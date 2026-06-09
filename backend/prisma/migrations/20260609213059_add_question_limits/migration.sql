-- AlterTable
ALTER TABLE "scoring_settings" ADD COLUMN     "phase2a_question_limit" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "phase2b_question_limit" INTEGER NOT NULL DEFAULT 30;
