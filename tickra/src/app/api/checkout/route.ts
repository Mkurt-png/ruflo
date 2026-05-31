import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ensureUser, isDbConfigured } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// POST /api/checkout
// Body: { plan: 'pro' | 'lifetime', cycle?: 'monthly' | 'annual', locale?: 'fr' | 'en' }
//
// TICKRA-FIX(security): no longer accepts `email` from the body — we use the
// session email so an attacker can't pre-fill a victim's address (which
// previously led to victims receiving Stripe receipts + a Pro row created
// in their name).
//
// Env required to activate:
//   STRIPE_SECRET_KEY              sk_live_… or sk_test_…
//   STRIPE_PRICE_PRO_MONTHLY       price_…
//   STRIPE_PRICE_PRO_ANNUAL        price_…
//   STRIPE_PRICE_LIFETIME          price_…
//   NEXT_PUBLIC_SITE_URL           https://tickra.com   (used for success/cancel URLs)
//
// Without those env vars, returns 501 so the deploy stays safe.

type Plan = 'pro' | 'lifetime';
type Cycle = 'monthly' | 'annual';

function resolvePrice(plan: Plan, cycle: Cycle): { price: string; mode: 'subscription' | 'payment' } | null {
  if (plan === 'lifetime') {
    const price = process.env.STRIPE_PRICE_LIFETIME;
    return price ? { price, mode: 'payment' } : null;
  }
  if (plan === 'pro') {
    const price =
      cycle === 'annual' ? process.env.STRIPE_PRICE_PRO_ANNUAL : process.env.STRIPE_PRICE_PRO_MONTHLY;
    return price ? { price, mode: 'subscription' } : null;
  }
  return null;
}

export async function POST(req: Request) {
  // TICKRA-FIX(security): require an authenticated user. Was unauthenticated
  // (anyone could create Stripe sessions on behalf of any email).
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    plan?: Plan;
    cycle?: Cycle;
    locale?: 'fr' | 'en';
  } | null;

  if (!body?.plan || (body.plan !== 'pro' && body.plan !== 'lifetime')) {
    return NextResponse.json({ error: 'plan must be "pro" or "lifetime"' }, { status: 400 });
  }
  const cycle: Cycle = body.cycle === 'annual' ? 'annual' : 'monthly';
  const locale = body.locale === 'fr' ? 'fr' : 'en';

  // Make sure the user row exists before Stripe fires the webhook — the
  // webhook now only UPDATES existing rows, it never creates them.
  if (isDbConfigured()) {
    await ensureUser(session.email).catch(() => {
      /* swallow */
    });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      {
        error: 'Stripe not configured',
        hint: 'Set STRIPE_SECRET_KEY + STRIPE_PRICE_* in the environment.',
      },
      { status: 501 },
    );
  }

  const resolved = resolvePrice(body.plan, cycle);
  if (!resolved) {
    return NextResponse.json({ error: 'price not configured for this plan/cycle' }, { status: 501 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  try {
    // Lazy import keeps Stripe out of the bundle when not configured.
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(secret);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: resolved.mode,
      line_items: [{ price: resolved.price, quantity: 1 }],
      customer_email: session.email,
      success_url: `${siteUrl}/${locale}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${locale}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      locale: locale === 'fr' ? 'fr' : 'en',
      // automatic_tax requires Stripe Tax to be activated and a registered
      // tax origin. Off by default so a fresh account can checkout without
      // first going through the Tax onboarding. Re-enable once you've set
      // up Stripe Tax + your registrations.
      billing_address_collection: 'auto',
      metadata: { plan: body.plan, cycle, locale },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    // TICKRA-FIX(security): log the full Stripe error server-side but only
    // surface a generic message to the client (was echoing internals).
    console.error('[checkout] stripe error', message);
    return NextResponse.json(
      { error: 'stripe_error', hint: 'checkout temporarily unavailable' },
      { status: 502 },
    );
  }
}
