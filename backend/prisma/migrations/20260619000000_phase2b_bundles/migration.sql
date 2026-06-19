-- BE-1: Phase 2B multi-pillar bundle checkout + admin-editable bundle discount.
--
-- 1. AppSettings gains the two admin-editable discount knobs (pct per extra
--    pillar + the pillar cap). Defaults reproduce the agreed 5%/5-pillar ladder.
-- 2. Payment gains `pillar_ids` — the full set of pillars bought in one bundle
--    transaction. Empty for PHASE2A / single-pillar / subscription rows.
-- 3. Phase2BPillarUnlock: the standalone unique on `payment_id` becomes a
--    composite unique on (payment_id, pillar_id) so one bundle Payment can
--    grant one unlock per pillar.

ALTER TABLE "app_settings"
  ADD COLUMN "phase2b_discount_pct_per_pillar" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "phase2b_discount_max_pillars"    INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "payments"
  ADD COLUMN "pillar_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

DROP INDEX "phase2b_pillar_unlocks_payment_id_key";

CREATE UNIQUE INDEX "phase2b_pillar_unlocks_payment_id_pillar_id_key"
  ON "phase2b_pillar_unlocks"("payment_id", "pillar_id");
