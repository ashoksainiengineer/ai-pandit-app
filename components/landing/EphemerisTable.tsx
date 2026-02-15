/**
 * Swiss Ephemeris Precision Data Table - Light Theme Edition
 */

'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Telescope,
  Orbit,
  Clock,
  Compass,
  Activity,
  Database,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles
} from 'lucide-react';

interface PlanetData {
  name: string;
  symbol: string;
  color: string;
  sign: string;
  degree: string;
  nakshatra: string;
  longitude: string;
  latitude: string;
  speed: string;
  house: string;
  dignity: string;
  shadbala: string;
  isExalted?: boolean;
  isDebilitated?: boolean;
  isRetrograde?: boolean;
}

const planetData: PlanetData[] = [
  { name: 'Sun', symbol: '☉', color: 'text-orange-500', sign: 'Capricorn', degree: "15°20'42\"", nakshatra: 'Shravana', longitude: '285.34567890°', latitude: '+0.00012345°', speed: '0.98564732°/d', house: '10th', dignity: 'Moolatrikona', shadbala: '1.2345' },
  { name: 'Moon', symbol: '☽', color: 'text-blue-500', sign: 'Leo', degree: "4°59'15\"", nakshatra: 'Magha', longitude: '124.98765432°', latitude: '-0.00234567°', speed: '13.17639646°/d', house: '5th', dignity: 'Own House', shadbala: '1.4567' },
  { name: 'Mars', symbol: '♂', color: 'text-red-500', sign: 'Pisces', degree: "0°07'24\"", nakshatra: 'Purva Bhadrapada', longitude: '340.12345678°', latitude: '+0.00123456°', speed: '0.52403209°/d', house: '12th', dignity: 'Exalted', shadbala: '1.3456', isExalted: true },
  { name: 'Mercury', symbol: '☿', color: 'text-emerald-500', sign: 'Capricorn', degree: "8°27'23\"", nakshatra: 'Uttara Ashadha', longitude: '278.45678901°', latitude: '-0.00345678°', speed: '1.60213095°/d', house: '9th', dignity: 'Neutral', shadbala: '0.9876' },
  { name: 'Jupiter', symbol: '♃', color: 'text-yellow-600', sign: 'Taurus', degree: "15°40'52\"", nakshatra: 'Rohini', longitude: '45.67890123°', latitude: '+0.00098765°', speed: '0.08309128°/d', house: '2nd', dignity: 'Own House', shadbala: '1.5678' },
  { name: 'Venus', symbol: '♀', color: 'text-pink-500', sign: 'Aquarius', degree: "12°20'45\"", nakshatra: 'Shatabhisha', longitude: '312.34567890°', latitude: '-0.00187654°', speed: '1.18187594°/d', house: '11th', dignity: 'Debilitated', shadbala: '0.8765', isDebilitated: true },
  { name: 'Saturn', symbol: '♄', color: 'text-indigo-500', sign: 'Libra', degree: "18°45'55\"", nakshatra: 'Swati', longitude: '198.76543210°', latitude: '+0.00210987°', speed: '0.03344589°/d', house: '7th', dignity: 'Neutral', shadbala: '1.1234' },
  { name: 'Rahu', symbol: '☊', color: 'text-purple-500', sign: 'Gemini', degree: "5°25'55\"", nakshatra: 'Mrigashira', longitude: '65.43210987°', latitude: '-0.00054321°', speed: '-0.05299209°/d', house: '3rd', dignity: 'Neutral', shadbala: '0.7654' },
  { name: 'Ketu', symbol: '☋', color: 'text-gray-500', sign: 'Sagittarius', degree: "5°25'55\"", nakshatra: 'Mula', longitude: '245.43210987°', latitude: '+0.00054321°', speed: '-0.05299209°/d', house: '9th', dignity: 'Neutral', shadbala: '0.7654' },
];

const additionalData = [
  { key: 'ayanamsa', label: 'Ayanamsa', value: "24°28'15.2341\"", subLabel: 'Lahiri (Chitrapaksha)', icon: Compass },
  { key: 'julianDay', label: 'Julian Day', value: '2460990.2345678901', subLabel: 'JD ET', icon: Clock },
  { key: 'lst', label: 'LST', value: '18:34:22.847291', subLabel: 'Mumbai, IN', icon: Activity },
  { key: 'obliquity', label: 'Obliquity', value: "23°26'14.9154\"", subLabel: 'True', icon: Telescope },
  { key: 'nutation', label: 'Nutation', value: '+0.002378°', subLabel: 'Longitude', icon: Orbit },
  { key: 'epsilon', label: 'Epsilon', value: '23.4378293°', subLabel: 'Mean', icon: Database },
];

const dashaData = {
  mahadasha: 'Venus',
  antardasha: 'Mercury',
  pratyantardasha: 'Saturn',
  period: '2020-2036',
};

// Static date to avoid hydration errors
const STATIC_DATE = '2026-01-29T15:22:30.000Z';

