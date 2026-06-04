import { Queue } from 'bullmq';
import { BuildJob } from '@vercel-clone/shared';
export declare const buildQueue: Queue<BuildJob, any, string, BuildJob, any, string>;
export declare function enqueueBuildJob(job: BuildJob): Promise<string>;
//# sourceMappingURL=queue.d.ts.map