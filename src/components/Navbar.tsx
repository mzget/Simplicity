import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { Wallet } from '../types';
import { 
  Plus, 
  Sparkles, 
  Upload, 
  ChevronDown, 
  Wallet as WalletIcon,
  LayoutDashboard,
  Receipt,
  PiggyBank,
  FolderKanban,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  wallets: Wallet[];
}

export const Navbar: React.FC<NavbarProps> = ({ wallets }) => {
  const { user, logout } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    selectedWalletId,
    setSelectedWalletId,
    setIsAddTxOpen,
    setIsImportOpen,
    setIsAiScanOpen,
  } = useFinanceStore();

  const activeWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-simplicity-border/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Wallet Switcher */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-simplicity-teal flex items-center justify-center text-white shadow-md shadow-simplicity-teal/20">
                <WalletIcon size={20} className="stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-simplicity-text">
                SIMPLICITY<span className="text-simplicity-teal">.</span>
              </span>
            </div>

            {/* Wallet Context Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-simplicity-canvas hover:bg-slate-200/60 transition-colors text-sm font-semibold text-simplicity-text border border-simplicity-border">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeWallet?.color || '#12C48B' }} />
                <span>{selectedWalletId === 'all' ? 'All Wallets' : activeWallet?.name || 'My Wallet'}</span>
                <ChevronDown size={14} className="text-simplicity-muted" />
              </button>

              <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-simplicity border border-simplicity-border py-1.5 hidden group-hover:block transition-all z-50">
                <button
                  onClick={() => setSelectedWalletId('all')}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-simplicity-canvas ${
                    selectedWalletId === 'all' ? 'font-bold text-simplicity-teal bg-simplicity-teal/5' : 'text-simplicity-text'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-simplicity-teal" />
                    All Wallets
                  </span>
                </button>
                <div className="border-t border-simplicity-border/60 my-1" />
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-simplicity-canvas ${
                      selectedWalletId === w.id ? 'font-bold text-simplicity-teal bg-simplicity-teal/5' : 'text-simplicity-text'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                      {w.name}
                    </span>
                    <span className="text-xs font-mono text-simplicity-muted">
                      {(w.computed_balance || 0).toLocaleString()} {w.currency}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'text-simplicity-teal bg-simplicity-teal/10'
                    : 'text-simplicity-muted hover:text-simplicity-text hover:bg-simplicity-canvas'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'transactions'
                    ? 'text-simplicity-teal bg-simplicity-teal/10'
                    : 'text-simplicity-muted hover:text-simplicity-text hover:bg-simplicity-canvas'
                }`}
              >
                <Receipt size={16} />
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('budgets')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'budgets'
                    ? 'text-simplicity-teal bg-simplicity-teal/10'
                    : 'text-simplicity-muted hover:text-simplicity-text hover:bg-simplicity-canvas'
                }`}
              >
                <PiggyBank size={16} />
                Budgets
              </button>
              <button
                onClick={() => setActiveTab('wallets')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'wallets'
                    ? 'text-simplicity-teal bg-simplicity-teal/10'
                    : 'text-simplicity-muted hover:text-simplicity-text hover:bg-simplicity-canvas'
                }`}
              >
                <FolderKanban size={16} />
                Wallets
              </button>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* AI Receipt Scanner */}
            <button
              onClick={() => setIsAiScanOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-simplicity-purple bg-simplicity-purple/10 hover:bg-simplicity-purple/20 transition-colors"
              title="AI Receipt Scanner"
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline">AI Scanner</span>
            </button>

            {/* CSV Import */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="p-2 rounded-lg text-simplicity-muted hover:text-simplicity-text hover:bg-simplicity-canvas transition-colors"
              title="Import CSV"
            >
              <Upload size={17} />
            </button>

            {/* Primary Add Transaction Pill Button */}
            <button
              onClick={() => setIsAddTxOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-simplicity-teal hover:bg-simplicity-teal-hover text-white text-sm font-bold shadow-md shadow-simplicity-teal/25 transition-all transform active:scale-95"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Add</span>
            </button>

            {/* Profile Avatar & User Menu Dropdown */}
            <div className="relative group ml-1">
              <button
                type="button"
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-simplicity-teal/40 transition-all focus:outline-none"
                title={user?.email || 'User Account'}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-simplicity-teal/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-simplicity-text text-white flex items-center justify-center font-bold text-xs ring-2 ring-simplicity-teal/30">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RN'}
                  </div>
                )}
              </button>

              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-simplicity border border-simplicity-border p-3 hidden group-hover:block transition-all z-50">
                <div className="flex items-center gap-3 p-2 bg-slate-50/70 rounded-xl mb-2">
                  <div className="w-10 h-10 rounded-full bg-simplicity-teal text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                    {user?.picture ? (
                      <img src={user.picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.name ? user.name.slice(0, 2).toUpperCase() : 'RN'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-simplicity-text truncate">{user?.name || 'Owner'}</p>
                    <p className="text-[11px] text-simplicity-muted truncate">{user?.email || 'rattajak.n@gmail.com'}</p>
                  </div>
                </div>

                <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg mb-2">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">Google Authorized Owner</span>
                </div>

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};


