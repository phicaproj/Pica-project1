-- CreateTable
CREATE TABLE "pillar_score_labels" (
    "id" TEXT NOT NULL,
    "pillar_id" TEXT NOT NULL,
    "min_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pillar_score_labels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pillar_score_labels_pillar_id_min_score_max_score_idx" ON "pillar_score_labels"("pillar_id", "min_score", "max_score");

-- AddForeignKey
ALTER TABLE "pillar_score_labels" ADD CONSTRAINT "pillar_score_labels_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
