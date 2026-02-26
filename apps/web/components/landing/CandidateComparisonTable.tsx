/**
 * Candidate Comparison Table - Light Theme Edition
 * Shows top BTR candidates with scores and ephemeris data
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
      className="rounded-2xl border border-[#78611D]/30 bg-white overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#FDF8F3] border-b border-[#F0E8DE]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B1F7A] to-[#8B4A9C] flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1A1612]">Candidate Analysis</h3>
            <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Top 4 BTR Results</p>
          </div>
        </div>

        {/* Winner Badge */}
        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
          ${scoreDiff > 5 ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}
        >
          {scoreDiff > 5 ? 'Clear Winner' : 'Close Match'}
        </div>
      </div>

      {/* Top 2 Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-b border-[#F0E8DE]">
        {topTwoCandidates.map((candidate) => (
          <motion.div
            key={candidate.rank}
            whileHover={{ scale: 1.01 }}
            className={`
              bg-[#FDF8F3] rounded-xl p-5 border transition-all
              ${candidate.isWinner
                ? 'border-[#78611D]/50 shadow-md'
                : 'border-[#F0E8DE]'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {candidate.isWinner ? (
                  <Trophy className="w-5 h-5 text-[#B8860B]" />
                ) : (
                  <Medal className="w-5 h-5 text-[#7A756F]" />
                )}
                <span className="text-[10px] text-[#7A756F] font-bold uppercase">Rank #{candidate.rank}</span>
              </div>
              {candidate.isWinner && (
                <span className="text-[8px] bg-[#B8860B]/10 text-[#B8860B] px-2 py-0.5 rounded-full font-bold uppercase">
                  Winner
                </span>
              )}
            </div>

            {/* Time */}
            <div className="text-2xl font-black text-[#1A1612] font-mono mb-2">
              {candidate.time}
            </div>

            {/* Score */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#7A756F]">Confidence Score</span>
                <span className={`font-bold ${candidate.score >= 90 ? 'text-emerald-600' : candidate.score >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {candidate.score.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#F0E8DE] rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${candidate.score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${candidate.score >= 90 ? 'bg-emerald-500' : candidate.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                />
              </div>
            </div>

            {/* Ephemeris Summary */}
            <div className="space-y-1 text-[10px] font-mono border-t border-[#F0E8DE] pt-2">
              <div className="flex justify-between">
                <span className="text-[#7A756F]">☉ Sun</span>
                <span className="text-[#4A453F]">{candidate.sun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A756F]">☽ Moon</span>
                <span className="text-[#4A453F]">{candidate.moon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A756F]">↑ Asc</span>
                <span className="text-[#4A453F]">{candidate.ascendant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A756F]">D60</span>
                <span className="text-[#B8860B]">{candidate.d60}</span>
              </div>
            </div>

            {/* Event Matches */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[9px] mb-0.5">
                  <span className="text-[#7A756F]">Event Correlation</span>
                  <span className="text-[#4A453F]">{candidate.eventMatches}/{candidate.totalEvents}</span>
                </div>
                <div className="w-full bg-[#F0E8DE] rounded-full h-1 overflow-hidden">
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
      <div className="p-5 border-b border-[#F0E8DE]">
        <h4 className="text-[10px] text-[#7A756F] uppercase tracking-wider font-bold mb-3">Key Differences Analysis</h4>
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
                <span className="w-24 text-[#7A756F] font-medium flex-shrink-0">{row.label}</span>
                <div className="flex-1 flex items-center justify-between gap-2 bg-[#FDF8F3] rounded-lg px-3 py-2">
                  <span className="font-mono text-[#4A453F]">{row.left}</span>
                  {matches ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="font-mono text-[#4A453F]">{row.right}</span>
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
            <tr className="bg-[#FDF8F3] border-b border-[#F0E8DE]">
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium">Rank</th>
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium">Time</th>
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium">Score</th>
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium hidden md:table-cell">Sun</th>
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium hidden md:table-cell">Moon</th>
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium hidden lg:table-cell">Ascendant</th>
              <th className="px-4 py-3 text-left text-[#7A756F] font-medium">Events</th>
              <th className="px-4 py-3 text-center text-[#7A756F] font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {candidatesData.map((candidate) => (
              <tr
                key={candidate.rank}
                className={`border-b border-[#F0E8DE] hover:bg-[#FDF8F3] transition-colors ${candidate.isWinner ? 'bg-[#B8860B]/5' : ''
                  }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {candidate.isWinner ? (
                      <Trophy className="w-4 h-4 text-[#B8860B]" />
                    ) : (
                      <span className="text-[#7A756F] font-mono">#{candidate.rank}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[#1A1612]">{candidate.time}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${candidate.score >= 90 ? 'text-emerald-600' : candidate.score >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {candidate.score.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-[#4A453F] hidden md:table-cell">{candidate.sun}</td>
                <td className="px-4 py-3 text-[#4A453F] hidden md:table-cell">{candidate.moon}</td>
                <td className="px-4 py-3 text-[#B8860B] hidden lg:table-cell">{candidate.ascendant}</td>
                <td className="px-4 py-3">
                  <span className="text-[#4A453F]">{candidate.eventMatches}/{candidate.totalEvents}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleRow(candidate.rank)}
                    className="p-1 hover:bg-[#F0E8DE] rounded transition-colors"
                    aria-label={expandedRows.includes(candidate.rank) ? "Collapse details" : "Expand details"}
                  >
                    {expandedRows.includes(candidate.rank) ? (
                      <ChevronUp className="w-4 h-4 text-[#7A756F]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#7A756F]" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Rows Content */}
      {candidatesData.map((candidate) => (
        expandedRows.includes(candidate.rank) && (
          <div
            key={`expanded-${candidate.rank}`}
            className="px-5 py-4 bg-[#FDF8F3] border-b border-[#F0E8DE]"
          >
            <div className="space-y-2">
              <div className="text-[10px] text-[#5A5550] uppercase tracking-wider font-bold">AI Analysis Reasons</div>
              <ul className="space-y-1">
                {candidate.reasons.map((reason, i) => (
                  <li key={`reason-${candidate.rank}-${i}`} className="flex items-start gap-2 text-xs text-[#4A453F]">
                    <span className="text-[#B8860B] mt-0.5">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#F0E8DE]">
                <div className="text-[10px]">
                  <span className="text-[#5A5550]">Boundary Distance: </span>
                  <span className="text-[#4A453F] font-mono">{candidate.boundaryDistance.toFixed(2)}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-[#5A5550]">D60: </span>
                  <span className="text-[#B8860B]">{candidate.d60}</span>
                </div>
              </div>
            </div>
          </div>
        )
      ))}

      {/* AI Verdict */}
      <div className="p-5 bg-[#B8860B]/10 border-t border-[#78611D]/30">
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-[#B8860B] mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-[#B8860B] mb-1">AI Comparison Verdict</h4>
            <p className="text-xs text-[#4A453F] leading-relaxed">
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
