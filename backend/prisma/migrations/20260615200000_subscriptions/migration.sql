-- Subscription tier catalogue + user subscriptions + per-period usage. The
-- three seeded tiers (Starter / Growth / Scale) are admin-editable; the
-- migration installs them with NULL Paystack plan codes so the BE can
-- populate them lazily on first admin save (the paystack.service helper
-- updates the row with the codes after the API call returns).

-- ── Enum: SubscriptionStatus ────────────────────────────────────────────────
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- ── Table: subscription_plans ──────────────────────────────────────────────
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price_usd" DECIMAL(12, 2) NOT NULL,
    "phase2a_per_month" INTEGER NOT NULL,
    "phase2b_per_month" INTEGER NOT NULL,
    "consultations_per_month" INTEGER NOT NULL,
    "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "paystack_plan_code_usd" TEXT,
    "paystack_plan_code_ngn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscription_plans_is_active_display_order_idx"
    ON "subscription_plans" ("is_active", "display_order");

-- ── Table: user_subscriptions ───────────────────────────────────────────────
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "paystack_subscription_code" TEXT,
    "paystack_customer_code" TEXT,
    "paystack_email_token" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_subscriptions_paystack_subscription_code_key"
    ON "user_subscriptions" ("paystack_subscription_code");

CREATE INDEX "user_subscriptions_user_id_status_idx"
    ON "user_subscriptions" ("user_id", "status");

ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Table: subscription_usage ───────────────────────────────────────────────
CREATE TABLE "subscription_usage" (
    "id" TEXT NOT NULL,
    "user_subscription_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "phase2a_used" INTEGER NOT NULL DEFAULT 0,
    "phase2b_used" INTEGER NOT NULL DEFAULT 0,
    "consultations_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_usage_user_subscription_id_period_start_key"
    ON "subscription_usage" ("user_subscription_id", "period_start");

CREATE INDEX "subscription_usage_user_subscription_id_period_end_idx"
    ON "subscription_usage" ("user_subscription_id", "period_end");

ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_user_subscription_id_fkey"
    FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Seed the three tiers ───────────────────────────────────────────────────
-- Starter (2 / 2 / 1 at $40), Growth (4 / 4 / 2 at $80), Scale (6 / 6 / 3 at
-- $120). Paystack plan codes are NULL — the admin save flow populates them
-- via paystack.service.createPlan after this migration applies. WHERE NOT
-- EXISTS keeps the seed idempotent so re-running locally is safe.
INSERT INTO "subscription_plans" (
    "id", "tier", "name", "description", "price_usd",
    "phase2a_per_month", "phase2b_per_month", "consultations_per_month",
    "features", "is_active", "display_order", "updated_at"
)
SELECT
    '00000000-0000-4000-8000-0000000000c1',
    1,
    'Starter',
    'Solo founders and small teams getting their first read on the business.',
    40.00,
    2, 2, 1,
    ARRAY[
        '2 Phase 2A diagnostics per month',
        '2 Phase 2B deep dives per month',
        '1 expert consultation per month',
        'Downloadable PDF reports'
    ]::TEXT[],
    true,
    1,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "subscription_plans" WHERE "tier" = 1
);

INSERT INTO "subscription_plans" (
    "id", "tier", "name", "description", "price_usd",
    "phase2a_per_month", "phase2b_per_month", "consultations_per_month",
    "features", "is_active", "display_order", "updated_at"
)
SELECT
    '00000000-0000-4000-8000-0000000000c2',
    2,
    'Growth',
    'Operating teams iterating on the diagnostic across multiple pillars.',
    80.00,
    4, 4, 2,
    ARRAY[
        '4 Phase 2A diagnostics per month',
        '4 Phase 2B deep dives per month',
        '2 expert consultations per month',
        'Downloadable PDF reports',
        'Priority email support'
    ]::TEXT[],
    true,
    2,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "subscription_plans" WHERE "tier" = 2
);

INSERT INTO "subscription_plans" (
    "id", "tier", "name", "description", "price_usd",
    "phase2a_per_month", "phase2b_per_month", "consultations_per_month",
    "features", "is_active", "display_order", "updated_at"
)
SELECT
    '00000000-0000-4000-8000-0000000000c3',
    3,
    'Scale',
    'Mature operations running the diagnostic in parallel across business units.',
    120.00,
    6, 6, 3,
    ARRAY[
        '6 Phase 2A diagnostics per month',
        '6 Phase 2B deep dives per month',
        '3 expert consultations per month',
        'Downloadable PDF reports',
        'Priority email + Slack support'
    ]::TEXT[],
    true,
    3,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "subscription_plans" WHERE "tier" = 3
);
