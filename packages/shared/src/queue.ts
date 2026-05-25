import { Queue, Worker, Job} from 'bullmq';
import { BuildJob } from './types';

export const QUEUE_NAME = 'build-queue';

export const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};