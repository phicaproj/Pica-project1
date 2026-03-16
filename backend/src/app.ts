import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/index.js';
import { logger } from './lib/logger.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requestContextMiddleware } from './middleware/request-context.middleware.js';
import { ApiError } from './utils/api-error.js';
import { router } from './routes/index.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'TOO_MANY_REQUESTS',
  },
});
app.use(limiter);

// Better Auth catch-all
app.all('/auth/*splat', toNodeHandler(auth));

// Request Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Logging & Context
app.use(requestContextMiddleware);
app.use(
  morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Health Checks
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', router);

// 404 Handler
app.use((_req, _res, next) => {
  next(ApiError.notFound('Resource not found'));
});

// Error Handling
app.use(errorMiddleware);

export { app };