export default function EphemerisTable() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'planets' | 'houses' | 'dasha'>('planets');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#F0E8DE] bg-white overflow-hidden shadow-sm"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#FDF8F3] transition-colors bg-[#FFFCF8]"
      >
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-bold text-[#1A1612]">Swiss Ephemeris Precision Data</h4>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[#7A756F] font-mono">SE v2.10.03 • 4-decimal precision • NASA DE440</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#7A756F]">
            <span className="text-orange-500">☉ {planetData[0].sign} {planetData[0].degree}</span>
            <span className="text-blue-500">☽ {planetData[1].sign} {planetData[1].degree}</span>
            <span className="text-[#B8860B]">↑ Lagna</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#7A756F]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#7A756F]" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-[#F0E8DE]">
          {/* Tabs */}
          <div className="flex border-b border-[#F0E8DE]">
            {[
              { id: 'planets', label: 'Planetary Positions', icon: Orbit },
              { id: 'houses', label: 'House Cusps', icon: Star },
              { id: 'dasha', label: 'Dasha Periods', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors ${activeTab === tab.id
                      ? 'text-[#B8860B] border-b-2 border-[#B8860B] bg-[#B8860B]/5'
                      : 'text-[#7A756F] hover:text-[#4A453F]'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5 space-y-4">
            {activeTab === 'planets' && (
              <>
                {/* Ascendant Card */}
                <div className="bg-[#FDF8F3] rounded-xl p-4 border border-[#D4A853]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-[#B8860B]" />
                    <span className="text-[10px] text-[#7A756F] uppercase tracking-wider font-bold">Ascendant (Lagna)</span>
                  </div>
                  <div className="text-lg font-bold text-[#B8860B] font-mono">
                    Aries 15°23&apos;45&quot; (Bharani)
                  </div>
                </div>

                {/* Planets Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {planetData.map((planet, index) => (
                    <motion.div
                      key={planet.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#FDF8F3] rounded-xl p-3 border border-[#F0E8DE] hover:border-[#D4A853]/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-lg ${planet.color}`}>{planet.symbol}</span>
                        <span className="text-[10px] text-[#7A756F] uppercase font-bold">{planet.name}</span>
                        {planet.isRetrograde && <span className="text-[8px] text-red-500">R</span>}
                      </div>
                      <div className="text-xs font-mono text-[#1A1612]">
                        {planet.sign} {planet.degree}
                      </div>
                      <div className="text-[10px] text-[#7A756F] flex items-center justify-between">
                        <span>{planet.nakshatra}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded ${planet.dignity === 'Exalted' ? 'bg-emerald-100 text-emerald-600' :
                            planet.dignity === 'Debilitated' ? 'bg-red-100 text-red-600' :
                              planet.dignity === 'Own House' ? 'bg-blue-100 text-blue-600' :
                                planet.dignity === 'Moolatrikona' ? 'bg-purple-100 text-purple-600' :
                                  'bg-[#F0E8DE] text-[#7A756F]'
                          }`}>
                          {planet.dignity}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] mb-0.5">
                          <span className="text-[#7A756F]">Shadbala</span>
                          <span className="text-[#4A453F] font-mono">{planet.shadbala}</span>
                        </div>
                        <div className="w-full bg-[#F0E8DE] rounded-full h-1 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${parseFloat(planet.shadbala) * 50}%` }}
                            transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                            className={`h-full rounded-full ${parseFloat(planet.shadbala) > 1.2 ? 'bg-emerald-500' :
                                parseFloat(planet.shadbala) > 0.9 ? 'bg-amber-500' :
                                  'bg-red-500'
                              }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Additional Calculations Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-[#F0E8DE]">
                  {additionalData.map((data, index) => {
                    const Icon = data.icon;
                    return (
                      <motion.div
                        key={data.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="p-3 bg-[#FDF8F3] rounded-xl border border-[#F0E8DE]"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-[#7A756F]" />
                          <span className="text-[9px] text-[#7A756F] uppercase">{data.label}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#4A453F]">{data.value}</div>
                        <div className="text-[8px] text-[#A8A39D]">{data.subLabel}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === 'houses' && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-[#FDF8F3] rounded-xl p-3 border border-[#F0E8DE] text-center"
                  >
                    <div className="text-[10px] text-[#7A756F]">{i + 1}H</div>
                    <div className="text-xs font-mono text-[#1A1612]">
                      {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i]}
                    </div>
                    <div className="text-[10px] text-[#B8860B]">
                      {15 + i}°{20 + i}&apos;{30 + i}&quot;
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'dasha' && (
              <div className="space-y-3">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] text-[#7A756F] uppercase tracking-wider font-bold">Current Dasha Period</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-mono text-emerald-600">{dashaData.mahadasha}</div>
                    <span className="text-[#7A756F]">→</span>
                    <div className="text-lg font-mono text-[#4A453F]">{dashaData.antardasha}</div>
                    <span className="text-[#7A756F]">→</span>
                    <div className="text-sm font-mono text-[#7A756F]">{dashaData.pratyantardasha}</div>
                  </div>
                  <div className="text-[10px] text-[#A8A39D] mt-1">Period: {dashaData.period}</div>
                </div>

                {/* Vimshottari Sequence */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Ketu (7)', 'Venus (20)', 'Sun (6)', 'Moon (10)', 'Mars (7)', 'Rahu (18)', 'Jupiter (16)', 'Saturn (19)', 'Mercury (17)'].map((planet, i) => (
                    <div
                      key={planet}
                      className={`p-3 rounded-xl border text-center text-xs ${i === 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-[#FDF8F3] border-[#F0E8DE] text-[#7A756F]'
                        }`}
                    >
                      {planet} years
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security Footer */}
          <div className="flex items-center justify-center px-5 py-3 bg-[#FDF8F3] border-t border-[#F0E8DE] text-xs">
            <div className="flex items-center gap-2 text-[#7A756F]">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Personal Data Protected • Encrypted Storage</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
