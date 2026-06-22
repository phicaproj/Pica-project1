-- ============================================================
-- Consultation -> free PICA 2A bonus + annual subscription billing
-- ============================================================
-- 1) ConsultationTier.freeP2ARuns / freeP2ACreditWindowDays
-- 2) SubscriptionPlan.annualDiscountPct + paystackPlanCode{Usd,Ngn}Annual
-- 3) UserSubscription.billingInterval (new enum BillingInterval)
-- 4) phase2a_credits table

-- (1) Consultation tier bonus knobs --------------------------------
ALTER TABLE "consultation_tiers"
  ADD COLUMN "free_p2a_runs" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "free_p2a_credit_window_days" INTEGER NOT NULL DEFAULT 90;

-- (2) Subscription plan annual cadence -----------------------------
ALTER TABLE "subscription_plans"
  ADD COLUMN "annual_discount_pct" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "paystack_plan_code_usd_annual" TEXT,
  ADD COLUMN "paystack_plan_code_ngn_annual" TEXT;

-- (3) BillingInterval enum + UserSubscription.billingInterval ------
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

ALTER TABLE "user_subscriptions"
  ADD COLUMN "billing_interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY';

-- (4) phase2a_credits ---------------------------------------------
CREATE TABLE "phase2a_credits" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "consultation_booking_id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "consumed_payment_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "phase2a_credits_pkey" PRIMARY KEY ("id")
);

-- One row per (booking, sequence) so confirm is idempotent.
CREATE UNIQUE INDEX "phase2a_credits_consultation_booking_id_sequence_key"
  ON "phase2a_credits"("consultation_booking_id", "sequence");

-- Hot lookup: fresh-credit check on initPaymentService Phase 2A path.
CREATE INDEX "phase2a_credits_user_id_consumed_at_expires_at_idx"
  ON "phase2a_credits"("user_id", "consumed_at", "expires_at");

ALTER TABLE "phase2a_credits"
  ADD CONSTRAINT "phase2a_credits_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "phase2a_credits"
  ADD CONSTRAINT "phase2a_credits_consultation_booking_id_fkey"
  FOREIGN KEY ("consultation_booking_id") REFERENCES "consultation_bookings"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "phase2a_credits"
  ADD CONSTRAINT "phase2a_credits_consumed_payment_id_fkey"
  FOREIGN KEY ("consumed_payment_id") REFERENCES "payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
