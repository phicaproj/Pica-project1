import { Router } from 'express'
import { getPhase1Questions } from './question.controller'

const questionRouter = Router()

questionRouter.get('/phase1', getPhase1Questions)

export default questionRouter
