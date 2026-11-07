import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { api } from '../../src/api/client';
import type { Wallet, Category, Transaction, Budget, DashboardStats } from '../../src/types';

describe('useFinanceStore (Theme & Exchange Rate Sync)', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      theme: 'dark',
      usdThbRate: 36.5,
      activeTab: 'dashboard',
      selectedWalletId: 'all',
    });
  });

  it('initializes with default theme and usdThbRate = 36.5', () => {
    const state = useFinanceStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.usdThbRate).toBe(36.5);
  });

  it('synchronizes valid light and dark theme modes', () => {
    useFinanceStore.getState().setTheme('light');
    expect(useFinanceStore.getState().theme).toBe('light');

    useFinanceStore.getState().setTheme('dark');
    expect(useFinanceStore.getState().theme).toBe('dark');
  });

  it('updates usdThbRate when given a positive finite number', () => {
    useFinanceStore.getState().setUsdThbRate(38.25);
    expect(useFinanceStore.getState().usdThbRate).toBe(38.25);
  });

  it('rejects zero, negative, NaN, or Infinite usdThbRate values', () => {
    useFinanceStore.getState().setUsdThbRate(37.0);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(0);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(-35.5);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(NaN);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);

    useFinanceStore.getState().setUsdThbRate(Infinity);
    expect(useFinanceStore.getState().usdThbRate).toBe(37.0);
  });
});

describe('useFinanceStore (Domain Data & Actions Slice)', () => {
  const mockWallets: Wallet[] = [
    {
      id: 'w1',
      userId: 'u1',
      name: 'Main Wallet',
      type: 'bank',
      currency: 'THB',
      startingBalance: 0,
      currentBalance: 5000,
      computed_balance: 5000,
      color: '#10B981',
      icon: 'Wallet',
      orderIndex: 0,
      status: 'active',
      createdAt: '2026-01-01',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'c1',
      name: 'Food',
      type: 'expense',
      color: '#ef4444',
      icon: 'Tag',
      position: 0,
      status: 'active',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      user_id: 'u1',
      wallet_id: 'w1',
      category_id: 'c1',
      amount: -250,
      type: 'EXPENSE',
      start_date: '2026-11-06T10:00:00Z',
    },
  ];

  const mockBudgets: Budget[] = [
    {
      id: 'b1',
      user_id: 'u1',
      name: 'Monthly Budget',
      amount: 10000,
      currency: 'THB',
      category_ids: '["c1"]',
      period: 'month',
      start_date: '2026-11-01',
      status: 'active',
      created_at: '2026-11-01',
    },
  ];

  const mockStats: DashboardStats = {
    totalBalance: 5000,
    periodIncome: 10000,
    periodExpense: 5000,
    periodChange: 5000,
    categoryBreakdown: [],
    cashFlowSeries: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    useFinanceStore.setState({
      wallets: [],
      categories: [],
      transactions: [],
      budgets: [],
      stats: null,
      isLoading: true,
      selectedWalletId: 'w1',
      selectedCategoryId: 'all',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      searchQuery: '',
    });

    vi.spyOn(api, 'getWallets').mockResolvedValue(mockWallets);
    vi.spyOn(api, 'getCategories').mockResolvedValue(mockCategories);
    vi.spyOn(api, 'getTransactions').mockResolvedValue(mockTransactions);
    vi.spyOn(api, 'getBudgets').mockResolvedValue(mockBudgets);
    vi.spyOn(api, 'getDashboardStats').mockResolvedValue(mockStats);
  });

  it('refreshData fetches all domain collections and updates store state', async () => {
    const onWalletsSync = vi.fn();
    await useFinanceStore.getState().refreshData(onWalletsSync);

    const state = useFinanceStore.getState();
    expect(state.wallets).toEqual(mockWallets);
    expect(state.categories).toEqual(mockCategories);
    expect(state.transactions).toEqual(mockTransactions);
    expect(state.budgets).toEqual(mockBudgets);
    expect(state.stats).toEqual(mockStats);
    expect(state.isLoading).toBe(false);
    expect(onWalletsSync).toHaveBeenCalledWith(mockWallets);

    expect(api.getTransactions).toHaveBeenCalledWith({
      walletId: 'w1',
      categoryId: 'all',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      search: '',
    });
  });

  it('saveTransaction creates new transaction and refreshes data', async () => {
    const createSpy = vi.spyOn(api, 'createTransaction').mockResolvedValue({ id: 'tx2' });
    const refreshSpy = vi.spyOn(useFinanceStore.getState(), 'refreshData');

    await useFinanceStore.getState().saveTransaction({ amount: -100, walletId: 'w1' });

    expect(createSpy).toHaveBeenCalledWith({ amount: -100, walletId: 'w1' });
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('saveTransaction updates existing transaction when id is present', async () => {
    const updateSpy = vi.spyOn(api, 'updateTransaction').mockResolvedValue({ id: 'tx1' } as any);
    const refreshSpy = vi.spyOn(useFinanceStore.getState(), 'refreshData');

    await useFinanceStore.getState().saveTransaction({ id: 'tx1', amount: -300 });

    expect(updateSpy).toHaveBeenCalledWith('tx1', { id: 'tx1', amount: -300 });
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('transfer calls api.createTransfer and refreshes data', async () => {
    const transferSpy = vi.spyOn(api, 'createTransfer').mockResolvedValue(undefined as any);
    const refreshSpy = vi.spyOn(useFinanceStore.getState(), 'refreshData');

    await useFinanceStore.getState().transfer({ fromWalletId: 'w1', toWalletId: 'w2', amount: 500 });

    expect(transferSpy).toHaveBeenCalled();
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('deleteTransaction calls api.deleteTransaction and refreshes data', async () => {
    const deleteSpy = vi.spyOn(api, 'deleteTransaction').mockResolvedValue(undefined as any);
    const refreshSpy = vi.spyOn(useFinanceStore.getState(), 'refreshData');

    await useFinanceStore.getState().deleteTransaction('tx1');

    expect(deleteSpy).toHaveBeenCalledWith('tx1');
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('createWallet and deleteWallet call api and refresh data', async () => {
    const createSpy = vi.spyOn(api, 'createWallet').mockResolvedValue({ id: 'w2' });
    const deleteSpy = vi.spyOn(api, 'deleteWallet').mockResolvedValue(undefined as any);
    const refreshSpy = vi.spyOn(useFinanceStore.getState(), 'refreshData');

    await useFinanceStore.getState().createWallet({ name: 'Savings' });
    expect(createSpy).toHaveBeenCalledWith({ name: 'Savings' });

    await useFinanceStore.getState().deleteWallet('w2');
    expect(deleteSpy).toHaveBeenCalledWith('w2');
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });

  it('createBudget and deleteBudget call api and refresh data', async () => {
    const createSpy = vi.spyOn(api, 'createBudget').mockResolvedValue({ id: 'b2' });
    const deleteSpy = vi.spyOn(api, 'deleteBudget').mockResolvedValue(undefined as any);
    const refreshSpy = vi.spyOn(useFinanceStore.getState(), 'refreshData');

    await useFinanceStore.getState().createBudget({ name: 'Food budget' });
    expect(createSpy).toHaveBeenCalledWith({ name: 'Food budget' });

    await useFinanceStore.getState().deleteBudget('b2');
    expect(deleteSpy).toHaveBeenCalledWith('b2');
    expect(refreshSpy).toHaveBeenCalledTimes(2);
  });
});
