import React, { useState, useEffect, useCallback } from 'react';
import { useFinanceStore } from './store/useFinanceStore';
import { useAuthStore } from './store/useAuthStore';
import { api } from './api/client';
import { Wallet, Category, Transaction, Budget, DashboardStats } from './types';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
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

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedWalletId,
    selectedCategoryId,
    startDate,
    endDate,
    searchQuery,
    setIsAddTxOpen,
  } = useFinanceStore();

  const { isAuthenticated, checkSession } = useAuthStore();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Fetch all state
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
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
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWalletId, selectedCategoryId, startDate, endDate, searchQuery]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleSaveTransaction = async (data: any) => {
    if (data.id) {
      // Update
      await fetch(`/api/transactions/${data.id}`, {
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

  const handleApplyReceipt = (data: { merchant: string; amount: number; categoryId: string; date: string }) => {
    setIsAddTxOpen(true);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-simplicity-canvas flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar wallets={wallets} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Wallets Horizontal Shelf */}
        <WalletsShelf wallets={wallets} />

        {/* Date Filter & Control Bar */}
        <DatePeriodBar />

        {/* Context Filters */}
        <FilterBar categories={categories} />

        {/* Tab Switch Views */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-simplicity-muted">
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
                    <h3 className="text-sm font-bold uppercase tracking-wider text-simplicity-muted">
                      Recent Activity ({transactions.length} records)
                    </h3>
                    <button
                      onClick={() => setActiveTab('transactions')}
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
                  <h2 className="text-base font-bold text-simplicity-text">
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

      {/* Footer Info */}
      <footer className="mt-auto py-5 border-t border-simplicity-border/60 bg-white text-center text-xs text-simplicity-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Simplicity — Full-Stack Cloudflare Edge (Pages • Workers • D1 • R2 • KV)</span>
          <span className="text-simplicity-teal font-medium">100% Serverless & Zero Egress Fees</span>
        </div>
      </footer>

      {/* Modals */}
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

