-- One-off data migration: PlanPrice.price and Discount.amountOff flip from
-- NGN major units to USD major units. This is the value half of the Slice 2
-- currency split (the type/service tag changes ride in the same commit).
--
-- Conversion divisor: 1500 (matches the default usdToNgn seeded in
-- app_settings). Admins should review prices after this migration runs and
-- adjust to the actual catalogue values they want billed in USD. The chosen
-- rate is documented in todo.md so the team can re-baseline if needed.
--
-- ROUND(value, 2) keeps the column's existing scale; the column itself stays
-- Decimal(12, 2) — USD prices comfortably fit and we don't want to silently
-- gain precision halfway through a money column.
--
-- Idempotency: this migration is single-shot. There is no marker we can
-- check to detect "already converted" data — Prisma's _prisma_migrations
-- ledger is the source of truth. Running it twice would re-divide by 1500
-- and corrupt the catalogue, so don't.

-- ── Convert PlanPrice rows (Phase 2A + every Phase 2B pillar) ────────────────
UPDATE "plan_prices"
SET "price" = ROUND("price" / 1500, 2);

-- ── Convert Discount.amountOff (absolute-amount coupons) ────────────────────
-- percent_off coupons aren't currency-bearing — leave them alone. amount_off
-- rows that are zero (a 100%-off coupon with percent_off > 0) stay zero.
UPDATE "discounts"
SET "amount_off" = ROUND("amount_off" / 1500, 2)
WHERE "amount_off" > 0;

-- ── Payment table — wire the USD-equivalent column + flip the default ──────
-- amount_usd nullable so existing NGN-charged rows can be back-filled below.
-- Future rows must have it set (the service writes it at init time); the
-- nullability stays so legacy rows from before this migration are still legal.
ALTER TABLE "payments" ADD COLUMN "amount_usd" DECIMAL(12, 2);

-- Back-fill amount_usd for historical rows so admin analytics still rolls up
-- correctly across the cutover. We divide NGN rows by the same 1500 rate; USD
-- rows (none exist yet, but the schema would allow them) copy through.
UPDATE "payments"
SET "amount_usd" = CASE
    WHEN "currency" = 'NGN' THEN ROUND("amount" / 1500, 2)
    ELSE "amount"
END;

-- New rows default to USD — the catalogue base after Slice 2. Existing rows
-- keep whatever currency they were charged in (no UPDATE on existing rows).
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'USD';
