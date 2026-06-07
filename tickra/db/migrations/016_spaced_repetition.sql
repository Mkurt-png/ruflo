-- Phase 5A · Spaced Repetition (SM-2 inspired) extension to tickra_mistakes.
-- Adds per-lesson ease factor, interval, next-review timestamp and a
-- consecutive-correct counter. Idempotent.

alter table tickra_mistakes
  add column if not exists ease_factor          numeric not null default 2.5,
  add column if not exists interval_days        integer not null default 1,
  add column if not exists next_review_at       timestamptz,
  add column if not exists consecutive_correct  integer not null default 0;

-- Backfill: any existing mistake without a scheduled review is due 1 day
-- after its last touch (reviewed_at or logged_at).
update tickra_mistakes
  set next_review_at = coalesce(reviewed_at, logged_at) + interval '1 day'
  where next_review_at is null;

create index if not exists tickra_mistakes_due_idx
  on tickra_mistakes(email, next_review_at);
