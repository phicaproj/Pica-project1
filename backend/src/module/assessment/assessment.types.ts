import { z } from 'zod'

const requiredText = (label: string) =>
	z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`)

export const startAssessmentInput = z.object({
	leadEmail: z
		.string({ error: 'Lead email is required' })
		.email('Lead email must be a valid email address'),
	staffSize: requiredText('Staff size'),
	businessName: requiredText('Business name'),
	industry: requiredText('Industry'),
	location: requiredText('Location'),
	operatingYears: requiredText('Operating years'),
	annualRevenue: requiredText('Annual revenue'),
})

export const assessmentSessionParams = z.object({
	sessionId: z
		.string({ error: 'Session ID is required' })
		.uuid('Session ID must be a valid UUID'),
})

export const answerAssessmentInput = z.object({
	questionId: z
		.string({ error: 'Question ID is required' })
		.uuid('Question ID must be a valid UUID'),
	selectedOptionId: z
		.string({ error: 'Selected option ID is required' })
		.uuid('Selected option ID must be a valid UUID'),
})

export type StartAssessmentInput = z.infer<typeof startAssessmentInput>
export type AssessmentSessionParams = z.infer<typeof assessmentSessionParams>
export type AnswerAssessmentInput = z.infer<typeof answerAssessmentInput>

export type StartAssessmentResponse = {
	message: string
	sessionId: string
}

export type AnswerAssessmentResponse = {
	message: string
	sessionId: string
	responseId: string
}

export type SubmitAssessmentResponse = {
	message: string
	sessionId: string
	redirectTo: string
}
