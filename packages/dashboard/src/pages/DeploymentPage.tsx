// packages/dashboard/src/pages/DeploymentPage.tsx
import { useParams } from 'react-router-dom';
import { useDeployment } from '../hooks/useDeployments';
import { useBuildLogs } from '../hooks/useBuildLogs';
import { StatusBadge } from '../components/StatusBadge';
import { LogTerminal } from '../components/LogTerminal';

export function DeploymentPage() {
  const { id } = useParams<{ id: string }>();
  const { data: deployment, isLoading } = useDeployment(id!);
  const { logs, connected } = useBuildLogs(id!);

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  if (!deployment) {
    return <div className="p-8 text-red-400">Deployment not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-semibold text-white">
            {deployment.project.name}
          </h1>
          <StatusBadge status={deployment.status} />
        </div>
        <p className="text-gray-400 text-sm font-mono">
          {deployment.commitSha.slice(0, 7)} — {deployment.commitMessage}
        </p>
      </div>

     {/* Deployment URL */}
      {deployment.status === 'READY' && deployment.url && (
        <div className="mb-6 p-4 bg-green-950 border border-green-800 rounded-lg">
          <p className="text-green-400 text-sm mb-1">Deployment URL</p>
          <p className="text-green-300 font-mono text-sm">{deployment.url}</p>
        </div>
      )}

      {/* Build logs */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-300">Build Logs</h2>
        <span className="text-xs text-gray-600">{logs.length} lines</span>
      </div>
      <LogTerminal logs={logs} connected={connected} />

      {/* Meta */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Branch</p>
          <p className="text-gray-200 font-mono">{deployment.branch}</p>
        </div>
        <div>
          <p className="text-gray-500">Started</p>
          <p className="text-gray-200">
            {new Date(deployment.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

    </div>
  );
}