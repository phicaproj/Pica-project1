import {
  Phase,
  Plan,
  Prisma,
  PaymentProvider,
  PaymentStatus,
  SessionStatus,
  WebhookProcessingStatus,
} from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
  UNPROCESSABLE_CONTENT,
} from '../../service/shared/http';
import {
  initializeTransaction,
  newPaymentReference,
  verifyTransaction,
  type PaystackVerifyData,
} from '../../service/shared/paystack.service';
import { sendPaymentSuccessEmail } from '../../service/shared/email.service';
import { APP_URL } from '../../Config/env';
import type {
  AdminPaymentRow,
  InitPaymentInput,
  InitPaymentResponse,
  ListPaymentsQuery,
  ListPaymentsResponse,
  VerifyPaymentResponse,
} from './payment.types';

// Maps Paystack `data.status` strings onto our PaymentStatus enum.
const mapPaystackStatus = (status: string): PaymentStatus => {
  switch (status) {
    case 'success':
      return PaymentStatus.SUCCESS;
    case 'failed':
      return PaymentStatus.FAILED;
    case 'abandoned':
      return PaymentStatus.ABANDONED;
    case 'reversed':
      return PaymentStatus.REVERSED;
    default:
      return PaymentStatus.PENDING;
  }
};

// ==============================================================
// 1. INITIALIZE — POST /api/payment/init  (auth)
// ==============================================================

export async function initPaymentService(
  userId: string,
  input: InitPaymentInput
): Promise<InitPaymentResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      businessName: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', NOT_FOUND);
  }

  // The two plans validate against different targets — Phase 2A pays for a
  // specific completed SessionResult; Phase 2B pays for a pillar credit
  // (Phase2BPillarUnlock) which is later redeemed via /assessment/phase2b/start.
  let paymentSessionId: string | null = null;
  let paymentPillarId: string | null = null;

  if (input.plan === Plan.PHASE2A) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: input.sessionId },
      select: {
        id: true,
        userId: true,
        phase: true,
        status: true,
        result: { select: { id: true, isPaid: true } },
      },
    });
    if (!session) {
      throw new AppError('Assessment session not found', NOT_FOUND);
    }
    if (session.userId !== user.id) {
      throw new AppError('You are not authorized to pay for this session', FORBIDDEN);
    }
    if (session.phase !== Phase.PHASE2A) {
      throw new AppError(
        'Plan PHASE2A can only be applied to a PHASE2A session',
        UNPROCESSABLE_CONTENT
      );
    }
    if (session.status !== SessionStatus.COMPLETED) {
      throw new AppError(
        'Phase 2A session must be submitted before payment can be initialized',
        CONFLICT
      );
    }
    if (!session.result) {
      throw new AppError(
        'No result exists for this session yet — submit the assessment first',
        CONFLICT
      );
    }
    if (session.result.isPaid) {
      throw new AppError(
        'This result has already been paid for. Retake the assessment for a new chargeable result.',
        CONFLICT
      );
    }
    paymentSessionId = session.id;
  } else {
    // PHASE2B_PILLAR — validate the pillar and reject if an open (unconsumed)
    // unlock already exists. "One open unlock per (user, pillar)" is enforced
    // here in app code rather than via a DB partial-unique index, since users
    // can hold many historical CONSUMED unlocks for the same pillar over time.
    const pillar = await prisma.pillar.findUnique({
      where: { id: input.pillarId },
      select: { id: true, isActive: true },
    });
    if (!pillar || !pillar.isActive) {
      throw new AppError('Pillar not found', NOT_FOUND);
    }
    const openUnlock = await prisma.phase2BPillarUnlock.findFirst({
      where: { userId: user.id, pillarId: pillar.id, consumedAt: null },
      select: { id: true, sessionId: true },
    });
    if (openUnlock) {
      throw new AppError(
        openUnlock.sessionId
          ? 'You already started a Phase 2B session for this pillar — finish it before purchasing again.'
          : 'You already have an unclaimed Phase 2B unlock for this pillar.',
        CONFLICT
      );
    }
    paymentPillarId = pillar.id;
  }

  const reference = newPaymentReference();

  // Create the Payment row in PENDING state BEFORE calling Paystack so we have
  // an audit trail even if the network call fails. If Paystack fails, the row
  // stays PENDING and is reaped by the admin or by a future cleanup job.
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      sessionId: paymentSessionId,
      pillarId: paymentPillarId,
      plan: input.plan,
      provider: PaymentProvider.PAYSTACK,
      providerReference: reference,
      amount: new Prisma.Decimal(input.amount),
      currency: 'NGN',
      status: PaymentStatus.PENDING,
      customerEmail: user.email,
      customerBusinessName: user.businessName,
    },
    select: { id: true },
  });

  const paystackData = await initializeTransaction({
    email: user.email,
    amount: input.amount,
    reference,
    metadata: {
      paymentId: payment.id,
      userId: user.id,
      sessionId: paymentSessionId,
      pillarId: paymentPillarId,
      plan: input.plan,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      accessCode: paystackData.access_code,
      authorizationUrl: paystackData.authorization_url,
      initPayload: paystackData as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    message: 'Payment initialized',
    authorizationUrl: paystackData.authorization_url,
    accessCode: paystackData.access_code,
    reference,
    paymentId: payment.id,
  };
}

// ==============================================================
// 2. VERIFY — GET /api/payment/verify/:reference  (auth)
// ==============================================================
//
// Called by the FE after Paystack redirects back. Idempotent — safe to call
// many times on the same reference. Returns whatever the latest status is.
//
// Webhook is the safety net: if the FE never hits this endpoint (user closed
// the tab), the webhook still flips the status.

export async function verifyPaymentService(
  userId: string,
  reference: string
): Promise<VerifyPaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: { id: true, userId: true, status: true, plan: true },
  });

  if (!payment) {
    throw new AppError('Payment reference not found', NOT_FOUND);
  }
  if (payment.userId !== userId) {
    throw new AppError('You are not authorized to verify this payment', FORBIDDEN);
  }

  // Already settled — no need to re-hit Paystack.
  if (
    payment.status === PaymentStatus.SUCCESS ||
    payment.status === PaymentStatus.FAILED ||
    payment.status === PaymentStatus.ABANDONED ||
    payment.status === PaymentStatus.REVERSED
  ) {
    return {
      message: 'Payment already verified',
      status: payment.status,
      paid: payment.status === PaymentStatus.SUCCESS,
      reference,
    };
  }

  const verifyData = await verifyTransaction(reference);
  await applyVerificationResult(reference, verifyData, { source: 'verify-endpoint' });

  const updated = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: { status: true },
  });

  const status = updated?.status ?? PaymentStatus.PENDING;
  return {
    message: 'Payment verified',
    status,
    paid: status === PaymentStatus.SUCCESS,
    reference,
  };
}

