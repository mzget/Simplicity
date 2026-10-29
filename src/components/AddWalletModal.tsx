import React, { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { X, Landmark, Wallet as WalletIcon, CreditCard, Coins, PiggyBank } from 'lucide-react';

interface AddWalletModalProps {
  onAddWallet: (data: any) => Promise<void>;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ onAddWallet }) => {
  const { isAddWalletOpen, setIsAddWalletOpen } = useFinanceStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit' | 'savings' | 'crypto'>('bank');
  const [currency, setCurrency] = useState('THB');
  const [startingBalance, setStartingBalance] = useState('');
  const [color, setColor] = useState('#12C48B');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddWalletOpen) return null;

  const colorPalette = [
    '#12C48B', '#2ECC71', '#38A3F1', '#2980B9', '#9065ED',
    '#E91E63', '#FFAA2C', '#E67E22', '#F55353', '#34495E'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddWallet({
        name,
        type,
        currency,
        startingBalance: Number(startingBalance) || 0,
        color,
        icon: type === 'bank' ? 'Landmark' : type === 'credit' ? 'CreditCard' : type === 'crypto' ? 'Coins' : 'Wallet',
      });
      setIsAddWalletOpen(false);
      setName('');
      setStartingBalance('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-simplicity-modal border border-simplicity-border w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-simplicity-canvas border-b border-simplicity-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-simplicity-teal flex items-center justify-center text-white">
              <WalletIcon size={16} />
            </div>
            <h3 className="text-sm font-bold text-simplicity-text">Add New Wallet</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAddWalletOpen(false)}
            className="p-1.5 rounded-lg text-simplicity-muted hover:text-simplicity-text hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1">Wallet Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. SCB Savings, Cash on hand, Binance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-simplicity-muted block mb-1">Account Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
                <option value="savings">Savings Account</option>
                <option value="credit">Credit Card</option>
                <option value="crypto">Crypto Wallet</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-simplicity-muted block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
              >
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1">Starting Balance</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className="w-full text-xs font-mono font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1.5">Color Accent</label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorPalette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-simplicity-text scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-simplicity-teal hover:bg-simplicity-teal-hover text-white font-bold text-sm shadow-md shadow-simplicity-teal/20 transition-all active:scale-98 mt-2"
          >
            {isSubmitting ? 'Creating...' : 'Create Wallet'}
          </button>
        </form>

      </div>
    </div>
  );
};

