import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import { OK } from '../../service/shared/http'
import { updateScoringSettingsSchema } from './scoring.types'
import {
	getScoringSettingsService,
	updateScoringSettingsService,
} from './scoring.admin.service'

export const getScoringSettings = asyncHandler(async (_req: Request, res: Response) => {
	const result = await getScoringSettingsService()
	return res.status(OK).json(result)
})

export const updateScoringSettings = asyncHandler(async (req: Request, res: Response) => {
	const input = updateScoringSettingsSchema.parse(req.body)
	const result = await updateScoringSettingsService(input)
	return res.status(OK).json(result)
})
