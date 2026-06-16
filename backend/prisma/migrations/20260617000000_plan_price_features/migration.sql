-- Section P — Move pay-per-use feature bullets from FE localStorage into the
-- pricing catalogue itself, so the bullets are shared across admin sessions
-- and consumed by the same public pricing endpoint that already serves the
-- prices.
--
-- The migration is idempotent on re-run: ADD COLUMN IF NOT EXISTS keeps the
-- ALTER TABLE step safe, and the seed UPDATEs only fire on rows whose
-- features column is still empty (= never touched by an admin). Once an admin
-- has saved their own bullets the seed has no effect.

ALTER TABLE "plan_prices"
  ADD COLUMN IF NOT EXISTS "features" TEXT[] NOT NULL DEFAULT '{}';

-- Seed PHASE2A with the bullets the FE was hardcoding in
-- app/admin/subscription/page.tsx (DEFAULT_FEATURES.PHASE2A). End users see
-- exactly what they see today; admins can now edit them and have the edit
-- persist across sessions.
UPDATE "plan_prices"
SET    "features" = ARRAY[
         'Full Phase 2A strategic diagnostic',
         'Scored report and recommendations',
         'Downloadable PDF report'
       ]
WHERE  plan = 'PHASE2A'
  AND  cardinality("features") = 0;

-- Same treatment for every PHASE2B_PILLAR row. The bullets are pillar-
-- agnostic by design (the pillar name itself differentiates the cards), so
-- every PHASE2B row gets the same default list.
UPDATE "plan_prices"
SET    "features" = ARRAY[
         'One paid pillar deep dive',
         'Pillar-specific findings',
         'Downloadable PDF report'
       ]
WHERE  plan = 'PHASE2B_PILLAR'
  AND  cardinality("features") = 0;
