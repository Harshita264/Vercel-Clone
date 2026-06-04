// packages/dashboard/src/components/StatusBadge.tsx

type Status = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'READY' | 'FAILED';

const styles: Record<Status, string> = {
  QUEUED:    'bg-gray-100 text-gray-600',
  BUILDING:  'bg-yellow-100 text-yellow-700',
  DEPLOYING: 'bg-blue-100 text-blue-700',
  READY:     'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
};

const dots: Record<Status, boolean> = {
  QUEUED: false, BUILDING: true, DEPLOYING: true, READY: false, FAILED: false,
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {dots[status] && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status}
    </span>
  );
}