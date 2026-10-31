import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  initSimplicityDb,
  getSnapshot,
  saveSnapshot,
  saveTransactionsBatch,
  getCachedTransactions,
  pruneOldTransactions,
  clearOfflineDb,
} from '../../src/utils/idbStorage';
import { Transaction } from '../../src/types';

describe('IndexedDB Storage Engine & 6-Month Auto-Pruning', () => {
  beforeEach(async () => {
    await clearOfflineDb();
  });

  it('initializes IndexedDB and successfully writes and reads snapshot data', async () => {
    const mockWallets = [
      { id: 'wal_1', name: 'Cash', balance: 1000 },
      { id: 'wal_2', name: 'Bank', balance: 50000 },
    ];

    await saveSnapshot('wallets', mockWallets);
    const retrieved = await getSnapshot<typeof mockWallets>('wallets');

    expect(retrieved).toEqual(mockWallets);
  });

  it('returns null when snapshot does not exist in store', async () => {
    const nonExistent = await getSnapshot('non_existent_key');
    expect(nonExistent).toBeNull();
  });

  it('stores and retrieves cached transactions sorted by start_date descending', async () => {
    const tx1: Transaction = {
      id: 'tx_old',
      wallet_id: 'wal_1',
      user_id: 'usr_test',
      category_id: 'cat_food',
      type: 'REGULAR',
      amount: -100,
      currency: 'THB',
      start_date: '2026-01-10T10:00:00.000Z',
      status: 'active',
      created_at: '2026-01-10T10:00:00.000Z',
      updated_at: '2026-01-10T10:00:00.000Z',
    };

    const tx2: Transaction = {
      id: 'tx_recent',
      wallet_id: 'wal_1',
      user_id: 'usr_test',
      category_id: 'cat_salary',
      type: 'REGULAR',
      amount: 5000,
      currency: 'THB',
      start_date: '2026-10-15T10:00:00.000Z',
      status: 'active',
      created_at: '2026-10-15T10:00:00.000Z',
      updated_at: '2026-10-15T10:00:00.000Z',
    };

    await saveTransactionsBatch([tx1, tx2]);
    const cached = await getCachedTransactions();

    expect(cached.length).toBe(2);
    expect(cached[0].id).toBe('tx_recent');
    expect(cached[1].id).toBe('tx_old');
  });

  it('prunes transactions older than 180 days (6 months) but retains pending transactions', async () => {
    const now = new Date('2026-10-31T00:00:00.000Z').getTime();

    // 200 days old (should be pruned if not pending)
    const oldRegularTx: Transaction = {
      id: 'tx_old_regular',
      wallet_id: 'wal_1',
      user_id: 'usr_test',
      category_id: 'cat_food',
      type: 'REGULAR',
      amount: -50,
      currency: 'THB',
      start_date: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // 200 days old but marked as pending offline sync (MUST NOT be pruned)
    const oldPendingTx: Transaction = {
      id: 'tx_old_pending',
      wallet_id: 'wal_1',
      user_id: 'usr_test',
      category_id: 'cat_food',
      type: 'REGULAR',
      amount: -120,
      currency: 'THB',
      is_pending: 1,
      start_date: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // 30 days old (within 6 months, MUST NOT be pruned)
    const recentTx: Transaction = {
      id: 'tx_recent_regular',
      wallet_id: 'wal_1',
      user_id: 'usr_test',
      category_id: 'cat_shopping',
      type: 'REGULAR',
      amount: -300,
      currency: 'THB',
      start_date: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await saveTransactionsBatch([oldRegularTx, oldPendingTx, recentTx]);

    const prunedCount = await pruneOldTransactions(180, new Date(now));
    expect(prunedCount).toBe(1);

    const remaining = await getCachedTransactions();
    const remainingIds = remaining.map((t) => t.id);

    expect(remainingIds).toContain('tx_recent_regular');
    expect(remainingIds).toContain('tx_old_pending');
    expect(remainingIds).not.toContain('tx_old_regular');
  });
});

