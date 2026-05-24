import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './routes/health';

export function createApp(): Application {
    const app = express();

    app.use(helmet());
    
    app.use(cors({
        origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
        credentials: true,
    }));

    app.use(express.json());

    app.use('/health', healthRouter);

    return app;
}