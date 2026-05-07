import { BusinessSize, Phase, Prisma, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, FORBIDDEN, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import { computeScoring } from '../scoring/scoring.service';
import { generatePhase1PDF } from '../../service/shared/pdf.service';
import { sendReportEmail } from '../../service/shared/email.service';
import type {
  AnswerAssessmentInput,
  StartAssessmentInput,
  StartAssessmentResponse,
  StartPhase2AResponse,
  SubmitAssessmentResponse,
  AnswerAssessmentResponse,
} from './assessment.types';

const PHASE2A_QUESTIONS_PER_PILLAR = 10;

const phase1QuestionCount = async (
  tx: Prisma.TransactionClient,
  businessSize: BusinessSize | null
) => {
  return tx.question.count({
    where: {
      phase: Phase.PHASE1,
      isActive: true,
      isPhase1Featured: true,
      ...(businessSize ? { businessSize } : {}),
    },
  });
};

/**
 * Derives BusinessSize from lead-capture inputs. Called once at Phase 1 start;
 * the resulting value is persisted on AssessmentSession and copied onto User
 * at registration. Never recomputed.
 *
 * Rules:
 *   - staffSize is a free-text headcount the user types. Parse the first integer.
 *       <= 50  → SMALL
 *       >= 51  → MEDIUM
 *     If unparseable, treat as SMALL (don't upgrade based on noise).
 *   - annualRevenue is one of three fixed FE-provided buckets:
 *       "Under 5M"            → SMALL
 *       "Mid-Range 5M-50M"    → MEDIUM
 *       "Enterprise 50M+"     → MEDIUM
 *     Matching is case-insensitive on the bracket markers ("under", "mid", "enterprise").
 *   - Final size is MEDIUM if EITHER signal says MEDIUM, else SMALL.
 *     (Either the headcount or the revenue can pull a business up to MEDIUM.)
 */
const SMALL_STAFF_THRESHOLD = 50;

function classifyStaffSize(staffSize: string): BusinessSize {
  const match = staffSize.match(/\d+/);
  if (!match) return BusinessSize.SMALL;
  const headcount = Number.parseInt(match[0], 10);
  return headcount > SMALL_STAFF_THRESHOLD ? BusinessSize.MEDIUM : BusinessSize.SMALL;
}

function classifyRevenue(annualRevenue: string): BusinessSize {
  const normalized = annualRevenue.trim().toLowerCase();
  if (normalized.includes('under')) return BusinessSize.SMALL;
  if (normalized.includes('mid') || normalized.includes('enterprise')) {
    return BusinessSize.MEDIUM;
  }
  // Unknown bucket — be conservative.
  return BusinessSize.SMALL;
}

function computeBusinessSize(staffSize: string, annualRevenue: string): BusinessSize {
  if (
    classifyStaffSize(staffSize) === BusinessSize.MEDIUM ||
    classifyRevenue(annualRevenue) === BusinessSize.MEDIUM
  ) {
    return BusinessSize.MEDIUM;
  }
  return BusinessSize.SMALL;
}

export async function startAssessmentService(
  data: StartAssessmentInput
): Promise<StartAssessmentResponse> {
  const leadEmail = data.leadEmail.trim().toLowerCase();
  const businessSize = computeBusinessSize(data.staffSize, data.annualRevenue);

  const existingSession = await prisma.assessmentSession.findFirst({
    where: {
      leadEmail,
      status: SessionStatus.IN_PROGRESS,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingSession?.status === SessionStatus.COMPLETED) {
    throw new AppError(
      'An assessment session is already completed for this email. Please check your email for the assessment results.',
      CONFLICT
    );
  }

  if (existingSession) {
    return {
      message:
        'An assessment session is already in progress for this email. Resuming the existing session.',
      sessionId: existingSession.id,
    };
  }

  const session = await prisma.assessmentSession.create({
    data: {
      phase: Phase.PHASE1,
      status: SessionStatus.IN_PROGRESS,
      leadEmail,
      staffSize: data.staffSize,
      businessName: data.businessName,
      industry: data.industry,
      location: data.location,
      operatingYears: data.operatingYears,
      annualRevenue: data.annualRevenue,
      businessSize,
    },
    select: {
      id: true,
    },
  });

  return {
    message: 'Assessment session started successfully',
    sessionId: session.id,
  };
}

export async function answerAssessmentService(
  sessionId: string,
  data: AnswerAssessmentInput,
  authenticatedUserId?: string
): Promise<AnswerAssessmentResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      phase: true,
      userId: true,
      selectedQuestionIds: true,
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new AppError('Assessment session is no longer editable', CONFLICT);
  }

  // Phase 2A is per-user — enforce ownership
  if (session.phase === Phase.PHASE2A) {
    if (!authenticatedUserId || session.userId !== authenticatedUserId) {
      throw new AppError('You are not authorized to modify this session', FORBIDDEN);
    }

    const snapshot = (session.selectedQuestionIds ?? []) as string[];
    if (!Array.isArray(snapshot) || !snapshot.includes(data.questionId)) {
      throw new AppError(
        'Question does not belong to this Phase 2A session',
        UNPROCESSABLE_CONTENT
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findFirst({
      where: {
        id: data.questionId,
        phase: session.phase,
        isActive: true,
      },
      select: {
        id: true,
        phase: true,
      },
    });

    if (!question) {
      throw new AppError('Question not found', NOT_FOUND);
    }

    if (question.phase !== session.phase) {
      throw new AppError('Question does not belong to this assessment phase', CONFLICT);
    }

    const option = await tx.questionOption.findFirst({
      where: {
        id: data.selectedOptionId,
        questionId: data.questionId,
      },
      select: {
        id: true,
        score: true,
        riskType: true,
      },
    });

    if (!option) {
      throw new AppError('Selected option does not belong to the question', UNPROCESSABLE_CONTENT);
    }

    const response = await tx.sessionResponse.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId: data.questionId,
        },
      },
      update: {
        selectedOptionId: data.selectedOptionId,
        scoreAtTime: option.score,
        riskTypeAtTime: option.riskType,
      },
      create: {
        sessionId,
        questionId: data.questionId,
        selectedOptionId: data.selectedOptionId,
        scoreAtTime: option.score,
        riskTypeAtTime: option.riskType,
      },
      select: {
        id: true,
      },
    });

    return {
      message: 'Answer saved successfully',
      sessionId,
      responseId: response.id,
    };
  });
}

