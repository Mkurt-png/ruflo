import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

// POST /api/billing/portal
//
// Returns the URL of a Stripe Billing Portal session for the current user.
// Requires:
//   STRIPE_SECRET_KEY
//   NEXT_PUBLIC_SITE_URL
//   A user record with a stripe_customer_id (looked up by email, env-gated).
//
// Without a Stripe customer for the user yet, returns 404 with a hint.

export async function POST(req: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 501 });
  }

  const url = new URL(req.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secret);

    // Look up the Stripe customer by email. In production you'd resolve this
    // through your DB; here we hit Stripe directly so the route works the
    // moment users have ever paid through Tickra.
    const customers = await stripe.customers.list({ email: session.email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json(
        { error: 'no_customer', hint: 'No Stripe customer for this email yet.' },
        { status: 404 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${siteUrl}/${locale}/me`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: 'stripe_error', detail: message }, { status: 502 });
  }
}
