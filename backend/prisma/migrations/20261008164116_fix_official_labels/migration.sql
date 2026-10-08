-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ColorBand" ADD VALUE 'ORANGE';
ALTER TYPE "ColorBand" ADD VALUE 'LIGHT_GREEN';

-- AlterTable
ALTER TABLE "scoring_settings" ADD COLUMN     "light_green_description" TEXT NOT NULL DEFAULT 'Strong strategic positioning and resilient practices.',
ADD COLUMN     "light_green_label" TEXT NOT NULL DEFAULT 'Strategically Fortified',
ADD COLUMN     "light_green_min" DECIMAL(5,2) NOT NULL DEFAULT 71,
ADD COLUMN     "orange_description" TEXT NOT NULL DEFAULT 'Basic foundations are in place but require structured enhancement.',
ADD COLUMN     "orange_label" TEXT NOT NULL DEFAULT 'Foundational Emergent',
ADD COLUMN     "orange_min" DECIMAL(5,2) NOT NULL DEFAULT 31,
ALTER COLUMN "amber_min" SET DEFAULT 51,
ALTER COLUMN "green_min" SET DEFAULT 91,
ALTER COLUMN "red_label" SET DEFAULT 'Reactive',
ALTER COLUMN "amber_label" SET DEFAULT 'Operationally Sound',
ALTER COLUMN "amber_description" SET DEFAULT 'Solid operations with room for strategic optimization.',
ALTER COLUMN "green_label" SET DEFAULT 'Future-Proofed',
ALTER COLUMN "green_description" SET DEFAULT 'Industry-leading practices with long-term sustainability.';
