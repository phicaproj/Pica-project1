-- Admin-editable app-wide settings, singleton. Today this owns only the
-- USD→NGN exchange rate used to convert the USD base price to NGN at display
-- and charge time for Nigerian users. Non-NG users continue to see USD.
-- The seed installs a placeholder rate of 1500.0000 NGN/USD; the admin is
-- expected to update it via the settings endpoint.

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "usd_to_ngn" DECIMAL(12,4) NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_fkey"
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the singleton row with a placeholder rate. Service code falls back to
-- creating this row on demand if it's missing, so this seed is just so a
-- fresh GET /api/admin/app-settings has something to return.
INSERT INTO "app_settings" ("id", "usd_to_ngn", "updated_at")
SELECT
    '00000000-0000-4000-8000-0000000000b1',
    1500.0000,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "app_settings");
