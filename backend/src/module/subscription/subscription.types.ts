import { z } from 'zod';
import { SubscriptionStatus } from '@prisma/client';

// ============================================================
// PUBLIC + USER-FACING TYPES
// ============================================================
//
// The plan catalogue is the same shape consumed by:
//   - GET /api/subscription/plans          (public marketing / dashboard)
//   - GET /api/admin/subscription/plans    (admin tier CRUD page)
// The admin endpoints add `paystackPlanCodeUsd|Ngn` + `isActive` flags so the
// admin UI can spot tiers that haven't been mirrored to Paystack yet.

export type SubscriptionPlanPublic = {
  id: string;
  tier: number;
  name: string;
  description: string;
  priceUsd: number;
  phase2aPerMonth: number;
  phase2bPerMonth: number;
  consultationsPerMonth: number;
  features: string[];
  displayOrder: number;
};

export type SubscriptionPlanAdmin = SubscriptionPlanPublic & {
  paystackPlanCodeUsd: string | null;
  paystackPlanCodeNgn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Masked card-on-file snapshot for the Settings → Payments screen. None of
// these are sensitive; they're the same fields Paystack echoes back. The FE
// only needs them to render "Visa •••• 4242 — exp 12/27" with a cancel link.
export type CardOnFile = {
  last4: string;
  brand: string | null;
  bank: string | null;
  expMonth: string | null;
  expYear: string | null;
};

// Snapshot of the authenticated user's active subscription. `usage` reflects
// the current billing period; quotas are inlined so the FE doesn't need a
// second round-trip to the plan endpoint to render the meter.
export type MySubscriptionPayload = {
  id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlanPublic;
  currency: 'USD' | 'NGN';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  /** Null until the first charge.success webhook lands and we capture it. */
  card: CardOnFile | null;
  usage: {
    phase2aUsed: number;
    phase2bUsed: number;
    consultationsUsed: number;
  };
};

// ============================================================
// REQUEST SCHEMAS — user
// ============================================================

export const subscribeSchema = z.object({
  planId: z.string().uuid('planId must be a valid uuid'),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export type SubscribeResponse = {
  message: string;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  amount: number;
  currency: 'USD' | 'NGN';
};

export type CancelSubscriptionResponse = {
  message: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
};

export type MySubscriptionResponse = {
  message: string;
  subscription: MySubscriptionPayload | null;
};

export type ListPlansResponse = {
  message: string;
  currency: 'USD';
  usdToNgn: number;
  plans: SubscriptionPlanPublic[];
};

// ============================================================
// ADMIN — tier CRUD
// ============================================================
//
// Admin owns every numeric and text field. Paystack codes are NOT editable —
// they're populated automatically by the service after createPaystackPlan
// returns. If currency support changes (e.g. enabling NGN later), the admin
// re-saves the tier and the service back-fills the missing code.

const nonNegativeInt = z
  .number()
  .int('must be an integer')
  .min(0, 'must be zero or greater');

export const createPlanSchema = z.object({
  tier: z.number().int().min(1, 'tier must be 1 or greater'),
  name: z.string().trim().min(1, 'name is required').max(80),
  description: z.string().trim().max(500).default(''),
  priceUsd: z
    .number()
    .gt(0, 'priceUsd must be greater than 0')
    .max(100_000, 'priceUsd looks unreasonably large'),
  phase2aPerMonth: nonNegativeInt,
  phase2bPerMonth: nonNegativeInt,
  consultationsPerMonth: nonNegativeInt,
  features: z.array(z.string().trim().min(1)).max(20).default([]),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

// Update mirrors create but every field is optional and `tier` is immutable —
// we don't want to break references silently. Re-tiering means creating a
// fresh plan and deactivating the old one.
export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    priceUsd: z
      .number()
      .gt(0, 'priceUsd must be greater than 0')
      .max(100_000, 'priceUsd looks unreasonably large')
      .optional(),
    phase2aPerMonth: nonNegativeInt.optional(),
    phase2bPerMonth: nonNegativeInt.optional(),
    consultationsPerMonth: nonNegativeInt.optional(),
    features: z.array(z.string().trim().min(1)).max(20).optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export type AdminPlanResponse = {
  message: string;
  plan: SubscriptionPlanAdmin;
};

export type AdminListPlansResponse = {
  message: string;
  plans: SubscriptionPlanAdmin[];
};
