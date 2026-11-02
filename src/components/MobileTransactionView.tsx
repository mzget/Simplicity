import React, { useEffect, useRef } from 'react';
import { Wallet, Category } from '../types';
import { ArrowLeft, Sparkles, TrendingDown, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useTransactionForm, TxMode, MODE_STYLES } from '../hooks/useTransactionForm';
import { TransactionFormFields } from './TransactionFormFields';

export interface MobileTransactionViewProps {
  form: ReturnType<typeof useTransactionForm>;
  wallets: Wallet[];
  categories: Category[];
}

export const MobileTransactionView: React.FC<MobileTransactionViewProps> = ({
  form,
  wallets,
  categories,
}) => {
  const {
    editingTx,
    txMode,
    setTxMode,
    setCategoryId,
    setShowAllCategories,
    setErrors,
    closeForm,
    openAiScan,
    handleSubmit,
    isSubmitting,
    styles,
    t,
  } = form;

  const didPushStateRef = useRef(false);

  // In-App History Integration (Option A):
  // Intercept phone back button and swipe-to-back to smoothly close this view
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Push dummy history entry
    window.history.pushState({ simplicityView: 'mobile-tx' }, '');
    didPushStateRef.current = true;

    const handlePopState = () => {
      didPushStateRef.current = false;
      closeForm();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up browser history entry if closing via button/submit instead of back button
      if (didPushStateRef.current && window.history.state?.simplicityView === 'mobile-tx') {
        window.history.back();
      }
    };
  }, [closeForm]);

  const modes: {
    key: TxMode;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { key: 'expense', label: 'Expense', icon: TrendingDown },
    { key: 'income', label: 'Income', icon: TrendingUp },
    { key: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  ];

  return (
    <div
      role="region"
      aria-label="Transaction Editor"
      data-testid="mobile-transaction-view"
      className={`simplicity-scope fixed inset-0 z-[10000] flex flex-col font-sans overflow-hidden ${t.surface}`}
    >
      {/* 1. Mobile Top Navigation Bar */}
      <header
        className={`shrink-0 h-14 px-3 border-b flex items-center justify-between gap-2 shadow-sm ${t.bar}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeForm}
            className="h-10 w-10 shrink-0 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </Button>
          <h1 className="text-base font-bold truncate">
            {editingTx ? 'Edit Transaction' : 'New Transaction'}
          </h1>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={openAiScan}
          className="h-10 w-10 shrink-0 rounded-full text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
          title="Scan Receipt with AI"
          aria-label="Scan Receipt with AI"
        >
          <Sparkles size={20} />
        </Button>
      </header>

      {/* 2. Mode Segmented Switcher (Sticky below header) */}
      <div className={`shrink-0 px-4 py-2.5 border-b ${t.bar}`}>
        <div
          role="tablist"
          aria-label="Transaction type"
          className={`flex items-center gap-1.5 p-1 rounded-xl border ${t.segment}`}
        >
          {modes.map(({ key, label, icon: Icon }) => {
            const isActive = txMode === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setTxMode(key);
                  if (key !== 'transfer') setCategoryId('');
                  setShowAllCategories(false);
                  setErrors((prev) => ({
                    ...prev,
                    transfer: '',
                    targetWallet: '',
                    category: '',
                  }));
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? MODE_STYLES[key].tabActive
                    : `${t.segmentIdle} hover:bg-black/5 dark:hover:bg-white/5`
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Scrollable Form Content */}
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col justify-between"
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <TransactionFormFields
            form={form}
            wallets={wallets}
            categories={categories}
            isMobile={true}
          />
        </div>

        {/* 4. Fixed Sticky Bottom Action Bar */}
        <div
          className={`shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,16px))] border-t shadow-lg ${t.bar}`}
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-12 rounded-2xl font-bold text-base shadow-xl transition-all ${styles.button}`}
          >
            {isSubmitting ? 'Saving...' : editingTx ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
};

