import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import { OK } from '../../service/shared/http'
import { getPhase1QuestionsService } from './question.service'

export const getPhase1Questions = asyncHandler(
	async (req: Request, res: Response) => {
		const result = await getPhase1QuestionsService()

		return res.status(OK).json(result)
	},
)
