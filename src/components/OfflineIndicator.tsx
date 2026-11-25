import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-5 left-4 z-40 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/90 px-3.5 py-2 text-xs font-medium text-amber-100 shadow-lg backdrop-blur-md"
    >
      <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
      <span>Çevrimdışı mod — Vakitler cihazda hesaplanıyor</span>
    </div>
  );
};
