/**
 * Pagination Component
 * Handles pagination with page size selector and jump to page
 */

'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('');

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Page Info */}
      <div className="text-sm text-[#7A756F]">
        Showing{' '}
        <span className="text-[#4A453F] font-medium">
          {Math.min((currentPage - 1) * pageSize + 1, totalCount)}
        </span>{' '}
        to{' '}
        <span className="text-[#4A453F] font-medium">
          {Math.min(currentPage * pageSize, totalCount)}
        </span>{' '}
        of{' '}
        <span className="text-[#4A453F] font-medium">{totalCount}</span> results
      </div>

      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#7A756F]">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="
            bg-white border border-[#F0E8DE] rounded-lg
            px-3 py-1.5 text-sm text-[#4A453F]
            focus:outline-none focus:border-[#D4AF37]/50
          "
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span className="text-sm text-[#7A756F]">per page</span>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="
            p-2 rounded-lg border border-[#F0E8DE]
            text-[#7A756F] hover:text-[#D4AF37] hover:border-[#D4AF37]/40
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="
            p-2 rounded-lg border border-[#F0E8DE]
            text-[#7A756F] hover:text-[#D4AF37] hover:border-[#D4AF37]/40
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-[#7A756F]">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`
                  w-10 h-10 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${currentPage === page
                    ? 'bg-[#D4AF37] text-white'
                    : 'border border-[#F0E8DE] text-[#4A453F] hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
                  }
                `}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="
            p-2 rounded-lg border border-[#F0E8DE]
            text-[#7A756F] hover:text-[#D4AF37] hover:border-[#D4AF37]/40
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="
            p-2 rounded-lg border border-[#F0E8DE]
            text-[#7A756F] hover:text-[#D4AF37] hover:border-[#D4AF37]/40
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Jump to Page */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-[#7A756F]">Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
            className="
              w-16 px-2 py-1.5 text-center
              bg-white border border-[#F0E8DE] rounded-lg
              text-sm text-[#4A453F]
              focus:outline-none focus:border-[#D4AF37]/50
            "
            placeholder="#"
          />
        </div>
      </div>
    </div>
  );
}
