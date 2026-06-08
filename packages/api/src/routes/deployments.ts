// packages/api/src/routes/deployments.ts
import { Router, Request, Response } from 'express';
import { createClient } from 'redis';
import { getDeployment, getProjectDeployments } from '../services/deployments';
import { prisma } from '../lib/prisma';

export const deploymentsRouter = Router();

// GET /deployments
deploymentsRouter.get('/', async (req: Request, res: Response) => {
  const repo = req.query.repo as string;
  if (!repo) {
    res.status(400).json({ error: 'repo query param required' });
    return;
  }
  const deployments = await getProjectDeployments(repo);
  res.json(deployments);
});

// GET /deployments/:id
deploymentsRouter.get('/:id', async (req: Request, res: Response) => {
  const deployment = await getDeployment(req.params.id);
  if (!deployment) {
    res.status(404).json({ error: 'Deployment not found' });
    return;
  }
  res.json(deployment);
});

// GET /deployments/:id/logs  — SSE stream
deploymentsRouter.get('/:id/logs', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify deployment exists
  const deployment = await prisma.deployment.findUnique({ where: { id } });
  if (!deployment) {
    res.status(404).json({ error: 'Deployment not found' });
    return;
  }

  // SSE headers — these tell the browser this is a stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Helper to send a log line to the browser
  const sendLine = (line: string) => {
    res.write(`data: ${line}\n\n`);
  };

  // Send any logs already stored in DB for this deployment
  // (covers the case where user opens the page after build started)
  if (deployment.buildLogs) {
    deployment.buildLogs.split('\n').forEach(sendLine);
  }

  // If already finished, just close the stream
  if (deployment.status === 'READY' || deployment.status === 'FAILED') {
    sendLine(`=== Build ${deployment.status.toLowerCase()} ===`);
    res.end();
    return;
  }

  // Keep-alive ping every 15 seconds so the connection doesn't timeout
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  // Subscribe to Redis pub/sub for live logs
  const subscriber = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  subscriber.on('error', (err) => {
    console.error('SSE Redis subscriber error:', err);
  });

  await subscriber.connect();

  await subscriber.subscribe(`logs:${id}`, (message) => {
    sendLine(message);

    // If build finished, close the stream
    if (message.includes('=== Deployment ready') || message.includes('=== Build failed')) {
      setTimeout(async () => {
        clearInterval(keepAlive);
        await subscriber.unsubscribe(`logs:${id}`);
        await subscriber.disconnect();
        res.end();
      }, 500); // small delay so last line is flushed
    }
  });

  // Clean up when the browser closes the tab
  req.on('close', async () => {
    clearInterval(keepAlive);
    try {
      await subscriber.unsubscribe(`logs:${id}`);
      await subscriber.disconnect();
    } catch {
      // already disconnected — ignore
    }
  });
});