import { useState, useEffect, useCallback } from 'react';
import { db, LocalFast, LocalFastBlock, LocalFastDay, addToSyncQueue } from '@/lib/localDatabase';
import { supabase } from '@/integrations/supabase/client';
import { useLiveQuery } from 'dexie-react-hooks';

export const useLocalFasts = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Live queries from IndexedDB
  const fasts = useLiveQuery(
    () => userId ? db.fasts.where('user_id').equals(userId).toArray() : [],
    [userId]
  );

  const activeFast = useLiveQuery(
    () => userId ? db.fasts.where({ user_id: userId, is_active: true }).first() : undefined,
    [userId]
  );

  // Create fast (offline-first)
  const createFast = useCallback(async (fastData: Omit<LocalFast, 'id' | 'created_at' | 'updated_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const newFast: LocalFast = {
      ...fastData,
      id,
      created_at: now,
      updated_at: now,
      _pending_sync: true
    };

    await db.fasts.add(newFast);
    await addToSyncQueue('fasts', 'insert', id, newFast);

    return id;
  }, []);

  // Update fast
  const updateFast = useCallback(async (id: string, updates: Partial<LocalFast>) => {
    const updated = {
      ...updates,
      updated_at: new Date().toISOString(),
      _pending_sync: true
    };

    await db.fasts.update(id, updated);
    await addToSyncQueue('fasts', 'update', id, updated);
  }, []);

  // Delete fast
  const deleteFast = useCallback(async (id: string) => {
    await db.fasts.delete(id);
    await db.fast_blocks.where('fast_id').equals(id).delete();
    await db.fast_days.where('fast_id').equals(id).delete();
    await addToSyncQueue('fasts', 'delete', id, { id });
  }, []);

  // Set active fast
  const setActiveFast = useCallback(async (id: string) => {
    if (!userId) return;

    // Deactivate all fasts
    const allFasts = await db.fasts.where('user_id').equals(userId).toArray();
    for (const fast of allFasts) {
      if (fast.is_active) {
        await updateFast(fast.id, { is_active: false });
      }
    }

    // Activate selected fast
    await updateFast(id, { is_active: true });
  }, [userId, updateFast]);

  // Create block
  const createBlock = useCallback(async (blockData: Omit<LocalFastBlock, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newBlock: LocalFastBlock = {
      ...blockData,
      id,
      created_at: now,
      _pending_sync: true
    };

    await db.fast_blocks.add(newBlock);
    await addToSyncQueue('fast_blocks', 'insert', id, newBlock);

    return id;
  }, []);

  // Create day
  const createDay = useCallback(async (dayData: Omit<LocalFastDay, 'id' | 'created_at'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newDay: LocalFastDay = {
      ...dayData,
      id,
      created_at: now,
      _pending_sync: true
    };

    await db.fast_days.add(newDay);
    await addToSyncQueue('fast_days', 'insert', id, newDay);

    return id;
  }, []);

  // Update day
  const updateDay = useCallback(async (id: string, updates: Partial<LocalFastDay>) => {
    const updated = {
      ...updates,
      _pending_sync: true
    };

    await db.fast_days.update(id, updated);
    await addToSyncQueue('fast_days', 'update', id, updated);
  }, []);

  // Get blocks for fast
  const getBlocksForFast = useCallback(async (fastId: string) => {
    return await db.fast_blocks.where('fast_id').equals(fastId).sortBy('order_index');
  }, []);

  // Get days for fast
  const getDaysForFast = useCallback(async (fastId: string) => {
    return await db.fast_days.where('fast_id').equals(fastId).toArray();
  }, []);

  return {
    fasts,
    activeFast,
    createFast,
    updateFast,
    deleteFast,
    setActiveFast,
    createBlock,
    createDay,
    updateDay,
    getBlocksForFast,
    getDaysForFast
  };
};
