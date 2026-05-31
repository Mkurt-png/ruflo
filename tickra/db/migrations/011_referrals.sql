-- Add referral fields to users (idempotent)
alter table tickra_users
  add column if not exists referral_slug          text unique,
  add column if not exists referred_by_slug       text,
  add column if not exists reward_days_pending    integer not null default 0,
  add column if not exists welcome_bonus_pending  integer not null default 0;

-- Track each conversion event (for audit + UI)
create table if not exists tickra_referrals (
  id            uuid primary key default gen_random_uuid(),
  inviter_email text not null references tickra_users(email) on delete cascade,
  invitee_email text not null references tickra_users(email) on delete cascade,
  status        text not null check (status in ('pending','converted')) default 'pending',
  created_at    timestamptz default now(),
  converted_at  timestamptz
);
create index if not exists tickra_referrals_inviter_idx on tickra_referrals(inviter_email);
