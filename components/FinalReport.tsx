import React from 'react';
import { FinalBTRReport } from '@/types/btr-realtime';

interface FinalReportProps {
  report: FinalBTRReport;
}

export const FinalReport: React.FC<FinalReportProps> = ({ report }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-900/30 border-green-500/30';
    if (score >= 75) return 'bg-yellow-900/30 border-yellow-500/30';
    return 'bg-red-900/30 border-red-500/30';
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'text-green-400';
      case 'GOOD': return 'text-blue-400';
      case 'FAIR': return 'text-yellow-400';
      case 'POOR': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'bg-green-900/30 text-green-400 border-green-500/30';
      case 'GOOD': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'FAIR': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30';
      case 'POOR': return 'bg-red-900/30 text-red-400 border-red-500/30';
      default: return 'bg-gray-900/30 text-gray-400 border-gray-500/30';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-400';
      case 'medium': return 'text-orange-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Birth Time Rectification Complete!
          </h1>
          <p className="text-xl text-gray-300">
            Your precise birth time has been determined with AI-powered analysis
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">📊</span>
            Executive Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <div className="text-gray-400 text-sm mb-2">Original Time</div>
              <div className="text-white text-2xl font-bold">{report.executiveSummary.originalTime}</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <div className="text-gray-400 text-sm mb-2">Rectified Time</div>
              <div className="text-white text-2xl font-bold">{report.executiveSummary.rectifiedTime}</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <div className="text-gray-400 text-sm mb-2">Adjustment</div>
              <div className="text-white text-2xl font-bold">{report.executiveSummary.adjustment}</div>
            </div>
            
            <div className={['rounded-lg', 'p-6', 'border', getConfidenceBgColor(report.executiveSummary.confidence)].join(' ')}>
              <div className="text-gray-400 text-sm mb-2">Confidence Score</div>
              <div className={['text-3xl', 'font-bold', getConfidenceColor(report.executiveSummary.confidence)].join(' ')}>
                {report.executiveSummary.confidence}/100
              </div>
              <div className={['text-sm', 'mt-1', getConfidenceColor(report.executiveSummary.confidence)].join(' ')}>
                {report.executiveSummary.confidenceCategory}
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <div className="text-gray-400 text-sm mb-2">Candidates Tested</div>
              <div className="text-white text-2xl font-bold">{report.executiveSummary.candidatesTested}</div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <div className="text-gray-400 text-sm mb-2">Processing Time</div>
              <div className="text-white text-2xl font-bold">{report.executiveSummary.duration}</div>
            </div>
          </div>
        </div>

        {/* Rectified Birth Chart */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">🌟</span>
            Rectified Birth Chart
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ascendant & Moon */}
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                <h3 className="text-lg font-bold text-white mb-3">Ascendant</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Sign:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.ascendant.sign}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Degree:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.ascendant.degree}°</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Nakshatra:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.ascendant.nakshatra}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Pada:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.ascendant.pada}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                <h3 className="text-lg font-bold text-white mb-3">Moon</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Sign:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.moon.sign}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Degree:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.moon.degree}°</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Nakshatra:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.moon.nakshatra}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Pada:</span>
                    <span className="text-white font-medium ml-2">{report.rectifiedChart.moon.pada}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                <h3 className="text-lg font-bold text-white mb-3">Birth Dasha</h3>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-400">
                    {report.rectifiedChart.birthDasha.planet} Mahadasha
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {report.rectifiedChart.birthDasha.yearsRemaining} years remaining
                  </div>
                </div>
              </div>
            </div>
            
            {/* Planetary Positions */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">Planetary Positions</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {report.rectifiedChart.planetaryPositions.map((planet, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/30 last:border-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {planet.planet === 'Sun' && '☉'}
                        {planet.planet === 'Moon' && '☽'}
                        {planet.planet === 'Mars' && '♂'}
                        {planet.planet === 'Mercury' && '☿'}
                        {planet.planet === 'Jupiter' && '♃'}
                        {planet.planet === 'Venus' && '♀'}
                        {planet.planet === 'Saturn' && '♄'}
                        {planet.planet === 'Rahu' && '☊'}
                        {planet.planet === 'Ketu' && '☋'}
                      </span>
                      <span className="text-white font-medium">{planet.planet}</span>
                      {planet.retrograde && (
                        <span className="text-xs text-red-400">(R)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm">
                        {planet.sign} {planet.degree.toFixed(1)}°
                      </div>
                      <div className="text-xs text-gray-400">
                        {planet.nakshatra}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Divisional Charts & Yogas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">Divisional Charts</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">D9 (Navamsa):</span>
                  <span className="text-white font-medium">{report.rectifiedChart.divisionalCharts.d9}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">D10 (Dasamsa):</span>
                  <span className="text-white font-medium">{report.rectifiedChart.divisionalCharts.d10}</span>
                </div>
                {report.rectifiedChart.divisionalCharts.d7 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">D7 (Saptamsa):</span>
                    <span className="text-white font-medium">{report.rectifiedChart.divisionalCharts.d7}</span>
                  </div>
                )}
                {report.rectifiedChart.divisionalCharts.d12 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">D12 (Dwadasamsa):</span>
                    <span className="text-white font-medium">{report.rectifiedChart.divisionalCharts.d12}</span>
                  </div>
                )}
                {report.rectifiedChart.divisionalCharts.d30 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">D30 (Trimsamsa):</span>
                    <span className="text-white font-medium">{report.rectifiedChart.divisionalCharts.d30}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">Identified Yogas</h3>
              <div className="space-y-3">
                {report.rectifiedChart.yogas.map((yoga, index) => (
                  <div key={index} className="border-b border-gray-700/30 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-medium">{yoga.name}</span>
                      <span className={[
                        'text-xs', 'px-2', 'py-1', 'rounded-full', 'border',
                        yoga.strength === 'strong' ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                        yoga.strength === 'moderate' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30' :
                        'bg-red-900/30 text-red-400 border-red-500/30'
                      ].join(' ')}>
                        {yoga.strength}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{yoga.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Correlation Analysis */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">📅</span>
            Event Correlation Analysis
          </h2>
          
          <div className="space-y-6">
            {report.eventCorrelations.map((correlation, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{correlation.event}</h3>
                  <div className={['px-3', 'py-1', 'rounded-full', 'text-sm', 'font-bold', 'border', getQualityBadgeColor(correlation.quality)].join(' ')}>
                    {correlation.quality} ({correlation.score}/10)
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Expected</div>
                    <div className="text-white font-medium">{correlation.expected}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Actual</div>
                    <div className="text-white font-medium">{correlation.actual}</div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/30">
                  <div className="text-gray-400 text-sm mb-2">Reasoning</div>
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {correlation.reasoning}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
              <div className="text-green-400 text-sm mb-1">Perfectly Matched</div>
              <div className="text-white text-2xl font-bold">
                {report.eventCorrelations.filter(e => e.quality === 'EXCELLENT').length}/{report.eventCorrelations.length}
              </div>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
              <div className="text-blue-400 text-sm mb-1">Well Matched</div>
              <div className="text-white text-2xl font-bold">
                {report.eventCorrelations.filter(e => e.quality === 'GOOD').length}/{report.eventCorrelations.length}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <div className="text-gray-400 text-sm mb-1">Overall Accuracy</div>
              <div className="text-white text-2xl font-bold">
                {Math.round((report.eventCorrelations.reduce((sum, e) => sum + e.score, 0) / report.eventCorrelations.length) * 10)}%
              </div>
            </div>
          </div>
        </div>

        {/* Scoring Breakdown */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">📈</span>
            Scoring Breakdown
          </h2>
          
          <div className="space-y-4">
            {Object.entries(report.scoringBreakdown).filter(([key]) => key !== 'total').map(([key, breakdown]) => (
              <div key={key} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-white font-bold">
                    {breakdown.score}/{breakdown.max}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${breakdown.percentage}%` }}
                  />
                </div>
                <div className="text-right text-sm text-gray-400 mt-1">
                  {breakdown.percentage}%
                </div>
              </div>
            ))}
            
            {/* Total Score */}
            <div className={['rounded-lg', 'p-6', 'border-2', getConfidenceBgColor(report.scoringBreakdown.total.score)].join(' ')}>
              <div className="flex justify-between items-center mb-2">
                <span className={['text-xl', 'font-bold', getConfidenceColor(report.scoringBreakdown.total.score)].join(' ')}>
                  TOTAL SCORE
                </span>
                <span className={['text-3xl', 'font-bold', getConfidenceColor(report.scoringBreakdown.total.score)].join(' ')}>
                  {report.scoringBreakdown.total.score}/{report.scoringBreakdown.total.max}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-1000"
                  style={{ width: `${report.scoringBreakdown.total.percentage}%` }}
                />
              </div>
              <div className="text-right text-lg font-bold mt-2">
                {report.scoringBreakdown.total.percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Evidence & Red Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Supporting Evidence */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">✅</span>
              Supporting Evidence
            </h2>
            
            <div className="space-y-4">
              {report.supportingEvidence.map((evidence, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                  <div className="flex items-start space-x-3">
                    <span className={['text-lg', 'flex-shrink-0', getImpactColor(evidence.impact)].join(' ')}>
                      {evidence.impact === 'positive' ? '✓' : evidence.impact === 'negative' ? '✗' : '•'}
                    </span>
                    <div>
                      <div className="text-white font-medium">{evidence.type}</div>
                      <div className="text-sm text-gray-400 mt-1">{evidence.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Red Flags */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">⚠️</span>
              Red Flags
            </h2>
            
            {report.redFlags.length > 0 ? (
              <div className="space-y-4">
                {report.redFlags.map((flag, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <div className="flex items-start space-x-3">
                      <span className={['text-lg', 'flex-shrink-0', getSeverityColor(flag.severity)].join(' ')}>
                        ⚠
                      </span>
                      <div>
                        <div className="text-white font-medium">{flag.issue}</div>
                        <div className={['text-sm', 'mt-1', getSeverityColor(flag.severity)].join(' ')}>
                          Severity: {flag.severity}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Recommendation: {flag.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-900/30 rounded-lg p-6 border border-green-500/30 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-green-400 font-medium">No red flags identified!</div>
                <div className="text-sm text-gray-400 mt-1">
                  All events show strong correlation with the rectified time
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Times */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">🥈</span>
            Alternative Times
          </h2>
          
          <div className="space-y-3">
            {report.alternativeTimes.map((alt, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-gray-400">#{alt.rank}</div>
                  <div>
                    <div className="text-white font-bold text-lg">{alt.time}</div>
                    <div className="text-sm text-gray-400">Alternative candidate</div>
                  </div>
                </div>
                <div className={['px-4', 'py-2', 'rounded-full', 'font-bold', getConfidenceBgColor(alt.score), getConfidenceColor(alt.score)].join(' ')}>
                  {alt.score}/100
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">💡</span>
            Recommendations
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">Primary Assessment</h3>
              <div className="text-gray-300 leading-relaxed">
                {report.recommendations.primary}
              </div>
            </div>
            
            {report.recommendations.secondary.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
                <h3 className="text-lg font-bold text-white mb-3">Secondary Recommendations</h3>
                <ul className="space-y-2">
                  {report.recommendations.secondary.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span className="text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">Next Steps</h3>
              <ul className="space-y-2">
                {report.recommendations.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span className="text-gray-300">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">🔬</span>
            Methodology
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">Technical Parameters</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ayanamsa:</span>
                  <span className="text-white font-medium">{report.methodology.ayanamsa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">House System:</span>
                  <span className="text-white font-medium">{report.methodology.houseSystem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Dasha System:</span>
                  <span className="text-white font-medium">{report.methodology.dashaSystem}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Precision:</span>
                  <span className="text-white font-medium">{report.methodology.precision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Iterations:</span>
                  <span className="text-white font-medium">{report.methodology.iterations}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <h3 className="text-lg font-bold text-white mb-3">AI & Charts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Model:</span>
                  <span className="text-white font-medium">{report.methodology.aiModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Divisional Charts:</span>
                  <span className="text-white font-medium">{report.methodology.divisionalCharts.join(', ')}</span>
                </div>
                <div className="text-gray-400 mt-3">References:</div>
                <div className="text-white text-xs mt-1">
                  {report.methodology.references.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="text-3xl mr-3">📥</span>
            Download Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-blue-900/30 hover:bg-blue-900/50 rounded-lg p-4 border border-blue-500/30 transition-all duration-300 flex items-center justify-center space-x-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
              <span className="text-white font-medium">PDF Report</span>
            </button>
            
            <button className="bg-purple-900/30 hover:bg-purple-900/50 rounded-lg p-4 border border-purple-500/30 transition-all duration-300 flex items-center justify-center space-x-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🖼️</span>
              <span className="text-white font-medium">Chart Image</span>
            </button>
            
            <button className="bg-green-900/30 hover:bg-green-900/50 rounded-lg p-4 border border-green-500/30 transition-all duration-300 flex items-center justify-center space-x-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              <span className="text-white font-medium">Event Analysis Excel</span>
            </button>
            
            <button className="bg-orange-900/30 hover:bg-orange-900/50 rounded-lg p-4 border border-orange-500/30 transition-all duration-300 flex items-center justify-center space-x-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">📧</span>
              <span className="text-white font-medium">Email Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};