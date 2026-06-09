import { PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND } from '../../service/shared/http';
import { verifyTransaction } from '../../service/shared/paystack.service';
import {
  applyVerificationResult,
  grantSuccessEntitlements,
  sendSuccessEmailBestEffort,
} from './payment.service';
import type {
  AdminCheckPaymentResponse,
  AdminPaymentDetail,
  AdminPaymentDetailResponse,
  AdminPaymentStatsResponse,
  AdminUpdateStatusInput,
} from './payment.types';

const SETTLED_STATUSES: PaymentStatus[] = [
  PaymentStatus.SUCCESS,
  PaymentStatus.FAILED,
  PaymentStatus.ABANDONED,
  PaymentStatus.REVERSED,
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ==============================================================
// STATS — GET /api/admin/payments/stats
// ==============================================================

export async function adminPaymentStatsService(): Promise<AdminPaymentStatsResponse> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // 6 calendar months back, including the current one.
  const startOfWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [totalAgg, thisMonthAgg, lastMonthAgg, pendingAgg, byStatus, windowRows] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.SUCCESS },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.SUCCESS, paidAt: { gte: startOfThisMonth } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.SUCCESS,
          paidAt: { gte: startOfLastMonth, lt: startOfThisMonth },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { status: PaymentStatus.PENDING },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      // Monthly revenue series: narrow select, bucketed in memory (6 months of
      // SUCCESS rows is small).
      prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCESS, paidAt: { gte: startOfWindow } },
        select: { amount: true, paidAt: true },
      }),
    ]);

  const totalRevenue = totalAgg._sum.amount?.toNumber() ?? 0;
  const revenueThisMonth = thisMonthAgg._sum.amount?.toNumber() ?? 0;
  const revenueLastMonth = lastMonthAgg._sum.amount?.toNumber() ?? 0;

  // Success rate over settled payments only — PENDING rows haven't concluded
  // so counting them would unfairly drag the rate down.
  const settledCounts = byStatus.filter((row) => SETTLED_STATUSES.includes(row.status));
  const settledTotal = settledCounts.reduce((sum, row) => sum + row._count._all, 0);
  const successCount =
    byStatus.find((row) => row.status === PaymentStatus.SUCCESS)?._count._all ?? 0;

  // Bucket SUCCESS revenue per calendar month, oldest first.
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      monthLabel: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
      amount: 0,
      count: 0,
    };
  });
  for (const row of windowRows) {
    if (!row.paidAt) continue;
    const bucket = monthlyRevenue.find(
      (m) => m.year === row.paidAt!.getFullYear() && m.month === row.paidAt!.getMonth()
    );
    if (bucket) {
      bucket.amount += row.amount.toNumber();
      bucket.count += 1;
    }
  }

  return {
    message: 'Payment stats fetched successfully',
    stats: {
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowthPct:
        revenueLastMonth > 0
          ? Number((((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1))
          : null,
      pendingAmount: pendingAgg._sum.amount?.toNumber() ?? 0,
      pendingCount: pendingAgg._count._all,
      successRatePct:
        settledTotal > 0 ? Number(((successCount / settledTotal) * 100).toFixed(1)) : null,
      countByStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      monthlyRevenue: monthlyRevenue.map(({ monthLabel, year, amount, count }) => ({
        monthLabel,
        year,
        amount,
        count,
      })),
    },
  };
}

// ==============================================================
// DETAIL — GET /api/admin/payments/:id
// ==============================================================

const detailSelect = {
  id: true,
  userId: true,
  sessionId: true,
  pillarId: true,
  providerReference: true,
  customerBusinessName: true,
  customerEmail: true,
  plan: true,
  provider: true,
  amount: true,
  currency: true,
  appliedCouponCode: true,
  discountAmount: true,
  paymentMethod: true,
  status: true,
  failureReason: true,
  authorizationUrl: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  pillar: { select: { name: true } },
  phase2bUnlock: {
    select: { id: true, unlockedAt: true, consumedAt: true, sessionId: true },
  },
  webhookEvents: {
    orderBy: { receivedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      eventType: true,
      processingStatus: true,
      processingError: true,
      receivedAt: true,
    },
  },
} satisfies Prisma.PaymentSelect;

type DetailRecord = Prisma.PaymentGetPayload<{ select: typeof detailSelect }>;

async function toDetail(row: DetailRecord): Promise<AdminPaymentDetail> {
  // PHASE2A entitlement state: did the user's result actually get unlocked?
  let resultIsPaid: boolean | null = null;
  if (row.sessionId) {
    const result = await prisma.sessionResult.findUnique({
      where: { sessionId: row.sessionId },
      select: { isPaid: true },
    });
    resultIsPaid = result?.isPaid ?? null;
  }

  const discount = row.discountAmount?.toNumber() ?? null;
  const amount = row.amount.toNumber();

  return {
    id: row.id,
    reference: row.providerReference,
    businessName: row.customerBusinessName,
    email: row.customerEmail,
    plan: row.plan,
    provider: row.provider,
    amount,
    currency: row.currency,
    paymentMethod: row.paymentMethod,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    userId: row.userId,
    sessionId: row.sessionId,
    pillarId: row.pillarId,
    pillarName: row.pillar?.name ?? null,
    baseAmount: amount + (discount ?? 0),
    couponCode: row.appliedCouponCode,
    discountAmount: discount,
    failureReason: row.failureReason,
    authorizationUrl: row.authorizationUrl,
    updatedAt: row.updatedAt,
    resultIsPaid,
    unlock: row.phase2bUnlock,
    webhookEvents: row.webhookEvents,
  };
}

export async function adminPaymentDetailService(
  paymentId: string
): Promise<AdminPaymentDetailResponse> {
  const row = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: detailSelect,
  });
  if (!row) throw new AppError('Payment not found', NOT_FOUND);

  return {
    message: 'Payment details fetched successfully',
    payment: await toDetail(row),
  };
}

