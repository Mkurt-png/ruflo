import { NextResponse } from 'next/server';

// POST /api/stripe/webhook
//
// Stripe webhook handler. Required to keep subscription state in sync.
// Configure in Stripe Dashboard → Developers → Webhooks → add endpoint
// pointing at https://tickra.com/api/stripe/webhook with these events:
//   checkout.session.completed
//   customer.subscription.created
//   customer.subscription.updated
//   customer.subscription.deleted
//   invoice.payment_failed
//
// Env required:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   (whsec_…)
//
// Persistence is intentionally left as TODO comments — wire to your DB.

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 501 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secret);

    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // TODO: persist { customerId: session.customer, email: session.customer_email,
        //                  plan: session.metadata?.plan, cycle: session.metadata?.cycle,
        //                  subscriptionId: session.subscription }
        console.log('[stripe] checkout.session.completed', {
          id: session.id,
          customer: session.customer,
          plan: session.metadata?.plan,
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        // TODO: update subscription state, current_period_end, status
        console.log('[stripe] subscription.upserted', { id: sub.id, status: sub.status });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        // TODO: mark subscription cancelled, downgrade entitlements
        console.log('[stripe] subscription.deleted', { id: sub.id });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        // TODO: notify the customer, mark account past_due
        console.log('[stripe] invoice.payment_failed', { id: invoice.id });
        break;
      }
      default:
        // Ignore events we don't track yet — Stripe still expects a 200.
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
