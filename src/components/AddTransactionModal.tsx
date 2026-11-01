import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { FileText, Hash, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { parseHashtags } from '../lib/parseHashtags';

interface AddTransactionModalProps {
  wallets: Wallet[];
  categories: Category[];
  onSave: (data: any) => Promise<void>;
  onTransfer: (data: any) => Promise<void>;
}

type TxMode = 'expense' | 'income' | 'transfer';

/** Number of categories visible before "Show all" (2 rows on mobile, 4 columns). */
const COLLAPSED_CATEGORY_COUNT = 8;

const MODE_STYLES: Record<TxMode, { sign: string; signColor: string; tab: string; button: string; focus: string }> = {
  expense: {
    sign: '-',
    signColor: 'text-red-500',
    tab: 'bg-red-500 text-white shadow-sm',
    button: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20',
    focus: 'focus:border-red-500',
  },
  income: {
    sign: '+',
    signColor: 'text-emerald-500',
    tab: 'bg-emerald-500 text-slate-950 shadow-sm font-bold',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20',
    focus: 'focus:border-emerald-500',
  },
  transfer: {
    sign: '⇄',
    signColor: 'text-sky-500',
    tab: 'bg-sky-500 text-white shadow-sm',
    button: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20',
    focus: 'focus:border-sky-500',
  },
};

const THEME_STYLES = {
  dark: {
    surface: 'border-white/10 bg-[#0f172a]/95 text-slate-100',
    bar: 'bg-slate-900/60 border-white/10',
    segment: 'bg-slate-950/60 border-white/5',
    segmentIdle: 'text-slate-400 hover:text-slate-200',
    label: 'text-slate-400',
    field: 'bg-slate-900/80 border-white/10 text-slate-100',
    well: 'bg-slate-950/40 border-white/10',
    amountText: 'text-slate-100 border-white/10 placeholder:text-slate-600',
    tileIdle: 'text-slate-300 hover:bg-white/5',
    tileSelected: 'bg-slate-800 shadow-sm ring-2 ring-emerald-500',
    tileLabel: 'text-slate-300',
    subtle: 'text-slate-500',
    chip: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    check: 'border-white/20 bg-slate-900',
  },
  light: {
    surface: 'border-slate-200 bg-white text-slate-900',
    bar: 'bg-slate-50 border-slate-200',
    segment: 'bg-slate-100 border-slate-200',
    segmentIdle: 'text-slate-500 hover:text-slate-800',
    label: 'text-slate-500',
    field: 'bg-slate-50 border-slate-200 text-slate-900',
    well: 'bg-slate-50 border-slate-200',
    amountText: 'text-slate-900 border-slate-200 placeholder:text-slate-300',
    tileIdle: 'text-slate-600 hover:bg-slate-100',
    tileSelected: 'bg-white shadow-sm ring-2 ring-emerald-500',
    tileLabel: 'text-slate-600',
    subtle: 'text-slate-400',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    check: 'border-slate-300 bg-white',
  },
} as const;

/** Keeps only digits and a single decimal point. */
const sanitizeAmount = (raw: string): string => {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const [intPart, ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${intPart}.${rest.join('')}` : intPart;
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  wallets,
  categories,
  onSave,
  onTransfer,
}) => {
  const { isAddTxOpen, setIsAddTxOpen, editingTx, setEditingTx, selectedWalletId, setIsAiScanOpen, theme } = useFinanceStore();
  const t = THEME_STYLES[theme === 'light' ? 'light' : 'dark'];

  const [txMode, setTxMode] = useState<TxMode>('expense');
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
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

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
  const visibleCategories = showAllCategories
    ? currentCategories
    : currentCategories.slice(0, COLLAPSED_CATEGORY_COUNT);
  const hasHiddenCategories = currentCategories.length > COLLAPSED_CATEGORY_COUNT;
  const tags = parseHashtags(hashtagInput);
  const styles = MODE_STYLES[txMode];

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

  const selectClass = `w-full text-sm font-medium h-10 px-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate ${t.field}`;
  const inputClass = `h-10 text-sm ${t.field}`;
  const labelClass = `text-xs font-semibold block mb-1 ${t.label}`;

  const modes: { key: TxMode; label: string }[] = [
    { key: 'expense', label: 'Expense' },
    { key: 'income', label: 'Income' },
    { key: 'transfer', label: 'Transfer' },
  ];

  return (
    <Dialog open={isAddTxOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        scheme={theme === 'light' ? 'light' : 'dark'}
        data-testid="add-transaction-modal"
        aria-describedby={undefined}
        className={`${t.surface} flex flex-col gap-0 p-0 overflow-hidden shadow-2xl backdrop-blur-2xl
          inset-x-0 bottom-0 top-auto left-0 w-full max-w-full max-h-[92dvh] translate-x-0 translate-y-0 rounded-b-none rounded-t-3xl
          sm:inset-auto sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:max-w-lg sm:max-h-[90vh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl`}
      >
        <DialogTitle className="sr-only">{editingTx ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>

        {/* Sticky header: mode tabs + AI scan (right padding leaves room for the close button) */}
        <div className={`shrink-0 py-3 pl-4 pr-14 border-b flex items-center gap-2 ${t.bar}`}>
          <div role="tablist" aria-label="Transaction type" className={`flex flex-1 items-center gap-1 p-1 rounded-xl border ${t.segment}`}>
            {modes.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={txMode === key}
                onClick={() => {
                  setTxMode(key);
                  if (key !== 'transfer') setCategoryId('');
                  setShowAllCategories(false);
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  txMode === key ? MODE_STYLES[key].tab : t.segmentIdle
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsAddTxOpen(false);
              setIsAiScanOpen(true);
            }}
            className="h-9 w-9 shrink-0 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
            title="Scan Receipt with AI"
            aria-label="Scan Receipt with AI"
          >
            <Sparkles size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
            {/* Amount */}
            <div className="text-center">
              <label htmlFor="tx-amount" className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${t.label}`}>
                Amount (THB)
              </label>
              <div className="flex items-center justify-center gap-2">
                <span aria-hidden="true" className={`text-3xl font-bold font-mono ${styles.signColor}`}>
                  {styles.sign}
                </span>
                <span aria-hidden="true" className={`text-2xl font-bold ${t.subtle}`}>฿</span>
                <input
                  id="tx-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  placeholder="0.00"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                  className={`w-44 sm:w-52 text-center text-4xl font-extrabold font-mono bg-transparent border-b-2 focus:outline-none transition-colors ${t.amountText} ${styles.focus}`}
                />
              </div>
            </div>

            {txMode === 'transfer' ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border ${t.well}`}>
                <div>
                  <label htmlFor="tx-from-wallet" className={labelClass}>From Wallet</label>
                  <select id="tx-from-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={selectClass}>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tx-to-wallet" className={labelClass}>To Wallet</label>
                  <select id="tx-to-wallet" value={targetWalletId} onChange={(e) => setTargetWalletId(e.target.value)} className={selectClass}>
                    {wallets.filter((w) => w.id !== walletId).map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${t.label}`}>Category</span>
                  {hasHiddenCategories && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories((v) => !v)}
                      aria-expanded={showAllCategories}
                      className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400"
                    >
                      {showAllCategories ? 'Show less' : 'Show all'}
                      {showAllCategories ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
                <div role="radiogroup" aria-label="Category" className={`grid grid-cols-4 sm:grid-cols-5 gap-2 p-2 border rounded-2xl ${t.well}`}>
                  {visibleCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        title={cat.name}
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex flex-col items-center justify-start gap-1 p-2 rounded-xl transition-all ${
                          isSelected ? t.tileSelected : t.tileIdle
                        }`}
                      >
                        <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                        <span className={`text-[10px] font-medium leading-tight text-center w-full line-clamp-2 break-words ${t.tileLabel}`}>
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wallet & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {txMode !== 'transfer' && (
                <div className="min-w-0">
                  <label htmlFor="tx-wallet" className={labelClass}>Wallet</label>
                  <select id="tx-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)} className={selectClass}>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} · {(w.computed_balance || 0).toLocaleString()} {w.currency}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={`min-w-0 ${txMode === 'transfer' ? 'sm:col-span-2' : ''}`}>
                <label htmlFor="tx-date" className={labelClass}>Date &amp; Time</label>
                <Input
                  id="tx-date"
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="tx-note" className={labelClass}>Note / Description</label>
              <div className="relative">
                <FileText size={14} className={`absolute left-3 top-3 pointer-events-none ${t.subtle}`} />
                <Input
                  id="tx-note"
                  type="text"
                  placeholder="e.g. Lunch with friends, groceries..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`${inputClass} !pl-9`}
                />
              </div>
            </div>

            {/* Hashtags */}
            {txMode !== 'transfer' && (
              <div>
                <label htmlFor="tx-hashtags" className={labelClass}>Hashtags</label>
                <div className="relative">
                  <Hash size={14} className={`absolute left-3 top-3 pointer-events-none ${t.subtle}`} />
                  <Input
                    id="tx-hashtags"
                    type="text"
                    placeholder="#food #travel #weekend"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    className={`${inputClass} !pl-9`}
                  />
                </div>
                {tags.length > 0 && (
                  <div data-testid="hashtag-chips" className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, i) => (
                      <span key={`${tag}-${i}`} className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${t.chip}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className={`shrink-0 px-5 py-3 sm:px-6 border-t space-y-3 ${t.bar}`}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="keepOpen"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className={`w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 ${t.check}`}
              />
              <label htmlFor="keepOpen" className={`text-xs font-medium cursor-pointer ${t.label}`}>
                Keep window open to add multiple transactions
              </label>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-11 rounded-2xl font-bold text-sm shadow-lg transition-all ${styles.button}`}
            >
              {isSubmitting ? 'Saving...' : editingTx ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
