/**
 * ViewToggle Component
 * Toggle between grid, list, and compact views
 */

'use client';

import { Grid3X3, List, AlignJustify } from 'lucide-react';
import { ViewMode } from '@/lib/dashboard/types';

interface ViewToggleProps {
  currentView: ViewMode;
  onChange: (view: ViewMode) => void;
}

const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'grid', icon: <Grid3X3 className="w-4 h-4" />, label: 'Grid' },
  { mode: 'list', icon: <List className="w-4 h-4" />, label: 'List' },
  { mode: 'compact', icon: <AlignJustify className="w-4 h-4" />, label: 'Compact' },
];

export function ViewToggle({ currentView, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-white rounded-xl border border-[#F0E8DE] p-1">
      {views.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
            transition-all duration-200
            ${currentView === mode
              ? 'bg-[#78611D]/20 text-[#78611D]'
              : 'text-[#7A756F] hover:text-[#4A453F]'
            }
          `}
          title={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
