-- Placement test result columns.
-- Note: 001_init.sql already defines placement_track / placement_score /
-- placement_taken_at. This migration is idempotent and is a no-op against
-- existing databases — it exists so a brand-new clone can apply 015 on top
-- of a pruned 001 and still get the columns. Spec name aliases:
--   placement_track   ≡ placement_track_id
--   placement_taken_at ≡ placement_at
--
-- We intentionally do NOT create new column names — keeping a single source
-- of truth (placement_track / placement_taken_at) across queries.ts.

alter table tickra_users
  add column if not exists placement_track    text,
  add column if not exists placement_score    integer,
  add column if not exists placement_taken_at timestamptz;
