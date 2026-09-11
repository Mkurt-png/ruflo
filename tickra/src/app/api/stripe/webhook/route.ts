import { NextResponse } from 'next/server';
import {
  updateUser,
  getUserByStripeCustomer,
  alreadyProcessedStripeEvent,
  markStripeEventProcessed,
  updateExistingUser,
  getUser,
} from '@/lib/db/queries';
import { markReferralConverted } from '@/lib/db/referral-queries';
import { sendEmail, FROM } from '@/lib/email/resend';
import { renderEmail } from '@/lib/email/layout';
import { BRAND_NAME, EMAIL } from '@/lib/brand';
import { SITE_URL } from '@/lib/site-url';
import {
  postDiscord,
  formatSale,
  formatReferralConversion,
} from '@/lib/notify/discord';
import { resolveCustomerEmail, type CustomerLookup } from '@/lib/stripe/resolve-customer';

function welcomeEmail(plan: 'pro' | 'lifetime' | null, locale: 'fr' | 'en') {
  const planName = plan === 'lifetime' ? `${BRAND_NAME} À vie` : `${BRAND_NAME} Pro`;
  const planNameEn = plan === 'lifetime' ? `${BRAND_NAME} Lifetime` : `${BRAND_NAME} Pro`;
  const curriculumHref = `${SITE_URL}/${locale}/curriculum`;

  if (locale === 'fr') {
    const { html, text } = renderEmail({
      heading: `Bienvenue dans ${planName}`,
      intro:
        'Votre paiement est confirmé et votre accès est actif. La suite la plus simple : ' +
        'commencez la piste « Bougies japonaises », dix minutes suffisent.',
      cta: { label: 'Ouvrir le cursus', url: curriculumHref },
      footer: [
        `Vous recevez ce message parce qu’un abonnement ${planName} vient d’être activé pour cette adresse.`,
        `Votre espace personnel : ${SITE_URL}/${locale}/me`,
        'Une question ? Répondez simplement à ce courriel.',
      ],
    });
    return { subject: `Bienvenue dans ${planName}`, text, html };
  }

  const { html, text } = renderEmail({
    heading: `Welcome to ${planNameEn}`,
    intro:
      'Your payment is confirmed and your access is live. The simplest next step: ' +
      'start the "Japanese candles" track — ten minutes is enough.',
    cta: { label: 'Open the curriculum', url: curriculumHref },
    footer: [
      `You are receiving this because a ${planNameEn} subscription was just activated for this address.`,
      `Your account: ${SITE_URL}/${locale}/me`,
      'Questions? Just reply to this email.',
    ],
  });
  return { subject: `Welcome to ${planNameEn}`, text, html };
}

// POST /api/stripe/webhook
// Required events — ALL SEVEN must be selected on the Stripe webhook endpoint,
// or the handler below never runs for the ones that are missing:
//
//   checkout.session.completed      grants the plan after payment
//   customer.subscription.created   \ keeps Pro in step with the subscription
//   customer.subscription.updated   /
//   customer.subscription.deleted   drops to free when Pro ends
//   invoice.payment_failed          (no write — entitlements hold until the
//                                   subscription itself flips)
//   charge.refunded                 revokes access on a FULL refund
//   charge.dispute.created          suspends access while funds are held
//
// The last two are easy to forget because they were added after the endpoint
// was first configured. Without them a refunded customer — including a Lifetime
// buyer refunded inside the advertised 14-day guarantee, where there is no
// subscription to cancel — keeps access forever.

export const runtime = 'nodejs';

function planFromMetadata(meta: Record<string, string | undefined> | null | undefined): 'pro' | 'lifetime' | null {
  const p = meta?.plan;
  if (p === 'pro' || p === 'lifetime') return p;
  return null;
}

function cycleFromMetadata(meta: Record<string, string | undefined> | null | undefined): 'monthly' | 'annual' | 'once' | null {
  const c = meta?.cycle;
  if (c === 'monthly' || c === 'annual') return c;
  return null;
}