// ==============================================================
// 3. WEBHOOK — POST /api/payment/webhook  (no auth, signature verified)
// ==============================================================

type WebhookEnvelope = {
  event: string;
  data: PaystackVerifyData & { reference?: string };
};

export async function handleWebhookService(params: {
  signatureValid: boolean;
  rawBody: string;
  parsedBody: WebhookEnvelope;
  signature: string | undefined;
}): Promise<{ message: string; processingStatus: WebhookProcessingStatus }> {
  const { signatureValid, parsedBody, signature } = params;

  // Idempotency: Paystack uses the signature header as the dedupe key.
  // Falling back to event+reference if signature is missing (we still log).
  const providerEventId =
    signature ?? `${parsedBody.event}:${parsedBody.data?.reference ?? 'unknown'}`;

  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: PaymentProvider.PAYSTACK,
        providerEventId,
      },
    },
    select: { id: true, processingStatus: true },
  });

  if (existing) {
    return {
      message: 'Webhook event already processed',
      processingStatus: existing.processingStatus,
    };
  }

  // Always log the event first — even if signature invalid, we keep the row
  // so the admin can see attempted forgeries.
  const event = await prisma.webhookEvent.create({
    data: {
      provider: PaymentProvider.PAYSTACK,
      providerEventId,
      eventType: parsedBody.event ?? 'unknown',
      signatureValid,
      rawBody: parsedBody as unknown as Prisma.InputJsonValue,
      processingStatus: WebhookProcessingStatus.RECEIVED,
    },
    select: { id: true },
  });

  if (!signatureValid) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: WebhookProcessingStatus.IGNORED,
        processingError: 'Invalid signature',
        processedAt: new Date(),
      },
    });
    throw new AppError('Invalid webhook signature', BAD_REQUEST);
  }

  // Only charge.success carries actionable state for us. Everything else is logged
  // and ignored — Paystack retries 'transfer.*' events too which we don't use.
  if (parsedBody.event !== 'charge.success') {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: WebhookProcessingStatus.IGNORED,
        processedAt: new Date(),
      },
    });
    return { message: 'Event ignored', processingStatus: WebhookProcessingStatus.IGNORED };
  }

  const reference = parsedBody.data?.reference;
  if (!reference) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: WebhookProcessingStatus.FAILED,
        processingError: 'Missing reference in payload',
        processedAt: new Date(),
      },
    });
    throw new AppError('Missing reference in webhook payload', BAD_REQUEST);
  }

  try {
    // Defense in depth: never trust the webhook body alone — re-verify with Paystack.
    const verifyData = await verifyTransaction(reference);
    const result = await applyVerificationResult(reference, verifyData, {
      source: 'webhook',
    });
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        paymentId: result.paymentId,
        processingStatus: WebhookProcessingStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
    return { message: 'Webhook processed', processingStatus: WebhookProcessingStatus.PROCESSED };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: WebhookProcessingStatus.FAILED,
        processingError: message,
        processedAt: new Date(),
      },
    });
    throw error;
  }
}

// ==============================================================
// 4. ADMIN — GET /api/payment/admin  (auth + isAdmin)
// ==============================================================