// ==============================================================
// CHECK — POST /api/admin/payments/:id/check
// ==============================================================

/**
 * Admin "is this payment actually paid?" button.
 *
 * Step 1 — our own verification logic: if the row is already settled
 * (SUCCESS/FAILED/ABANDONED/REVERSED) that state is authoritative (it came
 * from a previous verify or webhook) and we return it without a network call.
 *
 * Step 2 — fallback to Paystack's verify endpoint for PENDING rows: re-verify
 * the reference with the provider and apply the result through the same
 * idempotent path the user-verify endpoint and webhook use (so a discovered
 * SUCCESS also unlocks the report / grants the pillar credit + emails the user).
 */
export async function adminCheckPaymentService(
  paymentId: string
): Promise<AdminCheckPaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, providerReference: true, status: true, failureReason: true },
  });
  if (!payment) throw new AppError('Payment not found', NOT_FOUND);

  if (SETTLED_STATUSES.includes(payment.status)) {
    return {
      message: 'Payment already settled — status confirmed from our records',
      checkedVia: 'database',
      status: payment.status,
      paid: payment.status === PaymentStatus.SUCCESS,
      reference: payment.providerReference,
      gatewayResponse: payment.failureReason,
    };
  }

  // PENDING — our records are inconclusive, ask Paystack.
  const verifyData = await verifyTransaction(payment.providerReference);
  await applyVerificationResult(payment.providerReference, verifyData, {
    source: 'admin-check',
  });

  const updated = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { status: true },
  });
  const status = updated?.status ?? PaymentStatus.PENDING;

  return {
    message: 'Payment re-verified with Paystack',
    checkedVia: 'paystack',
    status,
    paid: status === PaymentStatus.SUCCESS,
    reference: payment.providerReference,
    gatewayResponse: verifyData.gateway_response ?? null,
  };
}

// ==============================================================
// STATUS OVERRIDE — PATCH /api/admin/payments/:id/status
// ==============================================================

/**
 * Manual status override for support cases (e.g. Paystack confirmed a charge
 * on their dashboard but the webhook never landed, or a dispute was resolved).
 *
 * Side-effects mirror the policy used everywhere else:
 *   - PENDING/other → SUCCESS grants entitlements (result unlock / pillar
 *     credit, coupon consumed) and sends the unlock email — identical to a
 *     Paystack-confirmed success.
 *   - SUCCESS → anything else is RECORD-ONLY: the status changes for
 *     bookkeeping but access already granted is NOT revoked (anti-fraud /
 *     refund policy — see Phase2BPillarUnlock notes in the schema).
 *
 * Every override stores an audit entry (admin id, reason, before/after) in
 * the verifyPayload JSON so support history survives on the row itself.
 */
export async function adminUpdatePaymentStatusService(
  paymentId: string,
  adminId: string,
  input: AdminUpdateStatusInput
): Promise<AdminPaymentDetailResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
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
      providerReference: true,
      verifyPayload: true,
    },
  });
  if (!payment) throw new AppError('Payment not found', NOT_FOUND);

  const newStatus = input.status as PaymentStatus;
  if (payment.status === newStatus) {
    throw new AppError(`Payment is already ${newStatus}`, CONFLICT);
  }

  const flippingToSuccess = newStatus === PaymentStatus.SUCCESS;
  const now = new Date();

  // Audit trail appended to verifyPayload under adminOverrides[] — keeps the
  // provider's original verify response intact alongside the manual history.
  const existingPayload =
    payment.verifyPayload && typeof payment.verifyPayload === 'object'
      ? (payment.verifyPayload as Record<string, unknown>)
      : {};
  const overrides = Array.isArray(existingPayload.adminOverrides)
    ? (existingPayload.adminOverrides as unknown[])
    : [];
  const auditedPayload = {
    ...existingPayload,
    adminOverrides: [
      ...overrides,
      {
        adminId,
        reason: input.reason,
        fromStatus: payment.status,
        toStatus: newStatus,
        at: now.toISOString(),
      },
    ],
  };

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        verifyPayload: auditedPayload as Prisma.InputJsonValue,
        ...(flippingToSuccess ? { paidAt: now } : {}),
        ...(newStatus === PaymentStatus.FAILED
          ? { failureReason: `Admin override: ${input.reason}` }
          : {}),
      },
    });

    if (flippingToSuccess) {
      await grantSuccessEntitlements(tx, payment, now, 'admin-override');
    }
  });

  if (flippingToSuccess) {
    sendSuccessEmailBestEffort(payment, payment.providerReference, 'admin-override');
  }

  const updated = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: detailSelect,
  });
  // The row was just updated inside this function, so it must exist.
  if (!updated) throw new AppError('Payment not found', NOT_FOUND);

  return {
    message: `Payment marked as ${newStatus}`,
    payment: await toDetail(updated),
  };
}
