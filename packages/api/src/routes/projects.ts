import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

export const projectsRouter = Router();

// GET /projects
projectsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      deployments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  res.json(projects);
});