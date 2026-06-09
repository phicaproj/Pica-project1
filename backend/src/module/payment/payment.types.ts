import { z } from 'zod';
import type { Plan, PaymentStatus, PaymentProvider } from '@prisma/client';

// Prices are resolved from the PlanPrice table by pricing.service.ts.
// The frontend must not send an amount; if an older client does, Zod strips it.
export const initPaymentSchema = z.discriminatedUnion('plan', [
  z.object({
    plan: z.literal('PHASE2A'),
    sessionId: z.string().uuid(),
    couponCode: z.string().trim().min(1).optional(),
  }),
  z.object({
    plan: z.literal('PHASE2B_PILLAR'),
    pillarId: z.string().uuid(),
    couponCode: z.string().trim().min(1).optional(),
  }),
]);

export const verifyPaymentParams = z.object({
  reference: z.string().min(6).max(64),
});

export const listPaymentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED']).optional(),
  plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR']).optional(),
  // Search matches reference, customer email or business name.
  search: z.string().trim().min(1).max(100).optional(),
  method: z.string().trim().min(1).max(30).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date formatted as YYYY-MM-DD')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date formatted as YYYY-MM-DD')
    .optional(),
});

export const paymentIdParams = z.object({
  id: z.uuid(),
});

// Admin manual override. Reason is required so every override is auditable —
// it is stored on the payment row (failureReason for failures, and always in
// the verifyPayload audit entry).
export const adminUpdateStatusSchema = z.object({
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED']),
  reason: z.string().trim().min(3).max(500),
});

export type InitPaymentInput = z.infer<typeof initPaymentSchema>;
export type VerifyPaymentParams = z.infer<typeof verifyPaymentParams>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuery>;
export type PaymentIdParams = z.infer<typeof paymentIdParams>;
export type AdminUpdateStatusInput = z.infer<typeof adminUpdateStatusSchema>;

export type InitPaymentResponse = {
  message: string;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  paymentId: string;
  amount: number;
  baseAmount: number;
  discountAmount: number;
  currency: string;
  couponCode: string | null;
};

export type VerifyPaymentResponse = {
  message: string;
  status: PaymentStatus;
  paid: boolean;
  reference: string;
};

export type AdminPaymentRow = {
  id: string;
  reference: string;
  businessName: string | null;
  email: string;
  plan: Plan;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
};

export type ListPaymentsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  payments: AdminPaymentRow[];
};

// ── Admin: stats / detail / check / status override ─────────────

export type AdminPaymentStatsResponse = {
  message: string;
  stats: {
    totalRevenue: number; // SUCCESS only, NGN major units
    revenueThisMonth: number;
    revenueLastMonth: number;
    // % change month-over-month (null when last month had no revenue).
    revenueGrowthPct: number | null;
    pendingAmount: number; // sum of PENDING payments
    pendingCount: number;
    successRatePct: number | null; // SUCCESS / settled (SUCCESS+FAILED+ABANDONED+REVERSED)
    countByStatus: { status: PaymentStatus; count: number }[];
    // Last 6 calendar months of SUCCESS revenue for the velocity chart,
    // oldest first. monthLabel like "Jan".
    monthlyRevenue: { monthLabel: string; year: number; amount: number; count: number }[];
  };
};

export type AdminPaymentDetail = AdminPaymentRow & {
  userId: string;
  sessionId: string | null;
  pillarId: string | null;
  pillarName: string | null;
  baseAmount: number; // amount + discount (what it was before the coupon)
  couponCode: string | null;
  discountAmount: number | null;
  failureReason: string | null;
  authorizationUrl: string | null;
  updatedAt: Date;
  // Resolved entitlement state so the admin can see what the user got.
  resultIsPaid: boolean | null; // PHASE2A: SessionResult.isPaid (null if no result/session)
  unlock: {
    id: string;
    unlockedAt: Date;
    consumedAt: Date | null;
    sessionId: string | null;
  } | null; // PHASE2B
  webhookEvents: {
    id: string;
    eventType: string;
    processingStatus: string;
    processingError: string | null;
    receivedAt: Date;
  }[];
};

export type AdminPaymentDetailResponse = {
  message: string;
  payment: AdminPaymentDetail;
};

export type AdminCheckPaymentResponse = {
  message: string;
  // Which check resolved the status: 'database' when the row was already
  // settled, 'paystack' when we re-verified with the provider.
  checkedVia: 'database' | 'paystack';
  status: PaymentStatus;
  paid: boolean;
  reference: string;
  gatewayResponse: string | null;
};

export const userPaymentHistoryQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type UserPaymentHistoryQuery = z.infer<typeof userPaymentHistoryQuery>;

export type UserPaymentRow = {
  id: string;
  reference: string;
  plan: Plan;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
};

export type UserPaymentHistoryResponse = {
  message: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  payments: UserPaymentRow[];
};
