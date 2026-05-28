import { z } from 'zod'
import { BusinessSize } from '@prisma/client'

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
