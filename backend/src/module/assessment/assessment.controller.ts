import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import { CREATED, OK } from '../../service/shared/http'
import {
	answerAssessmentInput,
	assessmentSessionParams,
	startAssessmentInput,
} from './assessment.types'
import {
	answerAssessmentService,
	startAssessmentService,
	submitAssessmentService,
} from './assessment.service'

export const startAssessment = asyncHandler(
	async (req: Request, res: Response) => {
		const request = startAssessmentInput.parse(req.body)
		const result = await startAssessmentService(request)

		return res.status(CREATED).json(result)
	},
)

export const answerAssessment = asyncHandler(
	async (req: Request, res: Response) => {
		const { sessionId } = assessmentSessionParams.parse(req.params)
		const request = answerAssessmentInput.parse(req.body)
		const result = await answerAssessmentService(sessionId, request)

		return res.status(OK).json(result)
	},
)

export const submitAssessment = asyncHandler(
	async (req: Request, res: Response) => {
		const { sessionId } = assessmentSessionParams.parse(req.params)
		const result = await submitAssessmentService(sessionId)

		return res.status(OK).json(result)
	},
)
