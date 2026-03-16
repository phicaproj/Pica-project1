import RedisPkg from 'ioredis';
const Redis = (RedisPkg as any).default || RedisPkg;

import { env } from '../config/index.js';
import { logger } from './logger.js';

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
};

export const redisConnection = new Redis(redisConfig);

redisConnection.on('error', (error: Error) => {
  logger.error('Redis connection error:', error);
});

redisConnection.on('connect', () => {
  logger.info('Connected to Redis');
});
