import { useState, useEffect, useRef, useCallback } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, Category } from '../types';
import { format, parseISO, isValid } from 'date-fns';
import { parseHashtags } from '../lib/parseHashtags';

export type TxMode = 'expense' | 'income' | 'transfer';

export const COLLAPSED_CATEGORY_COUNT = 8;

export const MODE_STYLES: Record<
  TxMode,
  { sign: string; signColor: string; tabActive: string; button: string; focus: string; ring: string }
> = {
  expense: {
    sign: '-',
    signColor: 'text-rose-500',
    tabActive: '!bg-rose-500 !text-white shadow-md shadow-rose-500/25 font-bold',
    button: '!bg-rose-500 hover:!bg-rose-600 !text-white shadow-lg shadow-rose-500/25',
    focus: 'focus:border-rose-500',
    ring: 'ring-rose-500',
  },
  income: {
    sign: '+',
    signColor: 'text-emerald-500',
    tabActive: '!bg-emerald-500 !text-white shadow-md shadow-emerald-500/25 font-bold',
    button: '!bg-emerald-500 hover:!bg-emerald-600 !text-white shadow-lg shadow-emerald-500/25',
    focus: 'focus:border-emerald-500',
    ring: 'ring-emerald-500',
  },
  transfer: {
    sign: '⇄',
    signColor: 'text-sky-500',
    tabActive: '!bg-sky-500 !text-white shadow-md shadow-sky-500/25 font-bold',
    button: '!bg-sky-500 hover:!bg-sky-600 !text-white shadow-lg shadow-sky-500/25',
    focus: 'focus:border-sky-500',
    ring: 'ring-sky-500',
  },
};

export const THEME_STYLES = {
  dark: {
    surface: 'border-slate-800 bg-[#0b0f17] text-slate-100',
    bar: 'bg-[#0f172a] border-slate-800',
    segment: 'bg-slate-900 border-slate-800',
    segmentIdle: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
    label: 'text-slate-300 font-semibold',
    field: 'bg-slate-900 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
    well: 'bg-slate-900/60 border-slate-800',
    amountText: 'text-slate-100 border-slate-700 placeholder:text-slate-600',
    tileIdle: 'text-slate-300 hover:bg-slate-800/80 border border-transparent',
    tileSelected: 'bg-slate-800/90 shadow-md ring-2 border border-slate-700/80',
    tileLabel: 'text-slate-200',
    subtle: 'text-slate-400',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    check: 'border-slate-700 bg-slate-900',
  },
  light: {
    surface: 'border-slate-200 bg-white text-slate-900',
    bar: 'bg-slate-50 border-slate-200',
    segment: 'bg-slate-100 border-slate-200',
    segmentIdle: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60',
    label: 'text-slate-700 font-semibold',
    field: 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
    well: 'bg-slate-50 border-slate-200',
    amountText: 'text-slate-900 border-slate-300 placeholder:text-slate-300',
    tileIdle: 'text-slate-600 hover:bg-slate-100 border border-transparent',
    tileSelected: 'bg-white shadow-md ring-2 border border-slate-200',
    tileLabel: 'text-slate-700',
    subtle: 'text-slate-500',
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
  onDelete?: (id: string) => Promise<void>;
  onClose?: () => void;
}

export function useTransactionForm({
  wallets,
  categories,
  onSave,
  onTransfer,
  onDelete,
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
    deleteTransaction: storeDeleteTransaction,
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
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSubmittingRef = useRef(false);
  const deleteConfirmTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadedTxIdRef = useRef<string | null>(null);

  const cancelDelete = useCallback(() => {
    if (deleteConfirmTimerRef.current) {
      clearTimeout(deleteConfirmTimerRef.current);
      deleteConfirmTimerRef.current = null;
    }
    setIsConfirmingDelete(false);
  }, []);

  const resetFormFields = useCallback(() => {
    setAmount('');
    setNote('');
    setHashtagInput('');
    setErrors({});
    setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    cancelDelete();
  }, [cancelDelete]);

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
        cancelDelete();
      }
    } else {
      if (lastLoadedTxIdRef.current !== null) {
        lastLoadedTxIdRef.current = null;
        resetFormFields();
      }
      // Set default category for create mode if not set
      const filtered = categories.filter((c) => c.type === (txMode === 'income' ? 'income' : 'expense'));
      if (filtered.length > 0 && !categoryId) {
        setCategoryId(filtered[0].id);
      }
    }
  }, [editingTx, categories, txMode, categoryId, resetFormFields, cancelDelete]);

  useEffect(() => {
    return () => {
      if (deleteConfirmTimerRef.current) {
        clearTimeout(deleteConfirmTimerRef.current);
      }
    };
  }, []);

  const closeForm = useCallback(() => {
    setIsAddTxOpen(false);
    setEditingTx(null);
    resetFormFields();
    onClose?.();
  }, [setIsAddTxOpen, setEditingTx, resetFormFields, onClose]);

  const deleteTxAction = onDelete || storeDeleteTransaction;

  const handleDelete = useCallback(async () => {
    if (!editingTx?.id || isDeleting) return;

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      if (deleteConfirmTimerRef.current) clearTimeout(deleteConfirmTimerRef.current);
      deleteConfirmTimerRef.current = setTimeout(() => {
        setIsConfirmingDelete(false);
      }, 4000);
      return;
    }

    // Step 2: Confirmed!
    if (deleteConfirmTimerRef.current) {
      clearTimeout(deleteConfirmTimerRef.current);
      deleteConfirmTimerRef.current = null;
    }

    setIsDeleting(true);
    try {
      await deleteTxAction(editingTx.id);
      closeForm();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setErrors((prev) => ({ ...prev, submit: 'Failed to delete transaction' }));
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  }, [editingTx, isDeleting, isConfirmingDelete, deleteTxAction, closeForm]);

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
    if (isSubmittingRef.current || isSubmitting) return false;

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

    isSubmittingRef.current = true;
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
        resetFormFields();
      }
      return true;
    } finally {
      isSubmittingRef.current = false;
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
    isDeleting,
    isConfirmingDelete,
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
    handleDelete,
    cancelDelete,
    resetFormFields,
    openAiScan: () => {
      closeForm();
      setIsAiScanOpen(true);
    },
  };
}

