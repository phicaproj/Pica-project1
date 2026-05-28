import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import AppError from '../../service/shared/appError'
import { CREATED, OK, UNAUTHORIZED } from '../../service/shared/http'
import {
	answerAssessmentInput,
	assessmentSessionParams,
	startAssessmentInput,
	startPhase2BInput,
} from './assessment.types'
import {
	answerAssessmentService,
	getMyPhase2BPillarsService,
	startAssessmentService,
	startPhase2AService,
	startPhase2BService,
	submitAssessmentService,
	getSessionResponsesService,
} from './assessment.service'

export const startAssessment = asyncHandler(
	async (req: Request, res: Response) => {
		const request = startAssessmentInput.parse(req.body)
		const result = await startAssessmentService(request)

		return res.status(CREATED).json(result)
	},
)

export const startPhase2A = asyncHandler(
	async (req: Request, res: Response) => {
		if (!req.user?.id) {
			throw new AppError('Authentication required', UNAUTHORIZED)
		}
		const result = await startPhase2AService(req.user.id)

		return res.status(CREATED).json(result)
	},
)

export const startPhase2B = asyncHandler(
	async (req: Request, res: Response) => {
		if (!req.user?.id) {
			throw new AppError('Authentication required', UNAUTHORIZED)
		}
		const { pillarId } = startPhase2BInput.parse(req.body)
		const result = await startPhase2BService(req.user.id, pillarId)

		return res.status(CREATED).json(result)
	},
)

export const getMyPhase2BPillars = asyncHandler(
	async (req: Request, res: Response) => {
		if (!req.user?.id) {
			throw new AppError('Authentication required', UNAUTHORIZED)
		}
		const result = await getMyPhase2BPillarsService(req.user.id)

		return res.status(OK).json(result)
	},
)

export const answerAssessment = asyncHandler(
	async (req: Request, res: Response) => {
		const { sessionId } = assessmentSessionParams.parse(req.params)
		const request = answerAssessmentInput.parse(req.body)
		const result = await answerAssessmentService(sessionId, request, req.user?.id)

		return res.status(OK).json(result)
	},
)

export const submitAssessment = asyncHandler(
	async (req: Request, res: Response) => {
		const { sessionId } = assessmentSessionParams.parse(req.params)
		const result = await submitAssessmentService(sessionId, req.user?.id)

		return res.status(OK).json(result)
	},
)

export const getSessionResponses = asyncHandler(
	async (req: Request, res: Response) => {
		if (!req.user?.id) {
			throw new AppError('Authentication required', UNAUTHORIZED)
		}
		const { sessionId } = assessmentSessionParams.parse(req.params)
		const result = await getSessionResponsesService(sessionId, req.user.id)

		return res.status(OK).json(result)
	},
)
