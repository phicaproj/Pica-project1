import { z } from 'zod';
import { registry, errorResponse } from './registry';
import {
  initPaymentSchema,
  verifyPaymentParams,
  listPaymentsQuery,
  userPaymentHistoryQuery,
} from '../module/payment/payment.types';
import {
  createPricingSchema,
  listPricingQuerySchema,
  pricingIdParamSchema,
  updatePricingSchema,
} from '../module/payment/pricing.types';

const PaymentStatus = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REVERSED']);

const UserPaymentRowSchema = registry.register(
  'UserPaymentRow',
  z
    .object({
      id: z.string().uuid(),
      reference: z.string(),
      plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR']),
      amount: z.number(),
      currency: z.string(),
      status: PaymentStatus,
      paidAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
    })
    .openapi('UserPaymentRow')
);

const AdminPaymentRowSchema = registry.register(
  'AdminPaymentRow',
  z
    .object({
      id: z.string().uuid(),
      reference: z.string(),
      businessName: z.string().nullable(),
      email: z.string().email(),
      plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR']),
      provider: z.string(),
      amount: z.number(),
      currency: z.string(),
      paymentMethod: z.string().nullable(),
      status: PaymentStatus,
      paidAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
    })
    .openapi('AdminPaymentRow')
);

const PricingRowSchema = registry.register(
  'PricingRow',
  z
    .object({
      id: z.string().uuid(),
      plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR']),
      pillarId: z.string().uuid().nullable(),
      pillarCode: z.string().nullable(),
      pillarName: z.string().nullable(),
      price: z.number(),
      currency: z.literal('NGN'),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .openapi('PricingRow')
);

// ----- GET /api/payment/pricing --------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/payment/pricing',
  tags: ['Payment'],
  summary: 'Get public plan pricing',
  description:
    'Public. Returns admin-managed Plan 2A pricing and per-pillar Plan 2B pricing for landing pages and checkout display.',
  responses: {
    200: {
      description: 'Public pricing retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            currency: z.literal('NGN'),
            phase2A: PricingRowSchema.nullable(),
            phase2B: z.array(PricingRowSchema),
          }),
        },
      },
    },
  },
});

// ----- POST /api/payment/init -----------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/payment/init',
  tags: ['Payment'],
  summary: 'Initialize a Paystack transaction for a Phase 2A result',
  description: [
    'Per-result paywall. `sessionId` is **required** and must point at a PHASE2A session owned by the authenticated user whose status is COMPLETED and whose result is not yet paid.',
    '',
    'The FE should redirect the user to the returned `authorizationUrl`. After Paystack redirects back, the FE calls GET /api/payment/verify/:reference to confirm — the webhook is a safety net for closed-tab scenarios.',
    '',
    '**100% coupon waiver:** when an applied coupon covers the full amount, no Paystack transaction is created. The response has `free: true`, null `authorizationUrl`/`accessCode`, and the payment is already SUCCESS with entitlements granted — skip the checkout and treat it as paid.',
    '',
    '**Retake semantics:** if the user takes Phase 2A again, the new session produces a new unpaid result. They must pay again to unlock it. Calling /init for an already-paid result returns 409.',
    '',
    '**Phase 2B bundles:** for `plan: PHASE2B_PILLAR`, send either a single `pillarId` (legacy) or `pillarIds: string[]` (1–7 distinct pillars) to buy a bundle in one transaction. The bundle total applies a compound discount (5% per extra pillar by default, capped — admin-configurable via app settings). A verified success grants one Phase 2B unlock per pillar, all sharing the same `paymentId`. Subscribers with enough remaining Phase 2B quota get the whole bundle free (one credit consumed per pillar); a bundle larger than the remaining quota falls through to the paid path.',
  ].join('\n'),
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: initPaymentSchema } },
    },
  },
  responses: {
    200: {
      description: 'Paystack transaction initialized',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            free: z.boolean().openapi({
              description: 'True when a 100%-off coupon settled the payment — no checkout to open',
            }),
            authorizationUrl: z
              .string()
              .url()
              .nullable()
              .openapi({ description: 'Redirect the user here (null when free)' }),
            accessCode: z.string().nullable(),
            reference: z.string().openapi({
              description: 'Pass to /verify/:reference after redirect-back',
            }),
            paymentId: z.string().uuid(),
            amount: z.number().openapi({
              description: 'Final amount charged after coupon discount, in major NGN units',
            }),
            baseAmount: z.number().openapi({
              description: 'Configured DB price before coupon discount',
            }),
            discountAmount: z.number(),
            currency: z.string(),
            couponCode: z.string().nullable(),
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('You do not own this session'),
    404: errorResponse('Session not found'),
    409: errorResponse(
      'Session not completed, no result yet, or this result has already been paid for'
    ),
    422: errorResponse('Plan does not match session phase'),
  },
});

