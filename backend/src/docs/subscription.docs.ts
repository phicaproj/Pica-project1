import { z } from 'zod';
import { registry, errorResponse } from './registry';
import {
  createPlanSchema,
  quotaCheckQuerySchema,
  subscribeSchema,
  updatePlanSchema,
} from '../module/subscription/subscription.types';

// ----- Component schemas ----------------------------------------------------
//
// The public storefront card. Prices are USD-major-units; the FE multiplies by
// `usdToNgn` from the list response to render the ₦-billed display amount.
const SubscriptionPlanPublicSchema = registry.register(
  'SubscriptionPlanPublic',
  z
    .object({
      id: z.string().uuid(),
      tier: z.number().int(),
      name: z.string(),
      description: z.string(),
      priceUsd: z.number(),
      phase2aPerMonth: z.number().int(),
      phase2bPerMonth: z.number().int(),
      consultationsPerMonth: z.number().int(),
      features: z.array(z.string()),
      displayOrder: z.number().int(),
      // Annual cadence. `annualDiscountPct = 0` means the tier has no annual
      // option and the FE Monthly/Annual toggle hides this side.
      // `priceUsdAnnual` is the BE-derived `priceUsd × 12 × (1 − pct/100)`.
      annualDiscountPct: z.number().int(),
      priceUsdAnnual: z.number(),
    })
    .openapi('SubscriptionPlanPublic')
);

// Admin shape adds Paystack mirror codes + the `isActive` flag so the admin UI
// can spot tiers that haven't been replicated to Paystack yet.
const SubscriptionPlanAdminSchema = registry.register(
  'SubscriptionPlanAdmin',
  SubscriptionPlanPublicSchema.extend({
    paystackPlanCodeUsd: z.string().nullable(),
    paystackPlanCodeNgn: z.string().nullable(),
    paystackPlanCodeUsdAnnual: z.string().nullable(),
    paystackPlanCodeNgnAnnual: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi('SubscriptionPlanAdmin')
);

// Masked card-on-file shown on the settings billing screen. None of the fields
// are sensitive — they're the same fields Paystack echoes on every webhook.
const CardOnFileSchema = registry.register(
  'CardOnFile',
  z
    .object({
      last4: z.string(),
      brand: z.string().nullable(),
      bank: z.string().nullable(),
      expMonth: z.string().nullable(),
      expYear: z.string().nullable(),
    })
    .openapi('CardOnFile')
);

const MySubscriptionPayloadSchema = registry.register(
  'MySubscriptionPayload',
  z
    .object({
      id: z.string().uuid(),
      status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']),
      plan: SubscriptionPlanPublicSchema,
      currency: z.enum(['USD', 'NGN']),
      usdToNgn: z.number(),
      // Cadence snapshot — Settings reads this for "billed monthly" vs
      // "billed annually" labelling. Snapshotted at subscribe time.
      billingInterval: z.enum(['MONTHLY', 'ANNUAL']),
      currentPeriodStart: z.string().datetime(),
      currentPeriodEnd: z.string().datetime(),
      cancelAtPeriodEnd: z.boolean(),
      card: CardOnFileSchema.nullable(),
      usage: z.object({
        phase2aUsed: z.number().int(),
        phase2bUsed: z.number().int(),
        consultationsUsed: z.number().int(),
      }),
    })
    .openapi('MySubscriptionPayload')
);

// ----- User-facing endpoints -----------------------------------------------

// GET /api/subscription/plans ------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/subscription/plans',
  tags: ['Subscription'],
  summary: 'List active subscription plans',
  description:
    'Public. Returns the plan catalogue + storefront section toggles. When the admin disables the subscription section entirely, `sections.subscription = false` and `plans = []` so legacy callers still get a valid shape.',
  responses: {
    200: {
      description: 'Plan catalogue',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            currency: z.literal('USD'),
            usdToNgn: z.number(),
            sections: z.object({
              payPerUse: z.boolean(),
              subscription: z.boolean(),
            }),
            plans: z.array(SubscriptionPlanPublicSchema),
          }),
        },
      },
    },
  },
});

// GET /api/subscription/me ---------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/subscription/me',
  tags: ['Subscription'],
  summary: 'Get my current subscription',
  description:
    'Returns the authenticated user\'s active subscription, including the current-period usage meter and masked card-on-file. Returns `subscription: null` when the user has never subscribed or the last subscription has fully expired.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current subscription',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            subscription: MySubscriptionPayloadSchema.nullable(),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
  },
});

