import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { usePwaStore } from '../../src/store/usePwaStore';
import { clearQueues, enqueueOfflineMutation, moveToDeadLetterQueue } from '../../src/utils/offlineSync';
import { clearOfflineDb } from '../../src/utils/idbStorage';

describe('usePwaStore Reactive State Management', () => {
  beforeEach(async () => {
    await clearOfflineDb();
    await clearQueues();
    usePwaStore.setState({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      dlqItems: [],
      lastSyncTime: null,
      syncMessage: null,
    });
  });

  it('updates online status correctly', () => {
    expect(usePwaStore.getState().isOnline).toBe(true);

    usePwaStore.getState().setOnlineStatus(false);
    expect(usePwaStore.getState().isOnline).toBe(false);

    usePwaStore.getState().setOnlineStatus(true);
    expect(usePwaStore.getState().isOnline).toBe(true);
  });

  it('refreshes queue count and DLQ items from IndexedDB', async () => {
    await enqueueOfflineMutation({
      id: 'mut_test',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -100 },
      timestamp: Date.now(),
      retryCount: 0,
      label: 'Test Tx',
    });

    await usePwaStore.getState().refreshQueueStats();
    expect(usePwaStore.getState().pendingCount).toBe(1);
    expect(usePwaStore.getState().dlqItems.length).toBe(0);

    // Simulate item moved to DLQ
    await moveToDeadLetterQueue(
      {
        id: 'mut_test',
        endpoint: '/api/transactions',
        method: 'POST',
        timestamp: Date.now(),
        retryCount: 0,
        label: 'Test Tx',
      },
      400,
      'Invalid data'
    );

    await usePwaStore.getState().refreshQueueStats();
    expect(usePwaStore.getState().pendingCount).toBe(0);
    expect(usePwaStore.getState().dlqItems.length).toBe(1);
    expect(usePwaStore.getState().dlqItems[0].errorMessage).toBe('Invalid data');
  });

  it('allows dismissing a dead letter item', async () => {
    await moveToDeadLetterQueue(
      {
        id: 'mut_dismiss_me',
        endpoint: '/api/wallets',
        method: 'POST',
        timestamp: Date.now(),
        retryCount: 0,
        label: 'Bad Wallet',
      },
      422,
      'Unprocessable Entity'
    );

    await usePwaStore.getState().refreshQueueStats();
    expect(usePwaStore.getState().dlqItems.length).toBe(1);

    await usePwaStore.getState().dismissDlqItem('mut_dismiss_me');
    expect(usePwaStore.getState().dlqItems.length).toBe(0);
  });
});

