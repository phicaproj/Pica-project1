import { ColorBand, InsightRule, RiskType, SessionStatus } from '@prisma/client'

export type ResultPillarScoreResponse = {
	id: string
	pillarId: string
	rawScore: number
	maxPossibleScore: number
	weightedScore: number
	hasKnockout: boolean
	colorBand: ColorBand
	insightRuleApplied: InsightRule
	findings: Array<{
		optionId: string
		questionText: string
		selectedLabel: string
		observation: string
		recommendation: string
		riskType: RiskType
		score: number
	}>
	pillar: {
		id: string
		code: string
		name: string
		description: string | null
		displayOrder: number
	}
}

export type ResultResponse = {
	id: string
	sessionId: string
	totalScore: number
	colorBand: ColorBand
	hasAnyKnockout: boolean
	knockoutQuestionIds: string[]
	insightPayload: unknown
	reportPdfUrl: string | null
	generatedAt: Date | null
	createdAt: Date
	updatedAt: Date
	pillarScores: ResultPillarScoreResponse[]
}

export type GetResultResponse = {
	message: string
	result: ResultResponse
}
