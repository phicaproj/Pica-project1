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
  UserPaymentHistoryQuery,
  UserPaymentHistoryResponse,
  UserPaymentRow,
} from './payment.types';
import { resolvePlanPrice } from './pricing.service';
import { validateAndPriceCoupon } from '../coupon/coupon.service';
import { getUsdToNgnRate } from '../settings/settings.service';
import {
  activateSubscriptionFromWebhook,
  assertSubscriptionQuota,
  consumeSubscriptionQuota,
  markSubscriptionCancelled,
  type PaystackAuthorizationSnapshot,
} from '../subscription/subscription.service';

// Mirror of the FE resolveDisplayCurrency() — Nigerian users charge in NGN,
// everyone else (including users with no country on file) in USD. Kept local
// to payment.service because it's the only BE caller and the alias list is
// the same shape the FE accepts.
const NIGERIA_ALIASES = new Set([
  'nigeria',
  'ng',
  'nga',
  'federal republic of nigeria',
]);
function resolveChargeCurrency(country: string | null | undefined): 'USD' | 'NGN' {
  if (!country) return 'USD';
  return NIGERIA_ALIASES.has(country.trim().toLowerCase()) ? 'NGN' : 'USD';
}

// Maps Paystack `data.status` strings onto our PaymentStatus enum.
export const mapPaystackStatus = (status: string): PaymentStatus => {
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
      country: true,
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
  // Backend-owned base price (major USD units after Slice 2). Converted to NGN
  // at the bottom of this function if the user's country resolves to Nigeria.
  let basePrice: number;

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
    basePrice = await resolvePlanPrice({ plan: Plan.PHASE2A });
  } else {
    // PHASE2B_PILLAR — validate the pillar and reject if an open (unconsumed)
    // unlock already exists. "One open unlock per (user, pillar)" is enforced
    // here in app code rather than via a DB partial-unique index, since users
    // can hold many historical CONSUMED unlocks for the same pillar over time.
    const pillar = await prisma.pillar.findUnique({
      where: { id: input.pillarId },
      select: { id: true, code: true, isActive: true },
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
    basePrice = await resolvePlanPrice({
      plan: Plan.PHASE2B_PILLAR,
      pillarId: pillar.id,
    });
  }

  const reference = newPaymentReference();
  const round2Usd = (n: number) => Math.round(n * 100) / 100;

  // ── Subscription quota short-circuit ────────────────────────────────────
  // Auto-consume the user's subscription quota BEFORE any Paystack init.
  // assertSubscriptionQuota is non-throwing — `hasQuota: false` (no sub,
  // exhausted, or expired) falls through to pay-per-use untouched. When
  // quota is available, we record a $0 Payment row tagged with the
  // subscription id, decrement the counter, and grant the entitlement in
  // the same transaction so a crash mid-flight can't grant without
  // decrementing (or vice versa).
  const quotaKind = input.plan === Plan.PHASE2A ? 'phase2a' : 'phase2b';
  const verdict = await assertSubscriptionQuota(user.id, quotaKind);
  if (verdict.hasQuota) {
    const paidAt = new Date();
    const quotaPayment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          userId: user.id,
          sessionId: paymentSessionId,
          pillarId: paymentPillarId,
          userSubscriptionId: verdict.subscriptionId,
          plan: input.plan,
          provider: PaymentProvider.PAYSTACK,
          providerReference: reference,
          amount: new Prisma.Decimal(0),
          amountUsd: new Prisma.Decimal(0),
          currency: 'USD',
          status: PaymentStatus.SUCCESS,
          paymentMethod: 'subscription',
          paidAt,
          customerEmail: user.email,
          customerBusinessName: user.businessName,
        },
        select: {
          id: true,
          userId: true,
          sessionId: true,
          pillarId: true,
          plan: true,
          amount: true,
          currency: true,
          customerEmail: true,
          customerBusinessName: true,
          appliedCouponCode: true,
        },
      });
      // Re-read the period end inside the tx — assertSubscriptionQuota only
      // returns periodStart for the upsert key.
      const sub = await tx.userSubscription.findUnique({
        where: { id: verdict.subscriptionId },
        select: { currentPeriodEnd: true },
      });
      await consumeSubscriptionQuota(tx, {
        subscriptionId: verdict.subscriptionId,
        periodStart: verdict.periodStart,
        periodEnd: sub?.currentPeriodEnd ?? new Date(),
        kind: quotaKind,
      });
      await grantSuccessEntitlements(tx, created, paidAt, 'subscription-quota');
      return created;
    });

    // No email for quota consumption — the user didn't actually pay anything,
    // so a "we received your payment" mail is misleading. The $0 Payment row
    // still exists for billing-history audit; the user sees it in their
    // dashboard if they want to track credit usage.
    void quotaPayment;

    return {
      message: 'Granted from your subscription — no charge',
      free: true,
      authorizationUrl: null,
      accessCode: null,
      reference,
      paymentId: quotaPayment.id,
      amount: 0,
      // Pre-quota price is what they would have paid; useful for the
      // FE receipt copy ("Saved $40 with your Starter plan").
      baseAmount: round2Usd(basePrice),
      discountAmount: round2Usd(basePrice),
      currency: 'USD',
      couponCode: null,
    };
  }

  // Apply a coupon if one was supplied. validateAndPriceCoupon enforces that the
  // coupon is active and (if user-scoped) belongs to this user, and returns the
  // discounted total. Coupon math runs in USD — the base currency — so a
  // fixed amountOff means the same thing for NGN and non-NGN users.
  let chargeAmountUsd = basePrice;
  let appliedCouponCode: string | null = null;
  // discountAmount, like amount, is stored in the wire currency the user is
  // actually charged in. Computed from the USD discount below after we know
  // the wire currency.
  let discountUsd = 0;

  if (input.couponCode) {
    const pricing = await validateAndPriceCoupon(input.couponCode, user.id, basePrice, {
      plan: input.plan,
      pillarId: paymentPillarId,
    });
    chargeAmountUsd = pricing.finalAmount;
    appliedCouponCode = pricing.code;
    discountUsd = pricing.discountAmount;
  }

  // Resolve the wire currency the user will actually be charged in. Nigerian
  // users charge in NGN (Paystack's native currency); everyone else in USD
  // (subject to Paystack USD support on the account — see BE-0 in todo.md).
  // Rate is snapshotted here so the user sees the same amount we charge even
  // if an admin edits the FX rate between init and verify.
  const chargeCurrency = resolveChargeCurrency(user.country);
  const usdToNgn = chargeCurrency === 'NGN' ? await getUsdToNgnRate() : 1;
  // Round to 2dp at the boundary so Paystack's ×100 minor-unit conversion
  // doesn't surface a fractional kobo/cent the gateway will reject.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const chargeAmount = round2(
    chargeCurrency === 'NGN' ? chargeAmountUsd * usdToNgn : chargeAmountUsd,
  );
  const discountAmountWire = round2(
    chargeCurrency === 'NGN' ? discountUsd * usdToNgn : discountUsd,
  );
  const discountAmount: Prisma.Decimal | null = appliedCouponCode
    ? new Prisma.Decimal(discountAmountWire)
    : null;

  // 100% waiver: a full-discount coupon leaves nothing to charge. Paystack
  // rejects zero-amount transactions, so skip the provider entirely — record
  // the payment as SUCCESS immediately and grant entitlements through the
  // same transactional path a verified Paystack success uses.
  if (chargeAmount <= 0) {
    const paidAt = new Date();
    const freePayment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          userId: user.id,
          sessionId: paymentSessionId,
          pillarId: paymentPillarId,
          plan: input.plan,
          provider: PaymentProvider.PAYSTACK,
          providerReference: reference,
          amount: new Prisma.Decimal(0),
          amountUsd: new Prisma.Decimal(0),
          appliedCouponCode,
          discountAmount,
          currency: chargeCurrency,
          status: PaymentStatus.SUCCESS,
          paymentMethod: 'coupon',
          paidAt,
          customerEmail: user.email,
          customerBusinessName: user.businessName,
        },
        select: {
          id: true,
          userId: true,
          sessionId: true,
          pillarId: true,
          plan: true,
          amount: true,
          currency: true,
          customerEmail: true,
          customerBusinessName: true,
          appliedCouponCode: true,
        },
      });
      await grantSuccessEntitlements(tx, created, paidAt, 'free-coupon');
      return created;
    });

    // No email — a 100%-off coupon means no money changed hands, so a
    // "payment received" mail would be misleading. The $0 Payment row is
    // still created for audit.
    void freePayment;

    return {
      message: 'Payment completed — coupon covered the full amount',
      free: true,
      authorizationUrl: null,
      accessCode: null,
      reference,
      paymentId: freePayment.id,
      amount: 0,
      // baseAmount is reported in the wire currency the user would have been
      // charged in, matching `currency` below — keeps the receipt internally
      // consistent.
      baseAmount: round2(chargeCurrency === 'NGN' ? basePrice * usdToNgn : basePrice),
      discountAmount: discountAmount?.toNumber() ?? round2(chargeCurrency === 'NGN' ? basePrice * usdToNgn : basePrice),
      currency: chargeCurrency,
      couponCode: appliedCouponCode,
    };
  }

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
      // `amount` is the wire-currency major-unit value the user will be billed.
      // `amountUsd` is the USD-equivalent snapshot so admin analytics can roll
      // up across mixed-currency rows without re-querying the FX history.
      amount: new Prisma.Decimal(chargeAmount),
      amountUsd: new Prisma.Decimal(round2(chargeAmountUsd)),
      appliedCouponCode,
      discountAmount,
      currency: chargeCurrency,
      status: PaymentStatus.PENDING,
      customerEmail: user.email,
      customerBusinessName: user.businessName,
    },
    select: { id: true },
  });

  const paystackData = await initializeTransaction({
    email: user.email,
    amount: chargeAmount,
    currency: chargeCurrency,
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
    free: false,
    authorizationUrl: paystackData.authorization_url,
    accessCode: paystackData.access_code,
    reference,
    paymentId: payment.id,
    amount: chargeAmount,
    // Returned figures all in the wire currency so the FE can render the
    // receipt without re-converting. baseAmount is the pre-coupon charge.
    baseAmount: round2(chargeCurrency === 'NGN' ? basePrice * usdToNgn : basePrice),
    discountAmount: discountAmount?.toNumber() ?? 0,
    currency: chargeCurrency,
    couponCode: appliedCouponCode,
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

  // Subscription lifecycle events. Paystack emits subscription.create on the
  // FIRST successful charge with a plan attached (we get the subscription_code
  // + email_token here), then charge.success on every renewal afterwards.
  // subscription.disable arrives after Paystack stops billing — either because
  // the user cancelled or because the renewal charge kept failing.
  if (parsedBody.event === 'subscription.create' || parsedBody.event === 'subscription.disable') {
    try {
      await handleSubscriptionEvent(parsedBody);
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          processingStatus: WebhookProcessingStatus.PROCESSED,
          processedAt: new Date(),
        },
      });
      return { message: 'Subscription event processed', processingStatus: WebhookProcessingStatus.PROCESSED };
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

    // Subscription-flavoured charge.success — metadata.kind === 'subscription'
    // means this is either the first charge for a new subscription or a
    // renewal. Either way, route into activateSubscriptionFromWebhook with
    // the card-on-file snapshot from data.authorization. We DON'T flip a
    // Payment row for these — there's no one-off Payment record; the
    // subscription IS the record.
    const meta = verifyData.metadata as Record<string, unknown> | null;
    if (meta?.kind === 'subscription') {
      await handleSubscriptionChargeSuccess(verifyData, parsedBody);
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          processingStatus: WebhookProcessingStatus.PROCESSED,
          processedAt: new Date(),
        },
      });
      return {
        message: 'Subscription charge processed',
        processingStatus: WebhookProcessingStatus.PROCESSED,
      };
    }

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

