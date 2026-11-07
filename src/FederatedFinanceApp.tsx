import React, { useEffect, useRef } from 'react';
import './index.css';
import { useFinanceStore } from './store/useFinanceStore';
import { useAuthStore } from './store/useAuthStore';
import { api } from './api/client';
import { Wallet } from './types';
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
import { PwaStatusBanner } from './components/PwaStatusBanner';
import { usePwaStore } from './store/usePwaStore';
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
  isEmbedded?: boolean;
  allowLocalFallback?: boolean;
  pendingAction?: 'add-tx' | 'ai-scan' | 'csv-import' | 'add-wallet' | null;
  onActionConsumed?: () => void;
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
  isEmbedded = false,
  allowLocalFallback = true,
  pendingAction,
  onActionConsumed,
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
    isAddTxOpen,
    setIsAddTxOpen,
    setIsAddWalletOpen,
    setIsImportOpen,
    setIsAiScanOpen,
    theme: storeTheme,
    setTheme,
    setUsdThbRate,
    setIsEmbedded,
    // Domain Data & Actions from Zustand Store (Approach 1: Domain Slice)
    wallets,
    categories,
    transactions,
    budgets,
    stats,
    isLoading,
    isLocalMode,
    refreshData,
    saveTransaction,
    transfer,
    deleteTransaction,
    createWallet,
    deleteWallet,
    createBudget,
    deleteBudget,
  } = useFinanceStore();

  const { isAuthenticated, checkSession, syncExternalAuth } = useAuthStore();

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

  // 2. Synchronize API & Dual-Mode Configuration (ADR-0021)
  useEffect(() => {
    if (typeof api?.setConfig === 'function') {
      api.setConfig({
        apiBaseUrl,
        allowLocalFallback,
        isEmbedded,
      });
    }
  }, [apiBaseUrl, allowLocalFallback, isEmbedded]);

  useEffect(() => {
    setIsEmbedded(isEmbedded);
  }, [isEmbedded, setIsEmbedded]);

  // --------------------------------------------------------------------------
  // Ref-based origin tracking to eliminate bidirectional echo loops
  // --------------------------------------------------------------------------
  const lastSyncedTabRef = useRef<string | undefined>(hostActiveTab);
  const lastSyncedWalletRef = useRef<string | undefined>(hostSelectedWalletId);

  // 3a. Inbound Tab Sync (Host -> Remote)
  useEffect(() => {
    if (hostActiveTab && hostActiveTab !== activeTab) {
      lastSyncedTabRef.current = hostActiveTab;
      setActiveTab(hostActiveTab);
    }
  }, [hostActiveTab, activeTab, setActiveTab]);

  // 3b. Outbound Tab Sync (Remote -> Host)
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
  }, [hostSelectedWalletId, selectedWalletId, setSelectedWalletId]);

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

  // 6. Hard Cutover: Declarative Action Consumer Bridge (ADR-0021)
  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction === 'add-tx') {
      setIsAddTxOpen(true);
    } else if (pendingAction === 'ai-scan') {
      setIsAiScanOpen(true);
    } else if (pendingAction === 'csv-import') {
      setIsImportOpen(true);
    } else if (pendingAction === 'add-wallet') {
      setIsAddWalletOpen(true);
    }
    onActionConsumed?.();
  }, [pendingAction, onActionConsumed, setIsAddTxOpen, setIsAiScanOpen, setIsImportOpen, setIsAddWalletOpen]);

  // 7. Data Fetching via Store Action
  useEffect(() => {
    refreshData(onWalletsSync);
  }, [refreshData, selectedWalletId, selectedCategoryId, startDate, endDate, searchQuery, onWalletsSync]);

  // Sync wallets on list mutation
  useEffect(() => {
    if (wallets.length > 0) {
      onWalletsSync?.(wallets);
    }
  }, [wallets, onWalletsSync]);

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

  useEffect(() => {
    const cleanup = usePwaStore.getState().initListeners();
    return () => cleanup();
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'simplicity-scope min-h-screen flex flex-col font-sans transition-colors duration-200',
        activeTheme === 'dark' ? 'dark bg-[#080c14] text-slate-100' : 'bg-simplicity-canvas text-simplicity-text'
      )}
    >
      {/* Main Content Area — No Navbar rendered in Federated mode */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-0 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3.5 sm:space-y-6">
        {/* PWA Offline / Syncing / DLQ Status Banner */}
        <PwaStatusBanner onSyncComplete={refreshData} />

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
                    onDelete={deleteTransaction}
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
                  onDelete={deleteTransaction}
                />
              </div>
            )}

            {activeTab === 'budgets' && (
              <BudgetsView
                budgets={budgets}
                categories={categories}
                onCreateBudget={createBudget}
                onDeleteBudget={deleteBudget}
              />
            )}

            {activeTab === 'wallets' && (
              <WalletsManagerView
                wallets={wallets}
                onDeleteWallet={deleteWallet}
              />
            )}
          </>
        )}
      </main>

      {/* Modals triggered internally or via pendingAction */}
      <AddTransactionModal
        wallets={wallets}
        categories={categories}
        onSave={saveTransaction}
        onTransfer={transfer}
        onDelete={deleteTransaction}
        isEmbedded={isEmbedded}
      />

      <AddWalletModal onAddWallet={createWallet} />

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
