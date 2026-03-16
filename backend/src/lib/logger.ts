import winston from 'winston';
import { env } from '../config/index.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, requestId, ...metadata }) => {
  return `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ''}: ${stack || message} ${
    Object.keys(metadata).length ? JSON.stringify(metadata) : ''
  }`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.NODE_ENV === 'development' ? combine(colorize(), logFormat) : json()
  ),
  transports: [new winston.transports.Console()],
});

logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
