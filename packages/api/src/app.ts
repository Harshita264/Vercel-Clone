import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhook';
import { deploymentsRouter } from './routes/deployments';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { envVarsRouter } from './routes/envVars';

export function createApp(): Application {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(cors({
    origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
    credentials: true, // required for cookies
  }));

  // Cookie parser — must be before routes
  app.use(cookieParser());

  // Raw body capture
  app.use((req: Request, res: Response, next: NextFunction) => {
    let data: Buffer[] = [];
    req.on('data', (chunk: Buffer) => data.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(data);
      (req as any).rawBody = rawBody;
      if (req.headers['content-type']?.includes('application/json')) {
        try { req.body = JSON.parse(rawBody.toString()); }
        catch { req.body = {}; }
      }
      next();
    });
  });

  app.use('/health', healthRouter);
  app.use('/webhook', webhookRouter);
  app.use('/deployments', deploymentsRouter);
  app.use('/auth', authRouter);
  app.use('/projects', projectsRouter);
  app.use('/projects/:projectId/env', envVarsRouter);

  return app;
}