import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PeriodPreset } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Card } from './ui/card';
import { Button } from './ui/button';

export const DatePeriodBar: React.FC = () => {
  const { datePreset, setDatePreset, startDate, endDate, setDateRange } = useFinanceStore();

  const presets: { id: PeriodPreset; label: string }[] = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all_time', label: 'All History' },
  ];

  const handlePrevMonth = () => {
    try {
      const current = parseISO(startDate);
      const prev = subMonths(current, 1);
      setDateRange(
        format(startOfMonth(prev), 'yyyy-MM-dd'),
        format(endOfMonth(prev), 'yyyy-MM-dd')
      );
    } catch (_) {}
  };

  const handleNextMonth = () => {
    try {
      const current = parseISO(startDate);
      const next = addMonths(current, 1);
      setDateRange(
        format(startOfMonth(next), 'yyyy-MM-dd'),
        format(endOfMonth(next), 'yyyy-MM-dd')
      );
    } catch (_) {}
  };

  const formatDisplayRange = () => {
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      return `${format(s, 'MMM dd, yyyy')} — ${format(e, 'MMM dd, yyyy')}`;
    } catch (_) {
      return `${startDate} — ${endDate}`;
    }
  };

  return (
    <Card className="p-2 sm:p-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Date Stepper */}
      <div className="flex items-center gap-1.5 w-full md:w-auto justify-between md:justify-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          title="Previous Month"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/50 text-xs font-semibold text-foreground">
          <CalendarIcon size={14} className="text-emerald-500 dark:text-emerald-400" />
          <span>{formatDisplayRange()}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          title="Next Month"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        {presets.map((p) => {
          const isActive = datePreset === p.id;
          return (
            <Button
              key={p.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDatePreset(p.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
              }`}
            >
              {p.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