// ──────────────────────────────────────────────────────────────────────────
// Subscription webhook dispatch
// ──────────────────────────────────────────────────────────────────────────
//
// Paystack's subscription envelopes look different from charge envelopes —
// `data` carries the subscription_code / email_token at top level, the
// customer code as `customer.customer_code`, the plan we attached via
// metadata.planId on subscribe init, and the period info as
// `next_payment_date`. We thread the raw shape through with a permissive
// type because Paystack adds fields over time.

type PaystackSubscriptionData = {
  subscription_code?: string;
  email_token?: string;
  status?: string;
  next_payment_date?: string;
  createdAt?: string;
  customer?: { customer_code?: string; metadata?: Record<string, unknown> | null };
  plan?: { plan_code?: string };
  metadata?: Record<string, unknown> | null;
};

function readSubscriptionMetaUserId(data: PaystackSubscriptionData): string | null {
  const top = data.metadata?.userId;
  if (typeof top === 'string' && top) return top;
  const customer = data.customer?.metadata?.userId;
  if (typeof customer === 'string' && customer) return customer;
  return null;
}

async function handleSubscriptionEvent(parsedBody: WebhookEnvelope): Promise<void> {
  const data = parsedBody.data as unknown as PaystackSubscriptionData;
  const subscriptionCode = data.subscription_code;
  if (!subscriptionCode) {
    throw new AppError('Subscription event missing subscription_code', BAD_REQUEST);
  }

  if (parsedBody.event === 'subscription.disable') {
    // User cancelled OR Paystack gave up on a failing renewal. Either way we
    // mark CANCELLED locally; expireLapsedSubscriptions() flips to EXPIRED
    // once the current period closes. No quota carries over.
    await markSubscriptionCancelled(subscriptionCode);
    return;
  }

  // subscription.create. Pair with the user via metadata.userId (set at
  // subscribe init time). If it's missing — should never happen, but log and
  // skip rather than crash the whole webhook pipeline.
  const userId = readSubscriptionMetaUserId(data);
  const planIdMeta = data.metadata?.planId ?? data.customer?.metadata?.planId;
  const currencyMeta = data.metadata?.currency ?? data.customer?.metadata?.currency;

  if (!userId || typeof planIdMeta !== 'string' || !planIdMeta) {
    console.warn('[webhook:subscription.create] missing userId/planId metadata, skipping');
    return;
  }
  const currency: 'USD' | 'NGN' = currencyMeta === 'NGN' ? 'NGN' : 'USD';

  const periodStart = data.createdAt ? new Date(data.createdAt) : new Date();
  const periodEnd = data.next_payment_date ? new Date(data.next_payment_date) : undefined;

  await activateSubscriptionFromWebhook({
    userId,
    planId: planIdMeta,
    currency,
    paystackSubscriptionCode: subscriptionCode,
    paystackCustomerCode: data.customer?.customer_code ?? null,
    paystackEmailToken: data.email_token ?? null,
    periodStart,
    periodEnd,
    // subscription.create itself doesn't carry the authorization block —
    // that lands on the paired charge.success. We persist card details there.
    authorization: null,
  });
}

