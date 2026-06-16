import { z } from 'zod';

// SUBSCRIPTION joined the enum in Slice F+ so admins can author coupons that
// discount monthly plans the same way pay-per-use diagnostics do.
const couponPlanSchema = z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'SUBSCRIPTION']);

// Admin creates a coupon. Exactly one of amountOff / percentOff carries the
// real value; the other is derived and stored so redemption can cross-check.
// A coupon may be scoped to a single user (userId) or left global (null).
export const createCouponSchema = z
  .object({
    description: z.string().trim().max(200).optional(),
    // Optional — if omitted the backend generates a unique code.
    code: z
      .string()
      .trim()
      .min(4, 'code must be at least 4 characters')
      .max(32)
      .regex(/^[A-Za-z0-9-]+$/, 'code may only contain letters, numbers, and dashes')
      .optional(),
    amountOff: z.coerce.number().min(0, 'amountOff cannot be negative').optional(),
    percentOff: z.coerce
      .number()
      .min(0, 'percentOff cannot be negative')
      .max(100, 'percentOff cannot exceed 100')
      .optional(),
    isActive: z.boolean().default(true),
    userId: z.string().uuid('userId must be a valid UUID').optional(),
    plan: couponPlanSchema.optional().nullable(),
    pillarId: z.string().uuid('pillarId must be a valid UUID').optional().nullable(),
    // Optional tier-narrowing for SUBSCRIPTION coupons. null = applies to any
    // tier; set = only valid for that specific subscription plan. Mirrors the
    // pillarId story for PHASE2B_PILLAR but is *optional* here so an admin can
    // still author a coupon that covers every tier in one promo.
    subscriptionPlanId: z
      .string()
      .uuid('subscriptionPlanId must be a valid UUID')
      .optional()
      .nullable(),
    // How many distinct users may redeem this code. Defaults to 1 so a
    // forgotten field can never produce an unlimited promo. User-scoped
    // coupons are forced to 1 (enforced below + in the service).
    maxUses: z.coerce
      .number()
      .int('maxUses must be a whole number')
      .min(1, 'maxUses must be at least 1')
      .max(100000, 'maxUses is too large')
      .default(1),
  })
  .refine((data) => data.amountOff !== undefined || data.percentOff !== undefined, {
    message: 'provide either amountOff or percentOff',
  })
  .refine((data) => !(data.amountOff && data.percentOff), {
    message: 'provide only one of amountOff or percentOff, not both',
  })
  .refine((data) => !data.userId || data.maxUses === 1, {
    path: ['maxUses'],
    message: 'a user-specific coupon can only have 1 use — remove the user to allow more',
  })
  .refine((data) => data.plan !== 'PHASE2B_PILLAR' || !!data.pillarId, {
    path: ['pillarId'],
    message: 'pillarId is required for PHASE2B_PILLAR coupons',
  })
  .refine((data) => data.plan === 'PHASE2B_PILLAR' || !data.pillarId, {
    path: ['pillarId'],
    message: 'pillarId can only be set for PHASE2B_PILLAR coupons',
  })
  .refine((data) => data.plan === 'SUBSCRIPTION' || !data.subscriptionPlanId, {
    path: ['subscriptionPlanId'],
    message: 'subscriptionPlanId can only be set for SUBSCRIPTION coupons',
  });

export const updateCouponSchema = z
  .object({
    description: z.string().trim().max(200).optional(),
    isActive: z.boolean().optional(),
    // Raising/lowering the cap after creation. Service-level rules: cannot be
    // set below usedCount, and stays locked to 1 on user-scoped coupons.
    maxUses: z.coerce
      .number()
      .int('maxUses must be a whole number')
      .min(1, 'maxUses must be at least 1')
      .max(100000, 'maxUses is too large')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export const listCouponsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  plan: couponPlanSchema.optional(),
  pillarId: z.string().uuid().optional(),
});

// User-facing validation at checkout. basePrice is the pre-discount amount the
// frontend intends to charge (major NGN units) so we can compute the discount.
// subscriptionPlanId carries the tier the user is subscribing to when
// plan = SUBSCRIPTION; the validator uses it to enforce coupon.subscriptionPlanId
// when set.
export const validateCouponSchema = z
  .object({
    code: z.string().trim().min(1, 'code is required'),
    basePrice: z.coerce.number().min(0, 'basePrice cannot be negative'),
    plan: couponPlanSchema,
    pillarId: z.string().uuid().optional(),
    subscriptionPlanId: z.string().uuid().optional(),
  })
  .refine((data) => data.plan !== 'PHASE2B_PILLAR' || !!data.pillarId, {
    path: ['pillarId'],
    message: 'pillarId is required for PHASE2B_PILLAR coupons',
  });

export const codeParamSchema = z.object({
  code: z.string().trim().min(1, 'code is required'),
});

export const couponIdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ListCouponsQuery = z.infer<typeof listCouponsQuerySchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CodeParam = z.infer<typeof codeParamSchema>;
export type CouponIdParam = z.infer<typeof couponIdParamSchema>;

export type CouponResponse = {
  id: string;
  code: string;
  description: string | null;
  amountOff: number;
  percentOff: number;
  isActive: boolean;
  status: string;
  maxUses: number;
  usedCount: number;
  plan: 'PHASE2A' | 'PHASE2B_PILLAR' | 'SUBSCRIPTION' | null;
  pillarId: string | null;
  pillarCode: string | null;
  pillarName: string | null;
  // SUBSCRIPTION-tier targeting. Both null = coupon applies to any tier.
  subscriptionPlanId: string | null;
  subscriptionPlanName: string | null;
  userId: string | null;
  userEmail: string | null;
  createdAt: Date;
};

export type CouponListResponse = {
  message: string;
  total: number;
  coupons: CouponResponse[];
};

export type CouponDetailResponse = {
  message: string;
  coupon: CouponResponse;
};

// Result of pricing a coupon against a base price — shared by the validate
// endpoint and the payment-init flow.
export type CouponPricing = {
  code: string;
  basePrice: number;
  discountAmount: number;
  finalAmount: number;
};

export type ValidateCouponResponse = {
  message: string;
  pricing: CouponPricing;
};
