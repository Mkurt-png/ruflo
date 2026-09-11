import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// A refund has to stick.
//
// Found on the first real card run, not by reading. Refunding set the plan to
// free correctly; cancelling the subscription immediately afterwards put Pro
// back. `cancel_at_period_end` does not change a subscription's status, so
// Stripe sent `customer.subscription.updated` with status still 'active', and
// the subscription handler reads exactly that to decide the plan — overwriting
// the refund's write with no error anywhere.
//
// Cancelling is only the visible case. Any later subscription event — a card
// update, a proration, a renewal attempt — re-grants Pro to someone who already
// has their money back, for as long as the subscription exists.
//
// The route is a Next handler and cannot be invoked without a signed Stripe
// payload, so this is a source-level guard rather than a behavioural test. It
// checks the two properties that together make the revocation durable.

const SRC = readFileSync(resolve(__dirname, 'route.ts'), 'utf8');

/** The body of one `case '<event>':` block in the route's switch. */
function handlerFor(event: string): string {
  const start = SRC.indexOf(`case '${event}':`);
  expect(start, `no handler for ${event}`).toBeGreaterThan(-1);
  const rest = SRC.slice(start + 1);
  const end = rest.indexOf('\n      case ');
  return end === -1 ? rest : rest.slice(0, end);
}

describe('charge.refunded', () => {
  const handler = handlerFor('charge.refunded');

  it('drops the plan to free', () => {
    expect(handler).toMatch(/plan:\s*'free'/);
  });

  it('cancels the subscription, so no later event can restore Pro', () => {
    expect(handler).toMatch(/subscriptions\.cancel\(/);
  });

  it('finds the subscription through the invoice on the charge', () => {
    // A Charge carries an invoice id, not a subscription id.
    expect(handler).toMatch(/invoices\.retrieve\(/);
  });

  it('still revokes when the cancel fails, and says so', () => {
    // A refund that cannot cancel is still a refund. The plan write must not be
    // rolled back or retried — but an operator has to know to finish by hand.
    expect(handler).toMatch(/catch/);
    expect(handler).toMatch(/console\.error/);
  });

  it('leaves partial refunds alone', () => {
    expect(handler).toMatch(/amount_refunded\s*<\s*charge\.amount/);
  });
});

describe('the subscription handler is what made the refund reversible', () => {
  it('still grants on active/trialing — the behaviour that must not silently change', () => {
    // Kept deliberately: this line is correct for a live subscription. It was
    // the CONTRADICTION with a refunded charge that was wrong, and that is
    // resolved by cancelling at the source. If this ever becomes the place
    // where refunds are handled too, these tests should be revisited together.
    const handler = handlerFor('customer.subscription.updated');
    expect(handler).toMatch(/status === 'active'/);
  });
});
