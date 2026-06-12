-- Tickra · Stripe webhook event idempotency.
-- One row per processed event so retries don't double-apply.

create table if not exists tickra_stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);
