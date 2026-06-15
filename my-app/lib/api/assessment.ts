import { authedFetch } from './config'

export type Phase2BPillarStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'

export interface Phase2BPillarSession {
	pillarId: string
	pillarCode: string
	pillarName: string
	sessionId: string | null
	status: Phase2BPillarStatus
	unlockedAt: string
}

export const getMyPhase2BPillars = async () => {
	return authedFetch<{ message: string; pillars: Phase2BPillarSession[] }>(
		'/assessment/phase2b/me',
		{ method: 'GET' }
	)
}

export const startPhase2B = async (payload: { pillarId: string }) => {
	return authedFetch<{ message: string; sessionId: string }>(
		'/assessment/phase2b/start',
		{ method: 'POST', body: JSON.stringify(payload) }
	)
}

export const fetchPhase2BQuestions = async (pillarId: string) => {
	// For now using `any` as the return type for questions until we have a Question type defined globally
	return authedFetch<any>(
		`/questions/phase2b?pillarId=${pillarId}`,
		{ method: 'GET' }
	)
}

export const getAllPillars = async () => {
	return authedFetch<any>(
		'/questions/pillars',
		{ method: 'GET' }
	)
}

export const getMyCompletedResults = async () => {
	return authedFetch<any>(
		'/result/me',
		{ method: 'GET' }
	)
}

export const getSessionResponses = async (sessionId: string) => {
	return authedFetch<{
		message: string;
		answeredCount: number;
		totalCount: number;
		responses: { questionId: string; selectedOptionId: string }[];
	}>(`/assessment/${sessionId}/responses`, { method: 'GET' })
}
