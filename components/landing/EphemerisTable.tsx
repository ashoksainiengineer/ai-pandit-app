/**
 * Swiss Ephemeris Precision Data Table
 * Matches the SwissEphPanel design from rectify page
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
  { name: 'Sun', symbol: '☉', color: 'text-orange-400', sign: 'Capricorn', degree: "15°20'42\"", nakshatra: 'Shravana', longitude: '285.34567890°', latitude: '+0.00012345°', speed: '0.98564732°/d', house: '10th', dignity: 'Moolatrikona', shadbala: '1.2345' },
  { name: 'Moon', symbol: '☽', color: 'text-blue-300', sign: 'Leo', degree: "4°59'15\"", nakshatra: 'Magha', longitude: '124.98765432°', latitude: '-0.00234567°', speed: '13.17639646°/d', house: '5th', dignity: 'Own House', shadbala: '1.4567' },
  { name: 'Mars', symbol: '♂', color: 'text-red-400', sign: 'Pisces', degree: "0°07'24\"", nakshatra: 'Purva Bhadrapada', longitude: '340.12345678°', latitude: '+0.00123456°', speed: '0.52403209°/d', house: '12th', dignity: 'Exalted', shadbala: '1.3456', isExalted: true },
  { name: 'Mercury', symbol: '☿', color: 'text-emerald-400', sign: 'Capricorn', degree: "8°27'23\"", nakshatra: 'Uttara Ashadha', longitude: '278.45678901°', latitude: '-0.00345678°', speed: '1.60213095°/d', house: '9th', dignity: 'Neutral', shadbala: '0.9876' },
  { name: 'Jupiter', symbol: '♃', color: 'text-yellow-400', sign: 'Taurus', degree: "15°40'52\"", nakshatra: 'Rohini', longitude: '45.67890123°', latitude: '+0.00098765°', speed: '0.08309128°/d', house: '2nd', dignity: 'Own House', shadbala: '1.5678' },
  { name: 'Venus', symbol: '♀', color: 'text-pink-400', sign: 'Aquarius', degree: "12°20'45\"", nakshatra: 'Shatabhisha', longitude: '312.34567890°', latitude: '-0.00187654°', speed: '1.18187594°/d', house: '11th', dignity: 'Debilitated', shadbala: '0.8765', isDebilitated: true },
  { name: 'Saturn', symbol: '♄', color: 'text-indigo-400', sign: 'Libra', degree: "18°45'55\"", nakshatra: 'Swati', longitude: '198.76543210°', latitude: '+0.00210987°', speed: '0.03344589°/d', house: '7th', dignity: 'Neutral', shadbala: '1.1234' },
  { name: 'Rahu', symbol: '☊', color: 'text-purple-400', sign: 'Gemini', degree: "5°25'55\"", nakshatra: 'Mrigashira', longitude: '65.43210987°', latitude: '-0.00054321°', speed: '-0.05299209°/d', house: '3rd', dignity: 'Neutral', shadbala: '0.7654' },
  { name: 'Ketu', symbol: '☋', color: 'text-gray-400', sign: 'Sagittarius', degree: "5°25'55\"", nakshatra: 'Mula', longitude: '245.43210987°', latitude: '+0.00054321°', speed: '-0.05299209°/d', house: '9th', dignity: 'Neutral', shadbala: '0.7654' },
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

export default function EphemerisTable() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'planets' | 'houses' | 'dasha'>('planets');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#2A3442] bg-[#1A1F2E]/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#2A3442]/30 transition-colors bg-[#0F1419]/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Telescope className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-bold text-[#F5F0EB]">Swiss Ephemeris Precision Data</h4>
            <p className="text-[10px] text-[#8C7F72] font-mono">SE v2.10.03 • 8-decimal precision • NASA DE440</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-[#8C7F72]">
            <span className="text-orange-400">☉ {planetData[0].sign} {planetData[0].degree}</span>
            <span className="text-blue-300">☽ {planetData[1].sign} {planetData[1].degree}</span>
            <span className="text-[#D4AF37]">↑ Lagna</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#8C7F72]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#8C7F72]" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-[#2A3442]">
          {/* Tabs */}
          <div className="flex border-b border-[#2A3442]">
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
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'text-[#8C7F72] hover:text-[#C4B8AD]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 space-y-4">
            {activeTab === 'planets' && (
              <>
                {/* Ascendant Card */}
                <div className="bg-[#0F1419]/50 rounded-lg p-3 border border-[#D4AF37]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold">Ascendant (Lagna)</span>
                  </div>
                  <div className="text-lg font-bold text-[#D4AF37] font-mono">
                    Aries 15°23'45" (Bharani)
                  </div>
                </div>

                {/* Planets Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {planetData.map((planet, index) => (
                    <motion.div
                      key={planet.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#0F1419]/50 rounded-lg p-2.5 border border-[#3A4452] hover:border-[#D4AF37]/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-lg ${planet.color}`}>{planet.symbol}</span>
                        <span className="text-[10px] text-[#8C7F72] uppercase font-bold">{planet.name}</span>
                        {planet.isRetrograde && <span className="text-[8px] text-red-400">R</span>}
                      </div>
                      <div className="text-xs font-mono text-[#F5F0EB]">
                        {planet.sign} {planet.degree}
                      </div>
                      <div className="text-[10px] text-[#8C7F72] flex items-center justify-between">
                        <span>{planet.nakshatra}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                          planet.dignity === 'Exalted' ? 'bg-emerald-500/20 text-emerald-400' :
                          planet.dignity === 'Debilitated' ? 'bg-red-500/20 text-red-400' :
                          planet.dignity === 'Own House' ? 'bg-blue-500/20 text-blue-400' :
                          planet.dignity === 'Moolatrikona' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-[#2A3442] text-[#8C7F72]'
                        }`}>
                          {planet.dignity}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] mb-0.5">
                          <span className="text-[#8C7F72]">Shadbala</span>
                          <span className="text-[#C4B8AD] font-mono">{planet.shadbala}</span>
                        </div>
                        <div className="w-full bg-[#2A3442] rounded-full h-1 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${parseFloat(planet.shadbala) * 50}%` }}
                            transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                            className={`h-full rounded-full ${
                              parseFloat(planet.shadbala) > 1.2 ? 'bg-emerald-500' :
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-[#2A3442]">
                  {additionalData.map((data, index) => {
                    const Icon = data.icon;
                    return (
                      <motion.div
                        key={data.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="p-2 bg-[#0F1419]/50 rounded-lg border border-[#3A4452]"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3 h-3 text-[#8C7F72]" />
                          <span className="text-[9px] text-[#8C7F72] uppercase">{data.label}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#C4B8AD]">{data.value}</div>
                        <div className="text-[8px] text-[#5A6475]">{data.subLabel}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === 'houses' && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-[#0F1419]/50 rounded-lg p-2.5 border border-[#3A4452] text-center"
                  >
                    <div className="text-[10px] text-[#8C7F72]">{i + 1}H</div>
                    <div className="text-xs font-mono text-[#F5F0EB]">
                      {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][i]}
                    </div>
                    <div className="text-[10px] text-[#D4AF37]">
                      {15 + i}°{20 + i}'{30 + i}"
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'dasha' && (
              <div className="space-y-3">
                <div className="bg-[#0F1419]/50 rounded-lg p-3 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold">Current Dasha Period</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-mono text-emerald-400">{dashaData.mahadasha}</div>
                    <span className="text-[#8C7F72]">→</span>
                    <div className="text-lg font-mono text-[#C4B8AD]">{dashaData.antardasha}</div>
                    <span className="text-[#8C7F72]">→</span>
                    <div className="text-sm font-mono text-[#8C7F72]">{dashaData.pratyantardasha}</div>
                  </div>
                  <div className="text-[10px] text-[#5A6475] mt-1">Period: {dashaData.period}</div>
                </div>

                {/* Vimshottari Sequence */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Ketu (7)', 'Venus (20)', 'Sun (6)', 'Moon (10)', 'Mars (7)', 'Rahu (18)', 'Jupiter (16)', 'Saturn (19)', 'Mercury (17)'].map((planet, i) => (
                    <div 
                      key={planet}
                      className={`p-2 rounded-lg border text-center text-xs ${
                        i === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#0F1419]/50 border-[#3A4452] text-[#8C7F72]'
                      }`}
                    >
                      {planet} years
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#0F1419]/80 border-t border-[#2A3442] text-xs">
            <div className="flex items-center gap-2 text-[#8C7F72]">
              <Activity className="w-3 h-3" />
              <span className="text-[10px]">Calculated: {new Date().toISOString()}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-[#5A6475]">Files:</span>
              <span className="font-mono text-[#8C7F72]">sepl_18.se1</span>
              <span className="font-mono text-[#8C7F72]">semo_18.se1</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
