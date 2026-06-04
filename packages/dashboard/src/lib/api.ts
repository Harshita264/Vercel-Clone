// packages/dashboard/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

export interface Deployment {
  id: string;
  projectId: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  status: 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'READY' | 'FAILED';
  url: string | null;
  port: number | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    repoName: string;
    repoUrl: string;
  };
}

export const getDeployment = async (id: string): Promise<Deployment> => {
  const { data } = await api.get(`/deployments/${id}`);
  return data;
};

export const getProjectDeployments = async (repo: string): Promise<Deployment[]> => {
  const { data } = await api.get(`/deployments`, { params: { repo } });
  return data;
};