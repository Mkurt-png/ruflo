import { describe, it, expect, vi } from 'vitest';
import { resolveCustomerEmail, type CustomerLookup } from './resolve-customer';

function deps(over: Partial<CustomerLookup> = {}): CustomerLookup {
  return {
    byStripeCustomer: vi.fn(async () => null),
    fromStripe: vi.fn(async () => null),
    link: vi.fn(async () => undefined),
    ...over,
  };
}

describe('resolveCustomerEmail', () => {
  it('returns null without touching anything when there is no customer id', async () => {
    const d = deps();
    expect(await resolveCustomerEmail(d, null)).toBeNull();
    expect(await resolveCustomerEmail(d, undefined)).toBeNull();
    expect(await resolveCustomerEmail(d, '')).toBeNull();
    expect(d.byStripeCustomer).not.toHaveBeenCalled();
    expect(d.fromStripe).not.toHaveBeenCalled();
  });

  it('takes the DB fast path and does not call Stripe', async () => {
    const d = deps({ byStripeCustomer: vi.fn(async () => 'known@example.com') });
    expect(await resolveCustomerEmail(d, 'cus_1')).toBe('known@example.com');
    expect(d.fromStripe).not.toHaveBeenCalled();
    expect(d.link).not.toHaveBeenCalled();
  });

  it('falls back to Stripe and backfills the link — the out-of-order case', async () => {
    const d = deps({ fromStripe: vi.fn(async () => ({ email: 'payer@example.com' })) });
    expect(await resolveCustomerEmail(d, 'cus_2')).toBe('payer@example.com');
    expect(d.link).toHaveBeenCalledWith('payer@example.com', 'cus_2');
  });

  it('still resolves via Stripe when the DB lookup throws', async () => {
    const d = deps({
      byStripeCustomer: vi.fn(async () => {
        throw new Error('db down');
      }),
      fromStripe: vi.fn(async () => ({ email: 'payer@example.com' })),
    });
    expect(await resolveCustomerEmail(d, 'cus_3')).toBe('payer@example.com');
  });

  it('returns null when Stripe throws, rather than propagating', async () => {
    const d = deps({
      fromStripe: vi.fn(async () => {
        throw new Error('stripe down');
      }),
    });
    await expect(resolveCustomerEmail(d, 'cus_4')).resolves.toBeNull();
  });

  it('ignores a deleted customer', async () => {
    const d = deps({ fromStripe: vi.fn(async () => ({ deleted: true, email: 'gone@example.com' })) });
    expect(await resolveCustomerEmail(d, 'cus_5')).toBeNull();
    expect(d.link).not.toHaveBeenCalled();
  });

  it('ignores a customer with no email', async () => {
    const d = deps({ fromStripe: vi.fn(async () => ({ email: null })) });
    expect(await resolveCustomerEmail(d, 'cus_6')).toBeNull();
    expect(d.link).not.toHaveBeenCalled();
  });

  it('returns the email even if backfilling the link fails', async () => {
    const d = deps({
      fromStripe: vi.fn(async () => ({ email: 'payer@example.com' })),
      link: vi.fn(async () => {
        throw new Error('write failed');
      }),
    });
    await expect(resolveCustomerEmail(d, 'cus_7')).resolves.toBe('payer@example.com');
  });
});
