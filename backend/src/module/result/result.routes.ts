import { Router } from 'express'
import { getResult } from './result.controller'

const resultRouter = Router()

resultRouter.get('/:sessionId', getResult)

export default resultRouter
