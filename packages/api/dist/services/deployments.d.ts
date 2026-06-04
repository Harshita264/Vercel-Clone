import { DeploymentStatus } from '@prisma/client';
export declare function findOrCreateProject(repoName: string, repoUrl: string): Promise<{
    id: string;
    repoName: string;
    name: string;
    repoUrl: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createDeployment(data: {
    projectId: string;
    commitSha: string;
    commitMessage: string;
    branch: string;
}): Promise<{
    port: number | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    commitSha: string;
    commitMessage: string;
    branch: string;
    status: import(".prisma/client").$Enums.DeploymentStatus;
    url: string | null;
    containerId: string | null;
    buildLogs: string | null;
    projectId: string;
}>;
export declare function updateDeploymentStatus(id: string, status: DeploymentStatus, extras?: {
    url?: string;
    port?: number;
    containerId?: string;
    buildLogs?: string;
}): Promise<{
    port: number | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    commitSha: string;
    commitMessage: string;
    branch: string;
    status: import(".prisma/client").$Enums.DeploymentStatus;
    url: string | null;
    containerId: string | null;
    buildLogs: string | null;
    projectId: string;
}>;
export declare function getDeployment(id: string): Promise<({
    project: {
        id: string;
        repoName: string;
        name: string;
        repoUrl: string;
        createdAt: Date;
        updatedAt: Date;
    };
} & {
    port: number | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    commitSha: string;
    commitMessage: string;
    branch: string;
    status: import(".prisma/client").$Enums.DeploymentStatus;
    url: string | null;
    containerId: string | null;
    buildLogs: string | null;
    projectId: string;
}) | null>;
export declare function getProjectDeployments(repoName: string): Promise<{
    port: number | null;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    commitSha: string;
    commitMessage: string;
    branch: string;
    status: import(".prisma/client").$Enums.DeploymentStatus;
    url: string | null;
    containerId: string | null;
    buildLogs: string | null;
    projectId: string;
}[]>;
//# sourceMappingURL=deployments.d.ts.map