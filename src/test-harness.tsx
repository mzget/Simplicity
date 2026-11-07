import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { FederatedFinanceApp } from './FederatedFinanceApp';
import { useFinanceStore } from './store/useFinanceStore';
import { Wallet, Category, Transaction, DashboardStats } from './types';
import './index.css';

// Mock Seed Data matching project types
const MOCK_WALLETS: Wallet[] = [
  {
    id: 'wal_kbank',
    userId: 'usr_test_e2e',
    name: 'K-Bank Main',
    type: 'bank',
    currency: 'THB',
    startingBalance: 50000,
    currentBalance: 50000,
    color: '#10b981',
    icon: 'landmark',
    orderIndex: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wal_scb',
    userId: 'usr_test_e2e',
    name: 'SCB Savings',
    type: 'bank',
    currency: 'THB',
    startingBalance: 25000,
    currentBalance: 25000,
    color: '#6366f1',
    icon: 'landmark',
    orderIndex: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wal_cash',
    userId: 'usr_test_e2e',
    name: 'Cash Wallet',
    type: 'cash',
    currency: 'THB',
    startingBalance: 3500,
    currentBalance: 3500,
    color: '#f59e0b',
    icon: 'wallet',
    orderIndex: 2,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'utensils', position: 1, status: 'active' },
  { id: 'cat_transport', name: 'Transport', type: 'expense', color: '#f97316', icon: 'car', position: 2, status: 'active' },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: 'shopping-bag', position: 3, status: 'active' },
  { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', color: '#06b6d4', icon: 'file-text', position: 4, status: 'active' },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'film', position: 5, status: 'active' },
  { id: 'cat_health', name: 'Health & Medical', type: 'expense', color: '#14b8a6', icon: 'heart', position: 6, status: 'active' },
  { id: 'cat_education', name: 'Education', type: 'expense', color: '#6366f1', icon: 'book', position: 7, status: 'active' },
  { id: 'cat_misc', name: 'Miscellaneous', type: 'expense', color: '#64748b', icon: 'more-horizontal', position: 8, status: 'active' },
  { id: 'cat_extra1', name: 'Groceries', type: 'expense', color: '#84cc16', icon: 'shopping-cart', position: 9, status: 'active' },
  { id: 'cat_salary', name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase', position: 10, status: 'active' },
  { id: 'cat_freelance', name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'laptop', position: 11, status: 'active' },
  { id: 'cat_invest', name: 'Investments', type: 'income', color: '#a855f7', icon: 'trending-up', position: 12, status: 'active' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    wallet_id: 'wal_kbank',
    user_id: 'usr_test_e2e',
    category_id: 'cat_food',
    type: 'REGULAR',
    amount: -350,
    currency: 'THB',
    start_date: new Date().toISOString(),
    note: 'Lunch at Siam Paragon #food #weekend',
    hashtags: ['food', 'weekend'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Food & Dining',
    wallet_name: 'K-Bank Main',
  },
  {
    id: 'tx_2',
    wallet_id: 'wal_kbank',
    user_id: 'usr_test_e2e',
    category_id: 'cat_salary',
    type: 'REGULAR',
    amount: 65000,
    currency: 'THB',
    start_date: new Date().toISOString(),
    note: 'Monthly salary deposit #salary',
    hashtags: ['salary'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Salary',
    wallet_name: 'K-Bank Main',
  },
];

const MOCK_STATS: DashboardStats = {
  totalBalance: 78500,
  periodIncome: 65000,
  periodExpense: 350,
  periodChange: 5.2,
  transactionCount: 2,
  categoryBreakdown: [
    { id: 'cat_food', name: 'Food & Dining', color: '#ef4444', icon: 'utensils', count: 1, total: 350 },
  ],
  cashFlowSeries: [
    { date: new Date().toISOString().slice(0, 10), income: 65000, expense: 350, net: 64650 },
  ],
};

declare global {
  interface Window {
    __E2E_STATE__: {
      tabChangeCalls: Array<'dashboard' | 'transactions' | 'wallets' | 'budgets'>;
      walletChangeCalls: string[];
      actionConsumedCalls: string[];
      historyBackCalls: number;
      historyPushStateCalls: number;
      setPendingAction: (action: 'add-tx' | 'ai-scan' | 'csv-import' | 'add-wallet' | null) => void;
      setTheme: (theme: 'light' | 'dark') => void;
      setActiveTab: (tab: 'dashboard' | 'transactions' | 'wallets' | 'budgets') => void;
      setIsEmbedded: (isEmbedded: boolean) => void;
    };
  }
}

export const TestHarnessApp: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  
  const initialTheme = (params.get('theme') as 'light' | 'dark') || 'dark';
  const initialTab = (params.get('tab') as 'dashboard' | 'transactions' | 'wallets' | 'budgets') || 'dashboard';
  const initialEmbedded = params.get('isEmbedded') !== 'false';
  const initialAction = (params.get('action') as 'add-tx' | 'ai-scan' | 'csv-import' | 'add-wallet' | null) || null;

  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'wallets' | 'budgets'>(initialTab);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(initialEmbedded);
  const [pendingAction, setPendingAction] = useState<'add-tx' | 'ai-scan' | 'csv-import' | 'add-wallet' | null>(initialAction);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

  // Track window.history calls for E2E validation
  useEffect(() => {
    const origPushState = window.history.pushState;
    const origBack = window.history.back;

    let historyBackCalls = 0;
    let historyPushStateCalls = 0;

    window.history.pushState = function (...args) {
      historyPushStateCalls++;
      if (window.__E2E_STATE__) {
        window.__E2E_STATE__.historyPushStateCalls = historyPushStateCalls;
      }
      return origPushState.apply(this, args);
    };

    window.history.back = function (...args) {
      historyBackCalls++;
      if (window.__E2E_STATE__) {
        window.__E2E_STATE__.historyBackCalls = historyBackCalls;
      }
      return origBack.apply(this, args);
    };

    window.__E2E_STATE__ = {
      tabChangeCalls: [],
      walletChangeCalls: [],
      actionConsumedCalls: [],
      historyBackCalls: 0,
      historyPushStateCalls: 0,
      setPendingAction: (act) => setPendingAction(act),
      setTheme: (t) => setTheme(t),
      setActiveTab: (tab) => setActiveTab(tab),
      setIsEmbedded: (emb) => setIsEmbedded(emb),
    };

    return () => {
      window.history.pushState = origPushState;
      window.history.back = origBack;
    };
  }, []);

  useEffect(() => {
    useFinanceStore.setState({
      wallets: MOCK_WALLETS,
      categories: MOCK_CATEGORIES,
      transactions: MOCK_TRANSACTIONS,
      stats: MOCK_STATS,
      isLoading: false,
      isEmbedded,
      isLocalMode: false,
    });
  }, [isEmbedded]);

  const handleTabChange = (tab: 'dashboard' | 'transactions' | 'wallets' | 'budgets') => {
    setActiveTab(tab);
    useFinanceStore.getState().setActiveTab(tab);
    window.__E2E_STATE__?.tabChangeCalls.push(tab);
  };

  const handleWalletChange = (walletId: string) => {
    setSelectedWalletId(walletId);
    window.__E2E_STATE__?.walletChangeCalls.push(walletId);
  };

  const handleActionConsumed = () => {
    const currentAction = pendingAction;
    if (currentAction) {
      window.__E2E_STATE__?.actionConsumedCalls.push(currentAction);
    }
    setPendingAction(null);
  };

  return (
    <div className={`w-full min-h-screen ${theme === 'dark' ? 'bg-[#06090e]' : 'bg-slate-50'}`}>
      {/* Simulated Oaktree Host Navigation Bar */}
      <nav data-testid="simulated-host-nav" className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-1">
          <span className="font-bold text-emerald-400 mr-2">Oaktree Host</span>
          <button
            data-testid="host-tab-dashboard"
            onClick={() => handleTabChange('dashboard')}
            className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            Dashboard
          </button>
          <button
            data-testid="host-tab-transactions"
            onClick={() => handleTabChange('transactions')}
            className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'transactions' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            Transactions
          </button>
          <button
            data-testid="host-tab-wallets"
            onClick={() => handleTabChange('wallets')}
            className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'wallets' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            Wallets
          </button>
          <button
            data-testid="host-tab-budgets"
            onClick={() => handleTabChange('budgets')}
            className={`px-3 py-1 rounded-md transition-colors ${activeTab === 'budgets' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            Budgets
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Triggers simulating Host dispatching pendingAction */}
          <button
            data-testid="host-action-add-tx"
            onClick={() => setPendingAction('add-tx')}
            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 font-medium"
          >
            + Add Tx
          </button>
          <button
            data-testid="host-action-ai-scan"
            onClick={() => setPendingAction('ai-scan')}
            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 font-medium"
          >
            AI Scan
          </button>
          <button
            data-testid="host-action-csv-import"
            onClick={() => setPendingAction('csv-import')}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 font-medium"
          >
            CSV Import
          </button>
          <button
            data-testid="host-action-add-wallet"
            onClick={() => setPendingAction('add-wallet')}
            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 font-medium"
          >
            + Wallet
          </button>

          {/* Theme Switcher */}
          <button
            data-testid="host-theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono"
          >
            Theme: {theme}
          </button>

          {/* Embedded Switcher */}
          <button
            data-testid="host-embedded-toggle"
            onClick={() => setIsEmbedded((prev) => !prev)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono"
          >
            Embedded: {isEmbedded ? 'YES' : 'NO'}
          </button>

          {/* Wallet Selector */}
          <select
            data-testid="host-wallet-select"
            value={selectedWalletId}
            onChange={(e) => handleWalletChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
          >
            <option value="all">All Wallets</option>
            {MOCK_WALLETS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Embedded Federated Remote Component Under Test */}
      <FederatedFinanceApp
        user={{
          email: 'rattajak.n@gmail.com',
          name: 'Rattajak N.',
        }}
        token="mock-e2e-jwt-token"
        theme={theme}
        usdThbRate={36.5}
        activeTab={activeTab}
        selectedWalletId={selectedWalletId}
        onTabChange={handleTabChange}
        onWalletChange={handleWalletChange}
        isEmbedded={isEmbedded}
        allowLocalFallback={true}
        pendingAction={pendingAction}
        onActionConsumed={handleActionConsumed}
      />
    </div>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<TestHarnessApp />);
}
