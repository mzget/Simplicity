import React from 'react';
import { Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { useFinanceStore } from '../store/useFinanceStore';
import { Trash2, ArrowRightLeft, Image as ImageIcon } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

interface TransactionsListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  currency?: string;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  onDelete,
  currency = 'THB',
}) => {
  const { setEditingTx, usdThbRate } = useFinanceStore();
  const rate = usdThbRate > 0 ? usdThbRate : 36.5;

  const toThb = (amount: number, txCurrency?: string) => {
    return txCurrency === 'USD' ? amount * rate : amount;
  };

  // Group transactions by date (YYYY-MM-DD)
  const grouped = transactions.reduce<Record<string, { txs: Transaction[]; dailySum: number }>>(
    (acc, tx) => {
      const dateKey = tx.start_date.slice(0, 10);
      if (!acc[dateKey]) {
        acc[dateKey] = { txs: [], dailySum: 0 };
      }
      acc[dateKey].txs.push(tx);
      acc[dateKey].dailySum += toThb(Number(tx.amount), tx.currency || tx.wallet_currency);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return `Today — ${format(date, 'EEE, MMM dd')}`;
      if (isYesterday(date)) return `Yesterday — ${format(date, 'EEE, MMM dd')}`;
      return format(date, 'EEEE — MMM dd, yyyy');
    } catch (_) {
      return dateStr;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-simplicity-border/80 text-center shadow-simplicity">
        <div className="w-12 h-12 rounded-full bg-simplicity-canvas mx-auto flex items-center justify-center text-simplicity-muted mb-3">
          <ArrowRightLeft size={22} />
        </div>
        <h3 className="text-base font-bold text-simplicity-text">No transactions found</h3>
        <p className="text-xs text-simplicity-muted mt-1 max-w-sm mx-auto">
          No records match your current wallet, date range, or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((dateKey) => {
        const { txs, dailySum } = grouped[dateKey];
        const isSumPositive = dailySum >= 0;

        return (
          <div key={dateKey} className="bg-white rounded-2xl border border-simplicity-border/80 shadow-simplicity overflow-hidden">
            {/* Group Header */}
            <div className="px-5 py-3 bg-simplicity-canvas/60 border-b border-simplicity-border/60 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-simplicity-muted">
                {formatDateHeader(dateKey)}
              </span>
              <span className={`text-xs font-bold font-mono ${
                isSumPositive ? 'text-simplicity-teal' : 'text-simplicity-red'
              }`}>
                {isSumPositive ? '+' : ''}{dailySum.toLocaleString()} {currency}
              </span>
            </div>

            {/* Transaction Items */}
            <div className="divide-y divide-slate-100">
              {txs.map((tx) => {
                const amt = Number(tx.amount);
                const isExpense = amt < 0;
                const isTransfer = tx.type === 'TRANSFER';
                const hashtags: string[] = typeof tx.hashtags === 'string'
                  ? JSON.parse(tx.hashtags || '[]')
                  : tx.hashtags || [];

                return (
                  <div
                    key={tx.id}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-simplicity-canvas/50 transition-colors group cursor-pointer"
                    onClick={() => setEditingTx(tx)}
                  >
                    {/* Left: Category Icon & Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <CategoryIcon
                        name={isTransfer ? 'ArrowRightLeft' : tx.category_icon || 'Tag'}
                        color={isTransfer ? '#38A3F1' : tx.category_color || '#6B7F8E'}
                        size={16}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-simplicity-text truncate">
                            {tx.note || tx.category_name || 'Transaction'}
                          </span>
                          {tx.image_url && (
                            <span title="Has receipt image">
                              <ImageIcon size={13} className="text-simplicity-muted shrink-0" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-medium text-simplicity-muted">
                            {tx.category_name}
                          </span>
                          <span className="text-[10px] text-simplicity-muted font-mono">•</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-simplicity-text font-medium">
                            {tx.wallet_name}
                          </span>
                          {hashtags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium text-simplicity-blue hover:underline"
                            >
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Quick Actions */}
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right">
                        <span className={`text-base font-bold font-mono tracking-tight block ${
                          isTransfer
                            ? 'text-simplicity-blue'
                            : isExpense
                            ? 'text-simplicity-red'
                            : 'text-simplicity-teal dark:text-emerald-400'
                        }`}>
                          {amt > 0 ? '+' : ''}{amt.toLocaleString()} {tx.currency || currency}
                        </span>
                        {(tx.currency === 'USD' || tx.foreign_currency === 'USD') && (
                          <span className="text-[11px] font-mono text-simplicity-muted block">
                            ~{Math.round(amt * rate).toLocaleString()} THB
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this transaction?')) {
                            onDelete(tx.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-simplicity-red hover:bg-simplicity-red/10 transition-all"
                        title="Delete transaction"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};


