import { Transaction } from '../types';

export const DB_NAME = 'simplicity_offline_db';
export const DB_VERSION = 1;

export const STORES = {
  CACHE_SNAPSHOTS: 'cache_snapshots',
  TRANSACTIONS: 'transactions',
  OFFLINE_MUTATIONS: 'offline_mutations',
  DEAD_LETTER_QUEUE: 'dead_letter_queue',
} as const;

let dbInstance: IDBDatabase | null = null;

export const getIndexedDb = (): IDBFactory | null => {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof indexedDB !== 'undefined') {
    return indexedDB;
  }
  return null;
};

export const initSimplicityDb = (): Promise<IDBDatabase> => {
  const idb = getIndexedDb();
  if (!idb) {
    return Promise.reject(new Error('IndexedDB is not supported in this runtime environment'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.CACHE_SNAPSHOTS)) {
        db.createObjectStore(STORES.CACHE_SNAPSHOTS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('start_date', 'start_date', { unique: false });
        txStore.createIndex('wallet_id', 'wallet_id', { unique: false });
        txStore.createIndex('category_id', 'category_id', { unique: false });
        txStore.createIndex('is_pending', 'is_pending', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.OFFLINE_MUTATIONS)) {
        const mutStore = db.createObjectStore(STORES.OFFLINE_MUTATIONS, { keyPath: 'id' });
        mutStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.DEAD_LETTER_QUEUE)) {
        const dlqStore = db.createObjectStore(STORES.DEAD_LETTER_QUEUE, { keyPath: 'id' });
        dlqStore.createIndex('failedAt', 'failedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
};

export const saveSnapshot = async <T>(key: string, data: T): Promise<void> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE_SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORES.CACHE_SNAPSHOTS);
    const req = store.put({ key, data, updatedAt: Date.now() });

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getSnapshot = async <T>(key: string): Promise<T | null> => {
  const db = await initSimplicityDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CACHE_SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORES.CACHE_SNAPSHOTS);
    const req = store.get(key);

    req.onsuccess = () => {
      if (req.result && 'data' in req.result) {
        resolve(req.result.data as T);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveTransactionsBatch = async (transactions: ReadonlyArray<Transaction>): Promise<void> => {
  if (transactions.length === 0) return;
  const db = await initSimplicityDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);

    transactions.forEach((item) => {
      store.put(item);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedTransactions = async (): Promise<Transaction[]> => {
  const db = await initSimplicityDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const req = store.getAll();

    req.onsuccess = () => {
      const items: Transaction[] = req.result || [];
      // Sort start_date descending
      items.sort((a, b) => b.start_date.localeCompare(a.start_date));
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
};

/**
 * Prunes cached transactions older than `days` (default: 180 days ~ 6 months).
 * Pending offline mutations (`is_pending === 1`) are strictly preserved.
 */
export const pruneOldTransactions = async (days = 180, referenceDate = new Date()): Promise<number> => {
  const cutoffTime = referenceDate.getTime() - days * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffTime).toISOString();
  const db = await initSimplicityDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const req = store.getAll();

    req.onsuccess = () => {
      const allTx: Transaction[] = req.result || [];
      let prunedCount = 0;

      allTx.forEach((item) => {
        // Only prune transactions that are older than cutoff AND NOT pending
        if (item.start_date < cutoffIso && item.is_pending !== 1) {
          store.delete(item.id);
          prunedCount += 1;
        }
      });

      tx.oncomplete = () => resolve(prunedCount);
    };

    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
};

export const clearOfflineDb = async (): Promise<void> => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  const idb = getIndexedDb();
  if (!idb) return;

  return new Promise((resolve, reject) => {
    const req = idb.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
};

