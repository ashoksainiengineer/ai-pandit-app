'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, RotateCcw } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TOP RECOMMENDATION - LARGE CARD */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-green-700 mb-2">RECTIFIED BIRTH TIME</p>
          <h1 className="text-5xl font-bold text-green-900 font-mono mb-4">
            {rectifiedTime}
          </h1>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-sm text-green-600">Accuracy Score</p>
              <p className="text-3xl font-bold text-green-900">{accuracy}/100</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Confidence</p>
              <p
                className={`text-3xl font-bold ${
                  confidence === 'High'
                    ? 'text-green-900'
                    : confidence === 'Medium'
                      ? 'text-yellow-900'
                      : 'text-red-900'
                }`}
              >
                {confidence}
              </p>
            </div>
          </div>

          <p className="text-lg text-green-800 mb-6">
            {topRecommendation.offsetDescription}
          </p>

          <div className="bg-white rounded-lg p-6 text-left">
            <h3 className="font-semibold text-lg mb-3">Recommendation</h3>
            <p className="text-gray-700 mb-4">{topRecommendation.recommendation}</p>

            <h3 className="font-semibold text-lg mb-2">Key Strengths</h3>
            <p className="text-gray-700 text-sm mb-4">
              {extractSection(topRecommendation.analysis, 'STRENGTHS')}
            </p>

            {topRecommendation.dashaAnalysis && (
              <>
                <h3 className="font-semibold text-lg mb-2">Dasha Analysis</h3>
                <p className="text-gray-700 text-sm mb-4">
                  {topRecommendation.dashaAnalysis}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TABS: TOP / ALTERNATIVES / ALL CANDIDATES */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedTab('top')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              selectedTab === 'top'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Top Choice
          </button>
          <button
            onClick={() => setSelectedTab('alternatives')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              selectedTab === 'alternatives'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Alternative Options ({alternativeOptions.length})
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              selectedTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Candidates ({statistics.allCandidateScores.length})
          </button>
        </div>
      </div>

      {/* TOP CHOICE CONTENT */}
      {selectedTab === 'top' && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-2xl font-bold">Most Likely Birth Time</h2>
          <CandidateCard candidate={topRecommendation} />
        </div>
      )}

      {/* ALTERNATIVES CONTENT */}
      {selectedTab === 'alternatives' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Backup Options</h2>
          <p className="text-gray-600 mb-4">
            If the top recommendation doesn't feel right, consider these alternatives:
          </p>
          {alternativeOptions.map((candidate: any, idx: number) => (
            <CandidateCard key={idx} candidate={candidate} rank={idx + 2} />
          ))}
        </div>
      )}

      {/* ALL CANDIDATES CONTENT */}
      {selectedTab === 'all' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Analyzed Times</h2>
          <p className="text-gray-600 mb-4">
            {statistics.totalCandidatesGenerated} times generated,
            {statistics.topCandidatesAnalyzed} pre-filtered,
            {statistics.deepAnalysisCount} deeply analyzed with Kimi K2
          </p>

          <div className="space-y-2">
            {statistics.allCandidateScores.map(
              (candidate: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-mono font-semibold">{candidate.time}</p>
                    <p className="text-sm text-gray-600">{candidate.offsetDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{candidate.quickScore}/100</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STATISTICS */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Analysis Statistics</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Generated Times</p>
            <p className="text-2xl font-bold">{statistics.totalCandidatesGenerated}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Pre-filtered</p>
            <p className="text-2xl font-bold">{statistics.topCandidatesAnalyzed}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Kimi K2 Analysis</p>
            <p className="text-2xl font-bold">{statistics.deepAnalysisCount}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Processing Time</p>
            <p className="text-2xl font-bold">{statistics.processingTime.totalSeconds}s</p>
          </div>
        </div>
      </div>

      {/* New Analysis Button */}
      <div className="text-center">
        <button
          onClick={onNewAnalysis}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start New Analysis
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
      ? 'text-green-600'
      : candidate.score >= 60
        ? 'text-yellow-600'
        : 'text-red-600';

  const confidenceColor =
    candidate.confidence === 'High'
      ? 'bg-green-100 text-green-800'
      : candidate.confidence === 'Medium'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {rank && <p className="text-sm font-semibold text-gray-500">#{rank}</p>}

      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-mono font-bold">{candidate.time}</h3>
        <div className="text-right">
          <p className={`text-3xl font-bold ${scoreColor}`}>{candidate.score}/100</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${confidenceColor}`}>
            {candidate.confidence}
          </span>
        </div>
      </div>

      <p className="text-gray-600">{candidate.offsetDescription}</p>

      {candidate.recommendation && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-semibold mb-2">Recommendation</p>
          <p className="text-gray-700">{candidate.recommendation}</p>
        </div>
      )}

      {candidate.analysis && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
          <p className="font-semibold mb-2">Analysis</p>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">
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
