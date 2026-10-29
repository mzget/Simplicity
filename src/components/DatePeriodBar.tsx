import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { PeriodPreset } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';

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
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-simplicity-border flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Date Stepper */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-simplicity-canvas text-simplicity-text transition-colors"
          title="Previous Month"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-simplicity-canvas text-sm font-semibold text-simplicity-text">
          <CalendarIcon size={15} className="text-simplicity-teal" />
          <span>{formatDisplayRange()}</span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-simplicity-canvas text-simplicity-text transition-colors"
          title="Next Month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setDatePreset(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              datePreset === p.id
                ? 'bg-simplicity-text text-white shadow-sm'
                : 'text-simplicity-muted hover:text-simplicity-text hover:bg-simplicity-canvas'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

