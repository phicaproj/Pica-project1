-- Adds optional per-tier targeting to SUBSCRIPTION coupons.
--
-- Background: Discount.plan already supported the SUBSCRIPTION enum value
-- (any-tier subscription coupon). This migration introduces an optional FK
-- so an admin can narrow a SUBSCRIPTION coupon to one specific tier (e.g. a
-- "Growth-only" promo). NULL means "applies to any subscription tier" — so
-- existing SUBSCRIPTION coupons (if any) keep working unchanged.

-- Note: subscription_plans.id is text (Prisma `String @id @default(uuid())`
-- without an explicit @db.Uuid), so the FK column must also be text — not UUID
-- — or Postgres rejects the FK with "incompatible types: uuid and text".
ALTER TABLE "discounts"
    ADD COLUMN "subscription_plan_id" TEXT;

ALTER TABLE "discounts"
    ADD CONSTRAINT "discounts_subscription_plan_id_fkey"
    FOREIGN KEY ("subscription_plan_id")
    REFERENCES "subscription_plans"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Composite index mirrors the (plan, pillar_id) index — admin "show all
-- coupons targeting plan X tier Y" queries get a covering index.
CREATE INDEX "discounts_plan_subscription_plan_id_idx"
    ON "discounts"("plan", "subscription_plan_id");
