import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useBuildLogs(deploymentId: string) {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!deploymentId) return;

    const eventSource = new EventSource(
      `${API_URL}/deployments/${deploymentId}/logs`
    );

    setConnected(true);

    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [deploymentId]);

  return { logs, connected };
}