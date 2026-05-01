import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { GlobalLimiter } from './service/shared/rateLimiter'
import errorHandler from './service/middleware/errorHandler'
import assessmentRouter from './module/assessment/assessment.routes'
import questionRouter from './module/question/question.routes'
import resultRouter from './module/result/result.routes'
import authRouter from './module/auth/auth.route'

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.set('trust proxy', 1)
app.use(GlobalLimiter)

app.use((req, res, next) => {
	console.log('Incoming:', req.method, req.url)
	next()
})
// Routes
app.use('/api/auth', authRouter)
app.use('/api/assessment', assessmentRouter)
app.use('/api/questions', questionRouter)
app.use('/api/result', resultRouter)

app.use(errorHandler)

export default app
