import { create } from 'zustand';
import { PeriodPreset, Transaction } from '../types';
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear, endOfYear, format } from 'date-fns';

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

  // Theme & Exchange Rate Synchronization (Milestone 4)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  usdThbRate: number;
  setUsdThbRate: (rate: number) => void;
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
      start: '2020-01-01',
      end: format(now, 'yyyy-MM-dd'),
    };
  }
  // Default: this_month
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  };
};

export const useFinanceStore = create<FinanceState>((set) => {
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
  };
});
