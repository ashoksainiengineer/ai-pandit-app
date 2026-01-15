'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BTRProgressUpdate, FinalBTRReport, BTRPhase, SwissEphCalculation, AIAnalysis, ActivityLogEntry } from '@/types/btr-realtime';
import { TopBar } from './TopBar';
import { SwissEphPanel } from './SwissEphPanel';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { ActivityLogPanel } from './ActivityLogPanel';
import { FinalReport } from './FinalReport';
import { useCelebrationAnimation } from '@/lib/celebrationAnimation';

interface RealTimeDisplayProps {
  onComplete?: (report: FinalBTRReport) => void;
}

export const RealTimeDisplay: React.FC<RealTimeDisplayProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<BTRProgressUpdate>({
    phase: {
      id: 'initialization',
      name: 'Starting rectification...',
      description: 'Initializing birth time rectification process',
      progressWeight: 0
    },
    overallProgress: 0,
    timeElapsed: 0,
    estimatedRemaining: 0,
    swissEphCalculations: [],
    aiAnalyses: [],
    activityLog: []
  });

  const [isComplete, setIsComplete] = useState(false);
  const [finalReport, setFinalReport] = useState<FinalBTRReport | null>(null);
  const { isActive, triggerCelebration, particles } = useCelebrationAnimation();

  // Simulate real-time updates (this will be replaced with actual BTR workflow integration)
  useEffect(() => {
    if (isComplete) return;

    const phases: BTRPhase[] = [
      { id: 'initialization', name: 'Starting rectification...', description: 'Initializing birth time rectification process', progressWeight: 0 },
      { id: 'phase1', name: 'Phase 1: Testing 120 candidates (2-min intervals)', description: 'Testing 120 candidates with 2-minute intervals', progressWeight: 40 },
      { id: 'phase2', name: 'Phase 2: Refining top 5 (30-sec precision)', description: 'Refining top 5 candidates with 30-second precision', progressWeight: 30 },
      { id: 'phase3', name: 'Phase 3: Final precision (5-sec intervals)', description: 'Final precision with 5-second intervals', progressWeight: 20 },
      { id: 'finalization', name: 'Generating report...', description: 'Generating comprehensive final report', progressWeight: 4 },
      { id: 'complete', name: 'Complete!', description: 'Birth time rectification complete', progressWeight: 1 }
    ];

    let currentPhaseIndex = 0;
    let candidateCount = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      if (currentPhaseIndex >= phases.length) {
        clearInterval(interval);
        return;
      }

      const currentPhase = phases[currentPhaseIndex];
      const phaseProgress = Math.min((candidateCount / 120) * currentPhase.progressWeight, currentPhase.progressWeight);
      const overallProgress = phases.slice(0, currentPhaseIndex).reduce((sum, p) => sum + p.progressWeight, 0) + phaseProgress;

      // Generate mock data for demonstration
      const newCalculation: SwissEphCalculation = {
        id: `calc-${Date.now()}`,
        timestamp: new Date(),
        candidateTime: `10:${23 + Math.floor(candidateCount / 60)}:${(candidateCount % 60).toString().padStart(2, '0')} AM`,
        calculations: {
          julianDay: (2460321.75432 + candidateCount * 0.00001).toFixed(5),
          ascendant: {
            sign: ['Taurus', 'Gemini', 'Cancer'][Math.floor(Math.random() * 3)],
            degree: parseFloat((15 + Math.random() * 15).toFixed(2)),
            nakshatra: ['Rohini', 'Mrigashira', 'Punarvasu'][Math.floor(Math.random() * 3)],
            pada: Math.floor(Math.random() * 4) + 1
          },
          moon: {
            sign: ['Cancer', 'Leo', 'Virgo'][Math.floor(Math.random() * 3)],
            degree: parseFloat((8 + Math.random() * 15).toFixed(2)),
            nakshatra: ['Pushya', 'Ashlesha', 'Magha'][Math.floor(Math.random() * 3)],
            pada: Math.floor(Math.random() * 4) + 1
          },
          birthDasha: {
            planet: ['Venus', 'Sun', 'Moon'][Math.floor(Math.random() * 3)],
            yearsRemaining: parseFloat((10 + Math.random() * 5).toFixed(1))
          },
          divisionalCharts: {
            d9: ['Libra', 'Scorpio', 'Sagittarius'][Math.floor(Math.random() * 3)],
            d10: ['Capricorn', 'Aquarius', 'Pisces'][Math.floor(Math.random() * 3)]
          },
          yogas: [
            { name: 'Raj Yoga', houses: '1-9', strength: 'strong' as const },
            { name: 'Dhana Yoga', houses: '2-11', strength: 'moderate' as const }
          ]
        }
      };

      const score = Math.floor(70 + Math.random() * 25);
      const newAIAnalysis: AIAnalysis = {
        id: `ai-${Date.now()}`,
        candidateTime: newCalculation.candidateTime,
        status: 'complete' as const,
        overallScore: score,
        breakdown: {
          ascendantMatch: Math.floor(15 + Math.random() * 5),
          dashaCorrelation: Math.floor(40 + Math.random() * 8),
          divisionalHarmony: Math.floor(15 + Math.random() * 4),
          yogaTiming: Math.floor(8 + Math.random() * 2)
        },
        insights: [
          { type: 'success' as const, message: 'Marriage perfectly matches Venus Antardasha', icon: '✓' as const },
          { type: 'warning' as const, message: 'Job loss shows weak correlation', icon: '⚠' as const }
        ],
        processingTime: 2000 + Math.random() * 1000
      };

      const newLogEntry: ActivityLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level: candidateCount === 0 ? 'info' as const : 'calculation' as const,
        message: candidateCount === 0 ? 'Starting rectification' : `Testing #${candidateCount + 1}: ${newCalculation.candidateTime}`,
        candidateNumber: candidateCount + 1,
        candidateTime: newCalculation.candidateTime
      };

      setProgress(prev => ({
        phase: currentPhase,
        overallProgress: Math.min(overallProgress, 100),
        timeElapsed: elapsed,
        estimatedRemaining: Math.max(0, 300 - elapsed), // 5 minutes estimated
        currentCandidate: {
          number: candidateCount + 1,
          time: newCalculation.candidateTime,
          score: score
        },
        bestCandidate: score > (prev.bestCandidate?.score || 0) 
          ? { time: newCalculation.candidateTime, score }
          : prev.bestCandidate,
        swissEphCalculations: [...prev.swissEphCalculations.slice(-5), newCalculation],
        aiAnalyses: [...prev.aiAnalyses.slice(-3), newAIAnalysis],
        activityLog: [...prev.activityLog, newLogEntry]
      }));

      candidateCount++;

      // Move to next phase
      if (candidateCount >= 120 && currentPhaseIndex === 1) {
        currentPhaseIndex = 2;
        candidateCount = 0;
      } else if (candidateCount >= 5 && currentPhaseIndex === 2) {
        currentPhaseIndex = 3;
        candidateCount = 0;
      } else if (candidateCount >= 10 && currentPhaseIndex === 3) {
        currentPhaseIndex = 4;
        candidateCount = 0;
      } else if (currentPhaseIndex === 4) {
        currentPhaseIndex = 5;
        
        // Generate final report
        const mockReport: FinalBTRReport = {
          executiveSummary: {
            originalTime: '10:30:00 AM',
            rectifiedTime: '10:23:45 AM',
            adjustment: '-6 min 15 sec',
            confidence: 89,
            confidenceCategory: 'HIGH',
            candidatesTested: 204,
            duration: '4 min 32 sec'
          },
          rectifiedChart: {
            ascendant: {
              sign: 'Taurus',
              degree: 15.34,
              nakshatra: 'Rohini',
              pada: 2
            },
            moon: {
              sign: 'Cancer',
              degree: 8.76,
              nakshatra: 'Pushya',
              pada: 3
            },
            birthDasha: {
              planet: 'Venus',
              yearsRemaining: 12.5
            },
            planetaryPositions: [
              { planet: 'Sun', sign: 'Aries', degree: 10.5, nakshatra: 'Ashwini', retrograde: false },
              { planet: 'Moon', sign: 'Cancer', degree: 8.76, nakshatra: 'Pushya', retrograde: false },
              { planet: 'Mars', sign: 'Scorpio', degree: 22.3, nakshatra: 'Jyeshtha', retrograde: false },
              { planet: 'Mercury', sign: 'Taurus', degree: 5.2, nakshatra: 'Krittika', retrograde: true },
              { planet: 'Jupiter', sign: 'Pisces', degree: 18.7, nakshatra: 'Revati', retrograde: false },
              { planet: 'Venus', sign: 'Gemini', degree: 12.4, nakshatra: 'Ardra', retrograde: false },
              { planet: 'Saturn', sign: 'Aquarius', degree: 25.1, nakshatra: 'Purva Bhadra', retrograde: false },
              { planet: 'Rahu', sign: 'Virgo', degree: 15.8, nakshatra: 'Hasta', retrograde: true },
              { planet: 'Ketu', sign: 'Pisces', degree: 15.8, nakshatra: 'Uttara Bhadra', retrograde: true }
            ],
            divisionalCharts: {
              d9: 'Libra',
              d10: 'Capricorn',
              d7: 'Leo',
              d12: 'Scorpio',
              d30: 'Gemini'
            },
            yogas: [
              { name: 'Raj Yoga', description: 'Lords of 1st and 9th houses conjunct', strength: 'strong' },
              { name: 'Dhana Yoga', description: 'Lords of 2nd and 11th houses in mutual aspect', strength: 'moderate' },
              { name: 'Gaja Kesari Yoga', description: 'Jupiter in Kendra from Moon', strength: 'strong' }
            ]
          },
          eventCorrelations: [
            {
              event: 'Marriage on June 15, 2015',
              date: 'June 15, 2015',
              expected: 'Venus/7th lord',
              actual: 'Venus Maha, Jupiter Antar',
              quality: 'EXCELLENT',
              score: 10,
              reasoning: 'Venus Mahadasha with Jupiter Antardasha is classic marriage timing. D9 shows strong 7th house with Venus in own sign.'
            },
            {
              event: 'Career change March 2018',
              date: 'March 2018',
              expected: '10th lord',
              actual: 'Sun Maha, Saturn Antar',
              quality: 'GOOD',
              score: 7,
              reasoning: 'Sun as 10th lord supports career change. D10 shows 10th lord well-placed.'
            }
          ],
          scoringBreakdown: {
            dashaEvent: { score: 45, max: 50, percentage: 90 },
            ascendant: { score: 18, max: 20, percentage: 90 },
            divisional: { score: 17, max: 20, percentage: 85 },
            yogas: { score: 9, max: 10, percentage: 90 },
            total: { score: 89, max: 100, percentage: 89 }
          },
          supportingEvidence: [
            { type: 'Dasha Correlation', description: 'All major events aligned with dashas', impact: 'positive' },
            { type: 'Ascendant Match', description: 'Ascendant matches temperament', impact: 'positive' },
            { type: 'D9 Support', description: 'D9 supports marriage quality', impact: 'positive' }
          ],
          redFlags: [
            { issue: 'Minor health issue weak correlation', severity: 'low', recommendation: 'Add more specific health event dates' },
            { issue: 'Small relocation not strongly indicated', severity: 'low', recommendation: 'Include exact relocation dates' }
          ],
          alternativeTimes: [
            { time: '10:24:15 AM', score: 87, rank: 2 },
            { time: '10:22:30 AM', score: 85, rank: 3 },
            { time: '10:25:00 AM', score: 82, rank: 4 }
          ],
          recommendations: {
            primary: 'Excellent match. Use with high confidence.',
            secondary: [
              'Add 2-3 more significant events for even higher accuracy',
              'Consider family verification of birth time window'
            ],
            nextSteps: [
              'Download PDF report for records',
              'Share with astrologer for verification',
              'Use rectified time for all future calculations'
            ]
          },
          methodology: {
            ayanamsa: 'Lahiri (Chitrapaksha)',
            houseSystem: 'Whole Sign (Vedic)',
            dashaSystem: 'Vimshottari (120 years)',
            divisionalCharts: ['D1', 'D9', 'D10', 'D7', 'D12', 'D30'],
            aiModel: 'Moonshot with classical principles',
            precision: 'Seconds-level (±5 sec)',
            iterations: 204,
            references: ['Parashara', 'K.N. Rao methods']
          }
        };

        setFinalReport(mockReport);
        setIsComplete(true);
        triggerCelebration();
        
        if (onComplete) {
          onComplete(mockReport);
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isComplete, onComplete, triggerCelebration]);

  if (isComplete && finalReport) {
    return <FinalReport report={finalReport} />;
  }

  const [activeTab, setActiveTab] = useState('swiss-ephemeris');
  
  const tabs = [
    { id: 'swiss-ephemeris', label: 'Swiss Ephemeris (KP Ayanamsha)', icon: '🔮' },
    { id: 'ai-analysis', label: 'Moonshot AI Analysis', icon: '🤖' },
    { id: 'iterative-refinement', label: 'Iterative Refinement', icon: '🔄' },
    { id: 'event-validation', label: 'Event-Based Validation', icon: '📅' },
    { id: 'divisional-analysis', label: 'Divisional Chart Analysis', icon: '📊' }
  ];

  // Debug: Log the data being passed to child components
  console.log('RealTimeDisplay - Data check:', {
    swissEphCount: progress.swissEphCalculations.length,
    aiAnalysesCount: progress.aiAnalyses.length,
    activityLogCount: progress.activityLog.length,
    currentCandidate: progress.currentCandidate,
    bestCandidate: progress.bestCandidate,
    overallProgress: progress.overallProgress
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Active Processing Indicator */}
      {!isComplete && (
        <div className="fixed top-4 right-4 z-40 bg-green-900/30 border border-green-500/50 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">Processing Active</span>
          </div>
        </div>
      )}
      
      {/* Celebration Overlay */}
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {particles.map((particle: any) => (
            <div
              key={particle.id}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                transition: 'none'
              }}
            />
          ))}
          
          {/* Center celebration message */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">🎊</div>
              <div className="text-4xl font-bold text-white mb-2">
                Rectification Complete!
              </div>
              <div className="text-xl text-gray-300">
                AI Analysis Finished
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6">
        {/* Header with active animation */}
        {!isComplete && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
              <div className="relative">
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-ping absolute inline-flex" />
                <div className="w-4 h-4 bg-purple-400 rounded-full relative inline-flex" />
              </div>
              <span className="text-purple-300 font-semibold">
                🔮 Birth Time Rectification in Progress...
              </span>
            </div>
          </div>
        )}
        
        {/* Top Bar */}
        <TopBar progress={progress} />
        
        {/* Tab Navigation */}
        <div className="mt-6">
          <div className="flex gap-2 mb-6 border-b border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Debug Info Panel */}
          {!isComplete && (
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-red-500/20 mb-6">
              <h3 className="text-lg font-bold text-red-400 mb-3">🔍 Debug Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-500">SwissEph Calculations:</span>
                  <span className="text-white font-bold">{progress.swissEphCalculations.length}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">AI Analyses:</span>
                  <span className="text-white font-bold">{progress.aiAnalyses.length}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Activity Log:</span>
                  <span className="text-white font-bold">{progress.activityLog.length}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">Overall Progress:</span>
                  <span className="text-white font-bold">{Math.round(progress.overallProgress)}%</span>
                </div>
              </div>
              {progress.currentCandidate && (
                <div className="mt-3 text-gray-300">
                  <span className="text-gray-500">Current Candidate:</span>
                  <span className="text-white font-bold">{progress.currentCandidate.time} ({progress.currentCandidate.score}/100)</span>
                </div>
              )}
            </div>
          )}
          
          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'swiss-ephemeris' && (
              <SwissEphPanel calculations={progress.swissEphCalculations} />
            )}
            
            {activeTab === 'ai-analysis' && (
              <AIAnalysisPanel analyses={progress.aiAnalyses} />
            )}
            
            {activeTab === 'iterative-refinement' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="text-2xl mr-3">🔄</span>
                  Iterative Refinement Process
                </h2>
                {progress.currentCandidate ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-500/30">
                      <div className="text-lg font-bold text-white">
                        Current Candidate: {progress.currentCandidate.time}
                      </div>
                      <div className="text-sm text-blue-300 mt-1">
                        Score: {progress.currentCandidate.score}/100
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                      <div className="text-gray-300 text-sm mb-2">Phase: {progress.phase.name}</div>
                      <div className="text-white font-medium">
                        {progress.phase.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">Initializing refinement process...</div>
                )}
              </div>
            )}
            
            {activeTab === 'event-validation' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="text-2xl mr-3">📅</span>
                  Event-Based Validation
                </h2>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-gray-300 text-sm mb-2">Validation Method</div>
                    <div className="text-white font-medium">
                      Correlating life events with dasha periods and planetary transits
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-gray-300 text-sm mb-2">Events Analyzed</div>
                    <div className="text-white font-medium">
                      Marriage, career changes, education milestones, and major life transitions
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'divisional-analysis' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  Divisional Chart Analysis
                </h2>
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-gray-300 text-sm mb-2">Charts Calculated</div>
                    <div className="text-white font-medium">
                      D-1 (Rashi), D-9 (Navamsa), D-10 (Dasamsa), D-7 (Saptamsa), D-12 (Dwadasamsa), D-30 (Trimsamsa)
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="text-gray-300 text-sm mb-2">Analysis Focus</div>
                    <div className="text-white font-medium">
                      Marriage (D-9), Career (D-10), Children (D-7), Parents (D-12), Misfortunes (D-30)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Activity Log Panel - Always visible at bottom */}
        <div className="mt-6">
          <ActivityLogPanel logEntries={progress.activityLog} />
        </div>
      </div>
    </div>
  );
};