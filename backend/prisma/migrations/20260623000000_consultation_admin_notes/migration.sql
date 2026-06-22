-- Admin Consultation Notes (lighter feature)
--
-- Adds a single text column to consultation_bookings that admins write to
-- from the new "View client" modal. `admin_notes_notified_at` is a one-shot
-- email gate so the user is emailed exactly once on the FIRST non-empty save
-- (subsequent edits never fire another email). The FK on
-- `admin_notes_updated_by_id` points at the staff user who last edited the
-- notes — surfaced in the user-facing payload so the user can see who wrote
-- the feedback.

ALTER TABLE "consultation_bookings"
  ADD COLUMN "admin_notes"               TEXT,
  ADD COLUMN "admin_notes_updated_at"    TIMESTAMP(3),
  ADD COLUMN "admin_notes_updated_by_id" TEXT,
  ADD COLUMN "admin_notes_notified_at"   TIMESTAMP(3);

ALTER TABLE "consultation_bookings"
  ADD CONSTRAINT "consultation_bookings_admin_notes_updated_by_id_fkey"
  FOREIGN KEY ("admin_notes_updated_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
