'use client';

import React from 'react';

export default function AIThinkingBox() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#000000] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#959595]">AI Thinking Process</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-[#636363]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Analyzing Vimshottari Dasha periods...</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#636363]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Cross-referencing 5 life events</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#636363]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Calculating KP Sub-lord precision...</span>
        </div>
      </div>
    </div>
  );
}
