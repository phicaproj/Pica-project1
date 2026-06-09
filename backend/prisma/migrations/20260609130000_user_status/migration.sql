-- User suspension: ACTIVE (default) / DISABLED. Disabled users cannot log in
-- and their live tokens are rejected by the auth middleware immediately.

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
