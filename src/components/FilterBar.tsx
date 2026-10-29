import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Category } from '../types';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface FilterBarProps {
  categories: Category[];
}

export const FilterBar: React.FC<FilterBarProps> = ({ categories }) => {
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    selectedWalletId,
    setSelectedWalletId,
    datePreset,
    setDatePreset,
  } = useFinanceStore();

  const isFiltered =
    selectedCategoryId !== 'all' ||
    searchQuery.trim() !== '' ||
    selectedWalletId !== 'all' ||
    datePreset !== 'this_month';

  const handleReset = () => {
    setSelectedCategoryId('all');
    setSearchQuery('');
    setSelectedWalletId('all');
    setDatePreset('this_month');
  };

  return (
    <div className="bg-white rounded-2xl p-3 border border-simplicity-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-1.5 text-xs font-bold text-simplicity-muted">
          <Filter size={14} className="text-simplicity-teal" />
          <span>Filters:</span>
        </div>

        {/* Category Filter Dropdown */}
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="text-xs font-semibold p-2 bg-simplicity-canvas rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Search note & hashtag */}
        <div className="relative flex-1 sm:w-64">
          <input
            type="text"
            placeholder="Search note or #tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium p-2 pl-8 bg-simplicity-canvas rounded-xl border border-simplicity-border text-simplicity-text focus:outline-none focus:ring-1 focus:ring-simplicity-teal"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-simplicity-muted" />
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-simplicity-red hover:bg-simplicity-red/10 transition-colors shrink-0"
            title="Reset All Filters"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

