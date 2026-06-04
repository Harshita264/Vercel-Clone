"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQueue = void 0;
exports.enqueueBuildJob = enqueueBuildJob;
const bullmq_1 = require("bullmq");
const shared_1 = require("@vercel-clone/shared");
exports.buildQueue = new bullmq_1.Queue(shared_1.QUEUE_NAME, {
    connection: shared_1.redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
    },
});
async function enqueueBuildJob(job) {
    const result = await exports.buildQueue.add('build', job, {
        jobId: job.deploymentId,
    });
    console.log(`Job enqueued: ${result.id}`);
    return result.id;
}
//# sourceMappingURL=queue.js.map