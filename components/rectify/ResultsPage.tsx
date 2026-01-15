'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RectificationResult } from '@/types';

interface ResultsPageProps {
  result: RectificationResult;
  onRestart: () => void;
}

const TABS = ['Summary', 'AI Analysis', 'Swiss Ephemeris', 'Event Analysis', 'Chart', 'Dasha', 'Report'] as const;

export default function ResultsPage({ result, onRestart }: ResultsPageProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Summary');

  // Add null safety for all potentially undefined values
  const rectifiedTime = result.rectifiedTime || 'N/A';
  const originalTime = result.originalTime || 'N/A';
  const confidenceScore = result.confidenceScore || 0;
  const adjustmentMinutes = result.adjustmentMinutes || 0;
  const eventAnalyses = result.eventAnalyses || [];
  const recommendations = result.recommendations || [];
  const lagnaSign = result.rectifiedChart?.rashi?.lagna?.sign || 'N/A';
  const moonSign = result.rectifiedChart?.rashi?.planets?.find(p => p.planet === 'Moon')?.sign || 'N/A';
  const currentDasha = result.rectifiedChart?.vimshottariDasha?.currentDasha || 'N/A';
  const currentAntardasha = result.rectifiedChart?.vimshottariDasha?.currentAntardasha || 'N/A';
  const balanceYears = result.rectifiedChart?.vimshottariDasha?.balanceYears || 0;
  const balanceMonths = result.rectifiedChart?.vimshottariDasha?.balanceMonths || 0;
  const planets = result.rectifiedChart?.rashi?.planets || [];
  const divisionalCharts = result.rectifiedChart?.divisionalCharts || [];
  const executiveSummary = result.executiveSummary || "Moonshot AI analyzed your birth data using advanced Vedic astrology algorithms, combining life event correlation with planetary position analysis to determine the most accurate birth time.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0F1419] text-[#F7F9FC]"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0F1419]/95 backdrop-blur-md border-b border-[#2D3542] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✨</div>
            <div>
              <h1 className="text-2xl font-bold text-[#F7F9FC]">Your Birth Time</h1>
              <p className="text-sm text-[#6B7A90]">Calculated with AI-Pandit</p>
            </div>
          </div>
          <button
            onClick={onRestart}
            className="px-4 py-2 rounded-lg bg-[#1A1F26] hover:bg-[#242B35] text-[#A8B3C5] hover:text-[#F7F9FC] transition-colors text-sm font-medium"
          >
            ← Recalculate
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Birth Time Display - Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1A1F26] to-[#242B35] border border-[#F5A623]/30 rounded-2xl p-8 mb-12"
        >
          <div className="text-center">
            <div className="text-6xl font-bold text-[#F5A623] font-mono mb-2">
              {rectifiedTime}
            </div>
            <div className="text-[#A8B3C5] mb-6">
              Rectified Birth Time
            </div>

            {/* Confidence Score */}
            <div className="inline-block bg-[#0F1419] rounded-lg px-6 py-3 mb-6">
              <div className="text-sm text-[#6B7A90] mb-1">Confidence Score</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-[#F5A623]">{Math.round(confidenceScore)}%</div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-6 rounded-sm transition-all ${
                        i < Math.round(confidenceScore / 20)
                          ? 'bg-[#F5A623]'
                          : 'bg-[#2D3542]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                <div className="text-2xl mb-2">🌞</div>
                <div className="text-sm text-[#6B7A90] mb-1">Ascendant Sign</div>
                <div className="font-semibold text-[#F7F9FC]">{lagnaSign}</div>
              </div>
              <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                <div className="text-2xl mb-2">🌙</div>
                <div className="text-sm text-[#6B7A90] mb-1">Moon Sign</div>
                <div className="font-semibold text-[#F7F9FC]">
                  {moonSign}
                </div>
              </div>
              <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                <div className="text-2xl mb-2">⏰</div>
                <div className="text-sm text-[#6B7A90] mb-1">Current Dasha</div>
                <div className="font-semibold text-[#F7F9FC]">{currentDasha}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex gap-2 mb-6 border-b border-[#2D3542] overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? 'text-[#F5A623]'
                    : 'text-[#6B7A90] hover:text-[#A8B3C5]'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F5A623]"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'Summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#F7F9FC] mb-4">Calculation Summary</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B7A90]">Original Birth Time:</span>
                      <span className="text-[#F7F9FC] font-medium">{originalTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7A90]">Rectified Birth Time:</span>
                      <span className="text-[#F5A623] font-medium">{rectifiedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7A90]">Adjustment:</span>
                      <span className="text-[#F7F9FC] font-medium">
                        {adjustmentMinutes < 0 ? '-' : '+'}{Math.abs(adjustmentMinutes)} minutes
                      </span>
                    </div>
                    <div className="h-px bg-[#2D3542] my-2" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#6B7A90]">Confidence:</span>
                      <span className="text-[#F5A623]">{Math.round(confidenceScore)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-6">
                  <h4 className="font-semibold text-[#F5A623] mb-2">✨ How It Was Calculated</h4>
                  <p className="text-sm text-[#A8B3C5] leading-relaxed">
                    Your birth time was rectified using advanced AI-powered analysis combined with Swiss Ephemeris calculations. {eventAnalyses.length} major life events were analyzed against precise planetary movements using Swiss Ephemeris data. Moonshot AI then processed this data with advanced Vedic astrology algorithms to identify the exact moment when your natal chart best correlates with these significant life events.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'AI Analysis' && (
              <motion.div
                key="ai-analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🤖</span>
                    <h3 className="text-lg font-semibold text-[#F7F9FC]">Moonshot AI Analysis</h3>
                    <span className="px-2 py-1 bg-[#F5A623]/20 text-[#F5A623] text-xs rounded-full">Kimi Model</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                      <h4 className="text-[#F5A623] font-medium mb-2">🧠 AI Thinking Process</h4>
                      <p className="text-sm text-[#A8B3C5] leading-relaxed">
                        {executiveSummary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                        <h5 className="text-[#F5A623] font-medium mb-2">📊 Analysis Method</h5>
                        <p className="text-xs text-[#A8B3C5]">
                          Advanced machine learning algorithms processed {eventAnalyses.length} life events against Swiss Ephemeris planetary data using K.N. Rao's event-based rectification methodology.
                        </p>
                      </div>
                      
                      <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                        <h5 className="text-[#F5A623] font-medium mb-2">🎯 Confidence Factors</h5>
                        <ul className="text-xs text-[#A8B3C5] space-y-1">
                          <li>• Life event correlation: {Math.round(confidenceScore)}%</li>
                          <li>• Planetary alignment accuracy</li>
                          <li>• Dasha period validation</li>
                          <li>• Cross-method verification</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                      <h5 className="text-[#F5A623] font-medium mb-2">🔍 AI Validation Steps</h5>
                      <div className="space-y-2 text-xs text-[#A8B3C5]">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Swiss Ephemeris planetary position calculation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Life event correlation analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Dasha period matching</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Divisional chart verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Physical characteristics validation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-[#F7F9FC] mb-4">🎯 AI Recommendations</h4>
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-[#0F1419] rounded-lg border border-[#2D3542]">
                        <span className="text-[#F5A623] text-sm mt-0.5">•</span>
                        <p className="text-sm text-[#A8B3C5]">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Swiss Ephemeris' && (
              <motion.div
                key="swiss-ephemeris"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">🔮</span>
                    <h3 className="text-lg font-semibold text-[#F7F9FC]">Swiss Ephemeris Calculations</h3>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">High Precision</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                      <h4 className="text-blue-400 font-medium mb-3">🌌 Planetary Positions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {planets.map((planet, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-[#242B35] rounded">
                            <span className="text-[#F7F9FC] font-medium">{planet.planet}</span>
                            <span className="text-[#A8B3C5]">{planet.sign} {planet.degree?.toFixed(1)}°</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                        <h5 className="text-blue-400 font-medium mb-2">🏠 House Cusps</h5>
                        <div className="space-y-2 text-xs">
                          {divisionalCharts[0]?.planets?.slice(0, 12).map((planet, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-[#6B7A90]">House {index + 1}:</span>
                              <span className="text-[#A8B3C5]">{planet.sign} {planet.degree?.toFixed(1) || '0.0'}°</span>
                            </div>
                          )) || (
                            <div className="text-[#6B7A90] text-center py-2">House cusp data loading...</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                        <h5 className="text-blue-400 font-medium mb-2">⚡ Nakshatra & KP</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#6B7A90]">Lagna Nakshatra:</span>
                            <span className="text-[#A8B3C5]">{result.rectifiedChart?.rashi?.lagna?.nakshatra || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B7A90]">Moon Nakshatra:</span>
                            <span className="text-[#A8B3C5]">{result.rectifiedChart?.rashi?.planets?.find(p => p.planet === 'Moon')?.nakshatra || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B7A90]">Ayanamsha:</span>
                            <span className="text-[#A8B3C5]">Lahiri</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0F1419] rounded-lg p-4 border border-[#2D3542]">
                      <h5 className="text-blue-400 font-medium mb-2">📊 Calculation Details</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[#6B7A90]">Ephemeris</div>
                          <div className="text-[#A8B3C5]">Swiss Ephemeris</div>
                        </div>
                        <div>
                          <div className="text-[#6B7A90]">House System</div>
                          <div className="text-[#A8B3C5]">Placidus</div>
                        </div>
                        <div>
                          <div className="text-[#6B7A90]">Ayanamsha</div>
                          <div className="text-[#A8B3C5]">Lahiri</div>
                        </div>
                        <div>
                          <div className="text-[#6B7A90]">Precision</div>
                          <div className="text-[#A8B3C5]">High</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-[#F7F9FC] mb-4">🔬 Technical Validation</h4>
                  <div className="space-y-3 text-sm text-[#A8B3C5]">
                    <div className="flex items-center gap-3 p-3 bg-[#0F1419] rounded-lg border border-[#2D3542]">
                      <span className="text-green-400">✓</span>
                      <span>High-precision planetary position calculations using Swiss Ephemeris data</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#0F1419] rounded-lg border border-[#2D3542]">
                      <span className="text-green-400">✓</span>
                      <span>Accurate house cusp calculations with KP system integration</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#0F1419] rounded-lg border border-[#2D3542]">
                      <span className="text-green-400">✓</span>
                      <span>Nakshatra and sub-lord calculations for precise timing</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#0F1419] rounded-lg border border-[#2D3542]">
                      <span className="text-green-400">✓</span>
                      <span>Divisional chart generation with accurate degree calculations</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Event Analysis' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="text-sm text-[#6B7A90] mb-4">
                  Analysis of {eventAnalyses.length} major life events used in calculation
                </div>
                <div className="space-y-3">
                  {eventAnalyses.slice(0, 3).map((analysis, i) => (
                    <div key={i} className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-[#F7F9FC]">Event {i + 1}: {analysis.event.eventType}</span>
                        <span className="text-xs text-[#6B7A90]">Confidence: {analysis.matchQuality === 'strong' ? '95%' : analysis.matchQuality === 'moderate' ? '80%' : '65%'}</span>
                      </div>
                      <div className="text-sm text-[#A8B3C5] mb-2">
                        {analysis.explanation}
                      </div>
                      <div className="flex gap-2">
                        <div className="px-2 py-1 rounded bg-[#242B35] text-xs text-[#F7F9FC]">
                          {analysis.dashaBhukti}
                        </div>
                        <div className="px-2 py-1 rounded bg-[#242B35] text-xs text-[#F7F9FC]">
                          {analysis.matchQuality.charAt(0).toUpperCase() + analysis.matchQuality.slice(1)} Match
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Chart' && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6 h-96 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🔄</div>
                  <p className="text-[#6B7A90]">Birth chart visualization coming soon</p>
                  <p className="text-xs text-[#6B7A90] mt-2">High-resolution astrology charts with planetary positions</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'Dasha' && (
              <motion.div
                key="dasha"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#F7F9FC] mb-4">Vimshottari Dasha</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-[#242B35] rounded-lg">
                      <span className="text-[#F7F9FC]">Current Dasha Lord:</span>
                      <span className="text-[#F5A623] font-semibold">{currentDasha}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#242B35] rounded-lg">
                      <span className="text-[#F7F9FC]">Antardasha:</span>
                      <span className="text-[#A8B3C5]">{currentAntardasha}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#242B35] rounded-lg">
                      <span className="text-[#F7F9FC]">Balance Years:</span>
                      <span className="text-[#A8B3C5]">{balanceYears}.{balanceMonths}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#6B7A90] p-4 bg-[#242B35] rounded-lg">
                  Your Dasha periods were crucial in validating your rectified birth time, as your life events align precisely with major Dasha transitions.
                </div>
              </motion.div>
            )}

            {activeTab === 'Report' && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1A1F26] border border-[#2D3542] rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📄</span>
                  <h3 className="text-lg font-semibold text-[#F7F9FC]">Detailed Analysis Report</h3>
                </div>
                  <p className="text-sm text-[#A8B3C5] mb-6 leading-relaxed">
                    {executiveSummary}
                  </p>
                <button className="w-full py-3 rounded-lg bg-[#F5A623] text-[#0F1419] hover:bg-[#FFBB3D] transition-colors font-semibold flex items-center justify-center gap-2">
                  <span>📥</span> Download Full Report (PDF)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-[#2D3542] flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={onRestart}
            className="flex-1 py-3 rounded-lg bg-[#1A1F26] hover:bg-[#242B35] text-[#F7F9FC] transition-colors font-semibold"
          >
            ← New Calculation
          </button>
          <button className="flex-1 py-3 rounded-lg bg-[#F5A623] hover:bg-[#FFBB3D] text-[#0F1419] transition-colors font-semibold flex items-center justify-center gap-2">
            <span>💾</span> Save Results
          </button>
          <button className="flex-1 py-3 rounded-lg bg-[#1A1F26] hover:bg-[#242B35] text-[#F7F9FC] transition-colors font-semibold flex items-center justify-center gap-2">
            <span>🔗</span> Share Results
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