export async function submitAssessmentService(
  sessionId: string,
  authenticatedUserId?: string
): Promise<SubmitAssessmentResponse> {
  const sessionPhase = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: { phase: true, userId: true },
  });

  if (!sessionPhase) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (sessionPhase.phase === Phase.PHASE2A) {
    if (!authenticatedUserId || sessionPhase.userId !== authenticatedUserId) {
      throw new AppError('You are not authorized to submit this session', FORBIDDEN);
    }
    return submitPhase2AService(sessionId);
  }

  return submitPhase1Service(sessionId);
}

async function submitPhase1Service(sessionId: string): Promise<SubmitAssessmentResponse> {
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const session = await tx.assessmentSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          businessName: true,
          leadEmail: true,
          businessSize: true,
        },
      });

      if (!session) {
        throw new AppError('Assessment session not found', NOT_FOUND);
      }

      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new AppError('Assessment session has already been submitted', CONFLICT);
      }

      const [answeredQuestions, totalQuestions] = await Promise.all([
        tx.sessionResponse.count({
          where: { sessionId },
        }),
        phase1QuestionCount(tx, session.businessSize),
      ]);

      if (answeredQuestions !== totalQuestions) {
        throw new AppError(
          `Assessment is incomplete. Answer all ${totalQuestions} questions before submitting.`,
          UNPROCESSABLE_CONTENT
        );
      }

      await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      const result = await computeScoring(tx, sessionId, {
        phase: Phase.PHASE1,
        businessSize: session.businessSize ?? undefined,
      });

      await tx.sessionResult.create({
        data: {
          sessionId,
          totalScore: new Prisma.Decimal(result.totalScore),
          colorBand: result.colorBand,
          hasAnyKnockout: result.hasAnyKnockout,
          knockoutQuestionIds: JSON.parse(JSON.stringify(result.knockoutQuestionIds)),
          insightPayload: JSON.parse(JSON.stringify(result)),
        },
        select: {
          id: true,
        },
      });

      await tx.sessionPillarScore.createMany({
        data: result.pillarScores.map((pillarScore) => ({
          sessionId,
          pillarId: pillarScore.pillarId,
          rawScore: pillarScore.rawScore,
          maxPossibleScore: pillarScore.maxPossibleScore,
          weightedScore: new Prisma.Decimal(pillarScore.weightedScore),
          hasKnockout: pillarScore.hasKnockout,
          colorBand: pillarScore.colorBand,
          insightRuleApplied: pillarScore.insightRuleApplied,
          findings: JSON.parse(JSON.stringify(pillarScore.findings)),
        })),
      });

      return {
        session,
        result,
      };
    },
    {
      timeout: 30000, // 30 seconds - allows time for complex scoring computation
    }
  );

  // After scoring resolves, generate PDF and send email (Phase 1 only — best-effort)
  try {
    const pdfBuffer = await generatePhase1PDF(
      transactionResult.result,
      transactionResult.session.businessName
    );

    // TODO: Update with actual PDF URL from storage service
    const reportPdfUrl = `${process.env.APP_URL || 'https://pica.beauvision.com'}/reports/${sessionId}`;

    if (!transactionResult.session.leadEmail) {
      throw new Error('Lead email is missing');
    }

    await sendReportEmail({
      toEmail: transactionResult.session.leadEmail,
      businessName: transactionResult.session.businessName,
      pdfBuffer,
      reportPdfUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating PDF or sending report email:', message);
    // Continue without throwing - assessment is already submitted
  }

  return {
    message: 'Assessment submitted successfully',
    sessionId: transactionResult.session.id,
    redirectTo: '/result-gate',
  };
}

async function submitPhase2AService(sessionId: string): Promise<SubmitAssessmentResponse> {
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const session = await tx.assessmentSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          phase: true,
          businessSize: true,
          selectedQuestionIds: true,
        },
      });

      if (!session) {
        throw new AppError('Assessment session not found', NOT_FOUND);
      }

      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new AppError('Assessment session has already been submitted', CONFLICT);
      }

      const snapshot = (session.selectedQuestionIds ?? []) as string[];
      if (!Array.isArray(snapshot) || snapshot.length === 0) {
        throw new AppError(
          'Phase 2A session has no question snapshot — cannot submit',
          UNPROCESSABLE_CONTENT
        );
      }

      const answered = await tx.sessionResponse.findMany({
        where: { sessionId, questionId: { in: snapshot } },
        select: { questionId: true },
      });

      if (answered.length !== snapshot.length) {
        throw new AppError(
          `Assessment is incomplete. Answer all ${snapshot.length} questions before submitting.`,
          UNPROCESSABLE_CONTENT
        );
      }

      await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      const result = await computeScoring(tx, sessionId, {
        phase: Phase.PHASE2A,
        questionIdScope: snapshot,
      });

      await tx.sessionResult.create({
        data: {
          sessionId,
          totalScore: new Prisma.Decimal(result.totalScore),
          colorBand: result.colorBand,
          hasAnyKnockout: result.hasAnyKnockout,
          knockoutQuestionIds: JSON.parse(JSON.stringify(result.knockoutQuestionIds)),
          insightPayload: JSON.parse(JSON.stringify(result)),
        },
        select: { id: true },
      });

      await tx.sessionPillarScore.createMany({
        data: result.pillarScores.map((pillarScore) => ({
          sessionId,
          pillarId: pillarScore.pillarId,
          rawScore: pillarScore.rawScore,
          maxPossibleScore: pillarScore.maxPossibleScore,
          weightedScore: new Prisma.Decimal(pillarScore.weightedScore),
          hasKnockout: pillarScore.hasKnockout,
          colorBand: pillarScore.colorBand,
          insightRuleApplied: pillarScore.insightRuleApplied,
          findings: JSON.parse(JSON.stringify(pillarScore.findings)),
        })),
      });

      return { sessionId };
    },
    {
      timeout: 30000,
    }
  );

  // No PDF, no email — those are unlocked by the payment module.
  return {
    message: 'Phase 2A assessment submitted successfully. Payment is required to access the full report.',
    sessionId: transactionResult.sessionId,
    redirectTo: '/payment',
  };
}

