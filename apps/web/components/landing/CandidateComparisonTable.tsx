'use client';

import React from 'react';

export default function CandidateComparisonTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E8DE] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#6B1F7A] rounded-full animate-pulse" />
        <span className="text-sm font-mono text-[#8A857F]">Candidate Comparison Table</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-[#F5F0E8] rounded animate-pulse" />
        <div className="h-2 bg-[#F5F0E8] rounded animate-pulse w-4/5" />
        <div className="h-2 bg-[#F5F0E8] rounded animate-pulse w-3/4" />
      </div>
    </div>
  );
}
