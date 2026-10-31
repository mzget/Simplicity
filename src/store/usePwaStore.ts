import { create } from 'zustand';
import {
  getOfflineMutationsQueue,
  getDeadLetterQueue,
  replayOfflineQueue,
  discardDlqItem,
  DeadLetterItem,
  OfflineMutation,
} from '../utils/offlineSync';
import { simplicityFetch } from '../api/client';

export interface PwaState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  dlqItems: ReadonlyArray<DeadLetterItem>;
  lastSyncTime: number | null;
  syncMessage: string | null;

  setOnlineStatus: (online: boolean) => void;
  refreshQueueStats: () => Promise<void>;
  triggerSync: (onComplete?: () => Promise<void>) => Promise<void>;
  dismissDlqItem: (id: string) => Promise<void>;
  initListeners: () => () => void;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  dlqItems: [],
  lastSyncTime: null,
  syncMessage: null,

  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online });
  },

  refreshQueueStats: async () => {
    try {
      const [queue, dlq] = await Promise.all([
        getOfflineMutationsQueue(),
        getDeadLetterQueue(),
      ]);
      set({
        pendingCount: queue.length,
        dlqItems: dlq,
      });
    } catch (_) {}
  },

  triggerSync: async (onComplete?: () => Promise<void>) => {
    const { isSyncing, isOnline } = get();
    if (isSyncing || !isOnline) return;

    set({ isSyncing: true, syncMessage: 'Syncing offline changes with Cloudflare...' });

    try {
      const result = await replayOfflineQueue(simplicityFetch);
      await get().refreshQueueStats();

      if (result.processedCount > 0 && onComplete) {
        await onComplete();
      }

      set({
        lastSyncTime: Date.now(),
        syncMessage:
          result.processedCount > 0
            ? `Successfully synced ${result.processedCount} offline item(s)`
            : null,
      });
    } catch (err: any) {
      set({ syncMessage: 'Sync interrupted. Will retry automatically.' });
    } finally {
      set({ isSyncing: false });
    }
  },

  dismissDlqItem: async (id: string) => {
    await discardDlqItem(id);
    await get().refreshQueueStats();
  },

  initListeners: () => {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      set({ isOnline: true });
      get().triggerSync();
    };

    const handleOffline = () => {
      set({ isOnline: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    get().refreshQueueStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
}));

