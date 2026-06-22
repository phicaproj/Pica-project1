import {
  PaymentProvider,
  PaymentStatus,
  Phase,
  Plan,
  Prisma,
  SessionStatus,
} from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, FORBIDDEN, NOT_FOUND } from '../../service/shared/http';
import { generateReportPDF } from '../../service/shared/pdf.service';
import { sendReportEmail } from '../../service/shared/email.service';
import { uploadPdf } from '../../service/shared/storage.service';
import { APP_URL } from '../../Config/env';
import {
  assertSubscriptionQuota,
  consumeSubscriptionQuota,
} from '../subscription/subscription.service';
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

  // Phase 2A and Phase 2B are paywalled per-result: each completed session
  // produces a SessionResult that is independently paid/unpaid. For 2A the
  // paywall is gated by the Paystack payment; for 2B it is gated by consuming
  // a Phase2BPillarUnlock at submit time (which sets isPaid: true directly).
  const isPaywalled =
    (session.phase === Phase.PHASE2A || session.phase === Phase.PHASE2B) && !result.isPaid;

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
      findings: isPaywalled ? [] : (pillarScore.findings as ResultPillarScoreResponse['findings']),
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

export async function getAllCompletedResultsForUserService(
  userId: string
): Promise<GetResultResponse[]> {
  const sessions = await prisma.assessmentSession.findMany({
    where: {
      userId,
      status: { in: Array.from(allowedResultStatuses) },
    },
    orderBy: { completedAt: 'desc' },
    select: { id: true },
  });

  return Promise.all(sessions.map((s) => getResultService(s.id)));
}

