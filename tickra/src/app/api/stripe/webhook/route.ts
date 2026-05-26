import { NextResponse } from 'next/server';
import { updateUser, getUserByStripeCustomer } from '@/lib/db/queries';

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
        await updateUser(email, patch);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const email = await emailForCustomer(typeof sub.customer === 'string' ? sub.customer : null);
        if (!email) break;
        const periodEndSeconds =
          (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end ??
          null;
        await updateUser(email, {
          plan: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
          current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const email = await emailForCustomer(typeof sub.customer === 'string' ? sub.customer : null);
        if (!email) break;
        await updateUser(email, { plan: 'free', current_period_end: null });
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

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: 'invalid signature or payload', detail: message }, {
      status: 400,
    });
  }
}
