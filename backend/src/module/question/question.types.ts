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

export type PillarResponse = {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
	questions: QuestionResponse[]
}

export type Phase1QuestionsResponse = {
	message: string
	pillars: PillarResponse[]
}
