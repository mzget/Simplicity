import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  enqueueOfflineMutation,
  getOfflineMutationsQueue,
  getDeadLetterQueue,
  clearQueues,
  replayOfflineQueue,
  discardDlqItem,
  OfflineMutation,
} from '../../src/utils/offlineSync';
import { clearOfflineDb } from '../../src/utils/idbStorage';

describe('Offline Mutation Queue & Dead Letter Queue (DLQ)', () => {
  beforeEach(async () => {
    await clearOfflineDb();
    await clearQueues();
  });

  it('enqueues mutations in FIFO order with timestamp and unique id', async () => {
    const mut1: OfflineMutation = {
      id: 'mut_1',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -250, note: 'Lunch' },
      timestamp: 1000,
      retryCount: 0,
      label: 'Add Transaction: Lunch',
    };

    const mut2: OfflineMutation = {
      id: 'mut_2',
      endpoint: '/api/wallets',
      method: 'POST',
      body: { name: 'Emergency Fund' },
      timestamp: 2000,
      retryCount: 0,
      label: 'Add Wallet: Emergency Fund',
    };

    await enqueueOfflineMutation(mut1);
    await enqueueOfflineMutation(mut2);

    const queue = await getOfflineMutationsQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe('mut_1');
    expect(queue[1].id).toBe('mut_2');
  });

  it('successfully replays FIFO queue when network requests succeed', async () => {
    const mut1: OfflineMutation = {
      id: 'mut_1',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -50 },
      timestamp: 1000,
      retryCount: 0,
      label: 'TX 1',
    };

    const mut2: OfflineMutation = {
      id: 'mut_2',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -100 },
      timestamp: 2000,
      retryCount: 0,
      label: 'TX 2',
    };

    await enqueueOfflineMutation(mut1);
    await enqueueOfflineMutation(mut2);

    const mockFetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await replayOfflineQueue(mockFetcher);

    expect(result.processedCount).toBe(2);
    expect(result.remainingCount).toBe(0);
    expect(result.dlqCount).toBe(0);
    expect(mockFetcher).toHaveBeenCalledTimes(2);

    const remainingQueue = await getOfflineMutationsQueue();
    expect(remainingQueue.length).toBe(0);
  });

  it('moves mutation to Dead Letter Queue (DLQ) immediately when server responds with 4xx client error', async () => {
    const badMutation: OfflineMutation = {
      id: 'mut_bad',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: 'invalid-number' },
      timestamp: 1000,
      retryCount: 0,
      label: 'Invalid Payload',
    };

    const goodMutation: OfflineMutation = {
      id: 'mut_good',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -200 },
      timestamp: 2000,
      retryCount: 0,
      label: 'Valid Payload',
    };

    await enqueueOfflineMutation(badMutation);
    await enqueueOfflineMutation(goodMutation);

    const mockFetcher = vi.fn().mockImplementation((endpoint: string, init: any) => {
      const parsedBody = JSON.parse(init.body);
      if (parsedBody.amount === 'invalid-number') {
        return Promise.resolve(new Response(JSON.stringify({ error: 'Validation failed' }), { status: 400 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    });

    const result = await replayOfflineQueue(mockFetcher);

    expect(result.processedCount).toBe(1);
    expect(result.dlqCount).toBe(1);
    expect(result.remainingCount).toBe(0);

    const activeQueue = await getOfflineMutationsQueue();
    expect(activeQueue.length).toBe(0); // Bad item did not block the good item!

    const dlq = await getDeadLetterQueue();
    expect(dlq.length).toBe(1);
    expect(dlq[0].id).toBe('mut_bad');
    expect(dlq[0].statusCode).toBe(400);
    expect(dlq[0].errorMessage).toContain('Validation failed');
  });

  it('stops queue replay and leaves items in queue when network error occurs', async () => {
    const mut1: OfflineMutation = {
      id: 'mut_net_fail',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -100 },
      timestamp: 1000,
      retryCount: 0,
      label: 'Failed by Network',
    };

    const mut2: OfflineMutation = {
      id: 'mut_waiting',
      endpoint: '/api/transactions',
      method: 'POST',
      body: { amount: -200 },
      timestamp: 2000,
      retryCount: 0,
      label: 'Waiting in queue',
    };

    await enqueueOfflineMutation(mut1);
    await enqueueOfflineMutation(mut2);

    const mockFetcher = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await replayOfflineQueue(mockFetcher);

    expect(result.processedCount).toBe(0);
    expect(result.stoppedDueToNetwork).toBe(true);

    const activeQueue = await getOfflineMutationsQueue();
    expect(activeQueue.length).toBe(2);
    expect(activeQueue[0].retryCount).toBe(1);

    const dlq = await getDeadLetterQueue();
    expect(dlq.length).toBe(0);
  });

  it('allows discarding an item from DLQ', async () => {
    const badMutation: OfflineMutation = {
      id: 'mut_dlq_discard',
      endpoint: '/api/transactions',
      method: 'POST',
      body: {},
      timestamp: 1000,
      retryCount: 0,
      label: 'To Discard',
    };

    await enqueueOfflineMutation(badMutation);
    const mockFetcher = vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 }));
    await replayOfflineQueue(mockFetcher);

    let dlq = await getDeadLetterQueue();
    expect(dlq.length).toBe(1);

    await discardDlqItem('mut_dlq_discard');
    dlq = await getDeadLetterQueue();
    expect(dlq.length).toBe(0);
  });
});

