"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBuildWorker = createBuildWorker;
const bullmq_1 = require("bullmq");
const shared_1 = require("@vercel-clone/shared");
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const clone_1 = require("./lib/clone");
const docker_1 = require("./lib/docker");
const cleanup_1 = require("./lib/cleanup");
const caddy_1 = require("./lib/caddy");
const prisma = new client_1.PrismaClient();
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'localhost';
async function updateStatus(id, status, extras) {
    await prisma.deployment.update({
        where: { id },
        data: { status, ...extras },
    });
}
function createBuildWorker() {
    const worker = new bullmq_1.Worker(shared_1.QUEUE_NAME, async (job) => {
        const { deploymentId, repoName, commitSha, repoUrl } = job.data;
        const publisher = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        await publisher.connect();
        const onLog = async (line) => {
            console.log(`[${deploymentId}] ${line}`);
            job.log(line);
            await publisher.publish(`logs:${deploymentId}`, line);
            // Append line to buildLogs column
            await prisma.$executeRaw `
    UPDATE "Deployment" 
    SET "buildLogs" = COALESCE("buildLogs", '') || ${line + '\n'}
    WHERE id = ${deploymentId}
  `;
        };
        let buildDir = null;
        try {
            await (0, cleanup_1.stopAndRemoveContainer)(deploymentId);
            await updateStatus(deploymentId, client_1.DeploymentStatus.BUILDING);
            await onLog(`=== Build started for ${repoName} @ ${commitSha.slice(0, 7)} ===`);
            await job.updateProgress(10);
            const { buildDir: dir } = await (0, clone_1.cloneRepo)(repoUrl, commitSha, deploymentId, onLog);
            buildDir = dir;
            await job.updateProgress(40);
            await updateStatus(deploymentId, client_1.DeploymentStatus.DEPLOYING);
            const { port, containerId } = await (0, docker_1.buildAndRunContainer)(buildDir, deploymentId, onLog);
            await onLog(`Registering route with reverse proxy...`);
            await (0, caddy_1.addDeploymentRoute)(deploymentId, port);
            const url = `http://${deploymentId}.${BASE_DOMAIN}`;
            await updateStatus(deploymentId, client_1.DeploymentStatus.READY, { url, port, containerId });
            await job.updateProgress(100);
            await onLog(`=== Deployment ready at ${url} ===`);
            return { deploymentId, status: 'ready', port, url };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await onLog(`=== Build failed: ${message} ===`);
            await updateStatus(deploymentId, client_1.DeploymentStatus.FAILED);
            throw err;
        }
        finally {
            if (buildDir)
                await (0, cleanup_1.cleanupBuildDir)(buildDir);
            await publisher.disconnect();
            await prisma.$disconnect();
        }
    }, {
        connection: shared_1.redisConnection,
        concurrency: 3,
    });
    worker.on('completed', (job) => console.log(`[${job.data.deploymentId}] ✓ Job completed`));
    worker.on('failed', (job, err) => console.error(`[${job?.data.deploymentId}] ✗ Job failed:`, err.message));
    return worker;
}
//# sourceMappingURL=worker.js.map