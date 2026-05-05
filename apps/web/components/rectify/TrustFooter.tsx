'use client';

import React from 'react';
import { Shield, Key, EyeOff } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: Shield,
    label: 'AES-256-GCM',
    sub: 'Military-grade encryption',
  },
  {
    icon: Key,
    label: 'User-Isolated Keys',
    sub: 'Your key = your data only',
  },
  {
    icon: EyeOff,
    label: 'Zero-Knowledge',
    sub: 'We cannot read your data',
  },
] as const;

export default function TrustFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Gradient top fade */}
      <div className="h-3 bg-gradient-to-t from-amber-950/10 to-transparent" />

      {/* Main bar */}
      <div className="bg-gradient-to-r from-amber-900/95 via-amber-800/95 to-amber-900/95 backdrop-blur-md border-t border-amber-700/30">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-center gap-6 sm:gap-10">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-amber-200/80"
            >
              <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 flex-shrink-0" />
              <span className="hidden sm:inline text-[11px] font-medium tracking-wide uppercase text-amber-100/90">
                {item.label}
              </span>
              <span className="hidden md:inline text-[10px] text-amber-300/50">
                {item.sub}
              </span>
              {/* Mobile: show only icon + label */}
              <span className="sm:hidden text-[10px] font-medium text-amber-100/80">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
