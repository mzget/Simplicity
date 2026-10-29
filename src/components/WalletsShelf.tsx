import React from 'react';
import { Wallet } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { CategoryIcon } from './CategoryIcon';
import { Plus, CreditCard, Landmark, Wallet as WalletIcon, Coins } from 'lucide-react';

interface WalletsShelfProps {
  wallets: Wallet[];
}

export const WalletsShelf: React.FC<WalletsShelfProps> = ({ wallets }) => {
  const { selectedWalletId, setSelectedWalletId, setIsAddWalletOpen } = useFinanceStore();

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
        <h2 className="text-xs font-bold uppercase tracking-wider text-simplicity-muted">
          Your Wallets & Accounts
        </h2>
        <button
          onClick={() => setIsAddWalletOpen(true)}
          className="text-xs font-bold text-simplicity-teal hover:underline flex items-center gap-1"
        >
          <Plus size={14} /> Add Wallet
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* All Wallets Summary Card */}
        <div
          onClick={() => setSelectedWalletId('all')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border bg-white ${
            selectedWalletId === 'all'
              ? 'ring-2 ring-simplicity-teal border-transparent shadow-simplicity'
              : 'border-simplicity-border/80 hover:border-simplicity-teal/40 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-simplicity-teal/10 text-simplicity-teal">
              All In One
            </span>
            <div className="w-8 h-8 rounded-full bg-simplicity-teal flex items-center justify-center text-white">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-sm font-semibold text-simplicity-text">All Wallets</div>
          <div className="text-lg font-bold font-mono text-simplicity-teal mt-0.5">
            {wallets.reduce((acc, w) => acc + (w.computed_balance || 0), 0).toLocaleString()} THB
          </div>
        </div>

        {/* Individual Wallet Cards */}
        {wallets.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          const balance = wallet.computed_balance || 0;
          const isNegative = balance < 0;

          return (
            <div
              key={wallet.id}
              onClick={() => setSelectedWalletId(wallet.id)}
              className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border bg-white relative overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-simplicity-teal border-transparent shadow-simplicity'
                  : 'border-simplicity-border/80 hover:border-simplicity-teal/40 hover:shadow-sm'
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

              <div className="text-sm font-semibold text-simplicity-text truncate" title={wallet.name}>
                {wallet.name}
              </div>

              <div className={`text-lg font-bold font-mono mt-0.5 ${isNegative ? 'text-simplicity-red' : 'text-simplicity-text'}`}>
                {balance >= 0 ? '+' : ''}{balance.toLocaleString()} {wallet.currency}
              </div>
            </div>
          );
        })}

        {/* Add New Wallet Quick Button */}
        <div
          onClick={() => setIsAddWalletOpen(true)}
          className="cursor-pointer rounded-2xl p-4 border-2 border-dashed border-simplicity-border hover:border-simplicity-teal/60 bg-simplicity-canvas/50 hover:bg-simplicity-canvas flex flex-col items-center justify-center text-center transition-all min-h-[105px]"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-simplicity-muted mb-1.5">
            <Plus size={16} />
          </div>
          <span className="text-xs font-bold text-simplicity-muted">Connect / Add Wallet</span>
        </div>
      </div>
    </div>
  );
};


