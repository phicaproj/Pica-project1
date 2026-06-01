import { z } from 'zod'
import { registry, errorResponse } from './registry'

const ColorBand = z.enum(['RED', 'AMBER', 'GREEN'])
const RiskType = z.enum(['NORMAL', 'RISK', 'KNOCKOUT'])
const InsightRule = z.enum(['KNOCKOUT', 'BOTH_RISK', 'ONE_RISK', 'BOTH_NORMAL'])
const Phase = z.enum(['PHASE1', 'PHASE2A', 'PHASE2B'])

const ResultPillarFindingSchema = registry.register(
	'ResultPillarFinding',
	z
		.object({
			optionId: z.string().uuid(),
			questionText: z.string(),
			selectedLabel: z.string().openapi({ example: 'B' }),
			observation: z.string(),
			recommendation: z.string(),
			riskType: RiskType,
			score: z.number().int(),
		})
		.openapi('ResultPillarFinding'),
)

const ResultPillarScoreSchema = registry.register(
	'ResultPillarScore',
	z
		.object({
			id: z.string().uuid(),
			pillarId: z.string().uuid(),
			rawScore: z.number().int(),
			maxPossibleScore: z.number().int(),
			weightedScore: z.number(),
			hasKnockout: z.boolean(),
			colorBand: ColorBand,
			insightRuleApplied: InsightRule,
			findings: z.array(ResultPillarFindingSchema),
			pillar: z.object({
				id: z.string().uuid(),
				code: z.string(),
				name: z.string(),
				description: z.string().nullable(),
				displayOrder: z.number().int(),
			}),
		})
		.openapi('ResultPillarScore'),
)

const ResultSchema = registry.register(
	'Result',
	z
		.object({
			id: z.string().uuid(),
			sessionId: z.string().uuid(),
			phase: Phase,
			totalScore: z.number(),
			colorBand: ColorBand,
			hasAnyKnockout: z.boolean(),
			knockoutQuestionIds: z.array(z.string().uuid()).openapi({
				description:
					'Empty array when the result is paywalled (Phase 2A, unpaid).',
			}),
			insightPayload: z.unknown().nullable().openapi({
				description:
					'Null when the result is paywalled (Phase 2A, unpaid). Full scoring payload otherwise.',
			}),
			reportPdfUrl: z.string().url().nullable(),
			generatedAt: z.string().datetime().nullable(),
			isPaid: z.boolean().openapi({
				description:
					'Per-result paywall state. Phase 1 results are always true. Phase 2A results start false and flip to true after POST /api/payment/init + Paystack SUCCESS for this sessionId.',
			}),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
			pillarScores: z.array(ResultPillarScoreSchema),
		})
		.openapi('Result'),
)

const GetResultResponseSchema = registry.register(
	'GetResultResponse',
	z
		.object({
			message: z.string(),
			result: ResultSchema,
			paywalled: z.boolean().openapi({
				description:
					'True iff this Phase 2A result is currently locked behind the paywall. When true, `result.insightPayload`, `result.knockoutQuestionIds`, `result.reportPdfUrl`, and per-pillar `findings` are stripped.',
			}),
		})
		.openapi('GetResultResponse'),
)

// ----- GET /api/result/me/latest --------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/result/me/latest',
	tags: ['Result'],
	summary: 'Get the authenticated user’s most recent completed result',
	description:
		'Returns the most recently completed result for the user, with the same paywall semantics as GET /api/result/:sessionId.',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Latest result',
			content: { 'application/json': { schema: GetResultResponseSchema } },
		},
		401: errorResponse('Missing or invalid token'),
		404: errorResponse('No completed assessment found for this user'),
	},
})

// ----- GET /api/result/me ---------------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/result/me',
	tags: ['Result'],
	summary: 'Get all completed results for the authenticated user',
	description:
		'Returns a list of all completed results for the user, with the same paywall semantics per result as GET /api/result/:sessionId.',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'All completed results for the user',
			content: {
				'application/json': {
					schema: z.object({
						results: z.array(GetResultResponseSchema),
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
	},
})

// ----- GET /api/result/:sessionId -------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/result/{sessionId}',
	tags: ['Result'],
	summary: 'Get the result for a session',
	description:
		'Public for Phase 1, paywalled for Phase 2A. When Phase 2A and `result.isPaid === false`, the response sets `paywalled: true` and strips sensitive fields (insightPayload, knockoutQuestionIds, reportPdfUrl, per-pillar findings). The pillar score numbers and colorBands are still returned so the FE can render a teaser.',
	request: {
		params: z.object({
			sessionId: z.string().uuid().openapi({
				param: { name: 'sessionId', in: 'path' },
			}),
		}),
	},
	responses: {
		200: {
			description: 'Result fetched (possibly paywalled)',
			content: { 'application/json': { schema: GetResultResponseSchema } },
		},
		404: errorResponse('Session or result not found'),
		409: errorResponse('Session not completed yet'),
	},
})

// ----- GET /api/result/:sessionId/pdf ---------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/result/{sessionId}/pdf',
	tags: ['Result'],
	summary: 'Download the result PDF',
	description:
		'Soft-authenticated. Phase 1 PDFs are open to anyone with the sessionId. Phase 2A PDFs require the authenticated user to own the session AND `SessionResult.isPaid === true` for that specific result. Returns `application/pdf` bytes; the FE should treat the response as a binary download.',
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({
			sessionId: z.string().uuid().openapi({
				param: { name: 'sessionId', in: 'path' },
			}),
		}),
	},
	responses: {
		200: {
			description: 'PDF report',
			content: {
				'application/pdf': {
					schema: z.string().openapi({ format: 'binary' }),
				},
			},
		},
		403: errorResponse(
			'Phase 2A: not the owner, or payment is required for this result',
		),
		404: errorResponse('Session or report data not found'),
		409: errorResponse('Session not completed yet'),
	},
})
