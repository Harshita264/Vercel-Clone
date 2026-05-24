import { Router, Request, Response } from 'express';
import { uptime } from 'process';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});