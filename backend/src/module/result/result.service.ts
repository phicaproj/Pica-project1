import { Phase, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, FORBIDDEN, NOT_FOUND } from '../../service/shared/http';
import { generatePhase1PDF } from '../../service/shared/pdf.service';
import { sendReportEmail } from '../../service/shared/email.service';
import { APP_URL } from '../../Config/env';
import type { ScoringResultPayload } from '../scoring/scoring.types';
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
      phase: true,
      userId: true,
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
      isPaid: true,
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

  // Phase 2A is paywalled per-result: each completed session produces a
  // SessionResult that is independently paid/unpaid. Retakes generate a new
  // unpaid result and re-trigger the paywall.
  const isPaywalled = session.phase === Phase.PHASE2A && !result.isPaid;

  const payload: ResultResponse = {
    ...result,
    phase: session.phase,
    totalScore: Number(result.totalScore),
    knockoutQuestionIds: isPaywalled ? [] : (result.knockoutQuestionIds as string[]),
    insightPayload: isPaywalled ? null : result.insightPayload,
    reportPdfUrl: isPaywalled ? null : result.reportPdfUrl,
    pillarScores: pillarScores.map<ResultPillarScoreResponse>((pillarScore) => ({
      ...pillarScore,
      weightedScore: Number(pillarScore.weightedScore),
      findings: isPaywalled
        ? []
        : (pillarScore.findings as ResultPillarScoreResponse['findings']),
    })),
  };

  return {
    message: 'Result fetched successfully',
    result: payload,
    paywalled: isPaywalled,
  };
}

export async function getLatestCompletedResultForUserService(
  userId: string
): Promise<GetResultResponse | null> {
  const session = await prisma.assessmentSession.findFirst({
    where: {
      userId,
      status: { in: Array.from(allowedResultStatuses) },
    },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });

  if (!session) return null;

  return getResultService(session.id);
}

/**
 * Builds the PDF for a session and triggers the report email in parallel.
 * Returns the PDF buffer and filename for the controller to stream.
 *
 * Authorization rules:
 *   - Phase 1: open (anyone with the sessionId can download — same as the
 *     auto-emailed PDF on submit).
 *   - Phase 2A: requires the authenticated user to own the session AND for
 *     this specific SessionResult to be isPaid === true. Each result is
 *     independently paywalled.
 */
export async function downloadResultPdfService(
  sessionId: string,
  authenticatedUserId: string | undefined
): Promise<{ pdfBuffer: Buffer; filename: string }> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      phase: true,
      status: true,
      userId: true,
      leadEmail: true,
      businessName: true,
      user: {
        select: { id: true, email: true },
      },
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (!allowedResultStatuses.has(session.status)) {
    throw new AppError(
      'Assessment session must be completed before report can be downloaded',
      CONFLICT
    );
  }

  const result = await prisma.sessionResult.findUnique({
    where: { sessionId },
    select: { insightPayload: true, isPaid: true },
  });

  if (!result?.insightPayload) {
    throw new AppError('Report data not found for this session', NOT_FOUND);
  }

  // Phase 2A: owner-only, per-result paywall.
  if (session.phase === Phase.PHASE2A) {
    if (!authenticatedUserId || session.userId !== authenticatedUserId) {
      throw new AppError('You are not authorized to download this report', FORBIDDEN);
    }
    if (!result.isPaid) {
      throw new AppError(
        'Payment is required to download the Phase 2A report',
        FORBIDDEN
      );
    }
  }

  const scoringPayload = result.insightPayload as unknown as ScoringResultPayload;
  const businessName = session.businessName ?? 'Business';

  const pdfBuffer = await generatePhase1PDF(scoringPayload, businessName);
  const filename = `PICA-Report-${businessName.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

  // Fire-and-forget: send the report email without blocking the download.
  // For Phase 2A use the authenticated user's email (their account). For Phase 1
  // fall back to leadEmail (no user yet).
  const recipientEmail =
    session.phase === Phase.PHASE2A
      ? session.user?.email ?? null
      : session.leadEmail ?? session.user?.email ?? null;

  if (recipientEmail) {
    void sendReportEmail({
      toEmail: recipientEmail,
      businessName,
      pdfBuffer,
      reportPdfUrl: `${APP_URL}/result/${sessionId}/pdf`,
    }).catch((error) => {
      console.error('downloadResultPdfService: email send failed:', error);
    });
  }

  // For Phase 2A, mark the session REPORT_GENERATED on first download so
  // SessionResult.generatedAt + status reflect that the report has been issued.
  if (session.phase === Phase.PHASE2A && session.status !== SessionStatus.REPORT_GENERATED) {
    await prisma.$transaction([
      prisma.assessmentSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.REPORT_GENERATED },
      }),
      prisma.sessionResult.update({
        where: { sessionId },
        data: { generatedAt: new Date() },
      }),
    ]);
  }

  return { pdfBuffer, filename };
}
