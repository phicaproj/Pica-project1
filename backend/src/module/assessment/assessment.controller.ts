import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import AppError from '../../service/shared/appError'
import { CREATED, OK, UNAUTHORIZED } from '../../service/shared/http'
import {
	answerAssessmentInput,
	assessmentSessionParams,
	startAssessmentInput,
} from './assessment.types'
import {
	answerAssessmentService,
	startAssessmentService,
	startPhase2AService,
	submitAssessmentService,
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
