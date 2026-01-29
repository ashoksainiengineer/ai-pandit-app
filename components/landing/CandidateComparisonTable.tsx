/**
 * Candidate Comparison Table
 * Shows top BTR candidates with scores and ephemeris data
 * Matches the CandidateComparisonView design from rectify page
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Scale, 
  Trophy, 
  Medal,
  Check,
  AlertTriangle,
  Clock,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CandidateData {
  rank: number;
  time: string;
  score: number;
  sun: string;
  moon: string;
  ascendant: string;
  d60: string;
  boundaryDistance: number;
  eventMatches: number;
  totalEvents: number;
  isWinner?: boolean;
  reasons: string[];
}

const candidatesData: CandidateData[] = [
  {
    rank: 1,
    time: '08:23:47 AM',
    score: 97.3,
    sun: 'Cap 15°20\'',
    moon: 'Leo 4°59\'',
    ascendant: 'Ari 15°23\'',
    d60: 'Leo Rising',
    boundaryDistance: 0.85,
    eventMatches: 8,
    totalEvents: 8,
    isWinner: true,
    reasons: [
      'Perfect marriage event correlation with Jupiter transit',
      'Career change aligns with Saturn return to 10th house',
      'Education milestone matches Mercury dasha period',
      'D60 chart confirms spiritual inclinations'
    ]
  },
  {
    rank: 2,
    time: '08:21:15 AM',
    score: 91.2,
    sun: 'Cap 15°18\'',
    moon: 'Leo 4°42\'',
    ascendant: 'Ari 15°05\'',
    d60: 'Cancer Rising',
    boundaryDistance: 0.72,
    eventMatches: 7,
    totalEvents: 8,
    reasons: [
      'Strong career event correlation',
      'Marriage timing slightly off by 3 months',
      'Good education milestone match',
      'D60 shows family focus'
    ]
  },
  {
    rank: 3,
    time: '08:26:30 AM',
    score: 86.8,
    sun: 'Cap 15°25\'',
    moon: 'Leo 5°18\'',
    ascendant: 'Ari 15°45\'',
    d60: 'Virgo Rising',
    boundaryDistance: 0.68,
    eventMatches: 6,
    totalEvents: 8,
    reasons: [
      'Acceptable career correlation',
      'Marriage timing discrepancy of 6 months',
      'Education period partially matches',
      'Health event correlation weak'
    ]
  },
  {
    rank: 4,
    time: '08:18:45 AM',
    score: 79.5,
    sun: 'Cap 15°12\'',
    moon: 'Leo 4°18\'',
    ascendant: 'Ari 14°52\'',
    d60: 'Taurus Rising',
    boundaryDistance: 0.55,
    eventMatches: 5,
    totalEvents: 8,
    reasons: [
      'Career change correlation marginal',
      'Marriage event misaligned by 1 year',
      'Education timing significantly off',
      'Property purchase event unmatched'
    ]
  }
];

export default function CandidateComparisonTable() {
  const [expandedRows, setExpandedRows] = useState<number[]>([1]);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([1, 2]);

  const toggleRow = (rank: number) => {
    setExpandedRows(prev => 
      prev.includes(rank) 
        ? prev.filter(r => r !== rank)
        : [...prev, rank]
    );
  };

  const topTwoCandidates = candidatesData.slice(0, 2);
  const winner = topTwoCandidates[0];
  const runnerUp = topTwoCandidates[1];
  const scoreDiff = winner.score - runnerUp.score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#D4AF37]/30 bg-[#1A1F2E]/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0F1419]/50 border-b border-[#2A3442]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F0EB]">Candidate Analysis</h3>
            <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">Top 4 BTR Results</p>
          </div>
        </div>

        {/* Winner Badge */}
        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
          ${scoreDiff > 5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}
        >
          {scoreDiff > 5 ? 'Clear Winner' : 'Close Match'}
        </div>
      </div>

      {/* Top 2 Comparison Cards */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-[#2A3442]">
        {topTwoCandidates.map((candidate) => (
          <motion.div
            key={candidate.rank}
            whileHover={{ scale: 1.01 }}
            className={`
              bg-[#0F1419]/70 rounded-xl p-4 border transition-all
              ${candidate.isWinner
                ? 'border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                : 'border-[#3A4452]'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {candidate.isWinner ? (
                  <Trophy className="w-5 h-5 text-[#D4AF37]" />
                ) : (
                  <Medal className="w-5 h-5 text-[#8C7F72]" />
                )}
                <span className="text-[10px] text-[#8C7F72] font-bold uppercase">Rank #{candidate.rank}</span>
              </div>
              {candidate.isWinner && (
                <span className="text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full font-bold uppercase">
                  Winner
                </span>
              )}
            </div>

            {/* Time */}
            <div className="text-2xl font-black text-[#F5F0EB] font-mono mb-2">
              {candidate.time}
            </div>

            {/* Score */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#8C7F72]">Confidence Score</span>
                <span className={`font-bold ${candidate.score >= 90 ? 'text-emerald-400' : candidate.score >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {candidate.score.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#2A3442] rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${candidate.score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${candidate.score >= 90 ? 'bg-emerald-500' : candidate.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                />
              </div>
            </div>

            {/* Ephemeris Summary */}
            <div className="space-y-1 text-[10px] font-mono border-t border-[#3A4452] pt-2">
              <div className="flex justify-between">
                <span className="text-[#8C7F72]">☉ Sun</span>
                <span className="text-[#C4B8AD]">{candidate.sun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7F72]">☽ Moon</span>
                <span className="text-[#C4B8AD]">{candidate.moon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7F72]">↑ Asc</span>
                <span className="text-[#C4B8AD]">{candidate.ascendant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7F72]">D60</span>
                <span className="text-[#D4AF37]">{candidate.d60}</span>
              </div>
            </div>

            {/* Event Matches */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <span className="text-[#8C7F72]">Event Correlation</span>
                  <span className="text-[#C4B8AD]">{candidate.eventMatches}/{candidate.totalEvents}</span>
                </div>
                <div className="w-full bg-[#2A3442] rounded-full h-1 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(candidate.eventMatches / candidate.totalEvents) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Details */}
      <div className="p-4 border-b border-[#2A3442]">
        <h4 className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold mb-3">Key Differences Analysis</h4>
        <div className="space-y-2">
          {[
            { label: 'Sun Position', left: winner.sun, right: runnerUp.sun },
            { label: 'Moon Position', left: winner.moon, right: runnerUp.moon },
            { label: 'Ascendant', left: winner.ascendant, right: runnerUp.ascendant },
            { label: 'D60 Chart', left: winner.d60, right: runnerUp.d60 },
          ].map((row) => {
            const matches = row.left === row.right;
            return (
              <div key={row.label} className="flex items-center gap-3 text-[10px]">
                <span className="w-24 text-[#8C7F72] font-medium flex-shrink-0">{row.label}</span>
                <div className="flex-1 flex items-center justify-between gap-2 bg-[#0F1419]/50 rounded-lg px-3 py-2">
                  <span className="font-mono text-[#C4B8AD]">{row.left}</span>
                  {matches ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <span className="font-mono text-[#C4B8AD]">{row.right}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Candidate Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#0F1419]/50 border-b border-[#2A3442]">
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium">Rank</th>
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium">Time</th>
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium">Score</th>
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium hidden md:table-cell">Sun</th>
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium hidden md:table-cell">Moon</th>
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium hidden lg:table-cell">Ascendant</th>
              <th className="px-4 py-2 text-left text-[#8C7F72] font-medium">Events</th>
              <th className="px-4 py-2 text-center text-[#8C7F72] font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {candidatesData.map((candidate, index) => (
              <>
                <tr 
                  key={candidate.rank}
                  className={`border-b border-[#2A3442]/50 hover:bg-[#2A3442]/20 transition-colors ${
                    candidate.isWinner ? 'bg-[#D4AF37]/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {candidate.isWinner ? (
                        <Trophy className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <span className="text-[#8C7F72] font-mono">#{candidate.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[#F5F0EB]">{candidate.time}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${candidate.score >= 90 ? 'text-emerald-400' : candidate.score >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {candidate.score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#C4B8AD] hidden md:table-cell">{candidate.sun}</td>
                  <td className="px-4 py-3 text-[#C4B8AD] hidden md:table-cell">{candidate.moon}</td>
                  <td className="px-4 py-3 text-[#D4AF37] hidden lg:table-cell">{candidate.ascendant}</td>
                  <td className="px-4 py-3">
                    <span className="text-[#C4B8AD]">{candidate.eventMatches}/{candidate.totalEvents}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleRow(candidate.rank)}
                      className="p-1 hover:bg-[#2A3442] rounded transition-colors"
                    >
                      {expandedRows.includes(candidate.rank) ? (
                        <ChevronUp className="w-4 h-4 text-[#8C7F72]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#8C7F72]" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRows.includes(candidate.rank) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 bg-[#0F1419]/30">
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-bold">AI Analysis Reasons</div>
                        <ul className="space-y-1">
                          {candidate.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#C4B8AD]">
                              <span className="text-[#D4AF37] mt-0.5">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#2A3442]">
                          <div className="text-[10px]">
                            <span className="text-[#8C7F72]">Boundary Distance: </span>
                            <span className="text-[#C4B8AD] font-mono">{candidate.boundaryDistance.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px]">
                            <span className="text-[#8C7F72]">D60: </span>
                            <span className="text-[#D4AF37]">{candidate.d60}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Verdict */}
      <div className="p-4 bg-[#D4AF37]/10 border-t border-[#D4AF37]/30">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-[#D4AF37] mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#D4AF37] mb-1">AI Comparison Verdict</h4>
            <p className="text-xs text-[#C4B8AD] leading-relaxed">
              {winner.time} is preferred
              {scoreDiff > 5
                ? ` with a significant ${scoreDiff.toFixed(1)}% lead. `
                : ` by a narrow ${scoreDiff.toFixed(1)}% margin. `}
              Dasha correlation and event timing were primary factors in this determination.
              The {winner.time} timestamp shows {winner.eventMatches}/{winner.totalEvents} event correlations
              with an average confidence of {winner.score.toFixed(1)}%.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
