import { Worker, Job } from 'bullmq';
import { BuildJob, QUEUE_NAME, redisConnection } from '@vercel-clone/shared';
import { cloneRepo } from './lib/clone';
import { buildAndRunContainer } from './lib/docker';
import { cleanupBuildDir } from './lib/cleanup';

export function createBuildWorker() {
  const worker = new Worker<BuildJob>(
    QUEUE_NAME,
    async (job: Job<BuildJob>) => {
      const { deploymentId, repoName, commitSha, repoUrl } = job.data;

      const onLog = (line: string) => {
        console.log(`[${deploymentId}] ${line}`);
      };

      let buildDir: string | null = null;

      try {
        onLog(`=== Build started for ${repoName} @ ${commitSha.slice(0,7)} ===`);

        await job.updateProgress(10);
        const { buildDir: dir } = await cloneRepo(
          repoUrl,
          commitSha,
          deploymentId,
          onLog
        );
        buildDir = dir;

        await job.updateProgress(40);
        const { port, containerId } = await buildAndRunContainer(
          buildDir,
          deploymentId,
          onLog
        );

        await job.updateProgress(90);

        const url = `http://localhost:${port}`;
        onLog(`=== Deployment ready at ${url} ===`);

        await job.updateProgress(100);

        return {
          deploymentId,
          status: 'ready',
          port,
          containerId,
          url,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        onLog(`===Build failed: ${message} ===`);
        throw err;
      } finally {
        if (buildDir) {
          await cleanupBuildDir(buildDir);
        }
      }
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

  return worker;
}