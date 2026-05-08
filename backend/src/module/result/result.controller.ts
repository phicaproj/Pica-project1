import { Request, Response } from 'express'
import asyncHandler from '../../service/shared/catchErrors'
import { OK } from '../../service/shared/http'
import { assessmentSessionParams } from '../assessment/assessment.types'
import { downloadResultPdfService, getResultService } from './result.service'

export const getResult = asyncHandler(async (req: Request, res: Response) => {
	const { sessionId } = assessmentSessionParams.parse(req.params)
	const result = await getResultService(sessionId)

	return res.status(OK).json(result)
})

export const downloadResultPdf = asyncHandler(async (req: Request, res: Response) => {
	const { sessionId } = assessmentSessionParams.parse(req.params)
	const { pdfBuffer, filename } = await downloadResultPdfService(sessionId, req.user?.id)

	res.setHeader('Content-Type', 'application/pdf')
	res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
	res.setHeader('Content-Length', pdfBuffer.length.toString())
	return res.status(OK).end(pdfBuffer)
})
