'use client';

import React from 'react';

export default function CandidateComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#6B1F7A] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#959595]">Candidate Comparison</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="text-sm text-[#636363] font-medium">14:32:18</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-medium">94.2% match</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full">Best</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-[#ffffff] rounded-lg">
          <div className="text-sm text-[#636363]">14:31:45</div>
          <span className="text-xs text-[#959595]">87.5% match</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-[#ffffff] rounded-lg">
          <div className="text-sm text-[#636363]">14:33:02</div>
          <span className="text-xs text-[#959595]">82.1% match</span>
        </div>
      </div>
    </div>
  );
}
