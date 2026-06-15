-- Extends the Plan enum with SUBSCRIPTION and links Payment rows to the
-- UserSubscription they fund. This is the idempotency anchor for recurring
-- charges: handleSubscriptionChargeSuccess upserts on Payment.provider_reference
-- (already @unique from the original payments table) BEFORE rolling the
-- subscription period forward, so a replayed charge.success with the same
-- reference is a no-op even if the WebhookEvent dedupe is somehow bypassed.

-- ── Plan enum: add SUBSCRIPTION ────────────────────────────────────────────
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION';

-- ── Payment.user_subscription_id FK ───────────────────────────────────────
ALTER TABLE "payments"
  ADD COLUMN "user_subscription_id" TEXT;

ALTER TABLE "payments" ADD CONSTRAINT "payments_user_subscription_id_fkey"
  FOREIGN KEY ("user_subscription_id")
  REFERENCES "user_subscriptions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "payments_user_subscription_id_idx"
  ON "payments" ("user_subscription_id");
