-- Phase 2B Action Plans
--
-- Adds a per-option action plan to question_options. Phase 2B replaces the
-- single `recommendation` line with an "N-Day Action Plan": `action_plan_days`
-- is the admin-set window (30/50/60/90 or any 1–365 value) and
-- `action_plan_items` is the ordered list of ~4–5 to-dos rendered under it.
-- Both are nullable / default-empty so existing Phase 1 / 2A rows are untouched
-- and no backfill is required — those phases keep using `recommendation`.

ALTER TABLE "question_options"
  ADD COLUMN "action_plan_days"  INTEGER,
  ADD COLUMN "action_plan_items" TEXT[] NOT NULL DEFAULT '{}';
