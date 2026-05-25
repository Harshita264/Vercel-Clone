// packages/worker/src/worker.ts
import { Worker, Job } from 'bullmq';
import { BuildJob, QUEUE_NAME, redisConnection } from '@vercel-clone/shared';

export function createBuildWorker() {
  const worker = new Worker<BuildJob>(
    QUEUE_NAME,
    async (job: Job<BuildJob>) => {
      const { deploymentId, repoName, commitSha, repoUrl } = job.data;

      console.log(`[${deploymentId}] Starting build for ${repoName} @ ${commitSha.slice(0, 7)}`);


      await job.updateProgress(10);
      console.log(`[${deploymentId}] Cloning ${repoUrl}...`);

      await new Promise(resolve => setTimeout(resolve, 3000));
      await job.updateProgress(100);

      console.log(`[${deploymentId}] Build complete!`);

      return { deploymentId, status: 'ready' };
    },
    {
      connection: redisConnection,
      concurrency: 3, 
    }
  );

  worker.on('completed', (job) => {
    console.log(`[${job.data.deploymentId}] Job completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${job?.data.deploymentId}] Job failed:`, err.message);
  });

  worker.on('progress', (job, progress) => {
    console.log(`[${job.data.deploymentId}] Progress: ${progress}%`);
  });

  return worker;
}