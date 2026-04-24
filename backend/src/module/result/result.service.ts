import { SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND } from '../../service/shared/http';
import type { GetResultResponse, ResultPillarScoreResponse, ResultResponse } from './result.types';

const allowedResultStatuses = new Set<SessionStatus>([
  SessionStatus.COMPLETED,
  SessionStatus.PAID,
  SessionStatus.REPORT_GENERATED,
]);

export async function getResultService(sessionId: string): Promise<GetResultResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (!allowedResultStatuses.has(session.status)) {
    throw new AppError(
      'Assessment session must be completed before result can be viewed',
      CONFLICT
    );
  }

  const result = await prisma.sessionResult.findUnique({
    where: { sessionId },
    select: {
      id: true,
      sessionId: true,
      totalScore: true,
      colorBand: true,
      hasAnyKnockout: true,
      knockoutQuestionIds: true,
      insightPayload: true,
      reportPdfUrl: true,
      generatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!result) {
    throw new AppError('Result not found for this session', NOT_FOUND);
  }

  const pillarScores = await prisma.sessionPillarScore.findMany({
    where: { sessionId },
    select: {
      id: true,
      pillarId: true,
      rawScore: true,
      maxPossibleScore: true,
      weightedScore: true,
      hasKnockout: true,
      colorBand: true,
      insightRuleApplied: true,
      findings: true,
      pillar: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          displayOrder: true,
        },
      },
    },
    orderBy: [
      {
        pillar: {
          displayOrder: 'asc',
        },
      },
    ],
  });

  const payload: ResultResponse = {
    ...result,
    totalScore: Number(result.totalScore),
    knockoutQuestionIds: result.knockoutQuestionIds as string[],
    pillarScores: pillarScores.map<ResultPillarScoreResponse>((pillarScore) => ({
      ...pillarScore,
      weightedScore: Number(pillarScore.weightedScore),
      findings: pillarScore.findings as ResultPillarScoreResponse['findings'],
    })),
  };

  return {
    message: 'Result fetched successfully',
    result: payload,
  };
}
