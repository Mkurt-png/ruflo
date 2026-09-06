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
import { SITE_URL } from '@/lib/site-url';
import {
  postDiscord,
  formatSale,
  formatReferralConversion,
} from '@/lib/notify/discord';

function welcomeEmail(plan: 'pro' | 'lifetime' | null, locale: 'fr' | 'en') {
  const planName = plan === 'lifetime' ? 'kNOWTrade Lifetime' : 'kNOWTrade Pro';
  const meHref = `${SITE_URL}/${locale}/me`;
  const curriculumHref = `${SITE_URL}/${locale}/curriculum`;
  if (locale === 'fr') {
    return {
      subject: `Bienvenue dans ${planName}`,
      text:
        `Merci pour votre paiement — votre accès ${planName} est actif.\n\n` +
        `Prochaine étape : commencez la piste "Bougies japonaises" depuis le cursus.\n` +
        `Votre espace : ${meHref}\n` +
        `Le cursus : ${curriculumHref}\n\n` +
        `À très vite,\nL'équipe kNOWTrade`,
    };
  }
  return {
    subject: `Welcome to ${planName}`,
    text:
      `Thanks for your payment — your ${planName} access is now live.\n\n` +
      `Next step: start the "Japanese candles" track from the curriculum.\n` +
      `Your space: ${meHref}\n` +
      `The curriculum: ${curriculumHref}\n\n` +
      `Speak soon,\nThe kNOWTrade team`,
  };
}

// POST /api/stripe/webhook
// Required events: checkout.session.completed, customer.subscription.created,
// customer.subscription.updated, customer.subscription.deleted,
// invoice.payment_failed.

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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email ?? (await emailForCustomer(session.customer as string | null));
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
        await updateExistingUser(email, patch);

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
        sendEmail({ from: FROM, to: email, subject: mail.subject, text: mail.text }).catch(() => {
          /* swallow — never fail the webhook on email errors */
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const email = await emailForCustomer(typeof sub.customer === 'string' ? sub.customer : null);
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
        if (priceId && !expected.includes(priceId)) {
          // Not our Pro price → ignore. Don't change the user's plan.
          break;
        }
        const periodEndSeconds =
          (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end ??
          null;
        await updateExistingUser(email, {
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
        const email = await emailForCustomer(typeof sub.customer === 'string' ? sub.customer : null);
        if (!email) break;
        await updateExistingUser(email, { plan: 'free', current_period_end: null });
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

    // Mark this event processed (idempotency log).
    await markStripeEventProcessed(event.id, event.type);

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: 'invalid signature or payload', detail: message }, {
      status: 400,
    });
  }
}
