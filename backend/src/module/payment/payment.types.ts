import { z } from 'zod';
import type { Plan, PaymentStatus, PaymentProvider } from '@prisma/client';

export const initPaymentSchema = z.object({
  // sessionId is REQUIRED — under the per-result paywall, every Phase 2A
  // payment unlocks one specific SessionResult. The FE must send the session
  // whose result is being paid for; the BE validates ownership and that the
  // session has a result and that the result is not already paid.
  sessionId: z.string().uuid(),
  plan: z.enum(['PHASE2A']),
  // Major units (NGN). Until the admin pricing module ships, FE supplies this.
  amount: z.number().positive().max(10_000_000),
});

export const verifyPaymentParams = z.object({
  reference: z.string().min(6).max(64),
});

export const listPaymentsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED']).optional(),
  plan: z.enum(['PHASE2A']).optional(),
});

export type InitPaymentInput = z.infer<typeof initPaymentSchema>;
export type VerifyPaymentParams = z.infer<typeof verifyPaymentParams>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuery>;

export type InitPaymentResponse = {
  message: string;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  paymentId: string;
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
  payments: AdminPaymentRow[];
};
