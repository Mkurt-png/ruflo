-- Tickra · personalised 14-day learning plan + email-notification log.
-- Run against your Supabase SQL Editor. Idempotent — safe to re-run.

-- ─── 14-day plan ──────────────────────────────────────────────────────────
-- One row per scheduled day. lesson_id matches the curriculum data.ts
-- identifier. The plan is generated when the user takes the placement test
-- (or at first /me visit if the test was skipped), and only refreshed on
-- explicit request.
create table if not exists tickra_user_plan (
  email          text not null references tickra_users(email) on delete cascade,
  day_index      integer not null check (day_index between 1 and 14),
  lesson_id      text not null,
  generated_at   timestamptz not null default now(),
  primary key (email, day_index)
);

create index if not exists tickra_user_plan_email_idx on tickra_user_plan(email);

-- ─── Notification log ─────────────────────────────────────────────────────
-- Used by the cron worker to avoid sending the same notification twice in a
-- row. Stores the last-sent timestamp per (email, kind).
create table if not exists tickra_notifications (
  email          text not null references tickra_users(email) on delete cascade,
  kind           text not null,                              -- e.g. 'streak_at_risk', 'plan_today'
  sent_at        timestamptz not null default now(),
  primary key (email, kind)
);

create index if not exists tickra_notifications_email_idx on tickra_notifications(email);
