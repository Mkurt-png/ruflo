-- Weekly leaderboard view.
-- Aggregates lessons completed in the last 7 days per user; XP = 25 × lessons (matches SharePanel formula).
-- For "current streak", we compute the count of distinct consecutive days ending today (or yesterday) with
-- at least one completed lesson — kept simple/portable in SQL.
--
-- Joined against tickra_users so we can surface display_name + share_slug when share_public is true.
-- Idempotent.
--
-- NOTE: this view DOES select email — it is the first column. It is the API
-- layer (lib/db/leaderboard-queries) that anonymises before returning, not the
-- view. An earlier version of this comment claimed the opposite, which is how
-- the exposure in migration 021 went unnoticed: a view runs with its owner's
-- privileges, so it read straight through the RLS added in 019. See 021 for the
-- fix (security_invoker + revoked grants).

create or replace view tickra_leaderboard_weekly as
with weekly as (
  select
    p.email,
    count(*) as lessons_week,
    (count(*) * 25)::int as xp_week
  from tickra_progress p
  where p.completed_at >= now() - interval '7 days'
  group by p.email
),
days as (
  -- Distinct completion days (UTC) per user, for streak calc.
  select email, date_trunc('day', completed_at) as d
  from tickra_progress
  group by email, date_trunc('day', completed_at)
),
streaks as (
  -- A streak ends today or yesterday (UTC). Walk back day-by-day counting consecutive days.
  -- Implemented via gap-and-island over row_number().
  select
    email,
    count(*) as streak_len
  from (
    select
      email,
      d,
      d - (row_number() over (partition by email order by d))::int * interval '1 day' as grp
    from days
    where d >= now() - interval '120 days'
  ) g
  group by email, grp
  -- only consider an island that includes today or yesterday
  having max(d) >= date_trunc('day', now()) - interval '1 day'
)
select
  coalesce(w.email, s.email) as email,
  coalesce(w.lessons_week, 0) as lessons_week,
  coalesce(w.xp_week, 0)      as xp_week,
  coalesce(max(s.streak_len), 0) as current_streak,
  u.display_name,
  u.share_slug,
  u.share_public
from weekly w
full outer join streaks s on s.email = w.email
left join tickra_users u on u.email = coalesce(w.email, s.email)
group by coalesce(w.email, s.email), w.lessons_week, w.xp_week, u.display_name, u.share_slug, u.share_public;
