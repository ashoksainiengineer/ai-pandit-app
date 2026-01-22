'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, RotateCcw, ShieldCheck } from 'lucide-react';

interface ResultsPageProps {
  analysisData: any; // From the new API response
  onNewAnalysis: () => void;
}

export default function ResultsPage({ analysisData, onNewAnalysis }: ResultsPageProps) {
  const [selectedTab, setSelectedTab] = useState<'top' | 'alternatives' | 'all'>('top');

  const {
    rectifiedTime,
    accuracy,
    confidence,
    topRecommendation,
    alternativeOptions,
    statistics,
  } = analysisData;

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-[#F5F0EB]">
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TOP RECOMMENDATION - LARGE CARD */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="bg-[#151a21] border-2 border-[#D4AF37]/30 rounded-xl p-8 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
        <div className="text-center">
          <p className="text-[10px] font-black text-[#8C7F72] uppercase tracking-[0.3em] mb-4">Rectified Birth Time</p>
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
                className={`text-4xl font-black ${confidence === 'High'
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
            <Clock className="w-4 h-4" />
            {topRecommendation.offsetDescription}
          </div>

          <div className="bg-[#0F1419] border border-[#3A4452] rounded-xl p-8 text-left space-y-6">
            <div>
              <h3 className="text-[#D4AF37] font-black uppercase tracking-wider text-sm mb-3">Logical Verdict</h3>
              <p className="text-[#C4B8AD] leading-relaxed">{topRecommendation.recommendation}</p>
            </div>

            <div>
              <h3 className="text-[#D4AF37] font-black uppercase tracking-wider text-sm mb-3">Precision Strengths</h3>
              <p className="text-[#8C7F72] text-sm leading-relaxed">
                {extractSection(topRecommendation.analysis, 'STRENGTHS')}
              </p>
            </div>

            {topRecommendation.dashaAnalysis && (
              <div>
                <h3 className="text-[#D4AF37] font-black uppercase tracking-wider text-sm mb-3">Vimshottari/Yogini Alignment</h3>
                <p className="text-[#8C7F72] text-sm leading-relaxed">
                  {topRecommendation.dashaAnalysis}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TABS: TOP / ALTERNATIVES / ALL CANDIDATES */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="border-b border-[#3A4452]">
        <div className="flex gap-8">
          <button
            onClick={() => setSelectedTab('top')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${selectedTab === 'top'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#8C7F72] hover:text-[#F5F0EB]'
              }`}
          >
            Finalist
          </button>
          <button
            onClick={() => setSelectedTab('alternatives')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${selectedTab === 'alternatives'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#8C7F72] hover:text-[#F5F0EB]'
              }`}
          >
            Alternatives ({alternativeOptions.length})
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${selectedTab === 'all'
              ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
              : 'text-[#8C7F72] hover:text-[#F5F0EB]'
              }`}
          >
            Compute Grid ({statistics.allCandidateScores.length})
          </button>
        </div>
      </div>

      {/* TOP CHOICE CONTENT */}
      {selectedTab === 'top' && (
        <div className="bg-[#151a21] border border-[#3A4452] rounded-xl p-8 space-y-6">
          <h2 className="text-xl font-black text-[#F5F0EB] uppercase tracking-tight">Primary Candidate Analysis</h2>
          <CandidateCard candidate={topRecommendation} />
        </div>
      )}

      {/* ALTERNATIVES CONTENT */}
      {selectedTab === 'alternatives' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-[#F5F0EB] uppercase tracking-tight">Secondary Timeline Options</h2>
          <p className="text-[#8C7F72] text-sm">
            High-precision alternatives that crossed the Level 2 neural screening threshold:
          </p>
          {alternativeOptions.map((candidate: any, idx: number) => (
            <CandidateCard key={idx} candidate={candidate} rank={idx + 2} />
          ))}
        </div>
      )}

      {/* ALL CANDIDATES CONTENT */}
      {selectedTab === 'all' && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-[#F5F0EB] uppercase tracking-tight">Full Compute Statistics</h2>
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
            {statistics.allCandidateScores.map(
              (candidate: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#151a21] border border-[#3A4452]/50 rounded-xl hover:border-[#D4AF37]/30 transition-colors"
                >
                  <div>
                    <p className="font-mono text-lg text-[#F5F0EB]">{candidate.time}</p>
                    <p className="text-[10px] text-[#8C7F72] uppercase">{candidate.offsetDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#D4AF37]">{candidate.quickScore}%</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STATISTICS FOOTER */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-8 flex items-center justify-between">
        <div>
          <h3 className="font-black text-[#D4AF37] uppercase tracking-widest text-xs mb-1">Compute Latency</h3>
          <p className="text-2xl font-black text-[#F5F0EB] font-mono">{statistics.processingTime.totalSeconds}s</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#8C7F72] uppercase font-bold tracking-widest mb-2">Engine Integrity</p>
          <div className="flex items-center gap-1.5 justify-end text-emerald-400 font-black text-xs">
            <ShieldCheck className="w-4 h-4" />
            VERIFIED OUTPUT
          </div>
        </div>
      </div>

      {/* New Analysis Button */}
      <div className="text-center pt-8">
        <button
          onClick={onNewAnalysis}
          className="px-10 py-4 bg-gradient-to-r from-[#D4AF37] to-[#C9A961] text-[#0F1419] rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:-translate-y-1 transition-all"
        >
          Initialize New Matrix
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// CANDIDATE CARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════

function CandidateCard({
  candidate,
  rank,
}: {
  candidate: any;
  rank?: number;
}) {
  const scoreColor =
    candidate.score >= 80
      ? 'text-emerald-400'
      : candidate.score >= 60
        ? 'text-yellow-400'
        : 'text-red-400';

  const confidenceColor =
    candidate.confidence === 'High'
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : candidate.confidence === 'Medium'
        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20';

  return (
    <div className="bg-[#0F1419] rounded-xl border border-[#3A4452] p-6 space-y-4 hover:border-[#D4AF37]/30 transition-all">
      {rank && <p className="text-[10px] font-black text-[#8C7F72] uppercase tracking-[0.2em]">Priority Sequence Alpha #{rank}</p>}

      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-mono font-black text-[#D4AF37] tracking-tighter">{candidate.time}</h3>
        <div className="text-right">
          <p className={`text-2xl font-black ${scoreColor}`}>{candidate.score}%</p>
          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${confidenceColor} mt-1`}>
            {candidate.confidence} Confidence
          </span>
        </div>
      </div>

      <p className="text-[#8C7F72] text-xs font-medium uppercase tracking-wider">{candidate.offsetDescription}</p>

      {candidate.recommendation && (
        <div className="bg-[#151a21] rounded-xl border border-[#3A4452]/50 p-6">
          <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">Neural Decision</p>
          <p className="text-[#C4B8AD] text-sm leading-relaxed">{candidate.recommendation}</p>
        </div>
      )}

      {candidate.analysis && (
        <div className="bg-[#151a21] rounded-xl border border-[#3A4452]/50 p-6 max-h-64 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black text-[#8C7F72] uppercase tracking-widest mb-3">Verification Trace</p>
          <p className="text-[#8C7F72] text-xs leading-relaxed whitespace-pre-wrap">
            {candidate.analysis}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function
function extractSection(text: string, section: string): string {
  const regex = new RegExp(`${section}[^:]*:([^]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim().substring(0, 200) : 'Analysis pending...';
}
