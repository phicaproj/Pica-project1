import { z } from 'zod';
import { BillingInterval, SubscriptionStatus } from '@prisma/client';

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
  // Annual cadence. `annualDiscountPct` of 0 means "no annual option" — the FE
  // hides the Monthly/Annual toggle for this tier. `priceUsdAnnual` is the
  // derived `priceUsd * 12 * (1 - pct/100)` shipped server-side so the FE
  // doesn't have to repeat the math.
  annualDiscountPct: number;
  priceUsdAnnual: number;
};

export type SubscriptionPlanAdmin = SubscriptionPlanPublic & {
  paystackPlanCodeUsd: string | null;
  paystackPlanCodeNgn: string | null;
  paystackPlanCodeUsdAnnual: string | null;
  paystackPlanCodeNgnAnnual: string | null;
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
//
// usdToNgn mirrors the rate returned by listPlansService so the FE can
// compute the wire-currency display price without an extra fetch. Plan
// prices are stored in USD; for NGN-billed subscriptions the FE multiplies
// priceUsd by usdToNgn before formatting with the ₦ symbol.
export type MySubscriptionPayload = {
  id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlanPublic;
  currency: 'USD' | 'NGN';
  usdToNgn: number;
  // Cadence snapshot. The FE labels the Settings panel "billed monthly /
  // annually" off this and uses it to format the renewal date.
  billingInterval: BillingInterval;
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
  // Cadence pick. Defaults to MONTHLY so existing FE callers that don't yet
  // send `interval` keep working untouched. ANNUAL applies the tier's
  // annualDiscountPct and rolls the period in 365-day chunks.
  interval: z.enum(['MONTHLY', 'ANNUAL']).default('MONTHLY'),
  // Optional discount code. When the discount covers 100% of the price the BE
  // skips Paystack entirely and returns `free: true` — the FE renders the
  // success state without ever opening the inline widget.
  couponCode: z.string().trim().min(1).max(32).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

// Section R-2 — cheap read-only quota probe. FE calls this before initPayment
// so it can short-circuit the checkout UI on a quota-covered action without
// the side effect of creating a PENDING Payment row.
export const quotaCheckQuerySchema = z.object({
  kind: z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'CONSULTATION']),
});

export type QuotaCheckQuery = z.infer<typeof quotaCheckQuerySchema>;

export type QuotaCheckResponse = {
  message: string;
  hasQuota: boolean;
  // Echoed back so a slow-network caller can correlate the response with the
  // request it issued. Cheap; the service already knows it.
  kind: 'PHASE2A' | 'PHASE2B_PILLAR' | 'CONSULTATION';
};

// Shape mirrors InitPaymentResponse so the FE can reuse the same coupon UI
// across pay-per-use and subscription checkout. `authorizationUrl`/`accessCode`
// are null on free-coupon settlements; FE must branch on `free`.
export type SubscribeResponse = {
  message: string;
  free: boolean;
  authorizationUrl: string | null;
  accessCode: string | null;
  reference: string;
  amount: number;
  baseAmount: number;
  discountAmount: number;
  currency: 'USD' | 'NGN';
  couponCode: string | null;
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
  // Section F — storefront on/off toggles. The FE branches on these so the
  // user never sees a deactivated section even briefly. `plans` is zeroed
  // when subscription is off so legacy callers still get a valid shape.
  sections: {
    payPerUse: boolean;
    subscription: boolean;
  };
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
  // 0–80% off `priceUsd × 12` when the user picks ANNUAL. 0 disables annual.
  annualDiscountPct: z
    .number()
    .int('annualDiscountPct must be an integer')
    .min(0, 'annualDiscountPct must be zero or greater')
    .max(80, 'annualDiscountPct cannot exceed 80')
    .default(0),
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
    annualDiscountPct: z
      .number()
      .int()
      .min(0)
      .max(80)
      .optional(),
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
