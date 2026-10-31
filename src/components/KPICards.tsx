import React from 'react';
import { DashboardStats } from '../types';
import { useFinanceStore } from '../store/useFinanceStore';
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from './ui/card';

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
      <Card className="relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 dark:text-emerald-400 tracking-tight">
            {stats.totalBalance.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">{currency}</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
            <span>Net worth</span>
            <span>{formatUsdEquivalent(stats.totalBalance)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Period Change */}
      <Card className="relative overflow-hidden group hover:border-border transition-all duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Period Change
            </span>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
              isPositiveChange 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
            }`}>
              <ArrowUpDown size={16} />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${
            isPositiveChange ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          }`}>
            {isPositiveChange ? '+' : ''}{stats.periodChange.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">{currency}</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
            <span>{isPositiveChange ? 'Net surplus' : 'Net deficit'}</span>
            <span>{formatUsdEquivalent(stats.periodChange)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Expenses */}
      <Card className="relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Period Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:scale-105 transition-transform">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-red-500 dark:text-red-400 tracking-tight">
            -{stats.periodExpense.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">{currency}</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
            <span>Total outflows</span>
            <span>{formatUsdEquivalent(stats.periodExpense)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Total Income */}
      <Card className="relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Period Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 dark:text-emerald-400 tracking-tight">
            +{stats.periodIncome.toLocaleString()} <span className="text-sm font-sans font-normal text-muted-foreground">{currency}</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
            <span>Total revenue</span>
            <span>{formatUsdEquivalent(stats.periodIncome)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
