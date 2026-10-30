import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { useFinanceStore } from './store/useFinanceStore';
import { useAuthStore } from './store/useAuthStore';
import { api, simplicityFetch, getIsLocalMode } from './api/client';
import { Wallet, Category, Transaction, Budget, DashboardStats } from './types';
import { WalletsShelf } from './components/WalletsShelf';
import { DatePeriodBar } from './components/DatePeriodBar';
import { FilterBar } from './components/FilterBar';
import { KPICards } from './components/KPICards';
import { AnalyticsGrid } from './components/AnalyticsGrid';
import { TransactionsList } from './components/TransactionsList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddWalletModal } from './components/AddWalletModal';
import { BudgetsView } from './components/BudgetsView';
import { WalletsManagerView } from './components/WalletsManagerView';
import { CSVImportModal } from './components/CSVImportModal';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { ArrowRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface FederatedFinanceProps {
  user?: { email: string; name: string; picture?: string } | null;
  token?: string | null;
  theme?: 'light' | 'dark';
  usdThbRate?: number;
  activeTab?: 'dashboard' | 'transactions' | 'budgets' | 'wallets';
  selectedWalletId?: string;
  onTabChange?: (tab: 'dashboard' | 'transactions' | 'budgets' | 'wallets') => void;
  onWalletChange?: (walletId: string) => void;
  onWalletsSync?: (wallets: Wallet[]) => void;
  apiBaseUrl?: string;
}

export const FederatedFinanceApp: React.FC<FederatedFinanceProps> = ({
  user,
  token,
  theme = 'dark',
  usdThbRate,
  activeTab: hostActiveTab,
  selectedWalletId: hostSelectedWalletId,
  onTabChange,
  onWalletChange,
  onWalletsSync,
  apiBaseUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    activeTab,
    setActiveTab,
    selectedWalletId,
    setSelectedWalletId,
    selectedCategoryId,
    startDate,
    endDate,
    searchQuery,
    setIsAddTxOpen,
    setIsAddWalletOpen,
    setIsImportOpen,
    setIsAiScanOpen,
    theme: storeTheme,
    setTheme,
    setUsdThbRate,
  } = useFinanceStore();

  const { isAuthenticated, checkSession, syncExternalAuth } = useAuthStore();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(
    typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );

  // 1. Synchronize Authentication (User & Token) from Host
  useEffect(() => {
    if (user && token) {
      syncExternalAuth(user, token);
    } else if (user) {
      syncExternalAuth(user, token || localStorage.getItem('auth_token') || 'host-session-token');
    } else if (isLocalMode && !isAuthenticated) {
      // Local development fallback
      useAuthStore.setState({
        user: {
          id: 'usr_rattajak_n_gmail_com',
          email: 'rattajak.n@gmail.com',
          name: 'Local Dev User',
          defaultCurrency: 'THB',
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else if (!isAuthenticated) {
      checkSession();
    }
  }, [user, token, isLocalMode, isAuthenticated, checkSession, syncExternalAuth]);

  // 2. Synchronize API Base URL if configured
  useEffect(() => {
    if (apiBaseUrl) {
      if (typeof (api as any).setConfig === 'function') {
        (api as any).setConfig({ apiBaseUrl });
      } else if (typeof (api as any).setBaseUrl === 'function') {
        (api as any).setBaseUrl(apiBaseUrl);
      }
    }
  }, [apiBaseUrl]);

  // --------------------------------------------------------------------------
  // Ref-based origin tracking to eliminate bidirectional echo loops
  // --------------------------------------------------------------------------
  const lastSyncedTabRef = useRef<string | undefined>(hostActiveTab);
  const lastSyncedWalletRef = useRef<string | undefined>(hostSelectedWalletId);

  // 3a. Inbound Tab Sync (Host -> Remote)
  // Only triggers when the host command changes
  useEffect(() => {
    if (hostActiveTab && hostActiveTab !== activeTab) {
      lastSyncedTabRef.current = hostActiveTab;
      setActiveTab(hostActiveTab);
    }
  }, [hostActiveTab]);

  // 3b. Outbound Tab Sync (Remote -> Host)
  // Only triggers when activeTab changes internally and differs from last synced
  useEffect(() => {
    if (activeTab && activeTab !== lastSyncedTabRef.current) {
      lastSyncedTabRef.current = activeTab;
      onTabChange?.(activeTab);
    }
  }, [activeTab, onTabChange]);

  // 4a. Inbound Wallet Sync (Host -> Remote)
  useEffect(() => {
    if (hostSelectedWalletId && hostSelectedWalletId !== selectedWalletId) {
      lastSyncedWalletRef.current = hostSelectedWalletId;
      setSelectedWalletId(hostSelectedWalletId);
    }
  }, [hostSelectedWalletId]);

  // 4b. Outbound Wallet Sync (Remote -> Host)
  useEffect(() => {
    if (selectedWalletId && selectedWalletId !== lastSyncedWalletRef.current) {
      lastSyncedWalletRef.current = selectedWalletId;
      onWalletChange?.(selectedWalletId);
    }
  }, [selectedWalletId, onWalletChange]);

  // 5. Synchronize Theme & USD/THB Rate
  useEffect(() => {
    if (theme) {
      setTheme(theme);
    }
  }, [theme, setTheme]);

  useEffect(() => {
    if (typeof usdThbRate === 'number' && Number.isFinite(usdThbRate) && usdThbRate > 0) {
      setUsdThbRate(usdThbRate);
    }
  }, [usdThbRate, setUsdThbRate]);

  // 6. Custom Event Bridge ('oaktree:finance-action') for Modals
  useEffect(() => {
    const handleFinanceAction = (e: Event) => {
      const customEvent = e as CustomEvent<{ action: 'add-tx' | 'ai-scan' | 'csv-import' | 'add-wallet' }>;
      const action = customEvent.detail?.action;
      if (action === 'add-tx') {
        setIsAddTxOpen(true);
      } else if (action === 'ai-scan') {
        setIsAiScanOpen(true);
      } else if (action === 'csv-import') {
        setIsImportOpen(true);
      } else if (action === 'add-wallet') {
        setIsAddWalletOpen(true);
      }
    };

    window.addEventListener('oaktree:finance-action', handleFinanceAction);
    return () => {
      window.removeEventListener('oaktree:finance-action', handleFinanceAction);
    };
  }, [setIsAddTxOpen, setIsAiScanOpen, setIsImportOpen, setIsAddWalletOpen]);

  // 7. Data Fetching & Sync Wallets with Host
  const refreshData = useCallback(async () => {
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

      setWallets(wList);
      setCategories(cList);
      setTransactions(txList);
      setBudgets(bList);
      setStats(sData);
      if (getIsLocalMode()) {
        setIsLocalMode(true);
      }

      // Dispatch wallets list up to host
      onWalletsSync?.(wList);
    } catch (err) {
      console.error('Error refreshing finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWalletId, selectedCategoryId, startDate, endDate, searchQuery, onWalletsSync]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Sync wallets on list mutation
  useEffect(() => {
    if (wallets.length > 0) {
      onWalletsSync?.(wallets);
    }
  }, [wallets, onWalletsSync]);

  // Handlers for child components
  const handleSaveTransaction = async (data: any) => {
    if (data.id) {
      await simplicityFetch(`/api/transactions/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      await api.createTransaction(data);
    }
    await refreshData();
  };

  const handleTransfer = async (data: any) => {
    await api.createTransfer(data);
    await refreshData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    await refreshData();
  };

  const handleAddWallet = async (data: any) => {
    await api.createWallet(data);
    await refreshData();
  };

  const handleDeleteWallet = async (id: string) => {
    await api.deleteWallet(id);
    await refreshData();
  };

  const handleCreateBudget = async (data: any) => {
    await api.createBudget(data);
    await refreshData();
  };

  const handleDeleteBudget = async (id: string) => {
    await api.deleteBudget(id);
    await refreshData();
  };

  const handleApplyReceipt = (_data: { merchant: string; amount: number; categoryId: string; date: string }) => {
    setIsAddTxOpen(true);
  };

  // Auth gate when running unauthenticated in production mode
  if (!isAuthenticated && !user && !isLocalMode) {
    return (
      <div className="simplicity-scope min-h-[400px] flex items-center justify-center p-8 bg-simplicity-canvas dark:bg-slate-950 font-sans">
        <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 rounded-2xl border border-simplicity-border dark:border-slate-800 shadow-simplicity text-center">
          <h3 className="text-lg font-bold text-simplicity-text dark:text-slate-100 mb-2">
            Authentication Required
          </h3>
          <p className="text-sm text-simplicity-muted dark:text-slate-400">
            Please sign in through Oaktree Agent to access Simplicity Finance.
          </p>
        </div>
      </div>
    );
  }

  const activeTheme = theme || storeTheme || 'dark';

  return (
    <div
      ref={containerRef}
      className={clsx(
        'simplicity-scope min-h-screen flex flex-col font-sans transition-colors duration-200',
        activeTheme === 'dark' ? 'dark bg-[#0f172a] text-slate-100' : 'bg-simplicity-canvas text-simplicity-text'
      )}
    >
      {/* Main Content Area — No Navbar rendered in Federated mode */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Local Mode Badge */}
        {isLocalMode && (
          <div className="flex items-center justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Local Mode (Mock DB)
            </span>
          </div>
        )}

        {/* Wallets Horizontal Shelf */}
        <WalletsShelf wallets={wallets} />

        {/* Date Filter & Control Bar */}
        <DatePeriodBar />

        {/* Context Filters */}
        <FilterBar categories={categories} />

        {/* Tab Switch Views */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-simplicity-muted dark:text-slate-400">
            <Loader2 size={32} className="animate-spin text-simplicity-teal mb-3" />
            <span className="text-sm font-semibold">Synchronizing with Cloudflare Edge...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                {/* 4-Card KPI Summary */}
                <KPICards stats={stats} />

                {/* Charts Grid: Cash Flow + Donut Breakdown */}
                <AnalyticsGrid stats={stats} />

                {/* Recent Transactions Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-simplicity-muted dark:text-slate-400">
                      Recent Activity ({transactions.length} records)
                    </h3>
                    <button
                      onClick={() => {
                        setActiveTab('transactions');
                        onTabChange?.('transactions');
                      }}
                      className="text-xs font-bold text-simplicity-teal hover:underline flex items-center gap-1"
                    >
                      View All Transactions <ArrowRight size={13} />
                    </button>
                  </div>
                  <TransactionsList
                    transactions={transactions.slice(0, 8)}
                    onDelete={handleDeleteTransaction}
                  />
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-simplicity-text dark:text-slate-100">
                    Transactions History ({transactions.length})
                  </h2>
                </div>
                <TransactionsList
                  transactions={transactions}
                  onDelete={handleDeleteTransaction}
                />
              </div>
            )}

            {activeTab === 'budgets' && (
              <BudgetsView
                budgets={budgets}
                categories={categories}
                onCreateBudget={handleCreateBudget}
                onDeleteBudget={handleDeleteBudget}
              />
            )}

            {activeTab === 'wallets' && (
              <WalletsManagerView
                wallets={wallets}
                onDeleteWallet={handleDeleteWallet}
              />
            )}
          </>
        )}
      </main>

      {/* Modals triggered internally or via 'oaktree:finance-action' events */}
      <AddTransactionModal
        wallets={wallets}
        categories={categories}
        onSave={handleSaveTransaction}
        onTransfer={handleTransfer}
      />

      <AddWalletModal onAddWallet={handleAddWallet} />

      <CSVImportModal
        wallets={wallets}
        categories={categories}
        onImportComplete={refreshData}
      />

      <ReceiptScannerModal onApplyReceipt={handleApplyReceipt} />
    </div>
  );
};

export default FederatedFinanceApp;
