import React from 'react';
import { DashboardStats } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

interface KPICardsProps {
  stats: DashboardStats;
  currency?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, currency = 'THB' }) => {
  const { usdThbRate } = useFinanceStore();
  const rate = usdThbRate > 0 ? usdThbRate : 36.5;
  const isPositiveChange = stats.periodChange >= 0;

  const formatUsdEquivalent = (thbAmount: number) => {
    const usdVal = Math.abs(thbAmount) / rate;
    return `≈ $${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total Balance */}
      <div className="bg-white simplicity-glass-card rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Total Balance
          </span>
          <div className="w-8 h-8 rounded-full bg-simplicity-teal/10 flex items-center justify-center text-simplicity-teal dark:text-emerald-400">
            <Wallet size={16} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-simplicity-teal dark:text-emerald-400 tracking-tight">
          {stats.totalBalance.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-[11px] font-mono text-simplicity-muted mt-1 flex items-center justify-between">
          <span>Current total net worth</span>
          <span>{formatUsdEquivalent(stats.totalBalance)}</span>
        </div>
      </div>

      {/* 2. Total Period Change */}
      <div className="bg-white simplicity-glass-card rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Period Change
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isPositiveChange ? 'bg-simplicity-teal/10 text-simplicity-teal dark:text-emerald-400' : 'bg-simplicity-red/10 text-simplicity-red'
          }`}>
            <ArrowUpDown size={16} />
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${
          isPositiveChange ? 'text-simplicity-teal dark:text-emerald-400' : 'text-simplicity-red'
        }`}>
          {isPositiveChange ? '+' : ''}{stats.periodChange.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-[11px] font-mono text-simplicity-muted mt-1 flex items-center justify-between">
          <span>{isPositiveChange ? 'Net savings surplus' : 'Net deficit'}</span>
          <span>{formatUsdEquivalent(stats.periodChange)}</span>
        </div>
      </div>

      {/* 3. Total Expenses */}
      <div className="bg-white simplicity-glass-card rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Period Expenses
          </span>
          <div className="w-8 h-8 rounded-full bg-simplicity-red/10 flex items-center justify-center text-simplicity-red">
            <TrendingDown size={16} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-simplicity-red tracking-tight">
          -{stats.periodExpense.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-[11px] font-mono text-simplicity-muted mt-1 flex items-center justify-between">
          <span>Outflows & expenditures</span>
          <span>{formatUsdEquivalent(stats.periodExpense)}</span>
        </div>
      </div>

      {/* 4. Total Income */}
      <div className="bg-white simplicity-glass-card rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Period Income
          </span>
          <div className="w-8 h-8 rounded-full bg-simplicity-teal/10 flex items-center justify-center text-simplicity-teal dark:text-emerald-400">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-simplicity-teal dark:text-emerald-400 tracking-tight">
          +{stats.periodIncome.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-[11px] font-mono text-simplicity-muted mt-1 flex items-center justify-between">
          <span>Total revenue & deposits</span>
          <span>{formatUsdEquivalent(stats.periodIncome)}</span>
        </div>
      </div>
    </div>
  );
};


