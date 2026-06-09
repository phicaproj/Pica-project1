-- AlterTable
ALTER TABLE "discounts" ADD COLUMN     "max_uses" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "used_count" INTEGER NOT NULL DEFAULT 0;
