import { Router } from 'express'
import { authenticate, softAuthenticate } from '../../service/middleware/authMiddleware'
import {
	answerAssessment,
	startAssessment,
	startPhase2A,
	submitAssessment,
} from './assessment.controller'

const assessmentRouter = Router()

assessmentRouter.post('/start', startAssessment)
assessmentRouter.post('/phase2a/start', authenticate, startPhase2A)
assessmentRouter.post('/:sessionId/answer', softAuthenticate, answerAssessment)
assessmentRouter.post('/:sessionId/submit', softAuthenticate, submitAssessment)

export default assessmentRouter
