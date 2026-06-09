-- Admin-editable score interpretation (RED/AMBER/GREEN color bands).
-- Singleton table: exactly one row, seeded here with the previously
-- hardcoded thresholds (>=80 GREEN, >=50 AMBER) so behavior is unchanged
-- until an admin edits the settings.

-- CreateTable
CREATE TABLE "scoring_settings" (
    "id" TEXT NOT NULL,
    "amber_min" DECIMAL(5,2) NOT NULL,
    "green_min" DECIMAL(5,2) NOT NULL,
    "red_label" TEXT NOT NULL DEFAULT 'Urgent attention',
    "red_description" TEXT NOT NULL DEFAULT 'Critical gaps that need immediate action.',
    "amber_label" TEXT NOT NULL DEFAULT 'Needs work',
    "amber_description" TEXT NOT NULL DEFAULT 'Improving, but key risks remain.',
    "green_label" TEXT NOT NULL DEFAULT 'Healthy',
    "green_description" TEXT NOT NULL DEFAULT 'Strong performance — keep it up.',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_settings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton row with the legacy hardcoded thresholds.
INSERT INTO "scoring_settings" ("id", "amber_min", "green_min", "updated_at")
SELECT
    '00000000-0000-4000-8000-0000000000a1',
    50.00,
    80.00,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "scoring_settings");