// GET /api/subscription/quota-check ------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/subscription/quota-check',
  tags: ['Subscription'],
  summary: 'Cheap read-only quota probe',
  description:
    'Side-effect-free check used by the FE to decide whether to short-circuit checkout. `hasQuota = true` means a subsequent paid-action endpoint will be settled by the user\'s subscription (no Paystack redirect). Does NOT consume quota.',
  security: [{ bearerAuth: [] }],
  request: { query: quotaCheckQuerySchema },
  responses: {
    200: {
      description: 'Quota verdict',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            hasQuota: z.boolean(),
            kind: z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'CONSULTATION']),
          }),
        },
      },
    },
    400: errorResponse('Invalid kind'),
    401: errorResponse('Missing or invalid token'),
  },
});

// POST /api/subscription/subscribe ------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/subscription/subscribe',
  tags: ['Subscription'],
  summary: 'Initialise a subscription purchase',
  description: [
    'Two paths, mirroring the pay-per-use init flow:',
    '- **Paid**: returns `free = false`, `authorizationUrl` + `accessCode` + `reference` for the FE to open the Paystack inline widget. The subscription is created on `subscription.create` webhook receipt.',
    '- **Coupon-covered free**: when a coupon discounts the price to zero, the BE skips Paystack entirely, creates the subscription synchronously, and returns `free = true`.',
    '',
    'Optional `interval` (`MONTHLY` | `ANNUAL`, default `MONTHLY`). When `ANNUAL`, the price is `priceUsd × 12 × (1 − annualDiscountPct/100)` and the renewal period rolls in 365-day chunks. Plans with `annualDiscountPct = 0` reject `interval = ANNUAL` with 400.',
    '',
    'Optional `couponCode` is validated against the same rules as POST /api/coupon/validate (including SUBSCRIPTION-tier targeting). Coupons apply on top of the annual discount when both are present.',
  ].join('\n'),
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: subscribeSchema } },
    },
  },
  responses: {
    200: {
      description: 'Subscription init or settled free',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            free: z.boolean(),
            authorizationUrl: z.string().nullable(),
            accessCode: z.string().nullable(),
            reference: z.string(),
            amount: z.number(),
            baseAmount: z.number(),
            discountAmount: z.number(),
            currency: z.enum(['USD', 'NGN']),
            couponCode: z.string().nullable(),
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    404: errorResponse('Plan not found or inactive'),
    409: errorResponse('User already has an active subscription'),
    422: errorResponse('Coupon invalid for this plan or already used'),
  },
});

// POST /api/subscription/cancel ---------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/subscription/cancel',
  tags: ['Subscription'],
  summary: 'Cancel the authenticated user\'s subscription',
  description:
    'Sets `cancelAtPeriodEnd = true` so the user retains access until the current period ends. The Paystack-side subscription is disabled so the next renewal charge will not run. Triggers a cancellation email.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Cancellation scheduled',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            cancelAtPeriodEnd: z.boolean(),
            currentPeriodEnd: z.string().datetime(),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    404: errorResponse('No active subscription'),
  },
});

// ----- Admin endpoints (plan CRUD) -----------------------------------------

// GET /api/admin/subscription-plans -----------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/admin/subscription-plans',
  tags: ['Admin'],
  summary: 'List subscription plans (admin)',
  description:
    'Admin only — requires `ledger:read`. Returns active and inactive plans plus their Paystack mirror codes.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Plans',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            plans: z.array(SubscriptionPlanAdminSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:read permission'),
  },
});

// POST /api/admin/subscription-plans ----------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/admin/subscription-plans',
  tags: ['Admin'],
  summary: 'Create a subscription plan',
  description:
    'Admin only — requires `ledger:write`. The service calls Paystack to create a matching plan in each enabled wire currency and writes the returned `paystackPlanCode...` columns back automatically.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createPlanSchema } },
    },
  },
  responses: {
    201: {
      description: 'Plan created',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), plan: SubscriptionPlanAdminSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:write permission'),
    502: errorResponse('Paystack plan creation failed'),
  },
});

// PATCH /api/admin/subscription-plans/{id} ----------------------------------
registry.registerPath({
  method: 'patch',
  path: '/api/admin/subscription-plans/{id}',
  tags: ['Admin'],
  summary: 'Update a subscription plan',
  description:
    'Admin only — requires `ledger:write`. `tier` is immutable post-create. Price/quota changes do not migrate existing subscribers — they take effect on the next renewal.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updatePlanSchema } },
    },
  },
  responses: {
    200: {
      description: 'Plan updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), plan: SubscriptionPlanAdminSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:write permission'),
    404: errorResponse('Plan not found'),
  },
});

// DELETE /api/admin/subscription-plans/{id} ---------------------------------
registry.registerPath({
  method: 'delete',
  path: '/api/admin/subscription-plans/{id}',
  tags: ['Admin'],
  summary: 'Delete a subscription plan',
  description:
    'Admin only — requires `ledger:write`. Soft-deactivates if any historical subscription references the plan; hard-deletes only when the plan has never been used. Active subscribers are not affected — they continue on their renewal cadence until the period ends.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Plan removed or deactivated',
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:write permission'),
    404: errorResponse('Plan not found'),
  },
});
