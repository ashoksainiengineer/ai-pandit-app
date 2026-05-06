'use client';

import React from 'react';

export default function CandidateComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E8DE] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#6B1F7A] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#8A857F]">Candidate Comparison</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="text-sm text-[#4A453F] font-medium">14:32:18</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-medium">94.2% match</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full">Best</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-[#FDF8F3] rounded-lg">
          <div className="text-sm text-[#4A453F]">14:31:45</div>
          <span className="text-xs text-[#8A857F]">87.5% match</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-[#FDF8F3] rounded-lg">
          <div className="text-sm text-[#4A453F]">14:33:02</div>
          <span className="text-xs text-[#8A857F]">82.1% match</span>
        </div>
      </div>
    </div>
  );
}
