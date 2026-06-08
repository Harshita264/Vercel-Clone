import { Worker, Job } from 'bullmq';
import { BuildJob, QUEUE_NAME, redisConnection } from '@vercel-clone/shared';
import { PrismaClient, DeploymentStatus } from '@prisma/client';
import { cloneRepo } from './lib/clone';
import { buildAndRunContainer } from './lib/docker';
import { cleanupBuildDir } from './lib/cleanup';
import { addDeploymentRoute } from './lib/caddy';
import { publishLog, disconnectPublisher } from './lib/logger';

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
      const { deploymentId, repoUrl, repoName, commitSha } = job.data;

      // declare logLines FIRST
      const logLines: string[] = [];

      // onLog collects every line
      const onLog = async (line: string) => {
        console.log(`[${deploymentId}] ${line}`);
        job.log(line);
        logLines.push(line);
        await publishLog(deploymentId, line);
      };

      let buildDir: string | null = null;

      try {
        await updateStatus(deploymentId, DeploymentStatus.BUILDING);
        await onLog(`=== Build started for ${repoName} @ ${commitSha.slice(0, 7)} ===`);

        await job.updateProgress(10);
        const { buildDir: dir } = await cloneRepo(repoUrl, commitSha, deploymentId, onLog);
        buildDir = dir;

        await job.updateProgress(40);
        await updateStatus(deploymentId, DeploymentStatus.DEPLOYING);

        const { port, containerId } = await buildAndRunContainer(
          buildDir,
          deploymentId,
          onLog
        );

        await onLog(`Registering route with reverse proxy...`);
        await addDeploymentRoute(deploymentId, port);

        const url = `http://${deploymentId}.${BASE_DOMAIN}`;

        await updateStatus(deploymentId, DeploymentStatus.READY, {
          url,
          port,
          containerId,
        });

        await job.updateProgress(100);
        await onLog(`=== Deployment ready at ${url} ===`);

        return { deploymentId, status: 'ready', port, url };

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await onLog(`=== Build failed: ${message} ===`);
        await updateStatus(deploymentId, DeploymentStatus.FAILED);
        throw err;

      } finally {
        // Save all collected logs to DB
        if (logLines.length > 0) {
          await prisma.deployment.update({
            where: { id: deploymentId },
            data: { buildLogs: logLines.join('\n') },
          }).catch(() => {});
        }

        if (buildDir) await cleanupBuildDir(buildDir);
        await disconnectPublisher();
        await prisma.$disconnect();
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[${job.data.deploymentId}] ✓ Done`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${job?.data.deploymentId}] ✗ ${err.message}`);
  });

  return worker;
}