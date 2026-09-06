import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUser, updateUser } from '@/lib/db/queries';

// POST /api/billing/portal
// Returns the URL of a Stripe Billing Portal session for the current user.
// Lookup order: DB row first (fast), then Stripe customers list by email.

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

    // 1) Look the user up in our DB. Fastest path.
    const user = await getUser(session.email);
    let customerId: string | null = user?.stripe_customer ?? null;

    // 2) Fallback: ask Stripe by email. Persist what we find so we don't
    //    repeat this request on the next call.
    if (!customerId) {
      const customers = await stripe.customers.list({ email: session.email, limit: 1 });
      const c = customers.data[0];
      if (c) {
        customerId = c.id;
        await updateUser(session.email, { stripe_customer: c.id });
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'no_customer', hint: 'No Stripe customer for this email yet.' },
        { status: 404 },
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/${locale}/me`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    // TICKRA-FIX(security): log Stripe's message server-side, return a generic
    // one. Matches /api/checkout, which was hardened earlier; this route had
    // been left echoing internals to the client.
    console.error('[billing/portal] stripe error', message);
    return NextResponse.json(
      { error: 'stripe_error', hint: 'billing portal temporarily unavailable' },
      { status: 502 },
    );
  }
}
