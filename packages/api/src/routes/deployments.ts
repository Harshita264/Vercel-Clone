import { Router, Request, Response } from 'express';
import { getDeployment, getProjectDeployments } from '../services/deployments';

export const deploymentsRouter = Router();

deploymentsRouter.get('/:id', async (req: Request, res: Response) => {
    const deployment = await getDeployment(req.params.id);
    if (!deployment) {
        res.status(404).json({ error: 'Deployment not found' });
        return;
    }
    res.json(deployment);
});

deploymentsRouter.get('/', async (req: Request, res: Response) => {
    const repo = req.query.repo as string;
    if (!repo) {
        res.status(400).json({ error: 'repo query param required' });
        return;
    }
    const deployments = await getProjectDeployments(repo);
    res.json(deployments);
});