async function handleSubscriptionChargeSuccess(
  verifyData: PaystackVerifyData,
  parsedBody: WebhookEnvelope
): Promise<void> {
  const meta = verifyData.metadata as Record<string, unknown> | null;
  const userId = typeof meta?.userId === 'string' ? meta.userId : null;
  const planId = typeof meta?.planId === 'string' ? meta.planId : null;
  // Section R-1 — couponCode flows through Paystack metadata when subscribeService
  // applies a partial-discount coupon. The free-coupon short-circuit increments
  // Discount.usedCount directly (no Paystack); the paid-coupon path lives here.
  const couponCode = typeof meta?.couponCode === 'string' ? meta.couponCode : null;
  if (!userId || !planId) {
    throw new AppError('Subscription charge missing userId/planId metadata', BAD_REQUEST);
  }

  const currency: 'USD' | 'NGN' = verifyData.currency === 'NGN' ? 'NGN' : 'USD';

  // Paystack puts subscription_code on the raw envelope's data block, not on
  // the verify response. Read both — verify is canonical for everything else.
  const raw = parsedBody.data as unknown as PaystackSubscriptionData & {
    authorization?: PaystackAuthorizationSnapshot | null;
  };
  const subscriptionCode = raw.subscription_code ?? null;
  const authorization = raw.authorization ?? null;

  const periodStart = verifyData.paid_at ? new Date(verifyData.paid_at) : new Date();
  const periodEnd = raw.next_payment_date ? new Date(raw.next_payment_date) : undefined;

  // ── Idempotency anchor ──────────────────────────────────────────────────
  // Paystack guarantees one reference per charge. We upsert on Payment.
  // providerReference (already @unique) BEFORE rolling the subscription
  // period forward, then only fire the period-roll if the upsert actually
  // inserted. A replayed charge.success with the same reference therefore
  // becomes a no-op even if WebhookEvent dedupe is bypassed.
  //
  // amountUsd: Paystack's amount is in minor units; / 100 → major units of
  // the wire currency. Convert to USD via the FX rate the user was charged at
  // (we re-read it here rather than relying on the webhook delivery time
  // because the user's record is the source of truth, not the wire).
  const chargedMajor = verifyData.amount / 100;
  const amountUsd =
    currency === 'NGN' ? chargedMajor / (await getUsdToNgnRate()) : chargedMajor;

  // Resolve which UserSubscription row this charge funds. We may not have it
  // yet on a brand-new subscribe (the subscription.create event might land
  // after this charge.success); in that case we still create the Payment row
  // but leave userSubscriptionId null. activateSubscriptionFromWebhook below
  // will create/locate the row; a follow-up update reconciles the link.
  const existingSub = subscriptionCode
    ? await prisma.userSubscription.findUnique({
        where: { paystackSubscriptionCode: subscriptionCode },
        select: { id: true },
      })
    : null;

  // Look up the user's email/businessName for the customer snapshot. Cheap
  // and consistent with one-off Payment rows.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, businessName: true },
  });

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // Upsert by providerReference — the @unique index turns a duplicate into
  // an update no-op (`update: {}`). The fact that `create` ran or didn't
  // tells us whether to roll the period; we infer that by reading createdAt
  // after the upsert and comparing to a marker we set on the create path.
  const before = await prisma.payment.findUnique({
    where: { providerReference: verifyData.reference },
    select: { id: true },
  });
  await prisma.payment.upsert({
    where: { providerReference: verifyData.reference },
    create: {
      userId,
      userSubscriptionId: existingSub?.id ?? null,
      plan: Plan.SUBSCRIPTION,
      provider: PaymentProvider.PAYSTACK,
      providerReference: verifyData.reference,
      amount: new Prisma.Decimal(round2(chargedMajor)),
      amountUsd: new Prisma.Decimal(round2(amountUsd)),
      currency,
      status: PaymentStatus.SUCCESS,
      paymentMethod: verifyData.channel ?? null,
      paidAt: verifyData.paid_at ? new Date(verifyData.paid_at) : new Date(),
      customerEmail: user?.email ?? verifyData.customer?.email ?? 'unknown',
      customerBusinessName: user?.businessName ?? null,
      // Section R-1 — stamp the redeemed coupon on the first-charge Payment row
      // so the admin transactions view shows which subscription invoices used a
      // coupon. Renewal charges will not carry couponCode in metadata, so the
      // column stays null on renewals (correct: only the initial charge applied
      // the discount).
      appliedCouponCode: couponCode,
      verifyPayload: verifyData as unknown as Prisma.InputJsonValue,
    },
    update: {}, // duplicate delivery — leave row alone
  });
  const isFirstDelivery = !before;

  if (!isFirstDelivery) {
    // We've already accounted for this reference. Period-roll already
    // happened on the original delivery; don't double it.
    return;
  }

  // Section R-1 — bump the coupon's redemption counter. Gated on isFirstDelivery
  // so Paystack retries (same reference, same coupon) don't inflate usedCount.
  // We use updateMany to swallow the case where the coupon was deleted between
  // the subscribe call and the webhook delivery — better to under-count by one
  // than to crash the webhook on a missing FK.
  if (couponCode) {
    await prisma.discount.updateMany({
      where: { code: couponCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  await activateSubscriptionFromWebhook({
    userId,
    planId,
    currency,
    paystackSubscriptionCode: subscriptionCode,
    paystackCustomerCode: raw.customer?.customer_code ?? null,
    paystackEmailToken: raw.email_token ?? null,
    periodStart,
    periodEnd,
    authorization,
  });

  // Reconcile the Payment.userSubscriptionId link if the subscription row
  // didn't exist when we wrote the Payment row above.
  if (!existingSub && subscriptionCode) {
    const linked = await prisma.userSubscription.findUnique({
      where: { paystackSubscriptionCode: subscriptionCode },
      select: { id: true },
    });
    if (linked) {
      await prisma.payment.update({
        where: { providerReference: verifyData.reference },
        data: { userSubscriptionId: linked.id },
      });
    }
  }
}

// ==============================================================
// 4. ADMIN — GET /api/admin/payments  (auth + isAdmin)
// ==============================================================

export async function listPaymentsService(query: ListPaymentsQuery): Promise<ListPaymentsResponse> {
  const where: Prisma.PaymentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.plan ? { plan: query.plan } : {}),
    ...(query.method ? { paymentMethod: { equals: query.method, mode: 'insensitive' } } : {}),
    ...(query.search
      ? {
          OR: [
            { providerReference: { contains: query.search, mode: 'insensitive' } },
            { customerEmail: { contains: query.search, mode: 'insensitive' } },
            { customerBusinessName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          createdAt: {
            ...(query.dateFrom ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) } : {}),
            ...(query.dateTo ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
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
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
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
export async function applyVerificationResult(
  reference: string,
  verifyData: PaystackVerifyData,
  opts: { source: 'verify-endpoint' | 'webhook' | 'admin-check' }
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
      appliedCouponCode: true,
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
      await grantSuccessEntitlements(tx, payment, paidAt, opts.source);
    }
  });

  if (flippingToSuccess) {
    sendSuccessEmailBestEffort(payment, reference, opts.source);
  }

  return { paymentId: payment.id, flippedToSuccess: flippingToSuccess };
}

// Narrow payment shape the success side-effects need. Both the Paystack
// verify path and the admin manual-override path select at least these fields.
export type SuccessPaymentSnapshot = {
  id: string;
  userId: string;
  sessionId: string | null;
  pillarId: string | null;
  plan: Plan;
  amount: Prisma.Decimal;
  currency: string;
  customerEmail: string;
  customerBusinessName: string | null;
  appliedCouponCode: string | null;
};

/**
 * Runs the "payment became SUCCESS" side-effects inside the caller's
 * transaction: consume the coupon, flip SessionResult.isPaid (Phase 2A) or
 * grant the pillar unlock (Phase 2B). Idempotent — safe under verify/webhook
 * races and repeat admin clicks.
 */
export async function grantSuccessEntitlements(
  tx: Prisma.TransactionClient,
  payment: SuccessPaymentSnapshot,
  paidAt: Date | null,
  source: string
): Promise<void> {
  if (payment.appliedCouponCode) {
    // Count this redemption. Atomic increment, then retire the code only once
    // the cap is reached — multi-use promo codes stay live until exhausted.
    const coupon = await tx.discount.update({
      where: { code: payment.appliedCouponCode },
      data: { usedCount: { increment: 1 } },
      select: { usedCount: true, maxUses: true },
    });
    if (coupon.usedCount >= coupon.maxUses) {
      await tx.discount.update({
        where: { code: payment.appliedCouponCode },
        data: { status: 'USED', isActive: false },
      });
    }
  }

  // Subscription charges have no entitlement to grant here — the
  // UserSubscription row IS the entitlement. Period roll + card capture
  // happen in handleSubscriptionChargeSuccess. Return early so the Phase
  // 2A/2B branches below don't try to find a session/pillar.
  if (payment.plan === Plan.SUBSCRIPTION) {
    return;
  }

  // Consultation paywall: there's nothing to grant — the ConsultationBooking
  // row already exists in REQUESTED state and the FE/admin both read the
  // Payment.status off the include. Flipping Payment to SUCCESS is the
  // entitlement; the admin then sees the booking surface as
  // "ready-to-confirm" in their inbox. Short-circuit so the Phase 2A/2B
  // branches below don't try to find a session/pillar.
  if (payment.plan === Plan.CONSULTATION) {
    return;
  }

  // Per-result paywall: on first successful Phase 2A payment, mark the
  // SessionResult as paid. The Payment row carries the sessionId set at
  // init time; legacy rows without a sessionId are skipped and logged.
  if (payment.plan === Plan.PHASE2A) {
    if (!payment.sessionId) {
      console.warn(
        `[payment:${source}] SUCCESS Phase 2A payment ${payment.id} has no sessionId — cannot mark result paid`
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
        `[payment:${source}] SUCCESS Phase 2B payment ${payment.id} has no pillarId — cannot grant unlock`
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

/**
 * Fire-and-forget unlock email. Source is logged so duplicate sends from
 * verify+webhook races can be diagnosed if they ever happen (the email is
 * idempotent from the user's perspective — they'd just see the same mail twice).
 *
 * For Phase 2B we point the user at the dashboard where they'll find the
 * newly-granted pillar credit. The email helper is plan-agnostic.
 */
export function sendSuccessEmailBestEffort(
  payment: SuccessPaymentSnapshot,
  reference: string,
  source: string
): void {
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
    console.error(`[payment:${source}] unlock email failed:`, error);
  });
}

export async function myPaymentsHistoryService(
  userId: string,
  query: UserPaymentHistoryQuery
): Promise<UserPaymentHistoryResponse> {
  const skip = (query.page - 1) * query.limit;

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where: { userId } }),
    prisma.payment.findMany({
      where: { userId },
      skip,
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        providerReference: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        createdAt: true,
      },
    }),
  ]);

  const payments: UserPaymentRow[] = rows.map((row) => ({
    id: row.id,
    reference: row.providerReference,
    plan: row.plan,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
  }));

  const totalPages = Math.ceil(total / query.limit);

  return {
    message: 'Billing history fetched successfully',
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    payments,
  };
}
