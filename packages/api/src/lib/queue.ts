import { Queue } from 'bullmq';
import { BuildJob, QUEUE_NAME, redisConnection } from '@vercel-clone/shared';


export const buildQueue = new Queue<BuildJob>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,               
    backoff: {
      type: 'exponential',
      delay: 5000,             
    },
    removeOnComplete: 100,   
  },
});

export async function enqueueBuildJob(job: BuildJob): Promise<string> {
  const result = await buildQueue.add('build', job, {
    jobId: job.deploymentId, 
  });
  console.log(`Job enqueued: ${result.id}`);
  return result.id!;
}