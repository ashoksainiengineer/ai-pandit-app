/**
 * ResultsPage.tsx
 * Enhanced results page with TypeScript, security, and accessibility
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Candidate {
  time: string;
  score: number;
  confidence: 'High' | 'Medium' | 'Low';
  offsetDescription: string;
  recommendation?: string;
  analysis?: string;
  dashaAnalysis?: string;
}

interface Statistics {
  totalCandidatesGenerated: number;
  topCandidatesAnalyzed: number;
  deepAnalysisCount: number;
  allCandidateScores: Array<{
    time: string;
    quickScore: number;
    offsetDescription: string;
  }>;
  processingTime: {
    totalSeconds: number;
  };
}

interface AnalysisData {
  rectifiedTime: string;
  accuracy: number;
  confidence: 'High' | 'Medium' | 'Low';
  topRecommendation: Candidate;
  alternativeOptions: Candidate[];
  statistics: Statistics;
}

interface ResultsPageProps {
  analysisData: AnalysisData;
  onNewAnalysis: () => void;
}

type TabType = 'top' | 'alternatives' | 'all';

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Sanitization Utility
// ═══════════════════════════════════════════════════════════════════════════════

function sanitizeHtml(input: string | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function truncateText(text: string | undefined, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '...';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryState {
  hasError: boolean;
}

class ResultsPageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ResultsPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#F5F0EB] mb-2">Something Went Wrong</h2>
          <p className="text-[#8C7F72] mb-4">Failed to display results. Please try refreshing.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#D4AF37] text-[#0F1419] rounded-lg font-medium"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANDIDATE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CandidateCardProps {
  candidate: Candidate;
  rank?: number;
}

function CandidateCard({ candidate, rank }: CandidateCardProps) {
  const scoreColor = useMemo(() => {
    if (candidate.score >= 80) return 'text-emerald-400';
    if (candidate.score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }, [candidate.score]);

  const confidenceColor = useMemo(() => {
    if (candidate.confidence === 'High') {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (candidate.confidence === 'Medium') {
      return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    }
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  }, [candidate.confidence]);

  return (
    <div className="bg-[#0F1419] rounded-xl border border-[#3A4452] p-6 space-y-4 hover:border-[#D4AF37]/30 transition-all">
      {rank && (
        <p className="text-[10px] font-black text-[#8C7F72] uppercase tracking-[0.2em]">
          Priority Sequence Alpha #{rank}
        </p>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-mono font-black text-[#D4AF37] tracking-tighter">
          {candidate.time}
        </h3>
        <div className="text-right">
          <p className={`text-2xl font-black ${scoreColor}`}>{candidate.score}%</p>
          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${confidenceColor} mt-1`}>
            {candidate.confidence} Confidence
          </span>
        </div>
      </div>

      <p className="text-[#8C7F72] text-xs font-medium uppercase tracking-wider">
        {sanitizeHtml(candidate.offsetDescription)}
      </p>

      {candidate.recommendation && (
        <div className="bg-[#151a21] rounded-xl border border-[#3A4452]/50 p-6">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">
            Neural Decision
          </p>
          <p className="text-[#C4B8AD] text-sm leading-relaxed">
            {sanitizeHtml(candidate.recommendation)}
          </p>
        </div>
      )}

      {candidate.analysis && (
        <div className="bg-[#151a21] rounded-xl border border-[#3A4452]/50 p-6 max-h-64 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-[#8C7F72] uppercase tracking-widest mb-3">
            Verification Trace
          </p>
          <p className="text-[#8C7F72] text-xs leading-relaxed whitespace-pre-wrap">
            {sanitizeHtml(candidate.analysis)}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RESULTS PAGE CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

function ResultsPageContent({ analysisData, onNewAnalysis }: ResultsPageProps) {
  const [selectedTab, setSelectedTab] = useState<TabType>('top');
  const [isLoading, setIsLoading] = useState(false);

  // Destructure with defaults for safety
  const {
    rectifiedTime = 'Unknown',
    accuracy = 0,
    confidence = 'Medium',
    topRecommendation,
    alternativeOptions = [],
    statistics,
  } = analysisData || {};

  // Handle new analysis with loading state
  const handleNewAnalysis = useCallback(() => {
    setIsLoading(true);
    try {
      onNewAnalysis();
    } catch (error) {
      console.error('Failed to start new analysis:', error);
      setIsLoading(false);
    }
  }, [onNewAnalysis]);

  // Extract section helper
  const extractSection = useCallback((text: string | undefined, section: string): string => {
    if (!text) return 'Analysis pending...';
    const regex = new RegExp(`${section}[^:]*:([^]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? sanitizeHtml(match[1].trim().substring(0, 200)) : 'Analysis pending...';
  }, []);

  // Validate data integrity
  if (!analysisData || !topRecommendation) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#F5F0EB] mb-2">Invalid Data</h2>
        <p className="text-[#8C7F72] mb-4">The analysis data is incomplete or corrupted.</p>
        <button
          onClick={handleNewAnalysis}
          className="px-6 py-3 bg-[#D4AF37] text-[#0F1419] rounded-lg font-bold"
        >
          Start New Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#F5F0EB]">
      {/* Top Recommendation Card */}
      <div className="bg-[#151a21] border-2 border-[#D4AF37]/30 rounded-xl p-8 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
        <div className="text-center">
          <p className="text-[10px] font-black text-[#8C7F72] uppercase tracking-[0.3em] mb-4">
            Rectified Birth Time
          </p>
          <h1 className="text-6xl font-black text-[#D4AF37] font-mono mb-6 tracking-tighter">
            {rectifiedTime}
          </h1>

          <div className="flex justify-center gap-12 mb-8">
            <div className="text-center">
              <p className="text-[10px] text-[#8C7F72] uppercase font-bold mb-1">Accuracy Score</p>
              <p className="text-4xl font-black text-[#F5F0EB]">{accuracy}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[#8C7F72] uppercase font-bold mb-1">Confidence</p>
              <p
                className={`text-4xl font-black ${
                  confidence === 'High'
                    ? 'text-emerald-400'
                    : confidence === 'Medium'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {confidence}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-8">
            <Clock className="w-4 h-4" aria-hidden="true" />
            {sanitizeHtml(topRecommendation.offsetDescription)}
          </div>

          <div className="bg-[#0F1419] border border-[#3A4452] rounded-xl p-8 text-left space-y-6">
            <div>
              <h3 className="text-[#D4AF37] font-black uppercase tracking-wider text-sm mb-3">
                Logical Verdict
              </h3>
              <p className="text-[#C4B8AD] leading-relaxed">
                {sanitizeHtml(truncateText(topRecommendation.recommendation, 500))}
              </p>
            </div>

            <div>
              <h3 className="text-[#D4AF37] font-black uppercase tracking-wider text-sm mb-3">
                Precision Strengths
              </h3>
              <p className="text-[#8C7F72] text-sm leading-relaxed">
                {extractSection(topRecommendation.analysis, 'STRENGTHS')}
              </p>
            </div>

            {topRecommendation.dashaAnalysis && (
              <div>
                <h3 className="text-[#D4AF37] font-black uppercase tracking-wider text-sm mb-3">
                  Vimshottari/Yogini Alignment
                </h3>
                <p className="text-[#8C7F72] text-sm leading-relaxed">
                  {sanitizeHtml(topRecommendation.dashaAnalysis)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#3A4452]">
        <div className="flex gap-8" role="tablist">
          {(['top', 'alternatives', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${
                selectedTab === tab
                  ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                  : 'text-[#8C7F72] hover:text-[#F5F0EB]'
              }`}
              role="tab"
              aria-selected={selectedTab === tab}
            >
              {tab === 'top' && 'Finalist'}
              {tab === 'alternatives' && `Alternatives (${alternativeOptions.length})`}
              {tab === 'all' && `Compute Grid (${statistics?.allCandidateScores?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'top' && (
          <motion.div
            key="top"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#151a21] border border-[#3A4452] rounded-xl p-8 space-y-6"
            role="tabpanel"
          >
            <h2 className="text-xl font-black text-[#F5F0EB] uppercase tracking-tight">
              Primary Candidate Analysis
            </h2>
            <CandidateCard candidate={topRecommendation} />
          </motion.div>
        )}

        {selectedTab === 'alternatives' && (
          <motion.div
            key="alternatives"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            role="tabpanel"
          >
            <h2 className="text-xl font-black text-[#F5F0EB] uppercase tracking-tight">
              Secondary Timeline Options
            </h2>
            <p className="text-[#8C7F72] text-sm">
              High-precision alternatives that crossed the Level 2 neural screening threshold:
            </p>
            {alternativeOptions.map((candidate, idx) => (
              <CandidateCard key={idx} candidate={candidate} rank={idx + 2} />
            ))}
          </motion.div>
        )}

        {selectedTab === 'all' && statistics && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
            role="tabpanel"
          >
            <h2 className="text-xl font-black text-[#F5F0EB] uppercase tracking-tight">
              Full Compute Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#151a21] border border-[#3A4452] p-4 rounded-xl">
                <p className="text-[10px] text-[#8C7F72] uppercase font-bold mb-1">Generated</p>
                <p className="text-xl font-mono text-white">{statistics.totalCandidatesGenerated}</p>
              </div>
              <div className="bg-[#151a21] border border-[#3A4452] p-4 rounded-xl">
                <p className="text-[10px] text-[#8C7F72] uppercase font-bold mb-1">Screened</p>
                <p className="text-xl font-mono text-white">{statistics.topCandidatesAnalyzed}</p>
              </div>
              <div className="bg-[#151a21] border border-[#3A4452] p-4 rounded-xl">
                <p className="text-[10px] text-[#8C7F72] uppercase font-bold mb-1">Neural Ops</p>
                <p className="text-xl font-mono text-white">{statistics.deepAnalysisCount}</p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {statistics.allCandidateScores.map((candidate, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#151a21] border border-[#3A4452]/50 rounded-xl hover:border-[#D4AF37]/30 transition-colors"
                >
                  <div>
                    <p className="font-mono text-lg text-[#F5F0EB]">{candidate.time}</p>
                    <p className="text-[10px] text-[#8C7F72] uppercase">
                      {sanitizeHtml(candidate.offsetDescription)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#D4AF37]">{candidate.quickScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics Footer */}
      {statistics && (
        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-8 flex items-center justify-between">
          <div>
            <h3 className="font-black text-[#D4AF37] uppercase tracking-widest text-xs mb-1">
              Compute Latency
            </h3>
            <p className="text-2xl font-black text-[#F5F0EB] font-mono">
              {statistics.processingTime?.totalSeconds || 0}s
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#8C7F72] uppercase font-bold tracking-widest mb-2">
              Engine Integrity
            </p>
            <div className="flex items-center gap-1.5 justify-end text-emerald-400 font-black text-xs">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              VERIFIED OUTPUT
            </div>
          </div>
        </div>
      )}

      {/* New Analysis Button */}
      <div className="text-center pt-8">
        <button
          onClick={handleNewAnalysis}
          disabled={isLoading}
          className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Initialize New Matrix'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT WITH ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════════

export function ResultsPage(props: ResultsPageProps) {
  return (
    <ResultsPageErrorBoundary>
      <ResultsPageContent {...props} />
    </ResultsPageErrorBoundary>
  );
}

export default ResultsPage;
