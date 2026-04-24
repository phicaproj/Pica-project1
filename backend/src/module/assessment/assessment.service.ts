import { Phase, Prisma, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import { computePhase1Scoring } from '../scoring/scoring.service';
import type {
  AnswerAssessmentInput,
  StartAssessmentInput,
  StartAssessmentResponse,
  SubmitAssessmentResponse,
  AnswerAssessmentResponse,
} from './assessment.types';

const phase1QuestionCount = async (tx: Prisma.TransactionClient) => {
  return tx.question.count({
    where: {
      phase: Phase.PHASE1,
      isActive: true,
    },
  });
};

export async function startAssessmentService(
  data: StartAssessmentInput
): Promise<StartAssessmentResponse> {
  const existingSession = await prisma.assessmentSession.findFirst({
    where: {
      leadEmail: data.leadEmail,
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
      leadEmail: data.leadEmail,
      staffSize: data.staffSize,
      businessName: data.businessName,
      industry: data.industry,
      location: data.location,
      operatingYears: data.operatingYears,
      annualRevenue: data.annualRevenue,
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
  data: AnswerAssessmentInput
): Promise<AnswerAssessmentResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      phase: true,
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new AppError('Assessment session is no longer editable', CONFLICT);
  }

  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findFirst({
      where: {
        id: data.questionId,
        phase: Phase.PHASE1,
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
  sessionId: string
): Promise<SubmitAssessmentResponse> {
  return prisma.$transaction(async (tx) => {
    const session = await tx.assessmentSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
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
      phase1QuestionCount(tx),
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

    const result = await computePhase1Scoring(tx, sessionId);

    await tx.sessionResult.create({
      data: {
        sessionId,
        totalScore: new Prisma.Decimal(result.totalScore),
        colorBand: result.colorBand,
        hasAnyKnockout: result.hasAnyKnockout,
        knockoutQuestionIds: result.knockoutQuestionIds,
        insightPayload: result,
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
        findings: pillarScore.findings,
      })),
    });

    return {
      message: 'Assessment submitted successfully',
      sessionId: session.id,
      redirectTo: '/result-gate',
    };
  });
}
