import { z } from 'zod'
import { registry, errorResponse } from './registry'
import {
	initPaymentSchema,
	verifyPaymentParams,
	listPaymentsQuery,
	userPaymentHistoryQuery,
} from '../module/payment/payment.types'

const PaymentStatus = z.enum([
	'PENDING',
	'SUCCESS',
	'FAILED',
	'ABANDONED',
	'REVERSED',
])

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
		.openapi('UserPaymentRow'),
)

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
		.openapi('AdminPaymentRow'),
)

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
		'**Retake semantics:** if the user takes Phase 2A again, the new session produces a new unpaid result. They must pay again to unlock it. Calling /init for an already-paid result returns 409.',
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
						authorizationUrl: z
							.string()
							.url()
							.openapi({ description: 'Redirect the user here' }),
						accessCode: z.string(),
						reference: z.string().openapi({
							description: 'Pass to /verify/:reference after redirect-back',
						}),
						paymentId: z.string().uuid(),
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
		401: errorResponse('Missing or invalid token'),
		403: errorResponse('You do not own this session'),
		404: errorResponse('Session not found'),
		409: errorResponse(
			'Session not completed, no result yet, or this result has already been paid for',
		),
		422: errorResponse('Plan does not match session phase'),
	},
})

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
})

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
			page: z.coerce.number().int().min(1).default(1).openapi({ param: { name: 'page', in: 'query' } }),
			limit: z.coerce.number().int().min(1).max(100).default(10).openapi({ param: { name: 'limit', in: 'query' } }),
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
})

// ----- GET /api/payment/admin -----------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/payment/admin',
	tags: ['Payment'],
	summary: 'List all platform payment transactions',
	description:
		'Admin-only. Returns paginated list of all payments across the entire platform, with query filters for status and plan.',
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			page: z.coerce.number().int().min(1).default(1).openapi({ param: { name: 'page', in: 'query' } }),
			pageSize: z.coerce.number().int().min(1).max(100).default(20).openapi({ param: { name: 'pageSize', in: 'query' } }),
			status: PaymentStatus.optional().openapi({ param: { name: 'status', in: 'query' } }),
			plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR']).optional().openapi({ param: { name: 'plan', in: 'query' } }),
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
						payments: z.array(AdminPaymentRowSchema),
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
		403: errorResponse('Forbidden: User is not an admin'),
	},
})
