import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectDeployments } from '../hooks/useDeployments';
import { StatusBadge } from '../components/StatusBadge';

export function ProjectsPage() {
  const [repo, setRepo] = useState('');
  const [activeRepo, setActiveRepo] = useState('');
  const navigate = useNavigate();

  const { data: deployments, isLoading } = useProjectDeployments(activeRepo);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Deployments</h1>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="username/repo-name"
          value={repo}
          onChange={e => setRepo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setActiveRepo(repo)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={() => setActiveRepo(repo)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100"
        >
          Load
        </button>
      </div>

      {activeRepo && isLoading && <p className="text-gray-400">Loading...</p>}

      {activeRepo && deployments && deployments.length === 0 && (
        <p className="text-gray-500">No deployments found for {activeRepo}</p>
      )}

      <div className="space-y-3">
        {deployments?.map(deployment => (
          <div
            key={deployment.id}
            onClick={() => navigate(`/deployments/${deployment.id}`)}
            className="p-4 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <StatusBadge status={deployment.status} />
                <span className="text-white text-sm font-medium">
                  {deployment.commitMessage}
                </span>
              </div>
              <span className="text-gray-500 text-xs font-mono">
                {deployment.commitSha.slice(0, 7)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{deployment.branch}</span>
              <span>{new Date(deployment.createdAt).toLocaleString()}</span>
              {deployment.url && (
                <span className="text-green-500">{deployment.url}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}