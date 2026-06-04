import { Router, Request, Response } from 'express';
import { createClient } from 'redis';
import { getDeployment, getProjectDeployments } from '../services/deployments';

export const deploymentsRouter = Router();

// GET /deployments?repo=username/my-app
deploymentsRouter.get('/', async (req: Request, res: Response) => {
  const repo = req.query.repo as string;
  if (!repo) {
    res.status(400).json({ error: 'repo query param required' });
    return;
  }
  const deployments = await getProjectDeployments(repo);
  res.json(deployments);
});

// GET /deployments/:id/logs  (SSE) — must be before /:id
deploymentsRouter.get('/:id/logs', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  // Send stored logs first for completed deployments
  const deployment = await getDeployment(id);
  if (deployment?.buildLogs) {
    const lines = deployment.buildLogs.split('\n').filter(Boolean);
    lines.forEach((line: string) => {
      res.write(`data: ${line}\n\n`);
    });
  }

  // If already done — send stored logs and close
  if (deployment?.status === 'READY' || deployment?.status === 'FAILED') {
    clearInterval(keepAlive);
    res.end();
    return;
  }

  // Still building — subscribe to live Redis stream
  const subscriber = createClient({
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
deploymentsRouter.get('/:id', async (req: Request, res: Response) => {
  const deployment = await getDeployment(req.params.id as string);
  if (!deployment) {
    res.status(404).json({ error: 'Deployment not found' });
    return;
  }
  res.json(deployment);
});