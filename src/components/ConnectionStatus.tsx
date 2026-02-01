import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus = ({ isConnected }: ConnectionStatusProps) => {
  return (
    <div className="flex items-center gap-1.5">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-success" />
          <span className="text-xs text-success font-medium">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-xs text-destructive font-medium">Offline</span>
        </>
      )}
    </div>
  );
};
