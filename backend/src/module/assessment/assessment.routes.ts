import { Router } from 'express'
import { answerAssessment, startAssessment, submitAssessment } from './assessment.controller'

const assessmentRouter = Router()

assessmentRouter.post('/start', startAssessment)
assessmentRouter.post('/:sessionId/answer', answerAssessment)
assessmentRouter.post('/:sessionId/submit', submitAssessment)

export default assessmentRouter
