/*
  Warnings:

  - A unique constraint covering the columns `[paid_by_payment_id]` on the table `session_results` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "session_results" ADD COLUMN     "is_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "paid_by_payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "session_results_paid_by_payment_id_key" ON "session_results"("paid_by_payment_id");
