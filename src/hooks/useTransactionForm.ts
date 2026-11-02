import { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, Category } from '../types';
import { format, parseISO, isValid } from 'date-fns';
import { parseHashtags } from '../lib/parseHashtags';

export type TxMode = 'expense' | 'income' | 'transfer';

export const COLLAPSED_CATEGORY_COUNT = 8;

export const MODE_STYLES: Record<
  TxMode,
  { sign: string; signColor: string; tabActive: string; button: string; focus: string }
> = {
  expense: {
    sign: '-',
    signColor: 'text-rose-500',
    tabActive: '!bg-rose-500 !text-white shadow-md shadow-rose-500/25 font-bold',
    button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20',
    focus: 'focus:border-rose-500',
  },
  income: {
    sign: '+',
    signColor: 'text-emerald-500',
    tabActive: '!bg-emerald-500 !text-white shadow-md shadow-emerald-500/25 font-bold',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20',
    focus: 'focus:border-emerald-500',
  },
  transfer: {
    sign: '⇄',
    signColor: 'text-sky-500',
    tabActive: '!bg-sky-500 !text-white shadow-md shadow-sky-500/25 font-bold',
    button: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20',
    focus: 'focus:border-sky-500',
  },
};

export const THEME_STYLES = {
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
export const sanitizeAmount = (raw: string): string => {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const [intPart, ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${intPart}.${rest.join('')}` : intPart;
};

export interface UseTransactionFormProps {
  wallets: Wallet[];
  categories: Category[];
  onSave: (data: any) => Promise<void>;
  onTransfer: (data: any) => Promise<void>;
  onClose?: () => void;
}

export function useTransactionForm({
  wallets,
  categories,
  onSave,
  onTransfer,
  onClose,
}: UseTransactionFormProps) {
  const {
    isAddTxOpen,
    setIsAddTxOpen,
    editingTx,
    setEditingTx,
    selectedWalletId,
    setIsAiScanOpen,
    theme,
  } = useFinanceStore();

  const [txMode, setTxMode] = useState<TxMode>('expense');
  const [amount, setAmount] = useState<string>('');
  const [walletId, setWalletId] = useState<string>(
    selectedWalletId !== 'all' ? selectedWalletId : wallets[0]?.id || ''
  );
  const [targetWalletId, setTargetWalletId] = useState<string>(
    wallets[1]?.id || wallets[0]?.id || ''
  );
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState<string>('');
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [keepOpen, setKeepOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lastLoadedTxIdRef = useRef<string | null>(null);

  // Sync state when editing an existing transaction
  useEffect(() => {
    if (editingTx) {
      if (lastLoadedTxIdRef.current !== editingTx.id) {
        lastLoadedTxIdRef.current = editingTx.id;
        const isExp = Number(editingTx.amount) < 0;
        setTxMode(editingTx.type === 'TRANSFER' ? 'transfer' : isExp ? 'expense' : 'income');
        setAmount(Math.abs(Number(editingTx.amount)).toString());
        setWalletId(editingTx.wallet_id);
        setCategoryId(editingTx.category_id);
        setDate(
          editingTx.start_date
            ? editingTx.start_date.slice(0, 16)
            : format(new Date(), "yyyy-MM-dd'T'HH:mm")
        );
        setNote(editingTx.note || '');
        const tags =
          typeof editingTx.hashtags === 'string'
            ? JSON.parse(editingTx.hashtags || '[]')
            : editingTx.hashtags || [];
        setHashtagInput(tags.join(' '));
        setErrors({});
      }
    } else {
      lastLoadedTxIdRef.current = null;
      // Set default category for create mode if not set
      const filtered = categories.filter((c) => c.type === (txMode === 'income' ? 'income' : 'expense'));
      if (filtered.length > 0 && !categoryId) {
        setCategoryId(filtered[0].id);
      }
    }
  }, [editingTx, categories, txMode, categoryId]);

  const closeForm = () => {
    setIsAddTxOpen(false);
    setEditingTx(null);
    setErrors({});
    onClose?.();
  };

  const currentCategories = categories.filter(
    (c) => c.type === (txMode === 'income' ? 'income' : 'expense')
  );
  const visibleCategories = showAllCategories
    ? currentCategories
    : currentCategories.slice(0, COLLAPSED_CATEGORY_COUNT);
  const hasHiddenCategories = currentCategories.length > COLLAPSED_CATEGORY_COUNT;
  const tags = parseHashtags(hashtagInput);
  const styles = MODE_STYLES[txMode];
  const t = THEME_STYLES[theme === 'light' ? 'light' : 'dark'];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newErrors: Record<string, string> = {};
    const numAmount = Number(amount);

    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Please enter an amount';
    } else if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (numAmount > 999999999) {
      newErrors.amount = 'Amount cannot exceed 999,999,999';
    }

    if (!walletId) {
      newErrors.wallet = 'Please select a wallet';
    }

    if (txMode === 'transfer') {
      if (wallets.length < 2) {
        newErrors.transfer = 'At least 2 wallets are required to make a transfer';
      } else if (walletId === targetWalletId) {
        newErrors.targetWallet = 'Source and destination wallets must be different';
      }
    } else {
      const activeCats = categories.filter(
        (c) => c.type === (txMode === 'income' ? 'income' : 'expense')
      );
      if (!categoryId && activeCats.length === 0) {
        newErrors.category = 'No category available. Please create one first.';
      }
    }

    if (!date || date.trim() === '') {
      newErrors.date = 'Date and time is required';
    } else {
      const parsedDate = parseISO(date);
      if (!isValid(parsedDate)) {
        newErrors.date = 'Invalid date and time';
      }
    }

    if (note && note.length > 255) {
      newErrors.note = 'Note cannot exceed 255 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    setErrors({});

    setIsSubmitting(true);
    try {
      if (txMode === 'transfer') {
        await onTransfer({
          id: editingTx?.id,
          fromWalletId: walletId,
          toWalletId: targetWalletId,
          amount: numAmount,
          date,
          startDate: date,
          start_date: date,
          note: note.trim(),
        });
      } else {
        const parsedAmount = txMode === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

        await onSave({
          id: editingTx?.id,
          walletId,
          categoryId: categoryId || currentCategories[0]?.id || 'cat_food',
          type: 'REGULAR',
          amount: parsedAmount,
          currency: 'THB',
          startDate: date,
          start_date: date,
          note: note.trim(),
          hashtags: tags,
        });
      }

      if (!keepOpen) {
        closeForm();
      } else {
        setAmount('');
        setNote('');
        setHashtagInput('');
        setErrors({});
      }
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isAddTxOpen,
    setIsAddTxOpen,
    editingTx,
    theme,
    txMode,
    setTxMode,
    amount,
    setAmount,
    walletId,
    setWalletId,
    targetWalletId,
    setTargetWalletId,
    categoryId,
    setCategoryId,
    date,
    setDate,
    note,
    setNote,
    hashtagInput,
    setHashtagInput,
    keepOpen,
    setKeepOpen,
    isSubmitting,
    showAllCategories,
    setShowAllCategories,
    errors,
    setErrors,
    closeForm,
    currentCategories,
    visibleCategories,
    hasHiddenCategories,
    tags,
    styles,
    t,
    handleSubmit,
    openAiScan: () => {
      closeForm();
      setIsAiScanOpen(true);
    },
  };
}

