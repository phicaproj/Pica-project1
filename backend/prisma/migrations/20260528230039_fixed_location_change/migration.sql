/*
  Warnings:

  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "location",
ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT;
