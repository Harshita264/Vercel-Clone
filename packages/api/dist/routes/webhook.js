"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const github_1 = require("../lib/github");
const queue_1 = require("../lib/queue");
const deployments_1 = require("../services/deployments");
exports.webhookRouter = (0, express_1.Router)();
exports.webhookRouter.post('/github', async (req, res) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
        res.status(500).json({ error: 'Server misconfiguration' });
        return;
    }
    const rawBody = req.rawBody;
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    if (!(0, github_1.verifyGithubWebhook)(rawBody, signature, secret)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
    }
    if (event !== 'push') {
        res.status(200).json({ message: `Ignoring event: ${event}` });
        return;
    }
    const payload = req.body;
    const branch = payload.ref.replace('refs/heads/', '');
    if (branch !== 'main' && branch !== 'master') {
        res.status(200).json({ message: `Ignoring push to branch: ${branch}` });
        return;
    }
    const project = await (0, deployments_1.findOrCreateProject)(payload.repository.full_name, payload.repository.clone_url);
    const deployment = await (0, deployments_1.createDeployment)({
        projectId: project.id,
        commitSha: payload.after,
        commitMessage: payload.head_commit?.message || 'No message',
        branch,
    });
    await (0, queue_1.enqueueBuildJob)({
        deploymentId: deployment.id,
        projectId: project.id,
        repoUrl: payload.repository.clone_url,
        repoName: payload.repository.full_name,
        commitSha: payload.after,
        commitMessage: payload.head_commit?.message || 'No message',
        branch,
    });
    console.log(`[${deployment.id}] Build queued for ${project.repoName} @ ${payload.after.slice(0, 7)}`);
    res.status(200).json({
        message: 'Build queued',
        deploymentId: deployment.id,
        repoName: project.repoName,
        commitSha: payload.after,
        branch,
    });
});
//# sourceMappingURL=webhook.js.map