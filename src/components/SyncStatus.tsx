import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { cn } from "@/lib/utils";

export const SyncStatus = () => {
  const { sync, isSyncing, pendingCount, isOnline, lastSyncTime } = useSyncEngine();

  const formatLastSync = () => {
    if (!lastSyncTime) return null;
    const minutes = Math.floor((Date.now() - lastSyncTime.getTime()) / 60000);
    if (minutes === 0) return "Agora";
    if (minutes === 1) return "1 min atrás";
    if (minutes < 60) return `${minutes} min atrás`;
    return lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <CloudOff className="w-3.5 h-3.5" />
          <span>Offline</span>
          {pendingCount > 0 && (
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingCount}
            </span>
          )}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={sync}
          disabled={isSyncing}
          className="h-8 px-3 text-xs gap-2"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <Cloud className={cn("w-3.5 h-3.5", pendingCount > 0 && "text-primary")} />
              <span>
                {pendingCount > 0 ? `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}` : 'Sincronizado'}
              </span>
              {lastSyncTime && (
                <span className="text-muted-foreground">• {formatLastSync()}</span>
              )}
            </>
          )}
        </Button>
      )}
    </div>
  );
};
