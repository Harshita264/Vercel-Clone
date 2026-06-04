import { Worker, Job } from 'bullmq';
import { BuildJob, QUEUE_NAME, redisConnection } from '@vercel-clone/shared';
import { PrismaClient, DeploymentStatus } from '@prisma/client';
import { createClient } from 'redis';
import { cloneRepo } from './lib/clone';
import { buildAndRunContainer } from './lib/docker';
import { cleanupBuildDir, stopAndRemoveContainer } from './lib/cleanup';
import { addDeploymentRoute } from './lib/caddy';

const prisma = new PrismaClient();
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'localhost';

async function updateStatus(
  id: string,
  status: DeploymentStatus,
  extras?: { url?: string; port?: number; containerId?: string }
) {
  await prisma.deployment.update({
    where: { id },
    data: { status, ...extras },
  });
}

export function createBuildWorker() {
  const worker = new Worker<BuildJob>(
    QUEUE_NAME,
    async (job: Job<BuildJob>) => {
      const { deploymentId, repoName, commitSha, repoUrl } = job.data;

      const publisher = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      await publisher.connect();

      const onLog = async (line: string) => {
  console.log(`[${deploymentId}] ${line}`);
  job.log(line);
  await publisher.publish(`logs:${deploymentId}`, line);

  // Append line to buildLogs column
  await prisma.$executeRaw`
    UPDATE "Deployment" 
    SET "buildLogs" = COALESCE("buildLogs", '') || ${line + '\n'}
    WHERE id = ${deploymentId}
  `;
};

      let buildDir: string | null = null;

      try {
        await stopAndRemoveContainer(deploymentId);

        await updateStatus(deploymentId, DeploymentStatus.BUILDING);
        await onLog(`=== Build started for ${repoName} @ ${commitSha.slice(0, 7)} ===`);

        await job.updateProgress(10);
        const { buildDir: dir } = await cloneRepo(repoUrl, commitSha, deploymentId, onLog);
        buildDir = dir;

        await job.updateProgress(40);
        await updateStatus(deploymentId, DeploymentStatus.DEPLOYING);

        const { port, containerId } = await buildAndRunContainer(buildDir, deploymentId, onLog);

        await onLog(`Registering route with reverse proxy...`);
        await addDeploymentRoute(deploymentId, port);

        const url = `http://${deploymentId}.${BASE_DOMAIN}`;
        await updateStatus(deploymentId, DeploymentStatus.READY, { url, port, containerId });

        await job.updateProgress(100);
        await onLog(`=== Deployment ready at ${url} ===`);

        return { deploymentId, status: 'ready', port, url };

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await onLog(`=== Build failed: ${message} ===`);
        await updateStatus(deploymentId, DeploymentStatus.FAILED);
        throw err;

      } finally {
        if (buildDir) await cleanupBuildDir(buildDir);
        await publisher.disconnect();
        await prisma.$disconnect();
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => console.log(`[${job.data.deploymentId}] ✓ Job completed`));
  worker.on('failed', (job, err) => console.error(`[${job?.data.deploymentId}] ✗ Job failed:`, err.message));

  return worker;
}