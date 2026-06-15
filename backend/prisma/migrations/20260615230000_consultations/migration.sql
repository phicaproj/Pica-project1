-- Section E — consultations. ConsultationTier is a price/duration template
-- (NOT mirrored to Paystack — every booking that needs payment generates a
-- fresh one-off transaction via initializeTransaction). ConsultationBooking
-- is the actual event, created REQUESTED up front; quota path keeps it as-is
-- with covered_by_subscription=true, paywall path attaches a Payment via
-- payments.consultation_booking_id.

-- ── Plan enum: add CONSULTATION ────────────────────────────────────────────
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'CONSULTATION';

-- ── New enum: ConsultationBookingStatus ───────────────────────────────────
CREATE TYPE "ConsultationBookingStatus" AS ENUM (
  'REQUESTED',
  'CONFIRMED',
  'ATTENDED',
  'NO_SHOW',
  'CANCELLED'
);

-- ── Table: consultation_tiers ─────────────────────────────────────────────
CREATE TABLE "consultation_tiers" (
    "id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price_usd" DECIMAL(12, 2) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_tiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultation_tiers_is_active_display_order_idx"
    ON "consultation_tiers" ("is_active", "display_order");

-- ── Table: consultation_bookings ──────────────────────────────────────────
CREATE TABLE "consultation_bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "status" "ConsultationBookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "topic" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "preferred_times" TEXT,
    "related_session_result_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "meeting_link" TEXT,
    "covered_by_subscription" BOOLEAN NOT NULL DEFAULT false,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consultation_bookings_user_id_status_idx"
    ON "consultation_bookings" ("user_id", "status");

CREATE INDEX "consultation_bookings_status_requested_at_idx"
    ON "consultation_bookings" ("status", "requested_at");

ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_tier_id_fkey"
    FOREIGN KEY ("tier_id") REFERENCES "consultation_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_related_session_result_id_fkey"
    FOREIGN KEY ("related_session_result_id") REFERENCES "session_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── payments.consultation_booking_id FK (paywall link) ───────────────────
ALTER TABLE "payments"
  ADD COLUMN "consultation_booking_id" TEXT;

CREATE UNIQUE INDEX "payments_consultation_booking_id_key"
    ON "payments" ("consultation_booking_id");

ALTER TABLE "payments" ADD CONSTRAINT "payments_consultation_booking_id_fkey"
    FOREIGN KEY ("consultation_booking_id") REFERENCES "consultation_bookings"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Seed three default tiers ──────────────────────────────────────────────
-- 30min / 60min / 90min as a starting catalogue; admin can rename, reprice,
-- or deactivate via /admin/consultation-tiers. Idempotent on re-run.
INSERT INTO "consultation_tiers" (
    "id", "tier", "name", "description", "price_usd",
    "duration_minutes", "is_active", "display_order", "updated_at"
)
SELECT
    '00000000-0000-4000-8000-0000000000d1',
    1,
    'Quick Consult',
    'A 30-minute focused call to address one specific question.',
    50.00,
    30,
    true,
    1,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "consultation_tiers" WHERE "tier" = 1
);

INSERT INTO "consultation_tiers" (
    "id", "tier", "name", "description", "price_usd",
    "duration_minutes", "is_active", "display_order", "updated_at"
)
SELECT
    '00000000-0000-4000-8000-0000000000d2',
    2,
    'Strategy Session',
    'A 60-minute working session to walk through findings and next steps.',
    100.00,
    60,
    true,
    2,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "consultation_tiers" WHERE "tier" = 2
);

INSERT INTO "consultation_tiers" (
    "id", "tier", "name", "description", "price_usd",
    "duration_minutes", "is_active", "display_order", "updated_at"
)
SELECT
    '00000000-0000-4000-8000-0000000000d3',
    3,
    'Deep Dive Workshop',
    'A 90-minute workshop that ends with a written action plan.',
    150.00,
    90,
    true,
    3,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "consultation_tiers" WHERE "tier" = 3
);
