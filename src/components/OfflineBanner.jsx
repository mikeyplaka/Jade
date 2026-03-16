import React from 'react';
import { WifiOff, Wifi, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflineBanner({ isOnline, pendingCount, isSyncing, onSync }) {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg mb-4 ${
      isOnline
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : 'bg-slate-800 text-slate-100 border border-slate-700'
    }`}>
      {isOnline ? (
        <Wifi className="w-4 h-4 flex-shrink-0 text-amber-500" />
      ) : (
        <WifiOff className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="flex-1">
        {isOnline
          ? `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`
          : `Offline mode — changes saved locally`}
      </span>
      {isOnline && pendingCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-amber-700 hover:bg-amber-100"
          onClick={onSync}
          disabled={isSyncing}
        >
          {isSyncing
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            : <><Upload className="w-3.5 h-3.5 mr-1" />Sync now</>
          }
        </Button>
      )}
    </div>
  );
}