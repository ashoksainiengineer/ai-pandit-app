'use client';

import React from 'react';

export default function EphemerisTable() {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#4A7C6F] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#959595]">Ephemeris Data (Skyfield)</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-[#959595] font-medium">Planet</div>
        <div className="text-[#959595] font-medium">Sign</div>
        <div className="text-[#959595] font-medium">Longitude</div>
        <div className="text-[#959595] font-medium">House</div>
        
        <div className="text-[#636363]">Sun</div>
        <div className="text-[#636363]">Leo</div>
        <div className="text-[#636363]">125.42°</div>
        <div className="text-[#636363]">5th</div>
        
        <div className="text-[#636363]">Moon</div>
        <div className="text-[#636363]">Scorpio</div>
        <div className="text-[#636363]">218.91°</div>
        <div className="text-[#636363]">8th</div>
        
        <div className="text-[#636363]">Jupiter</div>
        <div className="text-[#636363]">Taurus</div>
        <div className="text-[#636363]">45.18°</div>
        <div className="text-[#636363]">11th</div>
      </div>
    </div>
  );
}
