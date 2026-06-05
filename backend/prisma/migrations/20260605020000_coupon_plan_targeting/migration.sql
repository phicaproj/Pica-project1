ALTER TABLE "discounts" ADD COLUMN "plan" "Plan";
ALTER TABLE "discounts" ADD COLUMN "pillar_id" TEXT;

CREATE INDEX "discounts_plan_pillar_id_idx" ON "discounts"("plan", "pillar_id");

ALTER TABLE "discounts"
ADD CONSTRAINT "discounts_pillar_id_fkey"
FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
