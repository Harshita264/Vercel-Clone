import { Router, Request, Response } from 'express';
import { verifyGithubWebhook, GithubPushPayload } from '../lib/github';
import { enqueueBuildJob } from '../lib/queue';
import { findOrCreateProject, createDeployment } from '../services/deployments';

export const webhookRouter = Router();

webhookRouter.post('/github', async (req: Request, res: Response) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  const rawBody: Buffer = (req as any).rawBody;
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;

  if (!verifyGithubWebhook(rawBody, signature, secret)) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  if (event !== 'push') {
    res.status(200).json({ message: `Ignoring event: ${event}` });
    return;
  }

  const payload = req.body as GithubPushPayload;
  const branch = payload.ref.replace('refs/heads/', '');

  if (branch !== 'main' && branch !== 'master') {
    res.status(200).json({ message: `Ignoring push to branch: ${branch}` });
    return;
  }

  const project = await findOrCreateProject(
    payload.repository.full_name,
    payload.repository.clone_url
  );

  const deployment = await createDeployment({
    projectId: project.id,
    commitSha: payload.after,
    commitMessage: payload.head_commit?.message || 'No message',
    branch,
  });

  await enqueueBuildJob({
    deploymentId: deployment.id,
    projectId: project.id,
    repoUrl: payload.repository.clone_url,
    repoName: payload.repository.full_name,
    commitSha: payload.after,
    commitMessage: payload.head_commit?.message || 'No message',
    branch,
  })

  console.log(`[${deployment.id}] Build queued for ${project.repoName} @ ${payload.after.slice(0, 7)}`);

  res.status(200).json({
    message: 'Build queued',
    deploymentId: deployment.id,
    repoName: project.repoName,
    commitSha: payload.after,
    branch,
  });
});