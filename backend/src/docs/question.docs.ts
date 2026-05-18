import { z } from 'zod'
import { registry, errorResponse } from './registry'

const QuestionOptionSchema = registry.register(
	'QuestionOption',
	z
		.object({
			id: z.string().uuid(),
			optionLabel: z.string().openapi({ example: 'A' }),
			optionText: z.string(),
			displayOrder: z.number().int(),
		})
		.openapi('QuestionOption'),
)

const QuestionSchema = registry.register(
	'Question',
	z
		.object({
			id: z.string().uuid(),
			questionCode: z.string().openapi({ example: 'FL-001' }),
			questionText: z.string(),
			displayOrder: z.number().int(),
			options: z.array(QuestionOptionSchema),
		})
		.openapi('Question'),
)

const Phase2AQuestionSchema = registry.register(
	'Phase2AQuestion',
	QuestionSchema.extend({
		answered: z.boolean(),
		selectedOptionId: z.string().uuid().nullable(),
	}).openapi('Phase2AQuestion'),
)

const PillarSchema = registry.register(
	'Pillar',
	z
		.object({
			id: z.string().uuid(),
			code: z.string().openapi({ example: 'FL' }),
			name: z.string().openapi({ example: 'Founder & Leadership' }),
			description: z.string().nullable(),
			displayOrder: z.number().int(),
			questions: z.array(QuestionSchema),
		})
		.openapi('Pillar'),
)

const Phase2APillarSchema = registry.register(
	'Phase2APillar',
	z
		.object({
			id: z.string().uuid(),
			code: z.string(),
			name: z.string(),
			description: z.string().nullable(),
			displayOrder: z.number().int(),
			questions: z.array(Phase2AQuestionSchema),
		})
		.openapi('Phase2APillar'),
)

// ----- GET /api/questions/phase1 --------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/questions/phase1',
	tags: ['Questions'],
	summary: 'Get Phase 1 questions for a business size',
	description:
		'Public. Returns the Phase 1 question set (one featured question per pillar) for the given business size. Call after POST /api/assessment/start, passing the `businessSize` it returned.',
	request: {
		query: z.object({
			businessSize: z
				.enum(['SMALL', 'MEDIUM'])
				.openapi({
					param: { name: 'businessSize', in: 'query' },
					description: 'Returned by POST /api/assessment/start',
				}),
		}),
	},
	responses: {
		200: {
			description: 'Phase 1 questions grouped by pillar',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						pillars: z.array(PillarSchema),
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
	},
})

// ----- GET /api/questions/phase2a -------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/questions/phase2a',
	tags: ['Questions'],
	summary: 'Get Phase 2A questions for an active session',
	description:
		'Returns the 70-question Phase 2A set frozen for this session, grouped by pillar, with each question carrying `answered` and `selectedOptionId` so the FE can resume mid-assessment. Requires ownership of the session.',
	security: [{ bearerAuth: [] }],
	request: {
		query: z.object({
			sessionId: z
				.string()
				.uuid()
				.openapi({
					param: { name: 'sessionId', in: 'query' },
					description: 'PHASE2A AssessmentSession UUID',
				}),
		}),
	},
	responses: {
		200: {
			description: 'Phase 2A questions for the session',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						sessionId: z.string().uuid(),
						answeredCount: z.number().int(),
						totalCount: z.number().int(),
						pillars: z.array(Phase2APillarSchema),
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
		403: errorResponse('Not the owner of this session'),
		404: errorResponse('Session not found'),
	},
})
