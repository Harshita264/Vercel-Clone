import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { encrypt, decrypt } from '../lib/crypto';
import { requireAuth } from '../lib/auth';

export const envVarsRouter = Router({ mergeParams: true });

// GET /projects/:projectId/env
envVarsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const envVars = await prisma.envVar.findMany({
    where: { projectId },
    select: {
      id: true,
      key: true,
      // Never return the value — just confirm it exists
      createdAt: true,
    },
  });

  res.json(envVars);
});

// POST /projects/:projectId/env
envVarsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { key, value } = req.body;

  if (!key || !value) {
    res.status(400).json({ error: 'key and value are required' });
    return;
  }

  const encryptedValue = encrypt(value);

  const envVar = await prisma.envVar.upsert({
    where: { projectId_key: { projectId, key } },
    update: { value: encryptedValue },
    create: { projectId, key, value: encryptedValue },
  });

  res.json({ id: envVar.id, key: envVar.key });
});

// DELETE /projects/:projectId/env/:key
envVarsRouter.delete('/:key', requireAuth, async (req: Request, res: Response) => {
  const { projectId, key } = req.params;

  await prisma.envVar.deleteMany({
    where: { projectId, key },
  });

  res.json({ message: 'Deleted' });
});