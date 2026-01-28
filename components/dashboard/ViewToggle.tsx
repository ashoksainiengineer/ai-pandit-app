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
    <div className="flex items-center bg-[#0F1419] rounded-xl border border-[#D4AF37]/20 p-1">
      {views.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
            transition-all duration-200
            ${currentView === mode
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'text-[#8C7F72] hover:text-[#C4B8AD]'
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
