-- Tickra · initial schema (idempotent — safe to re-run)
--
-- Run order: 001_init.sql first, then any incremental migration below it.
-- Apply against your Supabase project's `public` schema via the SQL editor.

-- ─── Users ─────────────────────────────────────────────────────────────────
create table if not exists tickra_users (
  email                text primary key,
  created_at           timestamptz not null default now(),
  stripe_customer      text,                                  -- cus_…
  plan                 text check (plan in ('free','pro','lifetime')) default 'free',
  cycle                text check (cycle in ('monthly','annual','once')),
  current_period_end   timestamptz,
  placement_track      text,
  placement_score      integer,
  placement_taken_at   timestamptz,
  marketing_optin      boolean default false
);

create index if not exists tickra_users_stripe_customer_idx
  on tickra_users (stripe_customer);

-- ─── Progress ──────────────────────────────────────────────────────────────
create table if not exists tickra_progress (
  email          text not null references tickra_users(email) on delete cascade,
  lesson_id      text not null,
  completed_at   timestamptz not null default now(),
  primary key (email, lesson_id)
);

create index if not exists tickra_progress_email_idx
  on tickra_progress(email);

-- ─── Mistakes (spaced repetition) ─────────────────────────────────────────
create table if not exists tickra_mistakes (
  email          text not null references tickra_users(email) on delete cascade,
  lesson_id      text not null,
  logged_at      timestamptz not null default now(),
  reviewed_at    timestamptz,
  review_count   integer not null default 0,
  primary key (email, lesson_id)
);

create index if not exists tickra_mistakes_email_idx
  on tickra_mistakes(email);

-- ─── Bookmarks ────────────────────────────────────────────────────────────
create table if not exists tickra_bookmarks (
  email          text not null references tickra_users(email) on delete cascade,
  lesson_id      text not null,
  starred_at     timestamptz not null default now(),
  primary key (email, lesson_id)
);

create index if not exists tickra_bookmarks_email_idx
  on tickra_bookmarks(email);

-- ─── Lesson feedback ──────────────────────────────────────────────────────
create table if not exists tickra_feedback (
  id             bigserial primary key,
  email          text references tickra_users(email) on delete set null,
  lesson_id      text not null,
  vote           text not null check (vote in ('up','down')),
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists tickra_feedback_lesson_idx
  on tickra_feedback(lesson_id, created_at desc);

-- ─── RLS posture ──────────────────────────────────────────────────────────
-- Tickra writes from server-side routes only, using the service role key.
-- The client never speaks to Supabase directly, so RLS stays disabled on
-- read paths and the service role bypasses it on writes. Enabling RLS
-- on these tables would only matter if you later expose them to clients.
alter table tickra_users     enable row level security;
alter table tickra_progress  enable row level security;
alter table tickra_mistakes  enable row level security;
alter table tickra_bookmarks enable row level security;
alter table tickra_feedback  enable row level security;