export async function listPaymentsService(query: ListPaymentsQuery): Promise<ListPaymentsResponse> {
  const where: Prisma.PaymentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.plan ? { plan: query.plan } : {}),
  };

  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        providerReference: true,
        customerBusinessName: true,
        customerEmail: true,
        plan: true,
        provider: true,
        amount: true,
        currency: true,
        paymentMethod: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    }),
  ]);

  const payments: AdminPaymentRow[] = rows.map((row) => ({
    id: row.id,
    reference: row.providerReference,
    businessName: row.customerBusinessName,
    email: row.customerEmail,
    plan: row.plan,
    provider: row.provider,
    amount: Number(row.amount),
    currency: row.currency,
    paymentMethod: row.paymentMethod,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
  }));

  return {
    message: 'Payments fetched successfully',
    page: query.page,
    pageSize: query.pageSize,
    total,
    payments,
  };
}

// ==============================================================
// SHARED — apply Paystack verify result to Payment + User
// ==============================================================

/**
 * Idempotent. Translates the Paystack verify response into Payment row state,
 * flips SessionResult.isPaid on first SUCCESS for a Phase 2A plan, and fires
 * the unlock email once per payment (best-effort).
 *
 * Called by both the verify endpoint and the webhook. Either path produces
 * the same end state; whichever runs first wins, the other is a no-op.
 */
async function applyVerificationResult(
  reference: string,
  verifyData: PaystackVerifyData,
  opts: { source: 'verify-endpoint' | 'webhook' }
): Promise<{ paymentId: string; flippedToSuccess: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: {
      id: true,
      userId: true,
      sessionId: true,
      pillarId: true,
      plan: true,
      status: true,
      amount: true,
      currency: true,
      customerEmail: true,
      customerBusinessName: true,
    },
  });

  if (!payment) {
    throw new AppError(`Payment row not found for reference ${reference}`, NOT_FOUND);
  }

  const newStatus = mapPaystackStatus(verifyData.status);
  const wasAlreadySuccess = payment.status === PaymentStatus.SUCCESS;
  const flippingToSuccess = !wasAlreadySuccess && newStatus === PaymentStatus.SUCCESS;
  const paidAt = verifyData.paid_at ? new Date(verifyData.paid_at) : null;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paymentMethod: verifyData.channel ?? null,
        paidAt,
        failureReason:
          newStatus === PaymentStatus.FAILED ? (verifyData.gateway_response ?? null) : null,
        verifyPayload: verifyData as unknown as Prisma.InputJsonValue,
      },
    });

    if (flippingToSuccess) {
      // Per-result paywall: on first successful Phase 2A payment, mark the
      // SessionResult as paid. The Payment row carries the sessionId set at
      // init time; legacy rows without a sessionId are skipped and logged.
      if (payment.plan === Plan.PHASE2A) {
        if (!payment.sessionId) {
          console.warn(
            `[payment:${opts.source}] SUCCESS Phase 2A payment ${payment.id} has no sessionId — cannot mark result paid`
          );
        } else {
          await tx.sessionResult.update({
            where: { sessionId: payment.sessionId },
            data: {
              isPaid: true,
              paidAt: paidAt ?? new Date(),
              paidByPaymentId: payment.id,
            },
          });
        }
      }

      // Phase 2B unlock: grant a redeemable credit for the pillar. The user
      // claims it later via POST /api/assessment/phase2b/start. Idempotent via
      // the paymentId @unique constraint — a webhook+verify race can't double-grant.
      if (payment.plan === Plan.PHASE2B_PILLAR) {
        if (!payment.pillarId) {
          console.warn(
            `[payment:${opts.source}] SUCCESS Phase 2B payment ${payment.id} has no pillarId — cannot grant unlock`
          );
        } else {
          await tx.phase2BPillarUnlock.upsert({
            where: { paymentId: payment.id },
            create: {
              userId: payment.userId,
              pillarId: payment.pillarId,
              paymentId: payment.id,
              sessionId: null,
            },
            update: {}, // no-op on race — first writer wins
          });
        }
      }
    }
  });

  if (flippingToSuccess) {
    // Best-effort. Source is logged so duplicate sends from verify+webhook
    // races can be diagnosed if they ever happen (the email is idempotent
    // from the user's perspective — they'd just see the same mail twice).
    //
    // For Phase 2B we point the user at the dashboard where they'll find the
    // newly-granted pillar credit. The email helper is plan-agnostic.
    const reportDownloadUrl =
      payment.plan === Plan.PHASE2B_PILLAR
        ? `${APP_URL}/dashboard/deep-dive`
        : `${APP_URL}/dashboard/reports`;
    void sendPaymentSuccessEmail({
      toEmail: payment.customerEmail,
      businessName: payment.customerBusinessName,
      amount: Number(payment.amount),
      currency: payment.currency,
      reference,
      reportDownloadUrl,
      plan: payment.plan,
    }).catch((error) => {
      console.error(`[payment:${opts.source}] unlock email failed:`, error);
    });
  }

  return { paymentId: payment.id, flippedToSuccess: flippingToSuccess };
}
