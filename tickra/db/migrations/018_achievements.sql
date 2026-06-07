-- Phase 5C · Granular achievements. Idempotent — one row per (user, achievement).
-- Holds only the unlock timestamp; the catalog itself lives in code.

create table if not exists tickra_achievements (
  email          text not null references tickra_users(email) on delete cascade,
  achievement_id text not null,
  unlocked_at    timestamptz not null default now(),
  primary key (email, achievement_id)
);

create index if not exists tickra_achievements_email_idx
  on tickra_achievements(email, unlocked_at desc);

alter table tickra_achievements enable row level security;
