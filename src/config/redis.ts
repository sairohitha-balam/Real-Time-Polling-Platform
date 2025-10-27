// src/config/redis.ts

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, 
});

export const voteQueue = new Queue('vote-queue', {
  connection: redisConnection,
});