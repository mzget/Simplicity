import React from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { Category } from '../types';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
    <Card className="p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1">
          <Filter size={13} className="text-emerald-500 dark:text-emerald-400" />
          <span>Filters:</span>
        </div>

        {/* Category Filter Dropdown */}
        <select id="finance-category-filter" name="categoryId"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="text-xs font-medium h-9 px-3 bg-secondary/60 rounded-xl border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
          <Input id="finance-search-input" name="searchQuery"
            type="text"
            placeholder="Search note or #tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9 bg-secondary/50 border-border/80"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 h-9 px-3 rounded-xl"
            title="Reset All Filters"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
