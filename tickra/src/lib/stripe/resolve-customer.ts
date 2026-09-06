// TICKRA-FIX(billing): resolve a Stripe customer's email when the DB link is
// not there yet.
//
// Stripe does not guarantee webhook delivery order, and
// `customer.subscription.created` routinely arrives BEFORE
// `checkout.session.completed` — which was the only place that wrote
// `stripe_customer` on the user row. The DB lookup then missed, the
// subscription event was dropped, and `current_period_end` was never recorded.
//
// That left a paying customer on Pro with no paid-through date, which the
// expiry safety net reads as "fresh checkout, keep Pro" — an unbounded free
// ride, i.e. exactly the hole that net exists to close.
//
// Dependencies are injected so this is testable without a Stripe account or a
// database.

export type CustomerLookup = {
  /** Email of the user row already linked to this Stripe customer, if any. */
  byStripeCustomer: (customerId: string) => Promise<string | null>;
  /** Ask Stripe who this customer is. */
  fromStripe: (customerId: string) => Promise<{ deleted?: boolean; email?: string | null } | null>;
  /** Persist the link so later events take the fast path. Must never create a row. */
  link: (email: string, customerId: string) => Promise<void>;
};

/**
 * The email behind a Stripe customer id, or null when it cannot be determined.
 *
 * Never throws: a webhook that fails here should skip the event, not 500 and
 * trigger Stripe's retry storm.
 */
export async function resolveCustomerEmail(
  deps: CustomerLookup,
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;

  try {
    const known = await deps.byStripeCustomer(customerId);
    if (known) return known;
  } catch {
    // DB hiccup — fall through to Stripe rather than dropping the event.
  }

  let customer: { deleted?: boolean; email?: string | null } | null;
  try {
    customer = await deps.fromStripe(customerId);
  } catch {
    return null;
  }

  // A deleted customer carries no usable email.
  if (!customer || customer.deleted) return null;
  const email = customer.email ?? null;
  if (!email) return null;

  // Backfill is best-effort: having the email is what matters for this event.
  await deps.link(email, customerId).catch(() => undefined);
  return email;
}
