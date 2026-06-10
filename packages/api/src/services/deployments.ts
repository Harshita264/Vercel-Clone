import { prisma } from '../lib/prisma';
import { DeploymentStatus } from '@prisma/client';

export async function findOrCreateProject(repoName: string, repoUrl: string) {
    return prisma.project.upsert({
        where: { repoName },
        update: {},
        create: {
            name: repoName.split('/')[1],
            repoName,
            repoUrl,
        },
    });
}

export async function createDeployment(data: {
    projectId: string;
    commitSha: string;
    commitMessage: string;
    branch: string;
}) {
    return prisma.deployment.create({ data });
}

export async function updateDeploymentStatus(
    id: string,
    status: DeploymentStatus,
    extras? : {
        url?: string;
        port?: number;
        containerId?: string;
        buildLogs?: string;
    }
) {
    return prisma.deployment.update({
        where: { id },
        data: { status, ...extras },
    });
}

export async function getDeployment(id: string) {
    return prisma.deployment.findUnique({
        where: { id },
        include: { project: true },
    });
}

export async function getProjectDeployments(repoName: string) {
    return prisma.deployment.findMany({
        where: { project: { repoName } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {project: true },
    });
}