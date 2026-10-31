import { initSimplicityDb, STORES } from './idbStorage';

export type OfflineMutationMethod = 'POST' | 'PUT' | 'DELETE';

export interface OfflineMutation {
  readonly id: string;
  readonly endpoint: string;
  readonly method: OfflineMutationMethod;
  readonly body?: unknown;
  readonly timestamp: number;
  readonly retryCount: number;
  readonly label: string;
}

export interface DeadLetterItem extends OfflineMutation {
  readonly failedAt: number;
  readonly statusCode?: number;
  readonly errorMessage: string;
}

export interface ReplayResult {
  readonly processedCount: number;
  readonly remainingCount: number;
  readonly dlqCount: number;
  readonly stoppedDueToNetwork: boolean;
}

export const enqueueOfflineMutation = async (mutation: OfflineMutation): Promise<void> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_MUTATIONS, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_MUTATIONS);
    const req = store.put(mutation);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getOfflineMutationsQueue = async (): Promise<OfflineMutation[]> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_MUTATIONS, 'readonly');
    const store = tx.objectStore(STORES.OFFLINE_MUTATIONS);
    const req = store.getAll();

    req.onsuccess = () => {
      const list: OfflineMutation[] = req.result || [];
      // Strict FIFO order by timestamp ascending
      list.sort((a, b) => a.timestamp - b.timestamp);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
};

export const removeOfflineMutation = async (id: string): Promise<void> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_MUTATIONS, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_MUTATIONS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const moveToDeadLetterQueue = async (
  mutation: OfflineMutation,
  statusCode?: number,
  errorMessage = 'Client error or rejected request'
): Promise<void> => {
  const db = await initSimplicityDb();
  const dlqItem: DeadLetterItem = {
    ...mutation,
    failedAt: Date.now(),
    statusCode,
    errorMessage,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OFFLINE_MUTATIONS, STORES.DEAD_LETTER_QUEUE], 'readwrite');
    const mutStore = tx.objectStore(STORES.OFFLINE_MUTATIONS);
    const dlqStore = tx.objectStore(STORES.DEAD_LETTER_QUEUE);

    mutStore.delete(mutation.id);
    dlqStore.put(dlqItem);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getDeadLetterQueue = async (): Promise<DeadLetterItem[]> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DEAD_LETTER_QUEUE, 'readonly');
    const store = tx.objectStore(STORES.DEAD_LETTER_QUEUE);
    const req = store.getAll();

    req.onsuccess = () => {
      const list: DeadLetterItem[] = req.result || [];
      list.sort((a, b) => b.failedAt - a.failedAt);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
};

export const discardDlqItem = async (id: string): Promise<void> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DEAD_LETTER_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.DEAD_LETTER_QUEUE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const clearQueues = async (): Promise<void> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.OFFLINE_MUTATIONS, STORES.DEAD_LETTER_QUEUE], 'readwrite');
    tx.objectStore(STORES.OFFLINE_MUTATIONS).clear();
    tx.objectStore(STORES.DEAD_LETTER_QUEUE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Replays offline mutations in strict FIFO sequence.
 * - HTTP 2xx: Success -> Dequeued.
 * - HTTP 4xx: Client error / Validation failure -> Routed to Dead Letter Queue (DLQ).
 * - Network Error / 5xx: Stopped to avoid out-of-order execution, preserving queue.
 */
export const replayOfflineQueue = async (
  fetcher: (endpoint: string, init?: RequestInit) => Promise<Response>
): Promise<ReplayResult> => {
  const queue = await getOfflineMutationsQueue();
  let processedCount = 0;
  let dlqCount = 0;
  let stoppedDueToNetwork = false;

  for (const item of queue) {
    try {
      const res = await fetcher(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Simplicity-Offline-Replay': 'true',
        },
        body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok) {
        await removeOfflineMutation(item.id);
        processedCount += 1;
      } else if (res.status >= 400 && res.status < 500) {
        // Client-side failure: validation, unauthorized, forbidden, bad request
        // Do NOT block subsequent items; move to DLQ
        let errMessage = `HTTP ${res.status} ${res.statusText}`;
        try {
          const body = await res.json();
          if (body && (body.error || body.message)) {
            errMessage = body.error || body.message;
          }
        } catch (_) {}

        await moveToDeadLetterQueue(item, res.status, errMessage);
        dlqCount += 1;
      } else {
        // 5xx Server Error: stop and retry later
        stoppedDueToNetwork = true;
        const updatedItem: OfflineMutation = {
          ...item,
          retryCount: item.retryCount + 1,
        };
        await enqueueOfflineMutation(updatedItem);
        break;
      }
    } catch (networkErr: any) {
      // Offline / Network disconnect: stop sequence
      stoppedDueToNetwork = true;
      const updatedItem: OfflineMutation = {
        ...item,
        retryCount: item.retryCount + 1,
      };
      await enqueueOfflineMutation(updatedItem);
      break;
    }
  }

  const remaining = await getOfflineMutationsQueue();

  return {
    processedCount,
    remainingCount: remaining.length,
    dlqCount,
    stoppedDueToNetwork,
  };
};

