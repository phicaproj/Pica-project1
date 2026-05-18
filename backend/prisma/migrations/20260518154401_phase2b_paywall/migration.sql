-- AlterEnum
ALTER TYPE "Plan" ADD VALUE 'PHASE2B_PILLAR';

-- AlterTable
ALTER TABLE "assessment_sessions" ADD COLUMN     "pillar_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "pillar_id" TEXT;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "phase" "Phase" NOT NULL DEFAULT 'PHASE2A';

-- CreateTable
CREATE TABLE "phase2b_pillar_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pillar_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "session_id" TEXT,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "phase2b_pillar_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phase2b_pillar_unlocks_payment_id_key" ON "phase2b_pillar_unlocks"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "phase2b_pillar_unlocks_session_id_key" ON "phase2b_pillar_unlocks"("session_id");

-- CreateIndex
CREATE INDEX "phase2b_pillar_unlocks_user_id_pillar_id_idx" ON "phase2b_pillar_unlocks"("user_id", "pillar_id");

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase2b_pillar_unlocks" ADD CONSTRAINT "phase2b_pillar_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase2b_pillar_unlocks" ADD CONSTRAINT "phase2b_pillar_unlocks_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase2b_pillar_unlocks" ADD CONSTRAINT "phase2b_pillar_unlocks_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase2b_pillar_unlocks" ADD CONSTRAINT "phase2b_pillar_unlocks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
