/**
 * SearchFilterBar Component
 * Comprehensive search and filtering for sessions
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { FilterState, SessionStatus, SortField, SortOrder } from '@/lib/dashboard/types';

interface SearchFilterBarProps {
  filterState: FilterState;
  sortState: { field: SortField; order: SortOrder };
  onFilterChange: (filter: Partial<FilterState>) => void;
  onSortChange: (sort: { field: SortField; order: SortOrder }) => void;
  onClearFilters: () => void;
  resultCount: number;
  totalCount: number;
}

const statusOptions: { value: SessionStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'complete', label: 'Complete', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600' },
  { value: 'processing', label: 'Processing', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-600' },
  { value: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600' },
  { value: 'failed', label: 'Failed', icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600' },
];

const confidenceOptions = [
  { value: 'god-tier', label: 'God-Tier', color: 'text-[#78611D]' },
  { value: 'high', label: 'High', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'low', label: 'Low', color: 'text-red-600' },
];

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'fullName', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'accuracy', label: 'Accuracy' },
];

export const SearchFilterBar = memo(function SearchFilterBar({
  filterState,
  sortState,
  onFilterChange,
  onSortChange,
  onClearFilters,
  resultCount,
  totalCount,
}: SearchFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const hasActiveFilters = useMemo(() => 
    filterState.statusFilter.length > 0 ||
    filterState.confidenceFilter.length > 0 ||
    filterState.dateRange.from ||
    filterState.dateRange.to ||
    filterState.hasResults !== null ||
    filterState.favoritesOnly,
    [filterState]
  );

  const toggleStatus = useCallback((status: SessionStatus) => {
    const newStatuses = filterState.statusFilter.includes(status)
      ? filterState.statusFilter.filter(s => s !== status)
      : [...filterState.statusFilter, status];
    onFilterChange({ statusFilter: newStatuses });
  }, [filterState.statusFilter, onFilterChange]);

  const toggleConfidence = useCallback((confidence: string) => {
    const newConfidences = filterState.confidenceFilter.includes(confidence)
      ? filterState.confidenceFilter.filter(c => c !== confidence)
      : [...filterState.confidenceFilter, confidence];
    onFilterChange({ confidenceFilter: newConfidences });
  }, [filterState.confidenceFilter, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A756F]" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, place, or ID..."
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="
              w-full pl-12 pr-4 py-3
              bg-white border border-[#F0E8DE] rounded-xl
              text-[#1A1612] placeholder-[#7A756F]
              focus:outline-none focus:border-[#78611D]/50 focus:ring-2 focus:ring-[#78611D]/10
              transition-all
            "
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-[#7A756F] bg-[#F5EFE7] rounded border border-[#F0E8DE] hidden md:block">
            Ctrl K
          </kbd>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl
            border transition-all duration-200
            ${hasActiveFilters 
              ? 'bg-[#78611D]/20 border-[#78611D]/50 text-[#78611D]' 
              : 'bg-white border-[#F0E8DE] text-[#4A453F] hover:border-[#78611D]/40'
            }
          `}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-[#78611D] text-white rounded-full">
              {filterState.statusFilter.length + filterState.confidenceFilter.length + 
               (filterState.favoritesOnly ? 1 : 0) + 
               (filterState.dateRange.from || filterState.dateRange.to ? 1 : 0)}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onSortChange({ 
            field: sortState.field, 
            order: sortState.order === 'asc' ? 'desc' : 'asc' 
          })}
          className="px-4 py-3 rounded-xl bg-white border border-[#F0E8DE] text-[#4A453F] hover:border-[#78611D]/40 transition-all"
          title={`Sort: ${sortState.order === 'asc' ? 'Ascending' : 'Descending'}`}
        >
          {sortState.order === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-4 bg-white rounded-xl border border-[#F0E8DE]">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-[#7A756F] mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(({ value, label, icon, color }) => (
                    <button
                      key={value}
                      onClick={() => toggleStatus(value)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                        border transition-all duration-200
                        ${filterState.statusFilter.includes(value)
                          ? `bg-[#78611D]/20 border-[#78611D]/50 ${color}`
                          : 'bg-[#F5EFE7] border-[#F0E8DE] text-[#7A756F] hover:border-[#78611D]/30'
                        }
                      `}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Filter */}
              <div>
                <label className="text-sm font-medium text-[#7A756F] mb-2 block">Confidence</label>
                <div className="flex flex-wrap gap-2">
                  {confidenceOptions.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => toggleConfidence(value)}
                      className={`
                        px-3 py-2 rounded-lg text-sm
                        border transition-all duration-200
                        ${filterState.confidenceFilter.includes(value)
                          ? `bg-[#78611D]/20 border-[#78611D]/50 ${color}`
                          : 'bg-[#F5EFE7] border-[#F0E8DE] text-[#7A756F] hover:border-[#78611D]/30'
                        }
                      `}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onFilterChange({ favoritesOnly: !filterState.favoritesOnly })}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    border transition-all duration-200
                    ${filterState.favoritesOnly
                      ? 'bg-[#78611D]/20 border-[#78611D]/50 text-[#78611D]'
                      : 'bg-[#F5EFE7] border-[#F0E8DE] text-[#7A756F] hover:border-[#78611D]/30'
                    }
                  `}
                >
                  <Star className="w-4 h-4" />
                  Favorites Only
                </button>

                <button
                  onClick={() => onFilterChange({ 
                    hasResults: filterState.hasResults === true ? null : true 
                  })}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                    border transition-all duration-200
                    ${filterState.hasResults === true
                      ? 'bg-[#78611D]/20 border-[#78611D]/50 text-[#78611D]'
                      : 'bg-[#F5EFE7] border-[#F0E8DE] text-[#7A756F] hover:border-[#78611D]/30'
                    }
                  `}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Has Results
                </button>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#F0E8DE]">
                <span className="text-sm text-[#7A756F]">Sort by:</span>
                <select
                  value={sortState.field}
                  onChange={(e) => onSortChange({ ...sortState, field: e.target.value as SortField })}
                  className="bg-[#F5EFE7] border border-[#F0E8DE] rounded-lg px-3 py-2 text-sm text-[#4A453F] focus:outline-none focus:border-[#78611D]/50"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-2 text-sm text-[#7A756F] hover:text-[#4A453F] transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#7A756F]">
          Showing <span className="text-[#4A453F] font-medium">{resultCount}</span> of{' '}
          <span className="text-[#4A453F] font-medium">{totalCount}</span> sessions
        </span>
        {hasActiveFilters && (
          <span className="text-[#78611D]">
            Filters active
          </span>
        )}
      </div>
    </div>
  );
});
