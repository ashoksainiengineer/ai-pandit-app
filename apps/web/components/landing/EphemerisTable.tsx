'use client';

import React from 'react';

export default function EphemerisTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E8DE] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#4A7C6F] rounded-full animate-pulse" />
        <span className="text-sm font-mono text-[#8A857F]">Ephemeris Table</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-[#F5F0E8] rounded animate-pulse" />
        <div className="h-2 bg-[#F5F0E8] rounded animate-pulse w-5/6" />
        <div className="h-2 bg-[#F5F0E8] rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}
