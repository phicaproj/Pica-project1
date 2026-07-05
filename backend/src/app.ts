import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV } from './Config/env';
import { GlobalLimiter } from './service/shared/rateLimiter';
import errorHandler from './service/middleware/errorHandler';
import assessmentRouter from './module/assessment/assessment.routes';
import questionRouter from './module/question/question.routes';
import resultRouter from './module/result/result.routes';
import authRouter from './module/auth/auth.route';
import paymentRouter from './module/payment/payment.routes';
import userRouter from './module/user/user.routes';
import adminRouter from './module/admin/admin.routes';
import couponRouter from './module/coupon/coupon.routes';
import subscriptionRouter from './module/subscription/subscription.routes';
import consultationRouter from './module/consultation/consultation.routes';
import { buildOpenApiDocument } from './docs/openapi';

const app = express();

// CORS: allow only the origins we explicitly list (comma-separated in
// ALLOWED_ORIGINS). Requests with no Origin header (server-to-server, curl,
// mobile apps, health checks) are allowed through. If ALLOWED_ORIGINS is unset
// we fall back to allowing all origins so local dev keeps working — set the env
// var in production to lock this down.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.length === 0) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);
app.use(NODE_ENV === 'production' ? morgan('combined', {
  skip: (req) => req.path === '/api/payment/webhook',
}) : morgan('dev'));

// Payment webhook must receive the raw body so we can verify Paystack's
// HMAC signature against the original bytes. Skip the JSON body parser
// for that one route; the route uses express.raw() internally.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') return next();
  return express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://*'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));
app.set('trust proxy', 1);
app.use(GlobalLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/questions', questionRouter);
app.use('/api/result', resultRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coupon', couponRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/consultation', consultationRouter);

// OpenAPI / Swagger docs — built once on boot from the Zod-driven registry.
const openApiDocument = buildOpenApiDocument();
app.get('/api/docs.json', (_req, res) => res.json(openApiDocument));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'PICA API Docs',
  })
);

app.use(errorHandler);

export default app;
