import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../../src/api/client';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { app } from '../../functions/api/[[route]]';

describe('Date Filtering & Last-Month Boundary Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('includes transactions occurring on the final day of the month (e.g. Oct 31 with ISO time) when filtering last_month', async () => {
    const mockTransactions = [
      {
        id: 'tx_oct_31',
        wallet_id: 'wal_kbank',
        user_id: 'usr_rattajak_n_gmail_com',
        category_id: 'cat_bills',
        type: 'REGULAR',
        amount: -750,
        currency: 'THB',
        start_date: '2026-10-31T17:05:06.000Z',
        note: 'Google AI',
        hashtags: '["#spendee"]',
        status: 'active',
        created_at: '2026-10-31T17:05:06.000Z',
        updated_at: '2026-10-31T17:05:06.000Z',
      },
      {
        id: 'tx_oct_30',
        wallet_id: 'wal_kbank',
        user_id: 'usr_rattajak_n_gmail_com',
        category_id: 'cat_salary',
        type: 'REGULAR',
        amount: 86650,
        currency: 'THB',
        start_date: '2026-10-30T13:02:45.000Z',
        note: '10/69',
        hashtags: '["#spendee"]',
        status: 'active',
        created_at: '2026-10-30T13:02:45.000Z',
        updated_at: '2026-10-30T13:02:45.000Z',
      },
      {
        id: 'tx_nov_01',
        wallet_id: 'wal_kbank',
        user_id: 'usr_rattajak_n_gmail_com',
        category_id: 'cat_food',
        type: 'REGULAR',
        amount: -120,
        currency: 'THB',
        start_date: '2026-11-01T08:00:00.000Z',
        note: 'Breakfast',
        hashtags: '["#food"]',
        status: 'active',
        created_at: '2026-11-01T08:00:00.000Z',
        updated_at: '2026-11-01T08:00:00.000Z',
      },
      {
        id: 'tx_sep_30',
        wallet_id: 'wal_kbank',
        user_id: 'usr_rattajak_n_gmail_com',
        category_id: 'cat_food',
        type: 'REGULAR',
        amount: -350,
        currency: 'THB',
        start_date: '2026-09-30T23:59:59.000Z',
        note: 'Dinner',
        hashtags: '["#food"]',
        status: 'active',
        created_at: '2026-09-30T23:59:59.000Z',
        updated_at: '2026-09-30T23:59:59.000Z',
      },
    ];

    localStorage.setItem('simplicity_transactions', JSON.stringify(mockTransactions));

    // Filter for Last Month (October: 2026-10-01 to 2026-10-31)
    const results = await api.getTransactions({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });

    const ids = results.map((t) => t.id);
    // Crucial: The Oct 31 transaction (Google AI) MUST be included
    expect(ids).toContain('tx_oct_31');
    expect(ids).toContain('tx_oct_30');
    // Boundary checks: Sep 30 and Nov 01 MUST NOT be included
    expect(ids).not.toContain('tx_sep_30');
    expect(ids).not.toContain('tx_nov_01');
    expect(results).toHaveLength(2);
  });

  it('calculates dashboard stats accurately for last month including the last day transactions', async () => {
    const mockTransactions = [
      {
        id: 'tx_oct_31',
        wallet_id: 'wal_kbank',
        user_id: 'usr_rattajak_n_gmail_com',
        category_id: 'cat_bills',
        type: 'REGULAR',
        amount: -750,
        currency: 'THB',
        start_date: '2026-10-31T17:05:06.000Z',
        note: 'Google AI',
        status: 'active',
        created_at: '2026-10-31T17:05:06.000Z',
      },
      {
        id: 'tx_oct_30',
        wallet_id: 'wal_kbank',
        user_id: 'usr_rattajak_n_gmail_com',
        category_id: 'cat_salary',
        type: 'REGULAR',
        amount: 86650,
        currency: 'THB',
        start_date: '2026-10-30T13:02:45.000Z',
        note: '10/69',
        status: 'active',
        created_at: '2026-10-30T13:02:45.000Z',
      },
    ];

    localStorage.setItem('simplicity_transactions', JSON.stringify(mockTransactions));
    localStorage.setItem(
      'simplicity_wallets',
      JSON.stringify([{ id: 'wal_kbank', startingBalance: 10000, currentBalance: 95900, status: 'active' }])
    );

    const stats = await api.getDashboardStats({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });

    expect(stats.periodIncome).toBe(86650);
    expect(stats.periodExpense).toBe(750);
    expect(stats.periodChange).toBe(85900);
    expect(stats.transactionCount).toBe(2);
    const oct31Flow = stats.cashFlowSeries.find((c) => c.date === '2026-10-31');
    expect(oct31Flow).toBeDefined();
    expect(oct31Flow?.expense).toBe(750);
  });

  it('Hono API /api/transactions uses date prefix comparison substr(t.start_date, 1, 10)', async () => {
    let capturedQuery = '';
    let capturedParams: any[] = [];

    const mockDb = {
      exec: vi.fn().mockResolvedValue(undefined),
      prepare: (sql: string) => {
        capturedQuery = sql;
        return {
          bind: (...params: any[]) => {
            capturedParams = params;
            return {
              all: async () => ({ results: [] }),
              run: async () => ({}),
              first: async () => null,
            };
          },
        };
      },
    };

    const req = new Request('http://localhost:8788/api/transactions?startDate=2026-10-01&endDate=2026-10-31', {
      method: 'GET',
    });

    await app.fetch(req, {
      DB: mockDb,
      IS_LOCAL: 'true',
    } as any);

    expect(capturedQuery).toContain('substr(t.start_date, 1, 10) >= ?');
    expect(capturedQuery).toContain('substr(t.start_date, 1, 10) <= ?');
    expect(capturedParams).toContain('2026-10-01');
    expect(capturedParams).toContain('2026-10-31');
  });

  it('Hono API /api/stats/dashboard uses date prefix comparison substr(t.start_date, 1, 10)', async () => {
    const executedQueries: string[] = [];
    const boundParams: any[][] = [];

    const mockDb = {
      exec: vi.fn().mockResolvedValue(undefined),
      prepare: (sql: string) => {
        executedQueries.push(sql);
        return {
          bind: (...params: any[]) => {
            boundParams.push(params);
            return {
              all: async () => ({ results: [] }),
              run: async () => ({}),
              first: async () => null,
            };
          },
        };
      },
    };

    const req = new Request('http://localhost:8788/api/stats/dashboard?startDate=2026-10-01&endDate=2026-10-31', {
      method: 'GET',
    });

    await app.fetch(req, {
      DB: mockDb,
      IS_LOCAL: 'true',
    } as any);

    const txQuery = executedQueries.find((q) => q.includes('t.amount, t.start_date'));
    expect(txQuery).toBeDefined();
    expect(txQuery).toContain('substr(t.start_date, 1, 10) >= ?');
    expect(txQuery).toContain('substr(t.start_date, 1, 10) <= ?');
  });

  it('setDatePreset for last_month and all_time provides proper date range', () => {
    useFinanceStore.getState().setDatePreset('last_month');
    const state = useFinanceStore.getState();
    expect(state.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(state.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    useFinanceStore.getState().setDatePreset('all_time');
    const allTimeState = useFinanceStore.getState();
    expect(allTimeState.startDate).toBe('1970-01-01');
  });
});
