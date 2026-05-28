import { BusinessSize, Phase, Prisma, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, FORBIDDEN, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import { computeScoring } from '../scoring/scoring.service';
import { generatePhase1PDF } from '../../service/shared/pdf.service';
import { sendReportEmail } from '../../service/shared/email.service';
import { uploadPdf } from '../../service/shared/storage.service';
import type {
  AnswerAssessmentInput,
  MyPhase2BPillarsResponse,
  Phase2BPillarEntry,
  Phase2BPillarStatus,
  SessionResponsesResponse,
  StartAssessmentInput,
  StartAssessmentResponse,
  StartPhase2AResponse,
  StartPhase2BResponse,
  SubmitAssessmentResponse,
  AnswerAssessmentResponse,
} from './assessment.types';

const phase1QuestionCount = async (
  tx: Prisma.TransactionClient,
  businessSize: BusinessSize | null
) => {
  return tx.question.count({
    where: {
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
      businessSize: true,
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
      businessSize: existingSession.businessSize ?? businessSize,
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
    businessSize,
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
      businessSize: true,
      selectedQuestionIds: true,
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new AppError('Assessment session is no longer editable', CONFLICT);
  }

  // Phase 2A and Phase 2B are per-user with a frozen question snapshot —
  // enforce ownership and constrain answers to the snapshot.
  if (session.phase === Phase.PHASE2A || session.phase === Phase.PHASE2B) {
    if (!authenticatedUserId || session.userId !== authenticatedUserId) {
      throw new AppError('You are not authorized to modify this session', FORBIDDEN);
    }

    const snapshot = (session.selectedQuestionIds ?? []) as string[];
    if (!Array.isArray(snapshot) || !snapshot.includes(data.questionId)) {
      throw new AppError(
        `Question does not belong to this ${session.phase} session`,
        UNPROCESSABLE_CONTENT
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findFirst({
      where: {
        id: data.questionId,
        isActive: true,
      },
      select: {
        id: true,
        businessSize: true,
        isPhase1Featured: true,
      },
    });

    if (!question) {
      throw new AppError('Question not found', NOT_FOUND);
    }

    // For Phase 1 sessions: the question must match the session's businessSize
    // and be flagged as Phase 1 featured. (Phase 2A ownership/snapshot was already
    // checked above.)
    if (session.phase === Phase.PHASE1) {
      if (
        (session.businessSize && question.businessSize !== session.businessSize) ||
        !question.isPhase1Featured
      ) {
        throw new AppError('Question does not belong to this Phase 1 assessment', CONFLICT);
      }
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

  if (sessionPhase.phase === Phase.PHASE2B) {
    if (!authenticatedUserId || sessionPhase.userId !== authenticatedUserId) {
      throw new AppError('You are not authorized to submit this session', FORBIDDEN);
    }
    return submitPhase2BService(sessionId);
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

  // After scoring resolves, generate PDF, persist to R2, and email it
  // (Phase 1 only — best-effort; failures don't roll back the submission).
  try {
    const pdfBuffer = await generatePhase1PDF(
      transactionResult.result,
      transactionResult.session.businessName
    );

    // Upload to R2 under a stable per-session key — re-submitting/regenerating
    // overwrites the same object instead of leaving orphans.
    const { url: reportPdfUrl } = await uploadPdf(
      `reports/phase1/${sessionId}.pdf`,
      pdfBuffer
    );

    // Persist the public URL so subsequent downloads can stream from R2
    // instead of regenerating the PDF on every request.
    await prisma.sessionResult.update({
      where: { sessionId },
      data: {
        reportPdfUrl,
        generatedAt: new Date(),
      },
    });

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
    message:
      'Phase 2A assessment submitted successfully. Payment is required to access the full report.',
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

  // Snapshot every active question for the user's businessSize, ordered by pillar
  // then question displayOrder. The admin controls the question count by activating
  // or deactivating questions in the bank — no hard-coded per-pillar quota.
  const pillars = await prisma.pillar.findMany({
    where: { isActive: true },
    select: {
      id: true,
      questions: {
        where: {
          businessSize: user.businessSize,
          isActive: true,
        },
        select: { id: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  const selectedQuestionIds = pillars.flatMap((p) => p.questions.map((q) => q.id));

  if (selectedQuestionIds.length === 0) {
    throw new AppError(
      `No active Phase 2A questions configured for businessSize=${user.businessSize}.`,
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

/**
 * Claims a Phase 2B unlock and creates a per-pillar deep-dive session.
 *
 * Preconditions (raised as AppError otherwise):
 *   - Pillar must exist and be active.
 *   - User must hold an open (consumedAt: null, sessionId: null) Phase2BPillarUnlock
 *     for the pillar — granted by a previous successful PHASE2B_PILLAR payment.
 *   - At least one active PHASE2B question must exist for the pillar.
 *
 * Behaviour:
 *   - Snapshots all active PHASE2B question IDs for the pillar onto
 *     selectedQuestionIds so admin edits mid-session don't change the user's set.
 *   - Sets unlock.sessionId atomically with session creation — the unlock is
 *     now "claimed" against this session and cannot be re-used to start another.
 *   - Idempotent: a subsequent call with the same already-claimed unlock returns
 *     the existing IN_PROGRESS session instead of erroring.
 */
export async function startPhase2BService(
  userId: string,
  pillarId: string
): Promise<StartPhase2BResponse> {
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

  const pillar = await prisma.pillar.findUnique({
    where: { id: pillarId },
    select: { id: true, isActive: true, name: true },
  });
  if (!pillar || !pillar.isActive) {
    throw new AppError('Pillar not found', NOT_FOUND);
  }

  // Resume path: an open unlock with sessionId set means the user already
  // started this 2B run and we should just return the existing session.
  const existingUnlock = await prisma.phase2BPillarUnlock.findFirst({
    where: {
      userId: user.id,
      pillarId: pillar.id,
      consumedAt: null,
    },
    select: {
      id: true,
      sessionId: true,
      session: {
        select: { id: true, status: true, selectedQuestionIds: true },
      },
    },
  });

  if (!existingUnlock) {
    throw new AppError(
      'No active Phase 2B unlock for this pillar — purchase the pillar first.',
      FORBIDDEN
    );
  }

  if (
    existingUnlock.session &&
    existingUnlock.session.status === SessionStatus.IN_PROGRESS
  ) {
    const snapshot = (existingUnlock.session.selectedQuestionIds ?? []) as string[];
    return {
      message: 'Resuming existing Phase 2B session.',
      sessionId: existingUnlock.session.id,
      pillarId: pillar.id,
      questionCount: snapshot.length,
    };
  }

  // Snapshot every active PHASE2B question for this pillar, ordered for
  // deterministic display. No per-pillar count enforced — whatever the admin
  // has seeded is what the user gets.
  const questions = await prisma.question.findMany({
    where: {
      pillarId: pillar.id,
      phase: Phase.PHASE2B,
      isActive: true,
    },
    select: { id: true },
    orderBy: { displayOrder: 'asc' },
  });

  if (questions.length === 0) {
    throw new AppError(
      `No active Phase 2B questions configured for pillar ${pillar.name}.`,
      UNPROCESSABLE_CONTENT
    );
  }

  const selectedQuestionIds = questions.map((q) => q.id);

  const created = await prisma.$transaction(async (tx) => {
    const session = await tx.assessmentSession.create({
      data: {
        userId: user.id,
        phase: Phase.PHASE2B,
        pillarId: pillar.id,
        status: SessionStatus.IN_PROGRESS,
        // leadEmail intentionally null (auth path, not lead-capture).
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

    // Claim the unlock — the @unique on sessionId guarantees one unlock per session.
    await tx.phase2BPillarUnlock.update({
      where: { id: existingUnlock.id },
      data: { sessionId: session.id },
    });

    return session;
  });

  return {
    message: 'Phase 2B session started successfully',
    sessionId: created.id,
    pillarId: pillar.id,
    questionCount: selectedQuestionIds.length,
  };
}

/**
 * Submits a Phase 2B session. Mirrors submitPhase2AService with three
 * differences:
 *   - Uses the session's snapshot as questionIdScope (single-pillar set).
 *   - Writes SessionResult with isPaid: true immediately — the Phase 2B
 *     unlock IS the payment artifact, so the result is paid the moment
 *     the user submits (per schema:413-432 lifecycle comment).
 *   - Marks the matching Phase2BPillarUnlock.consumedAt inside the same tx.
 * After the transaction: generate the PDF, upload to R2, send the report
 * email — identical to Phase 1's post-submit flow.
 */
async function submitPhase2BService(sessionId: string): Promise<SubmitAssessmentResponse> {
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const session = await tx.assessmentSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          phase: true,
          userId: true,
          pillarId: true,
          businessName: true,
          businessSize: true,
          selectedQuestionIds: true,
          user: { select: { email: true } },
        },
      });

      if (!session) {
        throw new AppError('Assessment session not found', NOT_FOUND);
      }

      if (session.status !== SessionStatus.IN_PROGRESS) {
        throw new AppError('Assessment session has already been submitted', CONFLICT);
      }

      if (!session.pillarId) {
        throw new AppError(
          'Phase 2B session is missing its pillar — cannot submit',
          UNPROCESSABLE_CONTENT
        );
      }

      const snapshot = (session.selectedQuestionIds ?? []) as string[];
      if (!Array.isArray(snapshot) || snapshot.length === 0) {
        throw new AppError(
          'Phase 2B session has no question snapshot — cannot submit',
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
        phase: Phase.PHASE2B,
        questionIdScope: snapshot,
      });

      // The Phase 2B unlock IS the payment receipt — flip isPaid immediately
      // so getResult/download share the same auth path as paid Phase 2A.
      const now = new Date();
      await tx.sessionResult.create({
        data: {
          sessionId,
          totalScore: new Prisma.Decimal(result.totalScore),
          colorBand: result.colorBand,
          hasAnyKnockout: result.hasAnyKnockout,
          knockoutQuestionIds: JSON.parse(JSON.stringify(result.knockoutQuestionIds)),
          insightPayload: JSON.parse(JSON.stringify(result)),
          isPaid: true,
          paidAt: now,
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

      // Consume the unlock. Unique on sessionId, so this exactly identifies
      // the row claimed by startPhase2BService.
      await tx.phase2BPillarUnlock.update({
        where: { sessionId },
        data: { consumedAt: now },
      });

      return {
        sessionId,
        result,
        businessName: session.businessName,
        recipientEmail: session.user?.email ?? null,
      };
    },
    {
      timeout: 30000,
    }
  );

  // After scoring resolves, generate PDF, persist to R2, and email it —
  // best-effort; failures here don't roll back the submission.
  try {
    const pdfBuffer = await generatePhase1PDF(
      transactionResult.result,
      transactionResult.businessName
    );

    const { url: reportPdfUrl } = await uploadPdf(
      `reports/phase2b/${sessionId}.pdf`,
      pdfBuffer
    );

    await prisma.sessionResult.update({
      where: { sessionId },
      data: {
        reportPdfUrl,
        generatedAt: new Date(),
      },
    });

    if (transactionResult.recipientEmail) {
      await sendReportEmail({
        toEmail: transactionResult.recipientEmail,
        businessName: transactionResult.businessName,
        pdfBuffer,
        reportPdfUrl,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating PDF or sending Phase 2B report email:', message);
  }

  return {
    message: 'Phase 2B assessment submitted successfully',
    sessionId: transactionResult.sessionId,
    redirectTo: '/result-gate',
  };
}

/**
 * Returns every Phase 2B pillar this user has interacted with — paid, in-progress,
 * or completed. Joins Phase2BPillarUnlock with its pillar + session in one query
 * so the deep-dive page can render the full sidebar from a single response.
 *
 * Status derivation:
 *   - consumedAt set      → COMPLETED (report exists)
 *   - sessionId set, not consumed → IN_PROGRESS (started, not submitted)
 *   - neither set         → OPEN (paid, unstarted)
 *
 * Ordered most-recent-unlock first.
 */
export async function getMyPhase2BPillarsService(
  userId: string
): Promise<MyPhase2BPillarsResponse> {
  const unlocks = await prisma.phase2BPillarUnlock.findMany({
    where: { userId },
    select: {
      sessionId: true,
      consumedAt: true,
      unlockedAt: true,
      pillar: {
        select: { id: true, code: true, name: true },
      },
    },
    orderBy: { unlockedAt: 'desc' },
  });

  const pillars: Phase2BPillarEntry[] = unlocks.map((unlock) => {
    let status: Phase2BPillarStatus;
    if (unlock.consumedAt) {
      status = 'COMPLETED';
    } else if (unlock.sessionId) {
      status = 'IN_PROGRESS';
    } else {
      status = 'OPEN';
    }

    return {
      pillarId: unlock.pillar.id,
      pillarCode: unlock.pillar.code,
      pillarName: unlock.pillar.name,
      sessionId: unlock.sessionId,
      status,
      unlockedAt: unlock.unlockedAt,
    };
  });

  return {
    message: 'Phase 2B pillars fetched successfully',
    pillars,
  };
}

export async function getSessionResponsesService(
  sessionId: string,
  authenticatedUserId: string
): Promise<SessionResponsesResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      userId: true,
      selectedQuestionIds: true,
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (session.userId !== authenticatedUserId) {
    throw new AppError('You are not authorized to access this session', FORBIDDEN);
  }

  const snapshot = (session.selectedQuestionIds ?? []) as string[];
  
  const responses = await prisma.sessionResponse.findMany({
    where: { sessionId },
    select: { questionId: true, selectedOptionId: true },
  });

  return {
    message: 'Session responses fetched successfully',
    answeredCount: responses.length,
    totalCount: snapshot.length,
    responses,
  };
}
