import { Router } from 'express'
import { authenticate, softAuthenticate } from '../../service/middleware/authMiddleware'
import {
	downloadResultPdf,
	getMyLatestCompletedResult,
	getResult,
} from './result.controller'

const resultRouter = Router()

// Must be declared before the /:sessionId catch-all.
resultRouter.get('/me/latest', authenticate, getMyLatestCompletedResult)

resultRouter.get('/:sessionId', getResult)
// Soft auth — Phase 1 PDF download is open (anyone with the sessionId);
// Phase 2A download is gated inside the service on user ownership + payment.
resultRouter.get('/:sessionId/pdf', softAuthenticate, downloadResultPdf)

export default resultRouter
