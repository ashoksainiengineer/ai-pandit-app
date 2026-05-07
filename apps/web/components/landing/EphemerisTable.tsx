'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const PLANET_DATA = [
  { planet: 'Sun', sign: 'Leo', longitude: '125.42°', house: '5th', retro: false },
  { planet: 'Moon', sign: 'Scorpio', longitude: '218.91°', house: '8th', retro: false },
  { planet: 'Mars', sign: 'Aries', longitude: '15.67°', house: '1st', retro: false },
  { planet: 'Jupiter', sign: 'Taurus', longitude: '45.18°', house: '11th', retro: true },
  { planet: 'Saturn', sign: 'Capricorn', longitude: '298.33°', house: '10th', retro: false },
];

const staggerRow = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export default function EphemerisTable() {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-3 h-3 bg-[#0358F7] rounded-full animate-pulse" />
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-black/40" />
          <span className="text-sm font-medium text-black/60">Ephemeris Data — Skyfield DE440</span>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-5 gap-2 pb-2 border-b border-black/5 mb-3">
        <span className="text-xs font-medium text-black/30 uppercase tracking-wider">Planet</span>
        <span className="text-xs font-medium text-black/30 uppercase tracking-wider">Sign</span>
        <span className="text-xs font-medium text-black/30 uppercase tracking-wider">Longitude</span>
        <span className="text-xs font-medium text-black/30 uppercase tracking-wider">House</span>
        <span className="text-xs font-medium text-black/30 uppercase tracking-wider">Motion</span>
      </div>

      {/* Table rows */}
      <div className="space-y-1">
        {PLANET_DATA.map((row, i) => (
          <motion.div
            key={row.planet}
            {...staggerRow}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="grid grid-cols-5 gap-2 py-2 text-xs rounded-md hover:bg-black/[0.02] transition-colors"
          >
            <span className="text-black font-medium">{row.planet}</span>
            <span className="text-black/60">{row.sign}</span>
            <span className="text-black/60 font-mono">{row.longitude}</span>
            <span className="text-black/60">{row.house}</span>
            <span className={row.retro ? 'text-amber-600 text-[10px] font-medium' : 'text-black/30 text-[10px]'}>
              {row.retro ? 'RETRO' : 'direct'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[10px] text-black/30">
        <span>NASA JPL DE440 • IEEE 754 double-precision</span>
        <span className="font-mono">±0.0001° accuracy</span>
      </div>
    </div>
  );
}
