/*
  Warnings:

  - You are about to drop the column `phase` on the `pillars` table. All the data in the column will be lost.
  - You are about to drop the column `phase` on the `questions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lead_email]` on the table `assessment_sessions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `lead_business_name` on table `assessment_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lead_industry` on table `assessment_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lead_location` on table `assessment_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lead_operating_years` on table `assessment_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lead_annual_revenue_range` on table `assessment_sessions` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `business_size` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BusinessSize" AS ENUM ('SMALL', 'MEDIUM');

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "business_size" "BusinessSize",
ADD COLUMN     "selected_question_ids" JSONB,
ALTER COLUMN "lead_business_name" SET NOT NULL,
ALTER COLUMN "lead_industry" SET NOT NULL,
ALTER COLUMN "lead_location" SET NOT NULL,
ALTER COLUMN "lead_operating_years" SET NOT NULL,
ALTER COLUMN "lead_annual_revenue_range" SET NOT NULL;

-- AlterTable
ALTER TABLE "pillars" DROP COLUMN "phase";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "phase",
ADD COLUMN     "business_size" "BusinessSize" NOT NULL,
ADD COLUMN     "is_phase1_featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "annual_revenue_range" TEXT,
ADD COLUMN     "business_size" "BusinessSize",
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "operating_years" TEXT,
ADD COLUMN     "staff_size" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "assessment_sessions_lead_email_key" ON "assessment_sessions"("lead_email");