/**
 * Creates (or resumes) a Phase 2A session for an authenticated user. Snapshots the
 * 70 question IDs (deterministic by displayOrder) onto the session so the user's set
 * is frozen against admin edits.
 */
export async function startPhase2AService(userId: string): Promise<StartPhase2AResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      businessName: true,
      businessSize: true,
      staffSize: true,
      industry: true,
      location: true,
      operatingYears: true,
      annualRevenue: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  if (!user.businessSize) {
    throw new AppError(
      'Business size is missing on your account. Please complete the free Phase 1 scan first.',
      FORBIDDEN
    );
  }

  const existing = await prisma.assessmentSession.findFirst({
    where: {
      userId: user.id,
      phase: Phase.PHASE2A,
      status: SessionStatus.IN_PROGRESS,
    },
    select: { id: true },
  });

  if (existing) {
    return {
      message: 'Resuming existing Phase 2A session.',
      sessionId: existing.id,
    };
  }

  const pillars = await prisma.pillar.findMany({
    where: { phase: Phase.PHASE2A, isActive: true },
    select: {
      id: true,
      questions: {
        where: {
          phase: Phase.PHASE2A,
          businessSize: user.businessSize,
          isActive: true,
        },
        select: { id: true },
        orderBy: { displayOrder: 'asc' },
        take: PHASE2A_QUESTIONS_PER_PILLAR,
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  const selectedQuestionIds = pillars.flatMap((p) => p.questions.map((q) => q.id));

  const expected = pillars.length * PHASE2A_QUESTIONS_PER_PILLAR;
  if (selectedQuestionIds.length !== expected) {
    throw new AppError(
      `Phase 2A question bank is incomplete for businessSize=${user.businessSize}. Expected ${expected}, got ${selectedQuestionIds.length}.`,
      UNPROCESSABLE_CONTENT
    );
  }

  const session = await prisma.assessmentSession.create({
    data: {
      userId: user.id,
      phase: Phase.PHASE2A,
      status: SessionStatus.IN_PROGRESS,
      // leadEmail intentionally null for Phase 2A — that field is the Phase 1 lead-capture key
      // and is @unique. Phase 2A sessions are keyed by userId.
      staffSize: user.staffSize,
      businessName: user.businessName ?? '',
      industry: user.industry ?? '',
      location: user.location ?? '',
      operatingYears: user.operatingYears ?? '',
      annualRevenue: user.annualRevenue ?? '',
      businessSize: user.businessSize,
      selectedQuestionIds: selectedQuestionIds as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return {
    message: 'Phase 2A session started successfully',
    sessionId: session.id,
  };
}
