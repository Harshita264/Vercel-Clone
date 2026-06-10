import { useQuery } from '@tanstack/react-query';
import { getDeployment, getProjectDeployments } from '../lib/api';

// Poll a single deployment every 3 seconds until it's done
export function useDeployment(id: string) {
  return useQuery({
    queryKey: ['deployment', id],
    queryFn: () => getDeployment(id),
    // Keep polling while build is in progress
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'READY' || status === 'FAILED') return false;
      return 3000; // poll every 3s while QUEUED/BUILDING/DEPLOYING
    },
  });
}

// Poll project deployments every 5 seconds
export function useProjectDeployments(repo: string) {
  return useQuery({
    queryKey: ['deployments', repo],
    queryFn: () => getProjectDeployments(repo),
    enabled: !!repo,  //only fetch when repo is not empty
    refetchInterval: (query) => {
      if (!repo) return false;
      return 5000;
    },
  });
}