import express, { Application, NextFunction, Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhook';``
import { deploymentsRouter } from './routes/deployments';

export function createApp(): Application {
    const app = express();

    app.use(helmet());
    
    app.use(cors({
        origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
        credentials: true,
    }));

    app.use((req: Request, res: Response, next: NextFunction) => {
        let data: Buffer[] = [];
        req.on('data', (chunk: Buffer) => data.push(chunk));
        req.on('end', () => {
            const rawBody = Buffer.concat(data);
            (req as any).rawBody = Buffer.concat(data);

            if(req.headers['content-type']?.includes('application/json')) {
                try {
                    req.body = JSON.parse(rawBody.toString());
                } catch (e) {
                    req.body = {};
                }
            }
            next();
        });
    });
    app.use('/health', healthRouter);
    app.use('/webhook', webhookRouter);
    app.use('/deployments', deploymentsRouter);
    
    return app;
}