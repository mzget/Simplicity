import React from 'react';
import { Wallet } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { useFinanceStore } from '../store/useFinanceStore';
import { Plus, Trash2, ShieldCheck, ArrowRight } from 'lucide-react';

interface WalletsManagerViewProps {
  wallets: Wallet[];
  onDeleteWallet: (id: string) => Promise<void>;
  currency?: string;
}

export const WalletsManagerView: React.FC<WalletsManagerViewProps> = ({
  wallets,
  onDeleteWallet,
  currency = 'THB',
}) => {
  const { setIsAddWalletOpen, setSelectedWalletId, setActiveTab } = useFinanceStore();

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank': return 'Landmark';
      case 'credit': return 'CreditCard';
      case 'crypto': return 'Coins';
      default: return 'Wallet';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-simplicity-text">Wallets & Bank Accounts</h3>
          <p className="text-xs text-simplicity-muted mt-0.5">
            Organize cash, bank accounts, credit cards and crypto investments.
          </p>
        </div>
        <button
          onClick={() => setIsAddWalletOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-simplicity-teal hover:bg-simplicity-teal-hover text-white text-xs font-bold shadow-md shadow-simplicity-teal/20 transition-all"
        >
          <Plus size={15} /> Add Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((w) => {
          const balance = w.computed_balance || 0;
          return (
            <div
              key={w.id}
              className="bg-white rounded-3xl p-5 border border-simplicity-border shadow-simplicity relative overflow-hidden flex flex-col justify-between"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: w.color }}
              />

              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-simplicity-canvas text-simplicity-muted">
                    {w.type}
                  </span>
                  <div className="flex items-center gap-1">
                    {wallets.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete wallet "${w.name}"?`)) onDeleteWallet(w.id);
                        }}
                        className="p-1 rounded-lg text-slate-300 hover:text-simplicity-red hover:bg-simplicity-red/10 transition-colors"
                        title="Delete wallet"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <CategoryIcon name={getWalletIcon(w.type)} color={w.color} size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-simplicity-text">{w.name}</h4>
                    <span className="text-xs text-simplicity-muted font-mono">
                      Starting: {w.startingBalance.toLocaleString()} {w.currency}
                    </span>
                  </div>
                </div>

                <div className="bg-simplicity-canvas/60 rounded-2xl p-3 border border-simplicity-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-simplicity-muted block">
                    Current Balance
                  </span>
                  <span className={`text-xl font-bold font-mono ${
                    balance < 0 ? 'text-simplicity-red' : 'text-simplicity-text'
                  }`}>
                    {balance >= 0 ? '+' : ''}{balance.toLocaleString()} {w.currency}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-simplicity-teal flex items-center gap-1 font-semibold">
                  <ShieldCheck size={14} /> Active Edge Storage
                </span>
                <button
                  onClick={() => {
                    setSelectedWalletId(w.id);
                    setActiveTab('transactions');
                  }}
                  className="text-xs font-bold text-simplicity-muted hover:text-simplicity-text flex items-center gap-1 transition-colors"
                >
                  View Transactions <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


