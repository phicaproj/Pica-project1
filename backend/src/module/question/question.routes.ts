import { Router } from 'express'
import { authenticate } from '../../service/middleware/authMiddleware'
import {
	getPhase1Questions,
	getPhase2AQuestions,
} from './question.controller'

const questionRouter = Router()

questionRouter.get('/phase1', getPhase1Questions)
questionRouter.get('/phase2a', authenticate, getPhase2AQuestions)

export default questionRouter
