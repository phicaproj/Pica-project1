import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import { OK } from '../../service/shared/http'
import { assessmentSessionParams } from '../assessment/assessment.types'
import { getResultService } from './result.service'

export const getResult = asyncHandler(async (req: Request, res: Response) => {
	const { sessionId } = assessmentSessionParams.parse(req.params)
	const result = await getResultService(sessionId)

	return res.status(OK).json(result)
})