// ----- Admin pricing CRUD ---------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/pricing',
  tags: ['Admin'],
  summary: 'List plan prices',
  description:
    'Admin-only. Lists DB-owned plan prices used by checkout and Paystack initialization.',
  security: [{ bearerAuth: [] }],
  request: { query: listPricingQuerySchema },
  responses: {
    200: {
      description: 'Pricing rows retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            prices: z.array(PricingRowSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/pricing',
  tags: ['Admin'],
  summary: 'Create a plan price',
  description: 'Admin-only. Creates PHASE2A pricing or per-pillar PHASE2B_PILLAR pricing.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createPricingSchema } },
    },
  },
  responses: {
    201: {
      description: 'Pricing row created successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            price: PricingRowSchema,
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    409: errorResponse('A price already exists for this plan and pillar'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/pricing/{id}',
  tags: ['Admin'],
  summary: 'Update a plan price',
  security: [{ bearerAuth: [] }],
  request: {
    params: pricingIdParamSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: updatePricingSchema } },
    },
  },
  responses: {
    200: {
      description: 'Pricing row updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            price: PricingRowSchema,
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('Pricing row not found'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/pricing/{id}',
  tags: ['Admin'],
  summary: 'Delete a plan price',
  security: [{ bearerAuth: [] }],
  request: { params: pricingIdParamSchema },
  responses: {
    200: {
      description: 'Pricing row deleted successfully',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('Pricing row not found'),
  },
});

// ----- GET /api/payment/verify/:reference -----------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/payment/verify/{reference}',
  tags: ['Payment'],
  summary: 'Verify a Paystack transaction by reference',
  description:
    'Idempotent. The FE calls this after Paystack redirects the user back with the `reference` query param. On first SUCCESS, the matching `SessionResult.isPaid` is flipped to true and the unlock email is sent. Safe to call repeatedly — already-settled payments are returned without re-hitting Paystack.',
  security: [{ bearerAuth: [] }],
  request: {
    params: verifyPaymentParams,
  },
  responses: {
    200: {
      description: 'Payment status',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            status: PaymentStatus,
            paid: z.boolean().openapi({
              description: 'Convenience: `status === "SUCCESS"`',
            }),
            reference: z.string(),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('You are not the owner of this payment'),
    404: errorResponse('Payment reference not found'),
  },
});

// ----- GET /api/payment/history ---------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/payment/history',
  tags: ['Payment'],
  summary: 'Get authenticated user payment transaction history',
  description:
    'Authenticated. Returns paginated list of all payment transactions made by the authenticated user.',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .openapi({ param: { name: 'page', in: 'query' } }),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(10)
        .openapi({ param: { name: 'limit', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'User payment history retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
            payments: z.array(UserPaymentRowSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
  },
});

// ----- GET /api/admin/payments ------------------------------------------------

const adminPaymentErrors = {
  401: errorResponse('Missing or invalid token'),
  403: errorResponse('Forbidden: User is not an admin'),
};

registry.registerPath({
  method: 'get',
  path: '/api/admin/payments',
  tags: ['Admin'],
  summary: 'List all platform payment transactions',
  description:
    'Admin-only. Returns paginated list of all payments across the entire platform. Filters: status, plan, payment method, free-text search (reference / customer email / business name), and a created-date range.',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .openapi({ param: { name: 'page', in: 'query' } }),
      pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .openapi({ param: { name: 'pageSize', in: 'query' } }),
      status: PaymentStatus.optional().openapi({ param: { name: 'status', in: 'query' } }),
      plan: z
        .enum(['PHASE2A', 'PHASE2B_PILLAR'])
        .optional()
        .openapi({ param: { name: 'plan', in: 'query' } }),
      search: z
        .string()
        .optional()
        .openapi({
          param: { name: 'search', in: 'query' },
          description: 'Matches reference, customer email or business name.',
        }),
      method: z
        .string()
        .optional()
        .openapi({ param: { name: 'method', in: 'query' }, example: 'card' }),
      dateFrom: z
        .string()
        .optional()
        .openapi({ param: { name: 'dateFrom', in: 'query' }, example: '2026-01-01' }),
      dateTo: z
        .string()
        .optional()
        .openapi({ param: { name: 'dateTo', in: 'query' }, example: '2026-06-30' }),
    }),
  },
  responses: {
    200: {
      description: 'All payments retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            page: z.number(),
            pageSize: z.number(),
            total: z.number(),
            totalPages: z.number(),
            payments: z.array(AdminPaymentRowSchema),
          }),
        },
      },
    },
    ...adminPaymentErrors,
  },
});

