import { NextResponse } from 'next/server';

// Stripe checkout endpoint — wire this when STRIPE_SECRET_KEY is set.
// Expected payload: { plan: 'pro' | 'lifetime', cycle: 'monthly' | 'annual', email?: string }
//
// Implementation steps when ready:
//   1. npm i stripe
//   2. set STRIPE_SECRET_KEY + STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_ANNUAL / STRIPE_PRICE_LIFETIME
//   3. create a Stripe Checkout Session with mode=subscription | payment
//   4. return the url to redirect the client

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { plan?: string; cycle?: string; email?: string }
    | null;

  if (!body?.plan) {
    return NextResponse.json({ error: 'plan is required' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error: 'Stripe not configured yet',
        hint: 'Set STRIPE_SECRET_KEY and price IDs in the environment.',
      },
      { status: 501 },
    );
  }

  // Placeholder: real implementation goes here when Stripe is wired.
  return NextResponse.json({ url: null, plan: body.plan, cycle: body.cycle ?? 'monthly' });
}
