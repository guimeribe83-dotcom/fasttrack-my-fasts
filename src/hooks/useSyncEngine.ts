import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db, addToSyncQueue } from '@/lib/localDatabase';
import { toast } from '@/hooks/use-toast';

export const useSyncEngine = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await db.sync_queue.count();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000); // Increased to 10s
    return () => clearInterval(interval);
  }, []);

  // Sync function
  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) {
      console.log('Sync skipped:', { isOnline, isSyncing });
      return;
    }

    console.log('Starting sync...');
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Push local changes to Supabase
      const queueItems = await db.sync_queue.orderBy('created_at').toArray();
      
      for (const item of queueItems) {
        try {
          if (item.operation === 'insert') {
            await supabase.from(item.table).insert(item.data);
          } else if (item.operation === 'update') {
            await supabase.from(item.table).update(item.data).eq('id', item.record_id);
          } else if (item.operation === 'delete') {
            await supabase.from(item.table).delete().eq('id', item.record_id);
          }
          
          // Remove from queue if successful
          if (item.id) {
            await db.sync_queue.delete(item.id);
          }
        } catch (error) {
          console.error('Sync error for item:', item, error);
          // Increment attempts
          if (item.id) {
            await db.sync_queue.update(item.id, { attempts: (item.attempts || 0) + 1 });
          }
        }
      }

      // 2. Pull data from Supabase
      const { data: fasts } = await supabase
        .from('fasts')
        .select('*')
        .eq('user_id', user.id);

      if (fasts) {
        await db.fasts.bulkPut(fasts.map(f => ({
          ...f,
          _last_synced: new Date().toISOString(),
          _pending_sync: false
        })));
      }

      // Pull blocks
      const fastIds = fasts?.map(f => f.id) || [];
      if (fastIds.length > 0) {
        const { data: blocks } = await supabase
          .from('fast_blocks')
          .select('*')
          .in('fast_id', fastIds);

        if (blocks) {
          await db.fast_blocks.bulkPut(blocks.map(b => ({
            ...b,
            _last_synced: new Date().toISOString(),
            _pending_sync: false
          })));
        }

        // Pull days
        const { data: days } = await supabase
          .from('fast_days')
          .select('*')
          .in('fast_id', fastIds);

        if (days) {
          await db.fast_days.bulkPut(days.map(d => ({
            ...d,
            _last_synced: new Date().toISOString(),
            _pending_sync: false
          })));
        }
      }

      setLastSyncTime(new Date());
      console.log('Sync completed successfully');
      
      // Update pending count after sync
      const newCount = await db.sync_queue.count();
      setPendingCount(newCount);
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar. Tentaremos novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Auto-sync only when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      // Use a timeout to debounce and avoid rapid syncs
      const timeoutId = setTimeout(() => {
        sync();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOnline]);

  // Periodic sync - increased interval to reduce frequency
  useEffect(() => {
    if (!isOnline) return;
    
    const interval = setInterval(() => {
      sync();
    }, 60000); // Sync every 60 seconds (reduced from 30s)

    return () => clearInterval(interval);
  }, [isOnline]);

  return {
    sync,
    isSyncing,
    pendingCount,
    isOnline,
    lastSyncTime
  };
};
