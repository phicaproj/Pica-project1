import { z } from 'zod';
import type { Plan, PaymentStatus, PaymentProvider } from '@prisma/client';

// Discriminated union on `plan`. Each plan has its own required target:
//   PHASE2A         → sessionId (the SessionResult being unlocked)
//   PHASE2B_PILLAR  → pillarId  (no session exists yet; one is created later
//                                  via /assessment/phase2b/start once payment
//                                  succeeds and the unlock row is granted).
// Major units (NGN); until the admin pricing module ships the FE supplies the amount.
export const initPaymentSchema = z.discriminatedUnion('plan', [
  z.object({
    plan: z.literal('PHASE2A'),
    sessionId: z.string().uuid(),
    amount: z.number().positive().max(10_000_000),
  }),
  z.object({
    plan: z.literal('PHASE2B_PILLAR'),
    pillarId: z.string().uuid(),
    amount: z.number().positive().max(10_000_000),
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
