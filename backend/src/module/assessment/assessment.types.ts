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
	// Annual revenue used to feed the SMALL/MEDIUM classifier; business size
	// is now staff-only (see assessment.service.ts). The column is kept on
	// AssessmentSession for history, so we still accept it when provided.
	annualRevenue: z.string().trim().optional(),
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

export const startPhase2BInput = z.object({
	pillarId: z
		.string({ error: 'Pillar ID is required' })
		.uuid('Pillar ID must be a valid UUID'),
})

export type StartAssessmentInput = z.infer<typeof startAssessmentInput>
export type AssessmentSessionParams = z.infer<typeof assessmentSessionParams>
export type AnswerAssessmentInput = z.infer<typeof answerAssessmentInput>
export type StartPhase2BInput = z.infer<typeof startPhase2BInput>

export type StartAssessmentResponse = {
	message: string
	sessionId: string
	businessSize: 'SMALL' | 'MEDIUM'
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

export type StartPhase2AResponse = {
	message: string
	sessionId: string
}

export type StartPhase2BResponse = {
	message: string
	sessionId: string
	pillarId: string
	questionCount: number
}

export type Phase2BPillarStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'

export type Phase2BPillarEntry = {
	pillarId: string
	pillarCode: string
	pillarName: string
	sessionId: string | null
	status: Phase2BPillarStatus
	unlockedAt: Date
}

export type MyPhase2BPillarsResponse = {
	message: string
	pillars: Phase2BPillarEntry[]
}

export type SessionResponseEntry = {
	questionId: string
	selectedOptionId: string
}

export type SessionResponsesResponse = {
	message: string
	answeredCount: number
	totalCount: number
	responses: SessionResponseEntry[]
}
