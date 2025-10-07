import { supabase } from "@/integrations/supabase/client";

export type CreateFastPayload = {
  name: string;
  total_days: number;
  start_date: string;
  days_completed_before_app: number;
  is_active: boolean;
  blocks: Array<{
    name: string;
    total_days: number;
    order_index: number;
    manually_completed: boolean;
  }>;
};

type QueueItem = {
  id: string;
  type: "CREATE_FAST";
  payload: CreateFastPayload;
};

const OFFLINE_QUEUE_KEY = "offlineQueue";

function readQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
}

export function useOfflineQueue() {
  const enqueue = (item: QueueItem) => {
    const current = readQueue();
    writeQueue([...current, item]);
  };

  const queueCreateFast = (payload: CreateFastPayload) => {
    enqueue({ id: `${Date.now()}-${Math.random()}`, type: "CREATE_FAST", payload });
  };

  const processQueue = async () => {
    if (!navigator.onLine) return;
    const items = readQueue();
    if (items.length === 0) return;

    const remaining: QueueItem[] = [];

    for (const item of items) {
      try {
        if (item.type === "CREATE_FAST") {
          // Ensure user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado");

          // Create fast
          const { data: fast, error: fastError } = await supabase
            .from("fasts")
            .insert({
              user_id: user.id,
              name: item.payload.name,
              total_days: item.payload.total_days,
              start_date: item.payload.start_date,
              days_completed_before_app: item.payload.days_completed_before_app,
              is_active: item.payload.is_active,
            })
            .select()
            .single();

          if (fastError) throw fastError;

          // Deactivate other fasts
          await supabase
            .from("fasts")
            .update({ is_active: false })
            .neq("id", fast.id);

          // Insert blocks
          if (item.payload.blocks?.length) {
            const blocksToInsert = item.payload.blocks.map((b, index) => ({
              fast_id: fast.id,
              name: b.name,
              total_days: b.total_days,
              order_index: b.order_index ?? index,
              manually_completed: b.manually_completed,
            }));
            const { error: blocksError } = await supabase
              .from("fast_blocks")
              .insert(blocksToInsert);
            if (blocksError) throw blocksError;
          }
        }
        // Success: do not re-add to remaining
      } catch (e) {
        // Keep item in queue if it fails (e.g., still offline or backend error)
        remaining.push(item);
      }
    }

    writeQueue(remaining);
  };

  return { queueCreateFast, processQueue };
}
