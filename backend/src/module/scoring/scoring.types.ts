import { ColorBand, InsightRule, RiskType } from '@prisma/client'

export type ScoringFinding = {
	optionId: string
	questionText: string
	selectedLabel: string
	observation: string
	recommendation: string
	riskType: RiskType
	score: number
}

export type ScoringPillarPayload = {
	pillarId: string
	rawScore: number
	maxPossibleScore: number
	weightedScore: number
	hasKnockout: boolean
	colorBand: ColorBand
	insightRuleApplied: InsightRule
	findings: ScoringFinding[]
}

export type ScoringResultPayload = {
	totalScore: number
	colorBand: ColorBand
	hasAnyKnockout: boolean
	knockoutQuestionIds: string[]
	pillarScores: ScoringPillarPayload[]
}
