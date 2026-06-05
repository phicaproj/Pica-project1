-- Safely align existing databases with the current Prisma schema.
-- Prisma's generated migration wants to drop/recreate pillars.code when moving
-- from TEXT to enum. This preserves the required column and its existing data.

DO $$
BEGIN
  CREATE TYPE "PillarCode" AS ENUM ('FL', 'FR', 'BM', 'OP', 'MS', 'GC', 'SS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "pillars"
  ALTER COLUMN "code" TYPE "PillarCode"
  USING "code"::"PillarCode";

-- Payment coupon audit columns used by payment.service.ts.
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "applied_coupon_code" TEXT,
  ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(12,2);
