// packages/dashboard/src/components/LogTerminal.tsx
import { useEffect, useRef } from 'react';

interface Props {
  logs: string[];
  connected: boolean;
}

export function LogTerminal({ logs, connected }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new lines come in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
        <span className="text-gray-400 text-xs">
          {connected ? 'Streaming build logs...' : 'Build logs'}
        </span>
      </div>

      {logs.length === 0 && (
        <p className="text-gray-600">Waiting for logs...</p>
      )}

      {logs.map((line, i) => (
        <div
          key={i}
          className={`leading-relaxed ${
            line.includes('failed') || line.includes('error') || line.includes('Error')
              ? 'text-red-400'
              : line.startsWith('===')
              ? 'text-green-400 font-semibold'
              : 'text-gray-300'
          }`}
        >
          <span className="text-gray-600 mr-3 select-none">{String(i + 1).padStart(3, ' ')}</span>
          {line}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}