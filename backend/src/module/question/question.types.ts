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

export type BusinessSizeQuery = z.infer<typeof businessSizeQuerySchema>
export type Phase2AQuery = z.infer<typeof phase2aQuerySchema>

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
