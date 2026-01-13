'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Star, CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp,
  Calendar, User, Sparkles, Download, Share2, RotateCcw,
  TrendingUp, Award, Target, FileText, Sun, Moon
} from 'lucide-react';
import type { RectificationResult, EventAnalysis } from '@/types';
import { ZODIAC_SIGNS } from '@/lib/ephemeris';

interface ResultsDisplayProps {
  result: RectificationResult;
}

// Confidence Badge Component
const ConfidenceBadge = ({ level, score }: { level: string; score: number }) => {
  const colors = {
    very_high: 'bg-green-500/20 text-green-400 border-green-500/30',
    high: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  
  const labels = {
    very_high: 'Very High Confidence',
    high: 'High Confidence',
    moderate: 'Moderate Confidence',
    low: 'Low Confidence'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${colors[level as keyof typeof colors]}`}>
      <Award className="w-4 h-4" />
      <span className="font-medium">{labels[level as keyof typeof labels]}</span>
      <span className="font-bold">{score}/10</span>
    </div>
  );
};

// Match Quality Badge
const MatchBadge = ({ quality }: { quality: string }) => {
  const config = {
    strong: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Strong Match' },
    moderate: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Moderate Match' },
    weak: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Weak Match' },
    mismatch: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Mismatch' }
  };
  
  const { icon: Icon, color, bg, label } = config[quality as keyof typeof config];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${bg} ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// Planetary Position Card
const PlanetCard = ({ planet, sign, degree, nakshatra, retrograde }: any) => {
  const planetColors: Record<string, string> = {
    Sun: 'from-orange-500 to-yellow-500',
    Moon: 'from-slate-300 to-white',
    Mars: 'from-red-500 to-red-700',
    Mercury: 'from-green-400 to-emerald-600',
    Jupiter: 'from-yellow-400 to-amber-600',
    Venus: 'from-pink-400 to-rose-600',
    Saturn: 'from-blue-600 to-indigo-800',
    Rahu: 'from-slate-600 to-slate-800',
    Ketu: 'from-amber-700 to-amber-900'
  };
  
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${planetColors[planet]} flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">{planet.slice(0, 2)}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{planet}</span>
            {retrograde && <span className="text-xs text-red-400">℞</span>}
          </div>
          <p className="text-xs text-white/60">{sign} {degree.toFixed(2)}°</p>
          <p className="text-xs text-vedic-saffron">{nakshatra}</p>
        </div>
      </div>
    </div>
  );
};

// Event Analysis Card
const EventAnalysisCard = ({ analysis, index }: { analysis: EventAnalysis; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-vedic-saffron/20 rounded-lg flex items-center justify-center">
            <span className="text-vedic-saffron font-bold text-sm">{index + 1}</span>
          </div>
          <div>
            <p className="font-medium text-white">{analysis.event.eventType}</p>
            <p className="text-sm text-white/60">
              {new Date(analysis.event.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
              <span className="mx-2">•</span>
              {analysis.dashaBhukti}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <MatchBadge quality={analysis.matchQuality} />
          {isExpanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
        </div>
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          className="px-4 pb-4 border-t border-white/10"
        >
          <div className="pt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium text-white/80 mb-2">Analysis</h4>
              <p className="text-sm text-white/70">{analysis.explanation}</p>
            </div>
            
            {analysis.supportingFactors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2">Supporting Factors</h4>
                <ul className="space-y-1">
                  {analysis.supportingFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.concerningFactors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-400 mb-2">Concerning Factors</h4>
                <ul className="space-y-1">
                  {analysis.concerningFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 pt-2">
              {analysis.relevantCharts.map(chart => (
                <span key={chart} className="px-2 py-1 bg-vedic-saffron/20 text-vedic-saffron rounded text-xs">
                  {chart}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Main Results Display Component
export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'events' | 'chart' | 'dasha'>('summary');
  
  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'events', label: 'Event Analysis', icon: Calendar },
    { id: 'chart', label: 'Rectified Chart', icon: Star },
    { id: 'dasha', label: 'Dasha', icon: Clock }
  ];
  
  return (
    <div className="space-y-fib-8">
      {/* Hero Result Section - Golden Ratio Proportions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-fib-6"
      >
        <div className="inline-block">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.8, stiffness: 200 }}
            className="w-fib-7 h-fib-7 mx-auto bg-gradient-to-br from-vedic-saffron to-vedic-orange rounded-full flex items-center justify-center shadow-2xl shadow-vedic-saffron/40 relative"
          >
            <div className="absolute -inset-fib-2 bg-gradient-to-r from-vedic-saffron/20 to-vedic-orange/20 rounded-full animate-pulse" />
            <div className="relative text-center">
              <p className="text-4xl font-bold text-white mb-fib-1">{result.rectifiedTime}</p>
              <p className="text-sm text-white/80 uppercase tracking-wider">Rectified Time</p>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 21 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-h2 font-display font-bold text-white mb-fib-2">
            Birth Time Rectification Complete
          </h2>
          <p className="text-h5 text-white/70">
            Adjustment: {result.adjustmentMinutes >= 0 ? '+' : ''}{result.adjustmentMinutes} minutes from {result.originalTime}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 13 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <ConfidenceBadge level={result.confidenceLevel} score={result.confidenceScore} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-fib-3"
        >
          {result.methodsUsed.map((method, index) => (
            <motion.span
              key={method}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              className="px-fib-4 py-fib-2 bg-white/10 rounded-golden text-sm text-white/70 hover:bg-white/20 transition-all"
            >
              {method}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
      
      {/* Tabs - Golden Ratio Spacing */}
      <motion.div
        initial={{ opacity: 0, y: 21 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="flex justify-center"
      >
        <div className="inline-flex bg-white/5 rounded-golden p-fib-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-fib-2 px-fib-4 py-fib-3 rounded-golden text-h6 font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-vedic-saffron text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon className="w-fib-4 h-fib-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>
      
      {/* Tab Content - Golden Ratio Card */}
      <motion.div
        initial={{ opacity: 0, y: 13 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="vedic-card p-fib-8"
      >
        {activeTab === 'summary' && (
          <div className="space-y-fib-8">
            {/* Key Info Grid - Golden Ratio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-fib-6">
              <motion.div
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="vedic-card p-fib-6 text-center hover:border-vedic-saffron/30 transition-all"
              >
                <div className="flex items-center justify-center gap-fib-3 mb-fib-4">
                  <div className="p-fib-3 bg-vedic-saffron/20 rounded-golden">
                    <Sun className="w-fib-5 h-fib-5 text-vedic-saffron" />
                  </div>
                  <span className="font-semibold text-white text-h6">Lagna (Ascendant)</span>
                </div>
                <p className="text-3xl font-bold text-vedic-saffron mb-fib-2">
                  {result.rectifiedChart.rashi.lagna.sign}
                </p>
                <p className="text-white/60">
                  {result.rectifiedChart.rashi.lagna.degree}° {result.rectifiedChart.rashi.lagna.minute}' • {result.rectifiedChart.rashi.lagna.nakshatra}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="vedic-card p-fib-6 text-center hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center justify-center gap-fib-3 mb-fib-4">
                  <div className="p-fib-3 bg-blue-500/20 rounded-golden">
                    <Moon className="w-fib-5 h-fib-5 text-blue-400" />
                  </div>
                  <span className="font-semibold text-white text-h6">Moon Sign</span>
                </div>
                <p className="text-3xl font-bold text-blue-400 mb-fib-2">
                  {result.rectifiedChart.rashi.planets.find(p => p.planet === 'Moon')?.sign}
                </p>
                <p className="text-white/60">
                  {result.rectifiedChart.rashi.planets.find(p => p.planet === 'Moon')?.nakshatra} • Pada {result.rectifiedChart.rashi.planets.find(p => p.planet === 'Moon')?.pada}
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 21 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="vedic-card p-fib-6 text-center hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center justify-center gap-fib-3 mb-fib-4">
                  <div className="p-fib-3 bg-purple-500/20 rounded-golden">
                    <Clock className="w-fib-5 h-fib-5 text-purple-400" />
                  </div>
                  <span className="font-semibold text-white text-h6">Current Dasha</span>
                </div>
                <p className="text-3xl font-bold text-purple-400 mb-fib-2">
                  {result.rectifiedChart.vimshottariDasha.currentDasha}
                </p>
                <p className="text-white/60">
                  Antardasha: {result.rectifiedChart.vimshottariDasha.currentAntardasha}
                </p>
              </motion.div>
            </div>
            
            {/* Physical Verification - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, y: 21 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <h3 className="text-h4 font-semibold text-white mb-fib-5 flex items-center gap-fib-3">
                <User className="w-fib-5 h-fib-5 text-vedic-saffron" />
                Physical Description Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-fib-6">
                <div className="vedic-card p-fib-6 border-green-500/30 bg-green-500/10">
                  <h4 className="text-h6 font-medium text-green-400 mb-fib-4 flex items-center gap-fib-2">
                    <CheckCircle className="w-fib-4 h-fib-4" />
                    Matching Features
                  </h4>
                  <ul className="space-y-fib-3">
                    {result.physicalVerification.matches.map((match, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -13 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 2 + i * 0.1 }}
                        className="flex items-start gap-fib-3 text-white/80"
                      >
                        <CheckCircle className="w-fib-4 h-fib-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {match}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                {result.physicalVerification.mismatches.length > 0 && (
                  <div className="vedic-card p-fib-6 border-yellow-500/30 bg-yellow-500/10">
                    <h4 className="text-h6 font-medium text-yellow-400 mb-fib-4 flex items-center gap-fib-2">
                      <AlertCircle className="w-fib-4 h-fib-4" />
                      Non-Matching Features
                    </h4>
                    <ul className="space-y-fib-3">
                      {result.physicalVerification.mismatches.map((mismatch, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -13 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 2.2 + i * 0.1 }}
                          className="flex items-start gap-fib-3 text-white/80"
                        >
                          <AlertCircle className="w-fib-4 h-fib-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          {mismatch}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Recommendations - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, y: 21 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.2 }}
            >
              <h3 className="text-h4 font-semibold text-white mb-fib-5 flex items-center gap-fib-3">
                <Target className="w-fib-5 h-fib-5 text-vedic-saffron" />
                Recommendations
              </h3>
              <div className="space-y-fib-3">
                {result.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -21 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 2.4 + i * 0.1 }}
                    className="flex items-start gap-fib-4 p-fib-4 bg-white/5 rounded-golden hover:bg-white/10 transition-all"
                  >
                    <span className="w-fib-6 h-fib-6 bg-vedic-saffron/20 rounded-golden flex items-center justify-center text-vedic-saffron font-bold text-sm">
                      {i + 1}
                    </span>
                    <p className="text-white/90 leading-relaxed">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 21 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="space-y-fib-6"
          >
            <div className="flex items-center justify-between mb-fib-6">
              <h3 className="text-h4 font-semibold text-white">Event-by-Event Analysis</h3>
              <div className="flex items-center gap-fib-3 text-sm text-white/60">
                <span className="w-fib-3 h-fib-3 bg-green-500 rounded-full"></span>
                Strong: {result.eventAnalyses.filter(e => e.matchQuality === 'strong').length}
                <span className="w-fib-3 h-fib-3 bg-blue-500 rounded-full ml-fib-3"></span>
                Moderate: {result.eventAnalyses.filter(e => e.matchQuality === 'moderate').length}
              </div>
            </div>
            
            <div className="space-y-fib-4">
              {result.eventAnalyses.map((analysis, index) => (
                <EventAnalysisCard key={analysis.event.id} analysis={analysis} index={index} />
              ))}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'chart' && (
          <motion.div
            initial={{ opacity: 0, y: 21 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="space-y-fib-8"
          >
            <h3 className="text-h3 font-display font-semibold text-white mb-fib-6">Rectified Rashi Chart (D-1)</h3>
            
            {/* Lagna Info - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, x: -21 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="p-fib-6 bg-gradient-to-r from-vedic-saffron/20 to-vedic-orange/10 rounded-golden border border-vedic-saffron/30"
            >
              <div className="flex items-center gap-fib-6">
                <div className="w-fib-8 h-fib-8 bg-vedic-saffron rounded-golden flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {result.rectifiedChart.rashi.lagna.sign.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-h6 text-white/60 mb-fib-1">Lagna (Ascendant)</p>
                  <p className="text-2xl font-bold text-white mb-fib-2">{result.rectifiedChart.rashi.lagna.sign}</p>
                  <p className="text-h6 text-vedic-saffron">
                    {result.rectifiedChart.rashi.lagna.degree}° {result.rectifiedChart.rashi.lagna.minute}' •
                    {result.rectifiedChart.rashi.lagna.nakshatra} Pada {result.rectifiedChart.rashi.lagna.pada}
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Planetary Positions Grid - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, y: 21 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              <h4 className="text-h4 font-semibold text-white mb-fib-5">Planetary Positions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fib-4">
                {result.rectifiedChart.rashi.planets.map((planet, index) => (
                  <motion.div
                    key={planet.planet}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.8 + index * 0.1 }}
                  >
                    <PlanetCard
                      planet={planet.planet}
                      sign={planet.sign}
                      degree={planet.degree + planet.minute / 60}
                      nakshatra={planet.nakshatra}
                      retrograde={planet.retrograde}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Divisional Charts Summary - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, y: 21 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2 }}
            >
              <h4 className="text-h4 font-semibold text-white mb-fib-5">Divisional Charts Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-fib-4">
                {result.rectifiedChart.divisionalCharts.map((chart, index) => (
                  <motion.div
                    key={chart.chartType}
                    initial={{ opacity: 0, y: 13 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 + index * 0.1 }}
                    className="vedic-card p-fib-4 text-center hover:border-vedic-saffron/30 transition-all"
                  >
                    <p className="text-vedic-saffron font-medium text-sm mb-fib-1">{chart.chartType}</p>
                    <p className="text-white font-semibold">{chart.lagna.sign}</p>
                    <p className="text-xs text-white/60 mt-fib-1">{chart.lagna.degree.toFixed(1)}°</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {activeTab === 'dasha' && (
          <motion.div
            initial={{ opacity: 0, y: 21 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="space-y-fib-8"
          >
            <h3 className="text-h3 font-display font-semibold text-white mb-fib-6">Vimshottari Dasha</h3>
            
            {/* Birth Dasha Info - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="vedic-card p-fib-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-fib-6 text-center">
                <div>
                  <p className="text-h6 text-white/60 mb-fib-2">Birth Dasha</p>
                  <p className="text-2xl font-bold text-vedic-saffron">{result.rectifiedChart.vimshottariDasha.birthDasha}</p>
                </div>
                <div>
                  <p className="text-h6 text-white/60 mb-fib-2">Balance at Birth</p>
                  <p className="text-2xl font-bold text-white">
                    {result.rectifiedChart.vimshottariDasha.balanceYears}Y
                    {result.rectifiedChart.vimshottariDasha.balanceMonths}M
                    {result.rectifiedChart.vimshottariDasha.balanceDays}D
                  </p>
                </div>
                <div>
                  <p className="text-h6 text-white/60 mb-fib-2">Current Mahadasha</p>
                  <p className="text-2xl font-bold text-green-400">{result.rectifiedChart.vimshottariDasha.currentDasha}</p>
                </div>
                <div>
                  <p className="text-h6 text-white/60 mb-fib-2">Current Antardasha</p>
                  <p className="text-2xl font-bold text-blue-400">{result.rectifiedChart.vimshottariDasha.currentAntardasha}</p>
                </div>
              </div>
            </motion.div>
            
            {/* Dasha Sequence - Golden Ratio */}
            <motion.div
              initial={{ opacity: 0, y: 21 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              <h4 className="text-h4 font-semibold text-white mb-fib-5">Mahadasha Sequence</h4>
              <div className="space-y-fib-3">
                {result.rectifiedChart.vimshottariDasha.sequence.map((dasha, i) => {
                  const isCurrent = dasha.planet === result.rectifiedChart.vimshottariDasha.currentDasha;
                  const isPast = new Date() > dasha.endDate;
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -21 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.8 + i * 0.1 }}
                      className={`flex items-center justify-between p-fib-4 rounded-golden transition-all
                        ${isCurrent
                          ? 'bg-vedic-saffron/20 border border-vedic-saffron/50 shadow-lg shadow-vedic-saffron/20'
                          : isPast
                            ? 'bg-white/5 opacity-60'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-fib-4">
                        <div className={`w-fib-7 h-fib-7 rounded-golden flex items-center justify-center
                          ${isCurrent ? 'bg-vedic-saffron shadow-lg' : 'bg-white/10'}`}
                        >
                          <span className={`font-bold text-h6 ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                            {dasha.planet.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className={`font-semibold text-h6 ${isCurrent ? 'text-vedic-saffron' : 'text-white'}`}>
                            {dasha.planet} Mahadasha
                            {isCurrent && <span className="ml-fib-3 text-xs bg-vedic-saffron/30 px-fib-2 py-1 rounded-golden">Current</span>}
                          </p>
                          <p className="text-sm text-white/60">
                            {dasha.startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} -
                            {dasha.endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-h6 text-white/60">{dasha.years} years</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Action Buttons - Golden Ratio */}
      <motion.div
        initial={{ opacity: 0, y: 21 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.4 }}
        className="flex flex-wrap justify-center gap-fib-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-fib-3 px-fib-6 py-fib-4 bg-gradient-saffron text-white rounded-golden font-semibold hover:shadow-lg hover:shadow-vedic-saffron/40 transition-all"
        >
          <Download className="w-fib-5 h-fib-5" />
          Download Report
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-fib-3 px-fib-6 py-fib-4 bg-white/10 text-white rounded-golden font-semibold hover:bg-white/20 hover:shadow-lg transition-all"
        >
          <Share2 className="w-fib-5 h-fib-5" />
          Share Results
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="flex items-center gap-fib-3 px-fib-6 py-fib-4 bg-white/10 text-white rounded-golden font-semibold hover:bg-white/20 hover:shadow-lg transition-all"
        >
          <RotateCcw className="w-fib-5 h-fib-5" />
          New Analysis
        </motion.button>
      </motion.div>
    </div>
  );
}
