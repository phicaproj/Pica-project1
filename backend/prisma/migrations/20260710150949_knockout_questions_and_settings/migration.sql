-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "phase1_pull_total" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "is_knockout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_on_phase1" BOOLEAN NOT NULL DEFAULT false;
