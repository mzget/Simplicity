import { create } from 'zustand';
import { PeriodPreset, Transaction, Wallet, Category, Budget, DashboardStats } from '../types';
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear, endOfYear, format } from 'date-fns';
import { api, getIsLocalMode } from '../api/client';

interface FinanceState {
  // Navigation
  activeTab: 'dashboard' | 'transactions' | 'budgets' | 'wallets';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'budgets' | 'wallets') => void;

  // Filters
  selectedWalletId: string; // 'all' or walletId
  setSelectedWalletId: (id: string) => void;

  selectedCategoryId: string; // 'all' or categoryId
  setSelectedCategoryId: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  datePreset: PeriodPreset;
  startDate: string;
  endDate: string;
  setDatePreset: (preset: PeriodPreset) => void;
  setDateRange: (start: string, end: string) => void;

  // Modals
  isAddTxOpen: boolean;
  setIsAddTxOpen: (open: boolean) => void;
  editingTx: Transaction | null;
  setEditingTx: (tx: Transaction | null) => void;

  isAddWalletOpen: boolean;
  setIsAddWalletOpen: (open: boolean) => void;

  isAddBudgetOpen: boolean;
  setIsAddBudgetOpen: (open: boolean) => void;

  isImportOpen: boolean;
  setIsImportOpen: (open: boolean) => void;

  isAiScanOpen: boolean;
  setIsAiScanOpen: (open: boolean) => void;
  isEmbedded: boolean;
  setIsEmbedded: (isEmbedded: boolean) => void;

  // Theme & Exchange Rate Synchronization (Milestone 4)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  usdThbRate: number;
  setUsdThbRate: (rate: number) => void;

  // Domain Data Entities (Approach 1: Domain Slice)
  wallets: Wallet[];
  setWallets: (wallets: Wallet[]) => void;

  categories: Category[];
  setCategories: (categories: Category[]) => void;

  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;

  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;

  stats: DashboardStats | null;
  setStats: (stats: DashboardStats | null) => void;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  isLocalMode: boolean;
  setIsLocalMode: (isLocalMode: boolean) => void;

  // Domain Async Actions
  refreshData: (onWalletsSync?: (wallets: Wallet[]) => void) => Promise<void>;
  saveTransaction: (data: any) => Promise<void>;
  transfer: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  createWallet: (data: any) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  createBudget: (data: any) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const getDatesForPreset = (preset: PeriodPreset): { start: string; end: string } => {
  const now = new Date();
  if (preset === 'this_week') {
    return {
      start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
  }
  if (preset === 'last_month') {
    const lastMonth = subMonths(now, 1);
    return {
      start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
    };
  }
  if (preset === 'this_year') {
    return {
      start: format(startOfYear(now), 'yyyy-MM-dd'),
      end: format(endOfYear(now), 'yyyy-MM-dd'),
    };
  }
  if (preset === 'all_time') {
    return {
      start: '1970-01-01',
      end: format(now, 'yyyy-MM-dd'),
    };
  }
  // Default: this_month
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
};

export const useFinanceStore = create<FinanceState>((set, get) => {
  const initialDates = getDatesForPreset('this_month');

  return {
    activeTab: 'dashboard',
    setActiveTab: (tab) => set({ activeTab: tab }),

    selectedWalletId: 'all',
    setSelectedWalletId: (id) => set({ selectedWalletId: id }),

    selectedCategoryId: 'all',
    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

    searchQuery: '',
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    datePreset: 'this_month',
    startDate: initialDates.start,
    endDate: initialDates.end,

    setDatePreset: (preset) => {
      if (preset === 'custom') {
        set({ datePreset: 'custom' });
        return;
      }
      const range = getDatesForPreset(preset);
      set({ datePreset: preset, startDate: range.start, endDate: range.end });
    },

    setDateRange: (startDate, endDate) =>
      set({ datePreset: 'custom', startDate, endDate }),

    isAddTxOpen: false,
    setIsAddTxOpen: (isAddTxOpen) => set({ isAddTxOpen }),
    editingTx: null,
    setEditingTx: (editingTx) => set({ editingTx, isAddTxOpen: !!editingTx }),

    isAddWalletOpen: false,
    setIsAddWalletOpen: (isAddWalletOpen) => set({ isAddWalletOpen }),

    isAddBudgetOpen: false,
    setIsAddBudgetOpen: (isAddBudgetOpen) => set({ isAddBudgetOpen }),

    isImportOpen: false,
    setIsImportOpen: (isImportOpen) => set({ isImportOpen }),

    isAiScanOpen: false,
    setIsAiScanOpen: (isAiScanOpen) => set({ isAiScanOpen }),
    isEmbedded: false,
    setIsEmbedded: (isEmbedded) => set({ isEmbedded }),

    theme: 'dark',
    setTheme: (theme) =>
      set({
        theme: theme === 'light' ? 'light' : 'dark',
      }),

    usdThbRate: 36.5,
    setUsdThbRate: (rate) => {
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
        set({ usdThbRate: rate });
      }
    },

    // Domain Data Entities
    wallets: [],
    setWallets: (wallets) => set({ wallets }),

    categories: [],
    setCategories: (categories) => set({ categories }),

    transactions: [],
    setTransactions: (transactions) => set({ transactions }),

    budgets: [],
    setBudgets: (budgets) => set({ budgets }),

    stats: null,
    setStats: (stats) => set({ stats }),

    isLoading: true,
    setIsLoading: (isLoading) => set({ isLoading }),

    isLocalMode:
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    setIsLocalMode: (isLocalMode) => set({ isLocalMode }),

    // Domain Async Actions
    refreshData: async (onWalletsSync) => {
      const { selectedWalletId, selectedCategoryId, startDate, endDate, searchQuery } = get();
      try {
        const [wList, cList, txList, bList, sData] = await Promise.all([
          api.getWallets(),
          api.getCategories(),
          api.getTransactions({
            walletId: selectedWalletId,
            categoryId: selectedCategoryId,
            startDate,
            endDate,
            search: searchQuery,
          }),
          api.getBudgets(),
          api.getDashboardStats({
            walletId: selectedWalletId,
            startDate,
            endDate,
          }),
        ]);

        set({
          wallets: wList,
          categories: cList,
          transactions: txList,
          budgets: bList,
          stats: sData,
          isLocalMode: getIsLocalMode(),
        });

        onWalletsSync?.(wList);
      } catch (err) {
        console.error('Error refreshing finance data:', err);
      } finally {
        set({ isLoading: false });
      }
    },

    saveTransaction: async (data: any) => {
      if (data.id) {
        await api.updateTransaction(data.id, data);
      } else {
        await api.createTransaction(data);
      }
      await get().refreshData();
    },

    transfer: async (data: any) => {
      await api.createTransfer(data);
      await get().refreshData();
    },

    deleteTransaction: async (id: string) => {
      await api.deleteTransaction(id);
      await get().refreshData();
    },

    createWallet: async (data: any) => {
      await api.createWallet(data);
      await get().refreshData();
    },

    deleteWallet: async (id: string) => {
      await api.deleteWallet(id);
      await get().refreshData();
    },

    createBudget: async (data: any) => {
      await api.createBudget(data);
      await get().refreshData();
    },

    deleteBudget: async (id: string) => {
      await api.deleteBudget(id);
      await get().refreshData();
    },
  };
});
