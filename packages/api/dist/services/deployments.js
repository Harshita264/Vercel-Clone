"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateProject = findOrCreateProject;
exports.createDeployment = createDeployment;
exports.updateDeploymentStatus = updateDeploymentStatus;
exports.getDeployment = getDeployment;
exports.getProjectDeployments = getProjectDeployments;
const prisma_1 = require("../lib/prisma");
async function findOrCreateProject(repoName, repoUrl) {
    return prisma_1.prisma.project.upsert({
        where: { repoName },
        update: {},
        create: {
            name: repoName.split('/')[1],
            repoName,
            repoUrl,
        },
    });
}
async function createDeployment(data) {
    return prisma_1.prisma.deployment.create({ data });
}
async function updateDeploymentStatus(id, status, extras) {
    return prisma_1.prisma.deployment.update({
        where: { id },
        data: { status, ...extras },
    });
}
async function getDeployment(id) {
    return prisma_1.prisma.deployment.findUnique({
        where: { id },
        include: { project: true },
    });
}
async function getProjectDeployments(repoName) {
    return prisma_1.prisma.deployment.findMany({
        where: { project: { repoName } },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
}
//# sourceMappingURL=deployments.js.map