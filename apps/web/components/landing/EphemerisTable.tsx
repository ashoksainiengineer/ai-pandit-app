'use client';

import React from 'react';

export default function EphemerisTable() {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E8DE] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-[#4A7C6F] rounded-full animate-pulse" />
        <span className="text-sm font-medium text-[#8A857F]">Ephemeris Data (Skyfield)</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-[#8A857F] font-medium">Planet</div>
        <div className="text-[#8A857F] font-medium">Sign</div>
        <div className="text-[#8A857F] font-medium">Longitude</div>
        <div className="text-[#8A857F] font-medium">House</div>
        
        <div className="text-[#4A453F]">Sun</div>
        <div className="text-[#4A453F]">Leo</div>
        <div className="text-[#4A453F]">125.42°</div>
        <div className="text-[#4A453F]">5th</div>
        
        <div className="text-[#4A453F]">Moon</div>
        <div className="text-[#4A453F]">Scorpio</div>
        <div className="text-[#4A453F]">218.91°</div>
        <div className="text-[#4A453F]">8th</div>
        
        <div className="text-[#4A453F]">Jupiter</div>
        <div className="text-[#4A453F]">Taurus</div>
        <div className="text-[#4A453F]">45.18°</div>
        <div className="text-[#4A453F]">11th</div>
      </div>
    </div>
  );
}
