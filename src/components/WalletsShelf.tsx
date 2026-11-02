import React from 'react';
import { Wallet } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CategoryIcon } from './CategoryIcon';
import { Plus, CreditCard, Landmark, Wallet as WalletIcon, Coins } from 'lucide-react';

interface WalletsShelfProps {
  wallets: Wallet[];
}

export const WalletsShelf: React.FC<WalletsShelfProps> = ({ wallets }) => {
  const { selectedWalletId, setSelectedWalletId, setIsAddWalletOpen, usdThbRate } = useFinanceStore();
  const rate = usdThbRate > 0 ? usdThbRate : 36.5;

  const toThb = (amount: number, currency?: string) => {
    return currency === 'USD' ? amount * rate : amount;
  };

  const totalBalanceThb = wallets.reduce(
    (acc, w) => acc + toThb(w.computed_balance || 0, w.currency),
    0
  );

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank': return 'Landmark';
      case 'credit': return 'CreditCard';
      case 'crypto': return 'Coins';
      default: return 'Wallet';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-simplicity-muted dark:text-slate-400">
          Your Wallets & Accounts
        </h2>
        <button
          onClick={() => setIsAddWalletOpen(true)}
          className="text-xs font-bold text-simplicity-teal dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <Plus size={14} /> Add Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* All Wallets Summary Card */}
        <div
          onClick={() => setSelectedWalletId('all')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border bg-card/90 dark:bg-slate-900/60 simplicity-glass-card backdrop-blur-xl ${
            selectedWalletId === 'all'
              ? 'ring-2 ring-emerald-500 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-gradient-to-br from-emerald-950/20 via-transparent to-transparent'
              : 'border-border/80 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-simplicity-teal/10 text-simplicity-teal dark:text-emerald-400">
              All In One
            </span>
            <div className="w-8 h-8 rounded-full bg-simplicity-teal dark:bg-emerald-500 flex items-center justify-center text-white">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-sm font-semibold text-simplicity-text dark:text-slate-100">All Wallets</div>
          <div className="text-lg font-bold font-mono text-simplicity-teal dark:text-emerald-400 mt-0.5">
            {totalBalanceThb.toLocaleString()} THB
          </div>
          <div className="text-[11px] font-mono text-simplicity-muted dark:text-slate-400 mt-0.5">
            ≈ ${(totalBalanceThb / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD (1 USD = {rate} THB)
          </div>
        </div>

        {/* Individual Wallet Cards */}
        {wallets.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          const balance = wallet.computed_balance || 0;
          const isNegative = balance < 0;
          const isUsd = wallet.currency === 'USD';

          return (
            <div
              key={wallet.id}
              onClick={() => setSelectedWalletId(wallet.id)}
              className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border bg-white simplicity-glass-card relative overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-emerald-500 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-gradient-to-br from-emerald-950/20 via-transparent to-transparent'
                  : 'border-border/80 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-md'
              }`}
            >
              {/* Colored top accent bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: wallet.color }}
              />

              <div className="flex items-center justify-between mb-2 mt-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-simplicity-canvas text-simplicity-muted uppercase tracking-wider">
                  {wallet.type}
                </span>
                <CategoryIcon 
                  name={getWalletIcon(wallet.type)} 
                  color={wallet.color} 
                  size={14} 
                />
              </div>

              <div className="text-sm font-semibold text-simplicity-text dark:text-slate-100 truncate" title={wallet.name}>
                {wallet.name}
              </div>

              <div className={`text-lg font-bold font-mono mt-0.5 ${isNegative ? 'text-simplicity-red' : 'text-simplicity-text dark:text-slate-100'}`}>
                {balance >= 0 ? '+' : ''}{balance.toLocaleString()} {wallet.currency}
              </div>
              {isUsd && (
                <div className="text-[11px] font-mono text-simplicity-muted dark:text-slate-400 mt-0.5">
                  ~{(balance * rate).toLocaleString()} THB
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


