import React from 'react';
import { BTRProgressUpdate } from '@/types/btr-realtime';
import { UserButton } from '@clerk/nextjs';

interface TopBarProps {
  progress: BTRProgressUpdate;
}

export const TopBar: React.FC<TopBarProps> = ({ progress }) => {
  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 relative">
        <div className='absolute top-4 right-4'>
            <UserButton afterSignOutUrl='/rectify' />
        </div>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>{progress.phase.name}</span>
          <span>{Math.round(progress.overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.overallProgress}%` }}
          >
            <div className="h-full bg-white/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-gray-300">
            {progress.currentCandidate 
              ? `Testing: ${progress.currentCandidate.time}`
              : 'Initializing...'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Best:</span>
          {progress.bestCandidate ? (
            <>
              <span className="text-white font-medium">{progress.bestCandidate.time}</span>
              <span className={`font-bold ${getConfidenceColor(progress.bestCandidate.score)}`}>
                {progress.bestCandidate.score}/100
              </span>
            </>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-gray-400">
          <span>⏱️ {formatTime(progress.timeElapsed)}</span>
          <span>⏳ {formatTime(progress.estimatedRemaining)}</span>
        </div>
      </div>
    </div>
  );
};