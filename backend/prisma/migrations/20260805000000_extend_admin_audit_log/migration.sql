-- AlterTable
ALTER TABLE "admin_audit_logs" ADD COLUMN "action" TEXT NOT NULL DEFAULT 'UPDATE';
ALTER TABLE "admin_audit_logs" ADD COLUMN "entity_type" TEXT NOT NULL DEFAULT 'Admin';
ALTER TABLE "admin_audit_logs" ADD COLUMN "entity_id" TEXT;

ALTER TABLE "admin_audit_logs" ALTER COLUMN "old_value" SET DATA TYPE TEXT;
ALTER TABLE "admin_audit_logs" ALTER COLUMN "new_value" SET DATA TYPE TEXT;
