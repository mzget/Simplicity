import React, { useState } from 'react';
import { Budget, Category } from '../types';
import { Plus, PiggyBank, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  onCreateBudget: (data: any) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  currency?: string;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  onCreateBudget,
  onDeleteBudget,
  currency = 'THB',
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.currentSpent || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setIsSubmitting(true);
    try {
      await onCreateBudget({
        name,
        amount: Number(amount),
        category_ids: selectedCats,
        period: 'month',
        currency,
      });
      setIsCreating(false);
      setName('');
      setAmount('');
      setSelectedCats([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (catId: string) => {
    if (selectedCats.includes(catId)) {
      setSelectedCats(selectedCats.filter((id) => id !== catId));
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-simplicity-border shadow-simplicity">
          <span className="text-xs font-bold uppercase tracking-wider text-simplicity-muted">Total Budgeted</span>
          <div className="text-2xl font-bold font-mono text-simplicity-text mt-1">
            {totalBudgeted.toLocaleString()} {currency}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-simplicity-border shadow-simplicity">
          <span className="text-xs font-bold uppercase tracking-wider text-simplicity-muted">Total Spent This Month</span>
          <div className="text-2xl font-bold font-mono text-simplicity-red mt-1">
            {totalSpent.toLocaleString()} {currency}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-simplicity-border shadow-simplicity">
          <span className="text-xs font-bold uppercase tracking-wider text-simplicity-muted">Remaining Safe to Spend</span>
          <div className="text-2xl font-bold font-mono text-simplicity-teal mt-1">
            {Math.max(0, totalBudgeted - totalSpent).toLocaleString()} {currency}
          </div>
        </div>
      </div>

      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-simplicity-text flex items-center gap-2">
          <PiggyBank size={20} className="text-simplicity-teal" />
          Active Budgets
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-simplicity-teal hover:bg-simplicity-teal-hover text-white text-xs font-bold shadow-md shadow-simplicity-teal/20 transition-all"
        >
          <Plus size={15} /> Create Budget
        </button>
      </div>

      {/* Create Budget Inline Modal */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white rounded-3xl p-6 border border-simplicity-teal shadow-simplicity-hover space-y-4 animate-in fade-in">
          <h4 className="text-sm font-bold text-simplicity-text">New Monthly Budget Limit</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-simplicity-muted block mb-1">Budget Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Dining & Restaurants, Groceries"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-simplicity-border text-simplicity-text"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-simplicity-muted block mb-1">Monthly Limit ({currency})</label>
              <input
                type="number"
                required
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs font-mono font-semibold p-2.5 rounded-xl border border-simplicity-border text-simplicity-text"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-simplicity-muted block mb-1.5">
              Select Categories Included (Leave empty for All categories)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-simplicity-canvas rounded-xl border border-simplicity-border">
              {categories.filter((c) => c.type === 'expense').map((cat) => {
                const isSelected = selectedCats.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-simplicity-teal text-white shadow-xs'
                        : 'bg-white text-simplicity-muted hover:text-simplicity-text border border-simplicity-border'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-simplicity-muted hover:bg-simplicity-canvas"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-simplicity-teal text-white text-xs font-bold hover:bg-simplicity-teal-hover shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      )}

      {/* Budgets List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const spent = b.currentSpent || 0;
          const limit = b.amount || 1;
          const pct = Math.min(100, Math.round((spent / limit) * 100));
          const isOver = spent > limit;
          const isWarning = pct >= 80 && !isOver;

          const barColor = isOver ? '#F55353' : isWarning ? '#FFAA2C' : '#12C48B';

          return (
            <div key={b.id} className="bg-white rounded-2xl p-5 border border-simplicity-border/80 shadow-simplicity flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-simplicity-text">{b.name}</span>
                    {isOver ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-simplicity-red bg-simplicity-red/10 px-2 py-0.5 rounded-full">
                        <AlertCircle size={11} /> Over Budget
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-simplicity-teal bg-simplicity-teal/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> On Track
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this budget?')) onDeleteBudget(b.id);
                    }}
                    className="text-slate-300 hover:text-simplicity-red transition-colors p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="flex items-baseline justify-between mt-3 mb-1.5">
                  <span className="text-xl font-bold font-mono text-simplicity-text">
                    {spent.toLocaleString()} <span className="text-xs font-sans text-simplicity-muted">spent</span>
                  </span>
                  <span className="text-xs font-semibold text-simplicity-muted">
                    Limit: {limit.toLocaleString()} {currency}
                  </span>
                </div>

                {/* Progress Meter */}
                <div className="w-full h-2.5 rounded-full bg-simplicity-canvas overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-simplicity-muted mt-4 pt-3 border-t border-slate-100">
                <span>{pct}% of monthly limit used</span>
                <span className="font-semibold text-simplicity-text">
                  {Math.max(0, limit - spent).toLocaleString()} {currency} left
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