async function emailForCustomer(customerId: string | null | undefined): Promise<string | null> {
  if (!customerId) return null;
  const u = await getUserByStripeCustomer(customerId);
  return u?.email ?? null;
}

/**
 * Bind the tested resolver (lib/stripe/resolve-customer) to this route's real
 * DB and Stripe clients. The logic — and every edge case around it — lives
 * there under unit test; this is only the wiring.
 */
function customerLookup(stripe: {
  customers: { retrieve: (id: string) => Promise<unknown> };
}): CustomerLookup {
  return {
    byStripeCustomer: (id) => emailForCustomer(id),
    fromStripe: async (id) =>
      (await stripe.customers.retrieve(id)) as { deleted?: boolean; email?: string | null } | null,
    // Update-only: a webhook must never conjure a user row.
    link: async (email, id) => {
      await updateExistingUser(email, { stripe_customer: id });
    },
  };
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 501 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 });

  const rawBody = await req.text();

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secret);

    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // TICKRA-FIX(security): Stripe retries — drop duplicate event.id so
    // we don't re-apply state transitions on a flaky network.
    if (await alreadyProcessedStripeEvent(event.id)) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    // TICKRA-FIX(billing): a write that failed must not be recorded as done.
    //
    // Every entitlement update below discarded its result, and the event was
    // then marked processed regardless. So if the database was unreachable for
    // the few seconds a `checkout.session.completed` arrived, the grant was
    // lost AND Stripe's retry — which would have fixed it — was rejected as a
    // duplicate. The customer's money was taken, the webhook answered 200, and
    // they never got access. Nothing anywhere recorded that it had happened.
    //
    // Now a failed write is remembered, the event is left unprocessed, and the
    // route answers 500 so Stripe retries on its own schedule.
    let writeFailed = false;
    const write = async (
      addr: string,
      patch: Parameters<typeof updateExistingUser>[1],
    ): Promise<void> => {
      const { updated } = await updateExistingUser(addr, patch);
      if (!updated) {
        writeFailed = true;
        console.error(
          '[stripe] %s (%s): could not apply %j — leaving event unprocessed for retry',
          event.type,
          event.id,
          patch,
        );
      }
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email =
          session.customer_email ??
          (session.customer_details as { email?: string | null } | null)?.email ??
          (await resolveCustomerEmail(customerLookup(stripe), session.customer as string | null));
        if (!email) break;
        const plan = planFromMetadata(session.metadata as Record<string, string | undefined> | null);
        const cycle = cycleFromMetadata(session.metadata as Record<string, string | undefined> | null);
        const patch: Parameters<typeof updateUser>[1] = {
          stripe_customer: typeof session.customer === 'string' ? session.customer : null,
        };
        if (plan) patch.plan = plan;
        if (cycle) patch.cycle = cycle === 'monthly' || cycle === 'annual' ? cycle : null;
        if (plan === 'lifetime') patch.cycle = 'once';
        // TICKRA-FIX(security): UPDATE only — never create a user row from
        // a Stripe webhook. /api/checkout now requires an authenticated
        // session, so the row must already exist.
        await write(email, patch);

        // Referral conversion: if this user was invited and the referral
        // is still pending, flip it to converted (which also credits the
        // inviter +30 reward_days_pending). Idempotent via the
        // alreadyProcessedStripeEvent guard above + markReferralConverted's
        // status='pending' filter.
        let inviteeDisplayName: string | null = null;
        try {
          const user = await getUser(email);
          inviteeDisplayName = (user as { display_name?: string | null } | null)?.display_name ?? null;
          const referredBy = (user as { referred_by_slug?: string | null } | null)?.referred_by_slug;
          if (referredBy) {
            await markReferralConverted(email);
            // Fire-and-forget Discord ping on referral conversion. Inviter
            // display name is not trivially available without an extra lookup
            // by slug — leave null so the formatter falls back to "An
            // apprentice". Privacy-safe either way.
            postDiscord(
              'signups',
              formatReferralConversion({
                inviterDisplayName: null,
                inviteeDisplayName,
              }),
            ).catch(() => undefined);
          }
        } catch {
          /* swallow — never fail the webhook on referral wiring */
        }

        // Fire-and-forget Discord ping on Pro/Lifetime upgrade.
        if (plan === 'pro' || plan === 'lifetime') {
          postDiscord('sales', formatSale({ plan, displayName: inviteeDisplayName })).catch(
            () => undefined,
          );
        }

        // Fire-and-forget welcome email (Resend). Locale is stored in
        // metadata at checkout time so we can localise.
        const meta = session.metadata as Record<string, string | undefined> | null;
        const locale: 'fr' | 'en' = meta?.locale === 'fr' ? 'fr' : 'en';
        const mail = welcomeEmail(plan, locale);
        sendEmail({
          from: FROM,
          replyTo: EMAIL.support,
          to: email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        }).catch(() => {
          /* swallow — never fail the webhook on email errors */
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const email = await resolveCustomerEmail(
          customerLookup(stripe),
          typeof sub.customer === 'string' ? sub.customer : null,
        );
        if (!email) break;
        // TICKRA-FIX(security): only grant Pro if the subscription's price
        // matches one of our configured Pro price IDs. Was over-granting Pro
        // on any active subscription tied to the customer (incl. trials, gift
        // products, anything else they ever bought).
        const priceId =
          (sub.items?.data?.[0] as { price?: { id?: string } } | undefined)?.price?.id ?? null;
        const expected = [
          process.env.STRIPE_PRICE_PRO_MONTHLY,
          process.env.STRIPE_PRICE_PRO_ANNUAL,
        ].filter(Boolean) as string[];
        // TICKRA-FIX(billing): make this refusal audible.
        //
        // The check itself is right — an active subscription to something else
        // must not grant Pro. But it used to `break` in silence, and there are
        // two very different reasons it can fire:
        //
        //   1. The price genuinely is not one we sell. Ignoring it is correct.
        //   2. Neither STRIPE_PRICE_* variable is set in this environment, so
        //      `expected` is empty and EVERY price fails the test. Then a real
        //      customer pays, Stripe reports success, and their account stays
        //      free — with nothing written down anywhere to explain it.
        //
        // Case 2 is a misconfiguration that looks exactly like case 1 from the
        // outside, and it is the one that costs money. Both are logged now, and
        // case 2 says what to fix.
        if (expected.length === 0) {
          console.error(
            '[stripe] %s: STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_PRO_ANNUAL are both unset — ' +
              'no subscription can be recognised as Pro, so this grant is being dropped. ' +
              'Set them in the environment and replay this event.',
            event.type,
          );
          writeFailed = true;
          break;
        }
        if (priceId && !expected.includes(priceId)) {
          // Not our Pro price → ignore. Don't change the user's plan.
          console.warn(
            '[stripe] %s: price %s is not one of our Pro prices — leaving the plan untouched',
            event.type,
            priceId,
          );
          break;
        }
        const periodEndSeconds =
          (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end ??
          null;
        await write(email, {
          plan: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
          current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
        });

        // TODO(referral/phase-4): apply reward_days_pending + welcome_bonus_pending
        // to the Stripe subscription. Two viable implementations once Live mode is on:
        //   1) stripe.customers.createBalanceTransaction(customerId, {
        //        amount: -(days * dailyPriceCents), currency: 'cad'
        //      }) — credits the next invoice. Simplest, no period math.
        //   2) Extend current_period_end via the subscription's trial_end /
        //      proration_behavior=none on the next renewal item update.
        // For v1 we only RECORD the credit (already stored on the user row) and
        // surface it to the user via ReferralCard. Do NOT zero the counters here
        // until we actually apply them to billing — otherwise the credit is lost.
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const email = await resolveCustomerEmail(
          customerLookup(stripe),
          typeof sub.customer === 'string' ? sub.customer : null,
        );
        if (!email) break;

        // TICKRA-FIX(billing): a Lifetime purchase is not a subscription, and
        // must survive one ending.
        //
        // This used to write plan:'free' unconditionally. Someone who bought
        // Pro monthly, later upgraded to Lifetime, and whose old Pro
        // subscription was then cancelled — by them or by Stripe at period end
        // — had their paid-for-life access revoked by the cancellation of a
        // DIFFERENT product. They paid once and lost everything, silently, with
        // no event they could connect it to.
        //
        // Only a Pro subscription ending drops someone to free.
        const priceId =
          (sub.items?.data?.[0] as { price?: { id?: string } } | undefined)?.price?.id ?? null;
        const proPrices = [
          process.env.STRIPE_PRICE_PRO_MONTHLY,
          process.env.STRIPE_PRICE_PRO_ANNUAL,
        ].filter(Boolean) as string[];
        if (priceId && proPrices.length > 0 && !proPrices.includes(priceId)) {
          // Not our Pro subscription — leave entitlements alone.
          break;
        }
        const current = await getUser(email);
        if ((current as { plan?: string | null } | null)?.plan === 'lifetime') {
          // Lifetime outranks any subscription state. Clear the renewal date,
          // keep the access.
          await write(email, { current_period_end: null });
          break;
        }
        await write(email, { plan: 'free', current_period_end: null });
        break;
      }
      // TICKRA-FIX(billing): money going back out has to take access with it.
      //
      // None of these were handled, so a full refund and a won chargeback both
      // left the buyer with permanent Pro or Lifetime access. Lifetime was the
      // expensive case: a one-off payment, refunded on day 13 of the 14-day
      // guarantee we advertise, left the account entitled forever with nothing
      // to reverse it — there is no subscription to cancel.
      case 'charge.refunded': {
        const charge = event.data.object;
        // Partial refunds are a support decision, not an automatic revocation:
        // only a full refund removes access.
        if (charge.amount_refunded < charge.amount) break;
        const email =
          charge.billing_details?.email ??
          (await resolveCustomerEmail(
            customerLookup(stripe),
            typeof charge.customer === 'string' ? charge.customer : null,
          ));
        if (!email) break;
        console.warn('[stripe] full refund — revoking access for %s', email);
        await write(email, { plan: 'free', cycle: null, current_period_end: null });
        break;
      }
      case 'charge.dispute.created': {
        // A dispute is not yet a loss, but leaving paid access open while the
        // funds are held is how card-testing and friendly fraud get monetised.
        // Access is restored by hand if the dispute is won.
        const dispute = event.data.object;
        // A Dispute carries the charge id, not the customer, so the charge has
        // to be fetched to find out whose access this is.
        let email: string | null = null;
        if (typeof dispute.charge === 'string') {
          const charge = (await stripe.charges.retrieve(dispute.charge)) as {
            customer?: string | null;
            billing_details?: { email?: string | null } | null;
          };
          email =
            charge.billing_details?.email ??
            (await resolveCustomerEmail(
              customerLookup(stripe),
              typeof charge.customer === 'string' ? charge.customer : null,
            ));
        }
        if (!email) {
          console.warn('[stripe] dispute %s — could not resolve customer, review by hand', dispute.id);
          break;
        }
        console.warn('[stripe] dispute opened — suspending access for %s', email);
        await write(email, { plan: 'free', cycle: null, current_period_end: null });
        break;
      }
      case 'invoice.payment_failed': {
        // Intentionally no DB write here — keep entitlements until the
        // subscription itself flips. The flag-down happens in subscription.deleted.
        break;
      }
      default:
        break;
    }

    // Only record the event as handled if everything it asked for actually
    // landed. A 500 here is deliberate: it is what makes Stripe retry.
    if (writeFailed) {
      return NextResponse.json({ error: 'write_failed' }, { status: 500 });
    }
    await markStripeEventProcessed(event.id, event.type);

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: 'invalid signature or payload', detail: message }, {
      status: 400,
    });
  }
}
