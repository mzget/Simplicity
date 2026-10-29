import React from 'react';
import { DashboardStats } from '../types';
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

interface KPICardsProps {
  stats: DashboardStats;
  currency?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, currency = 'THB' }) => {
  const isPositiveChange = stats.periodChange >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total Balance */}
      <div className="bg-white rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Total Balance
          </span>
          <div className="w-8 h-8 rounded-full bg-simplicity-teal/10 flex items-center justify-center text-simplicity-teal">
            <Wallet size={16} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-simplicity-teal tracking-tight">
          {stats.totalBalance.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-xs text-simplicity-muted mt-1">Current total net worth</div>
      </div>

      {/* 2. Total Period Change */}
      <div className="bg-white rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Period Change
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isPositiveChange ? 'bg-simplicity-teal/10 text-simplicity-teal' : 'bg-simplicity-red/10 text-simplicity-red'
          }`}>
            <ArrowUpDown size={16} />
          </div>
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${
          isPositiveChange ? 'text-simplicity-teal' : 'text-simplicity-red'
        }`}>
          {isPositiveChange ? '+' : ''}{stats.periodChange.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-xs text-simplicity-muted mt-1">
          {isPositiveChange ? 'Net savings surplus' : 'Net deficit for period'}
        </div>
      </div>

      {/* 3. Total Expenses */}
      <div className="bg-white rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
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
        <div className="text-xs text-simplicity-muted mt-1">Outflows & expenditures</div>
      </div>

      {/* 4. Total Income */}
      <div className="bg-white rounded-2xl p-4 border border-simplicity-border/80 shadow-simplicity relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-simplicity-muted uppercase tracking-wider">
            Period Income
          </span>
          <div className="w-8 h-8 rounded-full bg-simplicity-teal/10 flex items-center justify-center text-simplicity-teal">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-simplicity-teal tracking-tight">
          +{stats.periodIncome.toLocaleString()} <span className="text-sm font-sans font-normal text-simplicity-muted">{currency}</span>
        </div>
        <div className="text-xs text-simplicity-muted mt-1">Total revenue & deposits</div>
      </div>
    </div>
  );
};


