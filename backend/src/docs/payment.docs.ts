import { z } from 'zod'
import { registry, errorResponse } from './registry'
import {
	initPaymentSchema,
	verifyPaymentParams,
} from '../module/payment/payment.types'

const PaymentStatus = z.enum([
	'PENDING',
	'SUCCESS',
	'FAILED',
	'ABANDONED',
	'REVERSED',
])

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
