-- CreateEnum
CREATE TYPE "Phase" AS ENUM ('PHASE1', 'PHASE2A', 'PHASE2B');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('NORMAL', 'RISK', 'KNOCKOUT');

-- CreateEnum
CREATE TYPE "ColorBand" AS ENUM ('RED', 'AMBER', 'GREEN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'PAID', 'REPORT_GENERATED');

-- CreateEnum
CREATE TYPE "InsightRule" AS ENUM ('KNOCKOUT', 'BOTH_RISK', 'ONE_RISK', 'BOTH_NORMAL');

-- CreateTable
CREATE TABLE "pillars" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" "Phase" NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pillars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "pillar_id" TEXT NOT NULL,
    "question_code" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "phase" "Phase" NOT NULL,
    "display_order" INTEGER NOT NULL,
    "has_knockout_option" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_label" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "risk_type" "RiskType" NOT NULL,
    "observation" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "business_name" TEXT,
    "phone" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "phase" "Phase" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "lead_email" TEXT,
    "lead_staff_size" TEXT,
    "lead_business_name" TEXT,
    "lead_industry" TEXT,
    "lead_location" TEXT,
    "lead_operating_years" TEXT,
    "lead_annual_revenue_range" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_responses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "selected_option_id" TEXT NOT NULL,
    "score_at_time" INTEGER NOT NULL,
    "risk_type_at_time" "RiskType" NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_pillar_scores" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "pillar_id" TEXT NOT NULL,
    "raw_score" INTEGER NOT NULL,
    "max_possible_score" INTEGER NOT NULL,
    "weighted_score" DECIMAL(6,2) NOT NULL,
    "has_knockout" BOOLEAN NOT NULL DEFAULT false,
    "color_band" "ColorBand" NOT NULL,
    "insight_rule_applied" "InsightRule" NOT NULL,
    "findings" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pillar_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_results" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "total_score" DECIMAL(6,2) NOT NULL,
    "color_band" "ColorBand" NOT NULL,
    "has_any_knockout" BOOLEAN NOT NULL DEFAULT false,
    "knockout_question_ids" JSONB NOT NULL,
    "insight_payload" JSONB NOT NULL,
    "report_pdf_url" TEXT,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pillars_code_key" ON "pillars"("code");

-- CreateIndex
CREATE UNIQUE INDEX "questions_question_code_key" ON "questions"("question_code");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_option_label_key" ON "question_options"("question_id", "option_label");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_responses_session_id_question_id_key" ON "session_responses"("session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_pillar_scores_session_id_pillar_id_key" ON "session_pillar_scores"("session_id", "pillar_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_results_session_id_key" ON "session_results"("session_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_responses" ADD CONSTRAINT "session_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_responses" ADD CONSTRAINT "session_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_responses" ADD CONSTRAINT "session_responses_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_pillar_scores" ADD CONSTRAINT "session_pillar_scores_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_pillar_scores" ADD CONSTRAINT "session_pillar_scores_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "pillars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_results" ADD CONSTRAINT "session_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
