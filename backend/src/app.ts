import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { GlobalLimiter } from './service/shared/rateLimiter'
import errorHandler from './service/middleware/errorHandler'
import assessmentRouter from './module/assessment/assessment.routes'
import questionRouter from './module/question/question.routes'
import resultRouter from './module/result/result.routes'
import authRouter from './module/auth/auth.route'
import paymentRouter from './module/payment/payment.routes'
import { buildOpenApiDocument } from './docs/openapi'

const app = express()

app.use(cors())
app.use(morgan('dev'))

// Payment webhook must receive the raw body so we can verify Paystack's
// HMAC signature against the original bytes. Skip the JSON body parser
// for that one route; the route uses express.raw() internally.
app.use((req, res, next) => {
	if (req.originalUrl === '/api/payment/webhook') return next()
	return express.json()(req, res, next)
})
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
app.use('/api/payment', paymentRouter)

// OpenAPI / Swagger docs — built once on boot from the Zod-driven registry.
const openApiDocument = buildOpenApiDocument()
app.get('/api/docs.json', (_req, res) => res.json(openApiDocument))
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
	swaggerOptions: { persistAuthorization: true },
	customSiteTitle: 'PICA API Docs',
}))

app.use(errorHandler)

export default app
