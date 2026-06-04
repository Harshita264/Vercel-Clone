"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deploymentsRouter = void 0;
// packages/api/src/routes/deployments.ts
const express_1 = require("express");
const redis_1 = require("redis");
const deployments_1 = require("../services/deployments");
exports.deploymentsRouter = (0, express_1.Router)();
exports.deploymentsRouter.get('/:id/logs', async (req, res) => {
    const id = req.params.id;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const keepAlive = setInterval(() => {
        res.write(': ping\n\n');
    }, 15000);
    // Send stored logs first for completed deployments
    const deployment = await (0, deployments_1.getDeployment)(id);
    if (deployment?.buildLogs) {
        const lines = deployment.buildLogs.split('\n').filter(Boolean);
        lines.forEach((line) => {
            res.write(`data: ${line}\n\n`);
        });
    }
    // If deployment is already done, no need to subscribe to live stream
    if (deployment?.status === 'READY' || deployment?.status === 'FAILED') {
        clearInterval(keepAlive);
        res.end();
        return;
    }
    // Still building — subscribe to live stream
    const subscriber = (0, redis_1.createClient)({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await subscriber.connect();
    await subscriber.subscribe(`logs:${id}`, (message) => {
        res.write(`data: ${message}\n\n`);
    });
    req.on('close', async () => {
        clearInterval(keepAlive);
        await subscriber.unsubscribe(`logs:${id}`);
        await subscriber.disconnect();
    });
});
// GET /deployments/:id
exports.deploymentsRouter.get('/:id', async (req, res) => {
    const deployment = await (0, deployments_1.getDeployment)(req.params.id);
    if (!deployment) {
        res.status(404).json({ error: 'Deployment not found' });
        return;
    }
    res.json(deployment);
});
// GET /deployments?repo=username/my-app
exports.deploymentsRouter.get('/', async (req, res) => {
    const repo = req.query.repo;
    if (!repo) {
        res.status(400).json({ error: 'repo query param required' });
        return;
    }
    const deployments = await (0, deployments_1.getProjectDeployments)(repo);
    res.json(deployments);
});
// GET /deployments/:id/logs  (SSE)
exports.deploymentsRouter.get('/:id/logs', async (req, res) => {
    const { id } = req.params;
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // Keep connection alive every 15s
    const keepAlive = setInterval(() => {
        res.write(': ping\n\n');
    }, 15000);
    // Subscribe to Redis pub/sub for this deployment's logs
    const subscriber = (0, redis_1.createClient)({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    await subscriber.connect();
    await subscriber.subscribe(`logs:${id}`, (message) => {
        res.write(`data: ${message}\n\n`);
    });
    // Clean up when browser disconnects
    req.on('close', async () => {
        clearInterval(keepAlive);
        await subscriber.unsubscribe(`logs:${id}`);
        await subscriber.disconnect();
    });
});
//# sourceMappingURL=deployments.js.map