import { z } from 'zod';
import { registry, errorResponse } from './registry';
import {
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from '../module/coupon/coupon.types';

// ----- Component schemas ----------------------------------------------------

const CouponResponseSchema = registry.register(
  'CouponResponse',
  z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      description: z.string().nullable(),
      amountOff: z.number(),
      percentOff: z.number(),
      isActive: z.boolean(),
      status: z.string(),
      maxUses: z.number().int(),
      usedCount: z.number().int(),
      plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'SUBSCRIPTION']).nullable(),
      pillarId: z.string().uuid().nullable(),
      pillarCode: z.string().nullable(),
      pillarName: z.string().nullable(),
      // Both null = "applies to any subscription tier"; set = tier-scoped.
      // The user-facing validate endpoint surfaces a clear "valid only for X
      // plan" error when the coupon is tier-scoped but the checkout target
      // is a different tier.
      subscriptionPlanId: z.string().uuid().nullable(),
      subscriptionPlanName: z.string().nullable(),
      userId: z.string().uuid().nullable(),
      userEmail: z.string().email().nullable(),
      createdAt: z.string().datetime(),
    })
    .openapi('CouponResponse')
);

const CouponPricingSchema = registry.register(
  'CouponPricing',
  z
    .object({
      code: z.string(),
      basePrice: z.number(),
      discountAmount: z.number(),
      finalAmount: z.number(),
    })
    .openapi('CouponPricing')
);

// ----- User-facing endpoint -------------------------------------------------

// POST /api/coupon/validate --------------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/coupon/validate',
  tags: ['Coupon'],
  summary: 'Validate a coupon and quote the discount',
  description: [
    'Authenticated. Validates the coupon code against the requested plan + base price and returns the priced quote. The same rules run at payment-init so the user never sees a "valid here, invalid there" mismatch.',
    '',
    'Rules enforced:',
    '- Coupon must exist, be active, and have uses remaining.',
    '- A user-scoped coupon (`userId` set) is only redeemable by that user.',
    '- The same user cannot redeem a code twice (checked against prior SUCCESS payments).',
    '- `plan` and (when set on the coupon) `pillarId` / `subscriptionPlanId` must match the checkout target.',
    '- The computed `discountAmount` is clamped so `finalAmount` never goes below 0.',
  ].join('\n'),
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: validateCouponSchema } },
    },
  },
  responses: {
    200: {
      description: 'Coupon applied',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), pricing: CouponPricingSchema }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    422: errorResponse(
      'Coupon invalid, exhausted, already used by this account, or scoped to a different plan/pillar/tier'
    ),
  },
});

// ----- Admin endpoints ------------------------------------------------------

// GET /api/admin/coupons -----------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/admin/coupons',
  tags: ['Admin'],
  summary: 'List coupons (admin)',
  description: 'Admin only — requires `coupons:read`. Filter by user, active flag, plan, or pillar.',
  security: [{ bearerAuth: [] }],
  request: { query: listCouponsQuerySchema },
  responses: {
    200: {
      description: 'Coupons',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            total: z.number().int(),
            coupons: z.array(CouponResponseSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing coupons:read permission'),
  },
});

// POST /api/admin/coupons ----------------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/admin/coupons',
  tags: ['Admin'],
  summary: 'Create a coupon',
  description: [
    'Admin only — requires `coupons:write`.',
    '',
    'Provide exactly one of `amountOff` or `percentOff`. Omitting `code` makes the BE generate a unique one. Plan-scoped rules:',
    '- `plan = PHASE2B_PILLAR` requires `pillarId`.',
    '- `plan = SUBSCRIPTION` may optionally set `subscriptionPlanId` to scope to a single tier; leave null to cover every tier.',
    '- `pillarId` and `subscriptionPlanId` can only be set on the matching plan.',
    '',
    'A user-scoped coupon (`userId` set) is automatically capped at `maxUses = 1` and triggers a delivery email to that user on success.',
  ].join('\n'),
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createCouponSchema } },
    },
  },
  responses: {
    201: {
      description: 'Coupon created',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), coupon: CouponResponseSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing coupons:write permission'),
    404: errorResponse('Referenced user, pillar, or subscription plan not found'),
    409: errorResponse('A coupon with this code already exists'),
  },
});

// PATCH /api/admin/coupons/{id} ---------------------------------------------
registry.registerPath({
  method: 'patch',
  path: '/api/admin/coupons/{id}',
  tags: ['Admin'],
  summary: 'Update a coupon',
  description:
    'Admin only — requires `coupons:write`. Only `description`, `isActive`, and `maxUses` are mutable post-create. `maxUses` cannot drop below `usedCount`; raising it above `usedCount` on an exhausted coupon re-opens it.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateCouponSchema } },
    },
  },
  responses: {
    200: {
      description: 'Coupon updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), coupon: CouponResponseSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing coupons:write permission'),
    404: errorResponse('Coupon not found'),
    422: errorResponse('maxUses below usedCount or invalid for user-scoped coupon'),
  },
});

// DELETE /api/admin/coupons/{id} --------------------------------------------
registry.registerPath({
  method: 'delete',
  path: '/api/admin/coupons/{id}',
  tags: ['Admin'],
  summary: 'Delete a coupon',
  description: 'Admin only — requires `coupons:write`. Hard-deletes the coupon row.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Coupon removed',
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing coupons:write permission'),
    404: errorResponse('Coupon not found'),
  },
});