// ----- GET /api/admin/payments/stats --------------------------------------------

const AdminPaymentStatsSchema = registry.register(
  'AdminPaymentStats',
  z
    .object({
      totalRevenue: z.number(),
      revenueThisMonth: z.number(),
      revenueLastMonth: z.number(),
      revenueGrowthPct: z.number().nullable(),
      pendingAmount: z.number(),
      pendingCount: z.number(),
      successRatePct: z.number().nullable(),
      countByStatus: z.array(z.object({ status: PaymentStatus, count: z.number() })),
      monthlyRevenue: z.array(
        z.object({
          monthLabel: z.string(),
          year: z.number(),
          amount: z.number(),
          count: z.number(),
        })
      ),
    })
    .openapi('AdminPaymentStats')
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/payments/stats',
  tags: ['Admin'],
  summary: 'Payment dashboard stats',
  description:
    'Admin-only. Revenue totals (SUCCESS payments), month-over-month growth, pending amount/count, success rate over settled payments, status counts, and a 6-month revenue series for the chart.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Stats retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), stats: AdminPaymentStatsSchema }),
        },
      },
    },
    ...adminPaymentErrors,
  },
});

// ----- GET /api/admin/payments/:id ----------------------------------------------

const AdminPaymentDetailSchema = registry.register(
  'AdminPaymentDetail',
  AdminPaymentRowSchema.extend({
    userId: z.string().uuid(),
    sessionId: z.string().uuid().nullable(),
    pillarId: z.string().uuid().nullable(),
    pillarName: z.string().nullable(),
    baseAmount: z.number(),
    couponCode: z.string().nullable(),
    discountAmount: z.number().nullable(),
    failureReason: z.string().nullable(),
    authorizationUrl: z.string().nullable(),
    updatedAt: z.string().datetime(),
    resultIsPaid: z.boolean().nullable(),
    unlock: z
      .object({
        id: z.string().uuid(),
        unlockedAt: z.string().datetime(),
        consumedAt: z.string().datetime().nullable(),
        sessionId: z.string().uuid().nullable(),
      })
      .nullable(),
    webhookEvents: z.array(
      z.object({
        id: z.string().uuid(),
        eventType: z.string(),
        processingStatus: z.string(),
        processingError: z.string().nullable(),
        receivedAt: z.string().datetime(),
      })
    ),
  }).openapi('AdminPaymentDetail')
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/payments/{id}',
  tags: ['Admin'],
  summary: 'Get full details of one payment',
  description:
    'Admin-only. Full payment record including coupon/discount breakdown, failure reason, granted entitlement state (Phase 2A result paid / Phase 2B unlock), and recent webhook events.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
  },
  responses: {
    200: {
      description: 'Payment details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), payment: AdminPaymentDetailSchema }),
        },
      },
    },
    404: errorResponse('Payment not found'),
    ...adminPaymentErrors,
  },
});

// ----- POST /api/admin/payments/:id/check ---------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/admin/payments/{id}/check',
  tags: ['Admin'],
  summary: 'Check whether a payment actually went through',
  description:
    'Admin-only. Settled payments (SUCCESS/FAILED/ABANDONED/REVERSED) are answered from our records. PENDING payments are re-verified against the Paystack verify endpoint; a discovered SUCCESS grants the user their entitlements exactly like the normal verify/webhook path.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
  },
  responses: {
    200: {
      description: 'Check completed',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            checkedVia: z.enum(['database', 'paystack']),
            status: PaymentStatus,
            paid: z.boolean(),
            reference: z.string(),
            gatewayResponse: z.string().nullable(),
          }),
        },
      },
    },
    404: errorResponse('Payment not found'),
    ...adminPaymentErrors,
  },
});

// ----- PATCH /api/admin/payments/:id/status --------------------------------------

registry.registerPath({
  method: 'patch',
  path: '/api/admin/payments/{id}/status',
  tags: ['Admin'],
  summary: 'Manually override a payment status',
  description:
    'Admin-only. Changes the payment status with a required audit reason (stored on the row). Marking SUCCESS grants the user their entitlements (report unlock / pillar credit) and sends the confirmation email. Downgrading a SUCCESS payment is record-only — already-granted access is not revoked (refund/anti-fraud policy).',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: PaymentStatus,
            reason: z.string().min(3).max(500).openapi({
              example: 'Paystack dashboard shows the charge succeeded but webhook never arrived.',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status updated; returns the refreshed payment detail',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), payment: AdminPaymentDetailSchema }),
        },
      },
    },
    404: errorResponse('Payment not found'),
    409: errorResponse('Payment is already in that status'),
    ...adminPaymentErrors,
  },
});
