import { Router } from 'express'
import { softAuthenticate } from '../../service/middleware/authMiddleware'
import { downloadResultPdf, getResult } from './result.controller'

const resultRouter = Router()

resultRouter.get('/:sessionId', getResult)
// Soft auth — Phase 1 PDF download is open (anyone with the sessionId);
// Phase 2A download is gated inside the service on user ownership + payment.
resultRouter.get('/:sessionId/pdf', softAuthenticate, downloadResultPdf)

export default resultRouter
