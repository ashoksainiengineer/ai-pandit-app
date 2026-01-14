import React from 'react';
import { SwissEphCalculation } from '@/types/btr-realtime';

interface SwissEphPanelProps {
  calculations: SwissEphCalculation[];
}

export const SwissEphPanel: React.FC<SwissEphPanelProps> = ({ calculations }) => {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'weak': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStrengthBgColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-900/30 border-green-500/30';
      case 'moderate': return 'bg-yellow-900/30 border-yellow-500/30';
      case 'weak': return 'bg-red-900/30 border-red-500/30';
      default: return 'bg-gray-900/30 border-gray-500/30';
    }
  };

  const latestCalculation = calculations[calculations.length - 1];

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="text-2xl mr-3">🌟</span>
        SwissEph Calculations
      </h2>
      
      {latestCalculation ? (
        <div className="space-y-4">
          {/* Candidate Time Header */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 border border-blue-500/30">
            <div className="text-lg font-bold text-white">
              Testing: {latestCalculation.candidateTime}
            </div>
            <div className="text-sm text-blue-300 mt-1">
              Julian Day: {latestCalculation.calculations.julianDay || 'Calculating...'}
            </div>
          </div>

          {/* Ascendant Card */}
          {latestCalculation.calculations.ascendant && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">Ascendant</span>
                <span className="text-2xl">♈</span>
              </div>
              <div className="text-white font-bold text-lg">
                {latestCalculation.calculations.ascendant.sign} {latestCalculation.calculations.ascendant.degree.toFixed(2)}°
              </div>
              <div className="text-sm text-gray-400">
                {latestCalculation.calculations.ascendant.nakshatra} Pada {latestCalculation.calculations.ascendant.pada}
              </div>
            </div>
          )}

          {/* Moon Card */}
          {latestCalculation.calculations.moon && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">Moon</span>
                <span className="text-2xl">☽</span>
              </div>
              <div className="text-white font-bold text-lg">
                {latestCalculation.calculations.moon.sign} {latestCalculation.calculations.moon.degree.toFixed(2)}°
              </div>
              <div className="text-sm text-gray-400">
                {latestCalculation.calculations.moon.nakshatra} Pada {latestCalculation.calculations.moon.pada}
              </div>
            </div>
          )}

          {/* Birth Dasha Card */}
          {latestCalculation.calculations.birthDasha && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">Birth Dasha</span>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="text-white font-bold text-lg">
                {latestCalculation.calculations.birthDasha.planet} Mahadasha
              </div>
              <div className="text-sm text-gray-400">
                {latestCalculation.calculations.birthDasha.yearsRemaining} years remaining
              </div>
            </div>
          )}

          {/* Divisional Charts */}
          {latestCalculation.calculations.divisionalCharts && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300 font-medium">Divisional Charts</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">D9:</span>
                  <span className="text-white font-medium">{latestCalculation.calculations.divisionalCharts.d9}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">D10:</span>
                  <span className="text-white font-medium">{latestCalculation.calculations.divisionalCharts.d10}</span>
                </div>
              </div>
            </div>
          )}

          {/* Yogas */}
          {latestCalculation.calculations.yogas && latestCalculation.calculations.yogas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-300 font-medium mb-2">
                <span className="text-xl">✨</span>
                <span>Identified Yogas</span>
              </div>
              {latestCalculation.calculations.yogas.map((yoga, index) => (
                <div 
                  key={index}
                  className={`rounded-lg p-3 border transition-all duration-300 ${getStrengthBgColor(yoga.strength)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{yoga.name}</div>
                      <div className="text-xs text-gray-400">Houses: {yoga.houses}</div>
                    </div>
                    <span className={`text-sm font-medium ${getStrengthColor(yoga.strength)}`}>
                      {yoga.strength}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">🌟</div>
            <div>Waiting for calculations...</div>
            <div className="text-sm mt-2">Swiss Ephemeris engine initializing</div>
          </div>
        </div>
      )}

      {/* Recent Calculations History */}
      {calculations.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="text-sm text-gray-400 mb-3">Recent Calculations</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {calculations.slice(-5, -1).reverse().map((calc, index) => (
              <div key={calc.id} className="text-xs text-gray-500 flex justify-between">
                <span>{calc.candidateTime}</span>
                <span>{calc.calculations.ascendant?.sign || '...'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};