import React from 'react';
import { Wallet, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import {
  FileText,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTransactionForm, sanitizeAmount } from '../hooks/useTransactionForm';

export interface TransactionFormFieldsProps {
  form: ReturnType<typeof useTransactionForm>;
  wallets: Wallet[];
  categories: Category[];
  isMobile?: boolean;
}

export const TransactionFormFields: React.FC<TransactionFormFieldsProps> = ({
  form,
  wallets,
  isMobile = false,
}) => {
  const {
    editingTx,
    txMode,
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
    visibleCategories,
    hasHiddenCategories,
    tags,
    styles,
    t,
  } = form;

  const selectClass = `w-full text-sm font-medium h-11 px-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate ${t.field}`;
  const inputClass = `h-11 text-sm ${t.field}`;
  const labelClass = `text-xs font-semibold block mb-1 ${t.label}`;

  return (
    <>
      {/* Amount Input */}
      <div className="text-center py-2">
        <label
          htmlFor="tx-amount"
          className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${t.label}`}
        >
          Amount (THB)
        </label>
        <div className="flex items-center justify-center gap-2">
          <span aria-hidden="true" className={`text-3xl sm:text-4xl font-bold font-mono ${styles.signColor}`}>
            {styles.sign}
          </span>
          <span aria-hidden="true" className={`text-2xl sm:text-3xl font-bold ${t.subtle}`}>
            ฿
          </span>
          <input
            id="tx-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(sanitizeAmount(e.target.value));
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
            }}
            className={`w-44 sm:w-56 text-center text-4xl sm:text-5xl font-extrabold font-mono bg-transparent border-b-2 focus:outline-none transition-colors ${
              errors.amount ? 'border-rose-500 text-rose-500' : `${t.amountText} ${styles.focus}`
            }`}
          />
        </div>
        {errors.amount && (
          <p role="alert" className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center justify-center gap-1">
            <AlertCircle size={13} />
            <span>{errors.amount}</span>
          </p>
        )}
      </div>

      {/* Mode-Specific Body: Transfer vs Expense/Income Category Grid */}
      {txMode === 'transfer' ? (
        <div className="space-y-2">
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl border ${t.well}`}>
            <div>
              <label htmlFor="tx-from-wallet" className={labelClass}>
                From Wallet
              </label>
              <select
                id="tx-from-wallet"
                value={walletId}
                onChange={(e) => {
                  setWalletId(e.target.value);
                  if (errors.wallet || errors.targetWallet) {
                    setErrors((prev) => ({ ...prev, wallet: '', targetWallet: '' }));
                  }
                }}
                className={selectClass}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tx-to-wallet" className={labelClass}>
                To Wallet
              </label>
              <select
                id="tx-to-wallet"
                value={targetWalletId}
                onChange={(e) => {
                  setTargetWalletId(e.target.value);
                  if (errors.targetWallet) {
                    setErrors((prev) => ({ ...prev, targetWallet: '' }));
                  }
                }}
                className={selectClass}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.targetWallet && (
            <p role="alert" className="text-xs text-rose-500 font-semibold flex items-center gap-1 px-1">
              <AlertCircle size={13} />
              <span>{errors.targetWallet}</span>
            </p>
          )}
          {errors.transfer && (
            <p role="alert" className="text-xs text-rose-500 font-semibold flex items-center gap-1 px-1">
              <AlertCircle size={13} />
              <span>{errors.transfer}</span>
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${t.label}`}>
              Category
            </span>
            {hasHiddenCategories && (
              <button
                type="button"
                onClick={() => setShowAllCategories((v) => !v)}
                aria-expanded={showAllCategories}
                className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500 hover:text-emerald-400 p-1"
              >
                {showAllCategories ? 'Show less' : 'Show all'}
                {showAllCategories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
          <div
            role="radiogroup"
            aria-label="Category"
            className={`grid grid-cols-4 sm:grid-cols-5 gap-2 p-2.5 border rounded-2xl ${t.well}`}
          >
            {visibleCategories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  title={cat.name}
                  onClick={() => {
                    setCategoryId(cat.id);
                    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                  }}
                  className={`flex flex-col items-center justify-start gap-1 p-2 sm:p-2.5 rounded-xl transition-all ${
                    isSelected ? t.tileSelected : t.tileIdle
                  }`}
                >
                  <CategoryIcon name={cat.icon} color={cat.color} size={isMobile ? 22 : 18} />
                  <span
                    className={`text-[11px] font-medium leading-tight text-center w-full line-clamp-2 break-words ${t.tileLabel}`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p role="alert" className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1 px-1">
              <AlertCircle size={13} />
              <span>{errors.category}</span>
            </p>
          )}
        </div>
      )}

      {/* Wallet & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {txMode !== 'transfer' && (
          <div className="min-w-0">
            <label htmlFor="tx-wallet" className={labelClass}>
              Wallet
            </label>
            <select
              id="tx-wallet"
              value={walletId}
              onChange={(e) => {
                setWalletId(e.target.value);
                if (errors.wallet) setErrors((prev) => ({ ...prev, wallet: '' }));
              }}
              className={selectClass}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {(w.computed_balance || 0).toLocaleString()} {w.currency}
                </option>
              ))}
            </select>
            {errors.wallet && (
              <p role="alert" className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>{errors.wallet}</span>
              </p>
            )}
          </div>
        )}
        <div className={`min-w-0 ${txMode === 'transfer' ? 'sm:col-span-2' : ''}`}>
          <label htmlFor="tx-date" className={labelClass}>
            Date &amp; Time
          </label>
          <Input
            id="tx-date"
            type="datetime-local"
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
            }}
            className={`${inputClass} ${errors.date ? 'border-rose-500 focus:ring-rose-500' : ''}`}
          />
          {errors.date && (
            <p role="alert" className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle size={13} />
              <span>{errors.date}</span>
            </p>
          )}
        </div>
      </div>

      {/* Note / Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="tx-note" className={labelClass}>
            Note / Description
          </label>
          {note.length > 200 && (
            <span className={`text-[10px] font-mono ${note.length > 255 ? 'text-rose-500 font-bold' : t.subtle}`}>
              {note.length}/255
            </span>
          )}
        </div>
        <div className="relative">
          <FileText size={15} className={`absolute left-3 top-3.5 pointer-events-none ${t.subtle}`} />
          <Input
            id="tx-note"
            type="text"
            placeholder="e.g. Lunch with friends, groceries..."
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (errors.note) setErrors((prev) => ({ ...prev, note: '' }));
            }}
            className={`${inputClass} !pl-9 ${errors.note ? 'border-rose-500 focus:ring-rose-500' : ''}`}
          />
        </div>
        {errors.note && (
          <p role="alert" className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
            <AlertCircle size={13} />
            <span>{errors.note}</span>
          </p>
        )}
      </div>

      {/* Hashtags */}
      {txMode !== 'transfer' && (
        <div>
          <label htmlFor="tx-hashtags" className={labelClass}>
            Hashtags
          </label>
          <div className="relative">
            <Hash size={15} className={`absolute left-3 top-3.5 pointer-events-none ${t.subtle}`} />
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
                <span
                  key={`${tag}-${i}`}
                  className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${t.chip}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkbox: Keep window open */}
      <div className="flex items-center gap-2 pt-1">
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

      {/* Save Button for Desktop (inside form flow) */}
      {!isMobile && (
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-11 rounded-2xl font-bold text-sm shadow-lg transition-all ${styles.button}`}
          >
            {isSubmitting ? 'Saving...' : editingTx ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </div>
      )}
    </>
  );
};

