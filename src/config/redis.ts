import Redis from 'ioredis';
import logger from './logger.js';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  retryStrategy: (times: number): number => {
    const delay = Math.min(times * 50, 2000);
    logger.warn('Redis reconnecting', { attempt: times, delay });
    return delay;
  },
});

redis.on('error', (err: Error) => {
  logger.error('Redis connection error', {
    error: err.message,
    stack: err.stack,
  });
});

redis.on('connect', () => {
  logger.info('Redis connected successfully', {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || '6379',
  });
});

redis.on('ready', () => {
  logger.info('Redis is ready to accept commands');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export default redis;
