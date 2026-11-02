import React from 'react';
import { Wallet, Category } from '../types';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useIsMobile } from '../hooks/useMediaQuery';
import {
  useTransactionForm,
  TxMode,
  MODE_STYLES,
} from '../hooks/useTransactionForm';
import { TransactionFormFields } from './TransactionFormFields';
import { MobileTransactionView } from './MobileTransactionView';

export interface AddTransactionModalProps {
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
  const isMobile = useIsMobile();
  const form = useTransactionForm({
    wallets,
    categories,
    onSave,
    onTransfer,
  });

  const {
    isAddTxOpen,
    setIsAddTxOpen,
    editingTx,
    theme,
    txMode,
    setTxMode,
    setCategoryId,
    setShowAllCategories,
    setErrors,
    openAiScan,
    handleSubmit,
    t,
  } = form;

  if (!isAddTxOpen) {
    return null;
  }

  // Mobile Layout: Full-Screen Native View (No Dialog, No FocusTrap collision)
  if (isMobile) {
    return (
      <MobileTransactionView
        form={form}
        wallets={wallets}
        categories={categories}
      />
    );
  }

  const modes: {
    key: TxMode;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { key: 'expense', label: 'Expense', icon: TrendingDown },
    { key: 'income', label: 'Income', icon: TrendingUp },
    { key: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
  ];

  // Desktop Layout: Centered Radix Modal Dialog
  return (
    <Dialog open={isAddTxOpen} onOpenChange={setIsAddTxOpen}>
      <DialogContent
        scheme={theme === 'light' ? 'light' : 'dark'}
        data-testid="add-transaction-modal"
        aria-describedby={undefined}
        className={`${t.surface} flex flex-col gap-0 p-0 overflow-hidden shadow-2xl backdrop-blur-2xl
          inset-auto left-[50%] top-[50%] max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-3xl`}
      >
        <DialogTitle className="sr-only">
          {editingTx ? 'Edit Transaction' : 'Add Transaction'}
        </DialogTitle>

        {/* Sticky header: mode tabs + AI scan */}
        <div className={`shrink-0 py-3 pl-4 pr-14 border-b flex items-center gap-2 ${t.bar}`}>
          <div
            role="tablist"
            aria-label="Transaction type"
            className={`flex flex-1 items-center gap-1.5 p-1 rounded-xl border ${t.segment}`}
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
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all ${
                    isActive
                      ? MODE_STYLES[key].tabActive
                      : `${t.segmentIdle} font-semibold hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openAiScan}
            className="h-9 w-9 shrink-0 text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
            title="Scan Receipt with AI"
            aria-label="Scan Receipt with AI"
          >
            <Sparkles size={16} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
            <TransactionFormFields
              form={form}
              wallets={wallets}
              categories={categories}
              isMobile={false}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
