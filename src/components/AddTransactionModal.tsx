import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { Calendar, FileText, Hash, ArrowRightLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

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

  const handleOpenChange = (open: boolean) => {
    setIsAddTxOpen(open);
    if (!open) {
      setEditingTx(null);
    }
  };

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
    <Dialog open={isAddTxOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-white/10 bg-[#0f172a]/95 text-slate-100 shadow-2xl backdrop-blur-2xl rounded-3xl">
        {/* Header Tabs */}
        <div className="p-4 bg-slate-900/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => { setTxMode('expense'); setCategoryId(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                txMode === 'expense' 
                  ? 'bg-red-500 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setTxMode('income'); setCategoryId(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                txMode === 'income' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setTxMode('transfer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                txMode === 'transfer' 
                  ? 'bg-sky-500 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transfer
            </button>
          </div>

          <div className="flex items-center gap-1 pr-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAddTxOpen(false);
                setIsAiScanOpen(true);
              }}
              className="h-8 w-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              title="Scan Receipt with AI"
            >
              <Sparkles size={16} />
            </Button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          {/* Big Amount Input */}
          <div className="text-center py-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Amount (THB)
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className={`text-3xl font-bold font-mono ${
                txMode === 'expense' ? 'text-red-500' : txMode === 'income' ? 'text-emerald-400' : 'text-sky-400'
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
                className="w-48 text-center text-4xl font-extrabold font-mono text-slate-100 bg-transparent border-b-2 border-white/10 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Transfer Mode Wallets */}
          {txMode === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900/60 rounded-2xl border border-white/5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">From Wallet</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-slate-950/80 rounded-xl border border-white/10 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">To Wallet</label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-slate-950/80 rounded-xl border border-white/10 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1.5 border border-white/10 rounded-2xl bg-slate-950/40">
                {currentCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-slate-800 shadow-sm ring-2 ring-emerald-500'
                          : 'hover:bg-slate-850/60 text-slate-300'
                      }`}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                      <span className="text-[10px] font-medium text-slate-300 truncate w-full text-center mt-1">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wallet & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {txMode !== 'transfer' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Wallet</label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full text-xs font-medium h-9 px-3 bg-slate-900/80 rounded-xl border border-white/10 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({(w.computed_balance || 0).toLocaleString()} {w.currency})</option>
                  ))}
                </select>
              </div>
            )}

            <div className={txMode === 'transfer' ? 'col-span-2' : ''}>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Date & Time</label>
              <Input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs h-9 bg-slate-900/80 border-white/10"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Note / Description</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g. Lunch with friends, groceries..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="pl-8 text-xs h-9 bg-slate-900/80 border-white/10"
              />
              <FileText size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Hashtags Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Hashtags</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="#food #travel #weekend"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                className="pl-8 text-xs h-9 bg-slate-900/80 border-white/10"
              />
              <Hash size={14} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Keep open toggle */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="keepOpen"
              checked={keepOpen}
              onChange={(e) => setKeepOpen(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-white/20 bg-slate-900"
            />
            <label htmlFor="keepOpen" className="text-xs font-medium text-slate-400 cursor-pointer">
              Keep window open to add multiple transactions
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant={txMode === 'expense' ? 'destructive' : 'default'}
            className={`w-full h-11 rounded-2xl font-bold text-sm shadow-lg transition-all ${
              txMode === 'expense'
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                : txMode === 'income'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
                : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20'
            }`}
          >
            {isSubmitting ? 'Saving...' : editingTx ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
