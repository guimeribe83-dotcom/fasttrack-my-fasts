import Dexie, { Table } from 'dexie';

export interface LocalFast {
  id: string;
  user_id: string;
  name: string;
  total_days: number;
  start_date: string;
  days_completed_before_app: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Sync metadata
  _pending_sync?: boolean;
  _last_synced?: string;
}

export interface LocalFastBlock {
  id: string;
  fast_id: string;
  name: string;
  total_days: number;
  order_index: number;
  manually_completed: boolean;
  created_at: string;
  // Sync metadata
  _pending_sync?: boolean;
  _last_synced?: string;
}

export interface LocalFastDay {
  id: string;
  fast_id: string;
  block_id: string | null;
  date: string;
  completed: boolean;
  created_at: string;
  // Sync metadata
  _pending_sync?: boolean;
  _last_synced?: string;
}

export interface SyncQueue {
  id?: number;
  table: 'fasts' | 'fast_blocks' | 'fast_days';
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  data: any;
  created_at: string;
  attempts: number;
}

class LocalDatabase extends Dexie {
  fasts!: Table<LocalFast, string>;
  fast_blocks!: Table<LocalFastBlock, string>;
  fast_days!: Table<LocalFastDay, string>;
  sync_queue!: Table<SyncQueue, number>;

  constructor() {
    super('FastTrackDB');
    
    this.version(1).stores({
      fasts: 'id, user_id, is_active, created_at',
      fast_blocks: 'id, fast_id, order_index',
      fast_days: 'id, fast_id, block_id, date',
      sync_queue: '++id, table, created_at, attempts'
    });
  }
}

export const db = new LocalDatabase();

// Helper para adicionar à fila de sincronização
export const addToSyncQueue = async (
  table: SyncQueue['table'],
  operation: SyncQueue['operation'],
  record_id: string,
  data: any
) => {
  await db.sync_queue.add({
    table,
    operation,
    record_id,
    data,
    created_at: new Date().toISOString(),
    attempts: 0
  });
};
