export type DeploymentStatus =
  | 'queued'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'failed';

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  createdAt: Date;
}

export interface Deployment {
  id: string;
  projectId: string;
  commitSha: string;
  commitMessage: string;
  status: DeploymentStatus;
  url: string | null;
  port: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuildJob {
  deploymentId: string;
  projectId: string;
  repoUrl: string;
  commitSha: string;
}