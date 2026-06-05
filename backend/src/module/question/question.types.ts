import { z } from 'zod'
import { BusinessSize, Phase, RiskType } from '@prisma/client'

export const businessSizeQuerySchema = z.object({
	businessSize: z.nativeEnum(BusinessSize, {
		message: 'businessSize must be one of: SMALL, MEDIUM',
	}),
})

export const phase2aQuerySchema = z.object({
	sessionId: z
		.string({ error: 'sessionId is required' })
		.uuid('sessionId must be a valid UUID'),
})

export const phase2bQuerySchema = z.object({
	pillarId: z
		.string({ error: 'pillarId is required' })
		.uuid('pillarId must be a valid UUID'),
})

export type BusinessSizeQuery = z.infer<typeof businessSizeQuerySchema>
export type Phase2AQuery = z.infer<typeof phase2aQuerySchema>
export type Phase2BQuery = z.infer<typeof phase2bQuerySchema>

export type QuestionOptionResponse = {
	id: string
	optionLabel: string
	optionText: string
	displayOrder: number
}

export type QuestionResponse = {
	id: string
	questionCode: string
	questionText: string
	displayOrder: number
	options: QuestionOptionResponse[]
}

export type Phase2AQuestionResponse = QuestionResponse & {
	answered: boolean
	selectedOptionId: string | null
}

export type PillarResponse = {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
	questions: QuestionResponse[]
}

export type Phase2APillarResponse = {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
	questions: Phase2AQuestionResponse[]
}

export type Phase1QuestionsResponse = {
	message: string
	pillars: PillarResponse[]
}

export type Phase2AQuestionsResponse = {
	message: string
	sessionId: string
	answeredCount: number
	totalCount: number
	pillars: Phase2APillarResponse[]
}

export type Phase2BPillarMeta = {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
}

export type Phase2BQuestionsResponse = {
	message: string
	pillar: Phase2BPillarMeta
	questions: QuestionResponse[]
}

export type AllPillarsResponse = {
	message: string
	pillars: Phase2BPillarMeta[]
}

// ============================================================
// ADMIN — question authoring (admin-only; mounted from admin routes)
// ============================================================
//
// The frontend only sends business meaning: the question text, which pillar /
// phase / size it belongs to, and per-option text + score. Everything that the
// scoring engine depends on is DERIVED on the backend so the admin UI cannot
// get it wrong:
//   - optionLabel       → A/B/C/D from the option's position in the array
//   - displayOrder      → option index, and next-in-pillar for the question
//   - riskType          → from score: 0 = KNOCKOUT, pillar-max = NORMAL, else RISK
//   - questionCode       → "<pillarCode>-<nextSequence>" (e.g. FL-001)
//   - hasKnockoutOption → true if any option scores 0

const optionScore = z
	.number({ error: 'score is required' })
	.int('score must be a whole number')
	.min(0, 'score cannot be negative')
	.max(10, 'score cannot exceed 10')

const adminOptionInput = z.object({
	optionText: z.string({ error: 'optionText is required' }).trim().min(1, 'optionText is required'),
	score: optionScore,
	observation: z.string({ error: 'observation is required' }).trim().min(1, 'observation is required'),
	recommendation: z
		.string({ error: 'recommendation is required' })
		.trim()
		.min(1, 'recommendation is required'),
})

export const createQuestionSchema = z.object({
	pillarId: z.string({ error: 'pillarId is required' }).uuid('pillarId must be a valid UUID'),
	phase: z.nativeEnum(Phase, { message: 'phase must be one of: PHASE1, PHASE2A, PHASE2B' }),
	businessSize: z.nativeEnum(BusinessSize, {
		message: 'businessSize must be one of: SMALL, MEDIUM',
	}),
	isPhase1Featured: z.boolean().default(false),
	questionText: z
		.string({ error: 'questionText is required' })
		.trim()
		.min(1, 'questionText is required'),
	// 2–6 options; exactly one is expected to score 0 (the knockout) but we don't
	// force it — hasKnockoutOption is derived from whatever is sent.
	options: z.array(adminOptionInput).min(2, 'a question needs at least 2 options').max(6),
})

export const updateQuestionSchema = z
	.object({
		questionText: z.string().trim().min(1).optional(),
		phase: z.nativeEnum(Phase).optional(),
		businessSize: z.nativeEnum(BusinessSize).optional(),
		isPhase1Featured: z.boolean().optional(),
		isActive: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'at least one field must be provided',
	})

export const updateOptionSchema = z
	.object({
		optionText: z.string().trim().min(1).optional(),
		score: optionScore.optional(),
		observation: z.string().trim().min(1).optional(),
		recommendation: z.string().trim().min(1).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'at least one field must be provided',
	})

export const addOptionSchema = adminOptionInput

export const idParamSchema = z.object({
	id: z.string({ error: 'id is required' }).uuid('id must be a valid UUID'),
})

export const listAdminQuestionsQuerySchema = z.object({
	pillarId: z.string().uuid().optional(),
	phase: z.nativeEnum(Phase).optional(),
	businessSize: z.nativeEnum(BusinessSize).optional(),
	search: z.string().trim().min(1).max(120).optional(),
	includeInactive: z.coerce.boolean().optional(),
})

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
export type UpdateOptionInput = z.infer<typeof updateOptionSchema>
export type AddOptionInput = z.infer<typeof addOptionSchema>
export type IdParam = z.infer<typeof idParamSchema>
export type ListAdminQuestionsQuery = z.infer<typeof listAdminQuestionsQuerySchema>

// Admin responses DO include the answer-key fields (score, riskType, observation,
// recommendation) that the public QuestionOptionResponse deliberately hides.
export type AdminOptionResponse = {
	id: string
	optionLabel: string
	optionText: string
	score: number
	riskType: RiskType
	observation: string
	recommendation: string
	displayOrder: number
}

export type AdminQuestionResponse = {
	id: string
	pillarId: string
	pillarCode: string
	questionCode: string
	questionText: string
	phase: Phase
	businessSize: BusinessSize
	isPhase1Featured: boolean
	hasKnockoutOption: boolean
	isActive: boolean
	displayOrder: number
	options: AdminOptionResponse[]
}

export type AdminQuestionListResponse = {
	message: string
	total: number
	questions: AdminQuestionResponse[]
}

export type AdminQuestionDetailResponse = {
	message: string
	question: AdminQuestionResponse
}
