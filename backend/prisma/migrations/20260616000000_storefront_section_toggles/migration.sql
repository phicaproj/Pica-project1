-- Section F: storefront-level on/off toggles for the public pricing page.
-- Two booleans on the singleton AppSettings row — both default TRUE so the
-- pricing page renders as-is until an admin flips one off. The service
-- layer enforces the "at least one section must stay live" invariant.

ALTER TABLE "app_settings"
  ADD COLUMN "pay_per_use_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "subscription_active"  BOOLEAN NOT NULL DEFAULT TRUE;