/**
 * Builds the PDF for a session and triggers the report email in parallel.
 * Returns the PDF buffer and filename for the controller to stream.
 *
 * Authorization rules:
 *   - Phase 1: open (anyone with the sessionId can download — same as the
 *     auto-emailed PDF on submit).
 *   - Phase 2A / Phase 2B: requires the authenticated user to own the session
 *     AND for this specific SessionResult to be isPaid === true. Each result
 *     is independently paywalled. (For 2B, isPaid is flipped at submit time
 *     because the pre-purchased unlock IS the payment receipt.)
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
      businessSize: true,
      completedAt: true,
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

  let result = await prisma.sessionResult.findUnique({
    where: { sessionId },
    select: { insightPayload: true, isPaid: true, reportPdfUrl: true },
  });

  if (!result?.insightPayload) {
    throw new AppError('Report data not found for this session', NOT_FOUND);
  }

  // Phase 2A / Phase 2B: owner-only, per-result paywall.
  if (session.phase === Phase.PHASE2A || session.phase === Phase.PHASE2B) {
    if (!authenticatedUserId || session.userId !== authenticatedUserId) {
      throw new AppError('You are not authorized to download this report', FORBIDDEN);
    }

    // Subscription-quota short-circuit (Phase 2A only). Phase 2B is gated on
    // Phase2BPillarUnlock.isPaid which is set at unlock-create time, so the
    // SessionResult.isPaid flip already happened during the Phase 2B submit
    // (when the unlock was consumed). Here we cover the Phase 2A case: the
    // user took the assessment freely, and at download time we now check
    // whether their subscription covers the unlock — if yes, consume one
    // slot, mark the result paid, and write the same $0 audit Payment row
    // the initPayment path creates. Behaviour matches paid Phase 2A: a
    // single SUCCESS Payment row + isPaid=true on the result.
    //
    // session.userId is the auth gate we already passed above, so it's
    // guaranteed non-null here — narrow into a const so the Payment.create
    // call below typechecks without an `!`.
    const ownerUserId = session.userId;
    if (session.phase === Phase.PHASE2A && !result.isPaid && ownerUserId) {
      const verdict = await assertSubscriptionQuota(ownerUserId, 'phase2a');
      if (verdict.hasQuota) {
        const paidAt = new Date();
        await prisma.$transaction(async (tx) => {
          // Re-read period end inside the tx so we never race a renewal
          // landing between the quota check and the consume.
          const sub = await tx.userSubscription.findUnique({
            where: { id: verdict.subscriptionId },
            select: { currentPeriodEnd: true, user: { select: { email: true, businessName: true } } },
          });

          const created = await tx.payment.create({
            data: {
              userId: ownerUserId,
              sessionId,
              pillarId: null,
              pillarIds: [],
              userSubscriptionId: verdict.subscriptionId,
              plan: Plan.PHASE2A,
              provider: PaymentProvider.PAYSTACK,
              // Reference must be unique; mirror the format initPaymentService
              // uses for quota grants so admin tooling can identify them.
              providerReference: `sub-quota-${session.id}-${Date.now()}`,
              amount: new Prisma.Decimal(0),
              amountUsd: new Prisma.Decimal(0),
              currency: 'USD',
              status: PaymentStatus.SUCCESS,
              paymentMethod: 'subscription',
              paidAt,
              customerEmail: sub?.user?.email ?? 'unknown',
              customerBusinessName: sub?.user?.businessName ?? null,
            },
            select: { id: true },
          });

          await consumeSubscriptionQuota(tx, {
            subscriptionId: verdict.subscriptionId,
            periodStart: verdict.periodStart,
            periodEnd: sub?.currentPeriodEnd ?? new Date(),
            kind: 'phase2a',
          });

          await tx.sessionResult.update({
            where: { sessionId },
            data: {
              isPaid: true,
              paidAt,
              paidByPaymentId: created.id,
            },
          });
        });

        // Re-read so downstream code (PDF generation, R2 upload) sees the
        // freshly-paid state.
        result = await prisma.sessionResult.findUnique({
          where: { sessionId },
          select: { insightPayload: true, isPaid: true, reportPdfUrl: true },
        });
        if (!result?.insightPayload) {
          throw new AppError('Report data not found for this session', NOT_FOUND);
        }
      }
    }

    if (!result.isPaid) {
      throw new AppError(`Payment is required to download the ${session.phase} report`, FORBIDDEN);
    }
  }

  const scoringPayload = result.insightPayload as unknown as ScoringResultPayload;
  const businessName = session.businessName ?? 'Business';

  const pdfBuffer = await generateReportPDF(scoringPayload, businessName, session.phase, {
    businessSize: session.businessSize,
    sessionId: session.id,
    completedAt: session.completedAt,
  });
  const filename = `PICA-Report-${businessName.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

  // Persist the PDF to R2 on first download — subsequent downloads reuse the
  // cached URL instead of re-uploading. Phase 1 PDFs are already uploaded at
  // submit-time, so this primarily covers Phase 2A's first authorized download.
  // Best-effort: a failure here shouldn't block the user's download.
  let reportPdfUrl = result.reportPdfUrl;
  if (!reportPdfUrl) {
    const phaseFolder =
      session.phase === Phase.PHASE2A
        ? 'phase2a'
        : session.phase === Phase.PHASE2B
          ? 'phase2b'
          : 'phase1';
    try {
      const uploaded = await uploadPdf(`reports/${phaseFolder}/${sessionId}.pdf`, pdfBuffer);
      reportPdfUrl = uploaded.url;
      await prisma.sessionResult.update({
        where: { sessionId },
        data: { reportPdfUrl, generatedAt: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('downloadResultPdfService: R2 upload failed:', message);
    }
  }

  // Fire-and-forget: send the report email without blocking the download.
  // For Phase 2A / 2B use the authenticated user's email (their account).
  // For Phase 1 fall back to leadEmail (no user yet).
  const recipientEmail =
    session.phase === Phase.PHASE2A || session.phase === Phase.PHASE2B
      ? (session.user?.email ?? null)
      : (session.leadEmail ?? session.user?.email ?? null);

  if (recipientEmail) {
    void sendReportEmail({
      toEmail: recipientEmail,
      businessName,
      pdfBuffer,
      // Prefer the durable R2 URL; fall back to the backend route if the
      // upload didn't succeed so the email still works.
      reportPdfUrl: reportPdfUrl ?? `${APP_URL}/result/${sessionId}/pdf`,
    }).catch((error) => {
      console.error('downloadResultPdfService: email send failed:', error);
    });
  }

  // For Phase 2A / Phase 2B, mark the session REPORT_GENERATED on first download
  // so session status reflects that the report has been issued. generatedAt is
  // already set above as part of the R2 upload block.
  if (
    (session.phase === Phase.PHASE2A || session.phase === Phase.PHASE2B) &&
    session.status !== SessionStatus.REPORT_GENERATED
  ) {
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.REPORT_GENERATED },
    });
  }

  return { pdfBuffer, filename };
}
