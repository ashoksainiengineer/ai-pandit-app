import React from 'react';
import { AIAnalysis } from '@/types/btr-realtime';

interface AIAnalysisPanelProps {
  analyses: AIAnalysis[];
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analyses }) => {
  const getScoreColor = (score?: number) => {
    if (!score && score !== 0) return 'text-gray-400';
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score?: number) => {
    if (!score && score !== 0) return 'bg-gray-900/50';
    if (score >= 90) return 'bg-green-900/30 border-green-500/30';
    if (score >= 75) return 'bg-yellow-900/30 border-yellow-500/30';
    return 'bg-red-900/30 border-red-500/30';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 border-green-500/30 bg-green-900/20';
      case 'warning': return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20';
      case 'error': return 'text-red-400 border-red-500/30 bg-red-900/20';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-900/20';
    }
  };

  const latestAnalysis = analyses[analyses.length - 1];

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="text-2xl mr-3">🤖</span>
        AI Analysis
      </h2>

      {latestAnalysis ? (
        <div className="space-y-6">
          {/* Analysis Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-white">
                Analyzing: {latestAnalysis.candidateTime}
              </div>
              {latestAnalysis.status === 'analyzing' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                  <span className="text-sm text-purple-300">AI thinking...</span>
                </div>
              ) : (
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreBgColor(latestAnalysis.overallScore)} ${getScoreColor(latestAnalysis.overallScore)}`}>
                  {latestAnalysis.overallScore}/100
                </div>
              )}
            </div>
            
            {latestAnalysis.processingTime && (
              <div className="text-xs text-purple-300">
                Analysis time: {(latestAnalysis.processingTime / 1000).toFixed(1)}s
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          {latestAnalysis.breakdown && latestAnalysis.status === 'complete' && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-300 mb-3">Scoring Breakdown</div>
              
              <div className="space-y-2">
                {/* Ascendant Match */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm">Ascendant Match</span>
                    <span className="text-white font-bold">
                      {latestAnalysis.breakdown.ascendantMatch}/20
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${(latestAnalysis.breakdown.ascendantMatch / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Dasha Correlation */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm">Dasha Correlation</span>
                    <span className="text-white font-bold">
                      {latestAnalysis.breakdown.dashaCorrelation}/50
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${(latestAnalysis.breakdown.dashaCorrelation / 50) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Divisional Harmony */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm">Divisional Harmony</span>
                    <span className="text-white font-bold">
                      {latestAnalysis.breakdown.divisionalHarmony}/20
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${(latestAnalysis.breakdown.divisionalHarmony / 20) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Yoga Timing */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-300 text-sm">Yoga Timing</span>
                    <span className="text-white font-bold">
                      {latestAnalysis.breakdown.yogaTiming}/10
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${(latestAnalysis.breakdown.yogaTiming / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {latestAnalysis.insights && latestAnalysis.insights.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-300 mb-3">Key Findings</div>
              <div className="space-y-2">
                {latestAnalysis.insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`rounded-lg p-3 border transition-all duration-300 animate-pulse ${getInsightColor(insight.type)}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0">{insight.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {insight.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Status */}
          {latestAnalysis.status === 'analyzing' && (
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <div className="flex items-center justify-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-purple-300">AI is analyzing chart patterns...</span>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                Checking dasha correlations, divisional harmony, and event alignments
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <div>Waiting for AI analysis...</div>
            <div className="text-sm mt-2">Moonshot AI initializing</div>
          </div>
        </div>
      )}

      {/* Recent Analyses History */}
      {analyses.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="text-sm text-gray-400 mb-3">Recent Scores</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {analyses.slice(-5, -1).reverse().map((analysis, index) => (
              <div key={analysis.id} className="text-xs flex justify-between items-center">
                <span className="text-gray-500">{analysis.candidateTime}</span>
                <span className={`font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};