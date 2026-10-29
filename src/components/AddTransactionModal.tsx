import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { X, Calendar, FileText, Hash, ArrowRightLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface AddTransactionModalProps {
  wallets: Wallet[];
  categories: Category[];
  onSave: (data: any) => Promise<void>;
  onTransfer: (data: any) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  wallets,
  categories,
  onSave,
  onTransfer,
}) => {
  const { isAddTxOpen, setIsAddTxOpen, editingTx, setEditingTx, selectedWalletId, setIsAiScanOpen } = useFinanceStore();

  const [txMode, setTxMode] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [walletId, setWalletId] = useState<string>(
    selectedWalletId !== 'all' ? selectedWalletId : wallets[0]?.id || ''
  );
  const [targetWalletId, setTargetWalletId] = useState<string>(wallets[1]?.id || wallets[0]?.id || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState<string>('');
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [keepOpen, setKeepOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when editing an existing transaction
  useEffect(() => {
    if (editingTx) {
      const isExp = Number(editingTx.amount) < 0;
      setTxMode(editingTx.type === 'TRANSFER' ? 'transfer' : isExp ? 'expense' : 'income');
      setAmount(Math.abs(Number(editingTx.amount)).toString());
      setWalletId(editingTx.wallet_id);
      setCategoryId(editingTx.category_id);
      setDate(editingTx.start_date.slice(0, 16));
      setNote(editingTx.note || '');
      const tags = typeof editingTx.hashtags === 'string'
        ? JSON.parse(editingTx.hashtags || '[]')
        : editingTx.hashtags || [];
      setHashtagInput(tags.join(' '));
    } else {
      // Set default category
      const filtered = categories.filter((c) => c.type === (txMode === 'income' ? 'income' : 'expense'));
      if (filtered.length > 0 && !categoryId) {
        setCategoryId(filtered[0].id);
      }
    }
  }, [editingTx, categories, txMode]);

  if (!isAddTxOpen) return null;

  const currentCategories = categories.filter((c) => c.type === (txMode === 'income' ? 'income' : 'expense'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      if (txMode === 'transfer') {
        await onTransfer({
          fromWalletId: walletId,
          toWalletId: targetWalletId,
          amount: Number(amount),
          date,
          note,
        });
      } else {
        const parsedAmount = txMode === 'expense' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
        const tags = hashtagInput
          .split(' ')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .map((t) => (t.startsWith('#') ? t : `#${t}`));

        await onSave({
          id: editingTx?.id,
          walletId,
          categoryId: categoryId || currentCategories[0]?.id || 'cat_food',
          type: 'REGULAR',
          amount: parsedAmount,
          currency: 'THB',
          startDate: date,
          note,
          hashtags: tags,
        });
      }

      if (!keepOpen) {
        setIsAddTxOpen(false);
        setEditingTx(null);
      } else {
        setAmount('');
        setNote('');
        setHashtagInput('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-simplicity-modal border border-simplicity-border w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Tabs */}
        <div className="p-4 bg-simplicity-canvas border-b border-simplicity-border/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-simplicity-border shadow-xs">
            <button
              type="button"
              onClick={() => { setTxMode('expense'); setCategoryId(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                txMode === 'expense' ? 'bg-simplicity-red text-white shadow-sm' : 'text-simplicity-muted hover:text-simplicity-text'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setTxMode('income'); setCategoryId(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                txMode === 'income' ? 'bg-simplicity-teal text-white shadow-sm' : 'text-simplicity-muted hover:text-simplicity-text'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setTxMode('transfer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                txMode === 'transfer' ? 'bg-simplicity-blue text-white shadow-sm' : 'text-simplicity-muted hover:text-simplicity-text'
              }`}
            >
              Transfer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddTxOpen(false);
                setIsAiScanOpen(true);
              }}
              className="p-1.5 rounded-lg text-simplicity-purple hover:bg-simplicity-purple/10 transition-colors"
              title="Scan Receipt with AI"
            >
              <Sparkles size={17} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddTxOpen(false);
                setEditingTx(null);
              }}
              className="p-1.5 rounded-lg text-simplicity-muted hover:text-simplicity-text hover:bg-slate-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Big Amount Input */}
          <div className="text-center py-2">
            <label className="text-xs font-bold uppercase tracking-wider text-simplicity-muted block mb-1">
              Amount (THB)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className={`text-3xl font-bold font-mono ${
                txMode === 'expense' ? 'text-simplicity-red' : txMode === 'income' ? 'text-simplicity-teal' : 'text-simplicity-blue'
              }`}>
                {txMode === 'expense' ? '-' : txMode === 'income' ? '+' : '⇄'}
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-48 text-center text-4xl font-extrabold font-mono text-simplicity-text bg-transparent border-b-2 border-slate-200 focus:border-simplicity-teal focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Transfer Mode Wallets */}
          {txMode === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3 p-4 bg-simplicity-canvas rounded-2xl border border-simplicity-border">
              <div>
                <label className="text-xs font-bold text-simplicity-muted block mb-1">From Wallet</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-simplicity-muted block mb-1">To Wallet</label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text"
                >
                  {wallets.filter((w) => w.id !== walletId).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Category Picker Grid */
            <div>
              <label className="text-xs font-bold text-simplicity-muted uppercase tracking-wider block mb-2">
                Category
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1.5 border border-simplicity-border rounded-2xl bg-simplicity-canvas/50">
                {currentCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-white shadow-simplicity ring-2 ring-simplicity-teal'
                          : 'hover:bg-white/80'
                      }`}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                      <span className="text-[10px] font-semibold text-simplicity-text truncate w-full text-center mt-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wallet & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {txMode !== 'transfer' && (
              <div>
                <label className="text-xs font-bold text-simplicity-muted block mb-1">Wallet</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({(w.computed_balance || 0).toLocaleString()} {w.currency})</option>
                  ))}
                </select>
              </div>
            )}

            <div className={txMode === 'transfer' ? 'col-span-2' : ''}>
              <label className="text-xs font-bold text-simplicity-muted block mb-1">Date & Time</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
                />
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1">Note / Description</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Lunch with friends, groceries..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs font-medium p-2.5 pl-8 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
              />
              <FileText size={14} className="absolute left-2.5 top-3 text-simplicity-muted" />
            </div>
          </div>

          {/* Hashtags Input */}
          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1">Hashtags</label>
            <div className="relative">
              <input
                type="text"
                placeholder="#food #travel #weekend (space separated)"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                className="w-full text-xs font-medium p-2.5 pl-8 bg-white rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
              />
              <Hash size={14} className="absolute left-2.5 top-3 text-simplicity-muted" />
            </div>
          </div>

          {/* Keep open toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="keepOpen"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="w-4 h-4 rounded text-simplicity-teal focus:ring-simplicity-teal border-slate-300"
            />
            <label htmlFor="keepOpen" className="text-xs font-medium text-simplicity-muted cursor-pointer">
              Keep window open to add multiple transactions
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow-md transition-all active:scale-98 ${
              txMode === 'expense'
                ? 'bg-simplicity-red hover:bg-simplicity-red-hover shadow-simplicity-red/20'
                : txMode === 'income'
                ? 'bg-simplicity-teal hover:bg-simplicity-teal-hover shadow-simplicity-teal/20'
                : 'bg-simplicity-blue hover:bg-blue-600 shadow-simplicity-blue/20'
            }`}
          >
            {isSubmitting ? 'Saving...' : editingTx ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>

      </div>
    </div>
  );
};


