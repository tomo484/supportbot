import type { ConnectionStatus } from '@/types/chat';

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Connected' },
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    disconnected: { color: 'bg-red-500', text: 'Disconnected' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-600">{config.text}</span>
    </div>
  );
}


