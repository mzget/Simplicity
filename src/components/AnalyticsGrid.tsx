import React from 'react';
import { DashboardStats } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface AnalyticsGridProps {
  stats: DashboardStats;
  currency?: string;
}

export const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({ stats, currency = 'THB' }) => {
  const { categoryBreakdown, cashFlowSeries, periodExpense } = stats;

  // Format date for Bar chart XAxis (e.g. "Oct 29")
  const formattedBarData = cashFlowSeries.map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // "10-29"
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
      {/* 1. Cash Flow History Bar Chart (7 Cols) */}
      <div className="lg:col-span-7 bg-card/90 dark:bg-slate-900/60 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-border/80 dark:border-white/10 shadow-simplicity simplicity-glass-card backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-simplicity-teal/10 flex items-center justify-center text-simplicity-teal">
              <BarChart3 size={16} />
            </div>
            <h3 className="text-sm font-bold text-simplicity-text dark:text-slate-100">Cash Flow Dynamics</h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-simplicity-teal">
              <span className="w-2.5 h-2.5 rounded-full bg-simplicity-teal" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-simplicity-red">
              <span className="w-2.5 h-2.5 rounded-full bg-simplicity-red" /> Expense
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {formattedBarData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-11 h-11 rounded-2xl bg-secondary/50 dark:bg-slate-800/60 border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground mb-2.5 shadow-inner">
                <BarChart3 size={20} className="text-emerald-500 opacity-80" />
              </div>
              <p className="text-xs font-semibold text-foreground">No cash flow activity in this period</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                Transactions recorded within the selected date range will appear here.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 11, fill: '#6B7F8E' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6B7F8E' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  cursor={{ fill: '#F4F7FA' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/10 text-xs text-slate-100">
                          <div className="font-bold text-simplicity-text mb-1.5">{data.date}</div>
                          <div className="text-simplicity-teal font-semibold">
                            Income: +{data.income.toLocaleString()} {currency}
                          </div>
                          <div className="text-simplicity-red font-semibold">
                            Expense: -{data.expense.toLocaleString()} {currency}
                          </div>
                          <div className="text-simplicity-muted mt-1 border-t border-slate-100 pt-1 font-mono">
                            Net: {data.net >= 0 ? '+' : ''}{data.net.toLocaleString()} {currency}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" fill="#12C48B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill="#F55353" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Expense Category Breakdown Donut & Ranked List (5 Cols) */}
      <div className="lg:col-span-5 bg-card/90 dark:bg-slate-900/60 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-border/80 dark:border-white/10 shadow-simplicity simplicity-glass-card backdrop-blur-xl flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-simplicity-red/10 flex items-center justify-center text-simplicity-red">
              <PieChartIcon size={16} />
            </div>
            <h3 className="text-sm font-bold text-simplicity-text dark:text-slate-100">Expenses by Category</h3>
          </div>
          <span className="text-xs font-bold text-simplicity-muted">
            {categoryBreakdown.length} Categories
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-10">
            <div className="w-11 h-11 rounded-2xl bg-secondary/50 dark:bg-slate-800/60 border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground mb-2.5 shadow-inner">
              <PieChartIcon size={20} className="text-red-400 opacity-80" />
            </div>
            <p className="text-xs font-semibold text-foreground">No expenses recorded for this period</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
              Categorized outflows will be summarized in a visual breakdown.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Donut Chart with Center Total */}
            <div className="relative h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const pct = periodExpense > 0 ? Math.round((data.total / periodExpense) * 100) : 0;
                        return (
                          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-white/10 text-xs text-slate-100">
                            <span className="font-bold" style={{ color: data.color }}>{data.name}</span>
                            <div className="font-mono font-bold mt-0.5">
                              {data.total.toLocaleString()} {currency} ({pct}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Hole Total Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-simplicity-muted uppercase tracking-wider">Total</span>
                <span className="text-sm font-bold font-mono text-simplicity-text">
                  {(periodExpense / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {/* Ranked Category List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {categoryBreakdown.map((cat) => {
                const percent = periodExpense > 0 ? Math.round((cat.total / periodExpense) * 100) : 0;
                return (
                  <div key={cat.id} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <CategoryIcon name={cat.icon} color={cat.color} size={13} />
                        <span className="font-semibold text-simplicity-text">{cat.name}</span>
                        <span className="text-[10px] text-simplicity-muted">({cat.count} tx)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-simplicity-text">
                          {cat.total.toLocaleString()} {currency}
                        </span>
                        <span className="text-[10px] font-semibold text-simplicity-muted w-7 text-right">
                          {percent}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-simplicity-canvas overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


