import { z } from 'zod'
import { registry, errorResponse } from './registry'
import {
	answerAssessmentInput,
	startAssessmentInput,
	startPhase2BInput,
} from '../module/assessment/assessment.types'

const SessionIdParam = z
	.string()
	.uuid()
	.openapi({
		param: { name: 'sessionId', in: 'path' },
		description: 'AssessmentSession UUID',
	})

const Phase2BPillarEntrySchema = registry.register(
	'Phase2BPillarEntry',
	z
		.object({
			pillarId: z.string().uuid(),
			pillarCode: z.string(),
			pillarName: z.string(),
			sessionId: z.string().uuid().nullable(),
			status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']),
			unlockedAt: z.string().datetime(),
		})
		.openapi('Phase2BPillarEntry'),
)

const SessionResponseEntrySchema = registry.register(
	'SessionResponseEntry',
	z
		.object({
			questionId: z.string().uuid(),
			selectedOptionId: z.string().uuid(),
		})
		.openapi('SessionResponseEntry'),
)

// ----- POST /api/assessment/start -------------------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/assessment/start',
	tags: ['Assessment'],
	summary: 'Start a Phase 1 assessment (lead-capture)',
	description:
		'Public. Creates a new AssessmentSession in PHASE1 from the lead form, returns its sessionId and the computed businessSize that drives which question set the FE should load.',
	request: {
		body: {
			required: true,
			content: { 'application/json': { schema: startAssessmentInput } },
		},
	},
	responses: {
		201: {
			description: 'Session created',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						sessionId: z.string().uuid(),
						businessSize: z.enum(['SMALL', 'MEDIUM']),
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
	},
})

// ----- POST /api/assessment/phase2a/start -----------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/assessment/phase2a/start',
	tags: ['Assessment'],
	summary: 'Start a new Phase 2A session for the authenticated user',
	description:
		'Creates a new PHASE2A AssessmentSession and freezes the question set (snapshot of question UUIDs). Each call creates a new session — users can retake. **Per-result paywall:** the result produced by this session will be unpaid until /api/payment/init succeeds for that sessionId.',
	security: [{ bearerAuth: [] }],
	responses: {
		201: {
			description: 'Phase 2A session created',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						sessionId: z.string().uuid(),
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
	},
})

// ----- POST /api/assessment/phase2b/start -----------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/assessment/phase2b/start',
	tags: ['Assessment'],
	summary: 'Start a Phase 2B assessment session for a specific pillar',
	description:
		'Authenticated. Creates a new PHASE2B assessment session for the given unlocked pillar.',
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			required: true,
			content: { 'application/json': { schema: startPhase2BInput } },
		},
	},
	responses: {
		201: {
			description: 'Phase 2B session created',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						sessionId: z.string().uuid(),
						pillarId: z.string().uuid(),
						questionCount: z.number().int(),
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
		401: errorResponse('Missing or invalid token'),
		403: errorResponse('Pillar not unlocked yet'),
	},
})

// ----- GET /api/assessment/phase2b/me ---------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/assessment/phase2b/me',
	tags: ['Assessment'],
	summary: 'Get all unlocked Phase 2B pillars and their session status',
	description:
		'Authenticated. Returns a list of all Phase 2B pillars that the user has unlocked, along with the status of their associated assessment sessions.',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Unlocked Phase 2B pillars list',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						pillars: z.array(Phase2BPillarEntrySchema),
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
	},
})

// ----- GET /api/assessment/:sessionId/responses -----------------------------

registry.registerPath({
	method: 'get',
	path: '/api/assessment/{sessionId}/responses',
	tags: ['Assessment'],
	summary: 'Get user responses for a specific session',
	description:
		'Authenticated. Returns all answers given so far in the specified assessment session.',
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({ sessionId: SessionIdParam }),
	},
	responses: {
		200: {
			description: 'Session responses list',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						answeredCount: z.number().int(),
						totalCount: z.number().int(),
						responses: z.array(SessionResponseEntrySchema),
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
		403: errorResponse('Forbidden: You do not own this session'),
		404: errorResponse('Session not found'),
	},
})

// ----- POST /api/assessment/:sessionId/answer -------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/assessment/{sessionId}/answer',
	tags: ['Assessment'],
	summary: 'Submit (or update) an answer for a question in this session',
	description:
		'Soft-authenticated. For Phase 1, anyone with the sessionId can answer. For Phase 2A, the authenticated user must own the session. Re-answering the same questionId overwrites the previous selection.',
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({ sessionId: SessionIdParam }),
		body: {
			required: true,
			content: { 'application/json': { schema: answerAssessmentInput } },
		},
	},
	responses: {
		200: {
			description: 'Answer recorded',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						sessionId: z.string().uuid(),
						responseId: z.string().uuid(),
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
		403: errorResponse('Not the owner of this Phase 2A session'),
		404: errorResponse('Session, question, or option not found'),
		409: errorResponse('Session not in an answerable state'),
	},
})

// ----- POST /api/assessment/:sessionId/submit -------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/assessment/{sessionId}/submit',
	tags: ['Assessment'],
	summary: 'Submit a completed session for scoring',
	description:
		'Soft-authenticated. Marks the session COMPLETED and triggers scoring, which populates `SessionPillarScore` rows and a `SessionResult`. The `redirectTo` field tells the FE where to send the user next (e.g. `/result/:sessionId`).',
	security: [{ bearerAuth: [] }],
	request: {
		params: z.object({ sessionId: SessionIdParam }),
	},
	responses: {
		200: {
			description: 'Session submitted and scored',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						sessionId: z.string().uuid(),
						redirectTo: z.string(),
					}),
				},
			},
		},
		403: errorResponse('Not the owner of this Phase 2A session'),
		404: errorResponse('Session not found'),
		409: errorResponse('Session already submitted or incomplete answers'),
	},
})
