import React from 'react';
import { ActivityLogEntry } from '@/types/btr-realtime';

interface ActivityLogPanelProps {
  logEntries: ActivityLogEntry[];
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ logEntries }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'calculation': return 'text-green-400';
      case 'ai': return 'text-purple-400';
      case 'result': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-900/20';
      case 'calculation': return 'bg-green-900/20';
      case 'ai': return 'bg-purple-900/20';
      case 'result': return 'bg-yellow-900/20';
      case 'error': return 'bg-red-900/20';
      default: return 'bg-gray-900/20';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'calculation': return '🔢';
      case 'ai': return '🤖';
      case 'result': return '📊';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <span className="text-2xl mr-3">📋</span>
        Live Activity Log
      </h2>

      {logEntries.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`rounded-lg p-3 border border-gray-600/30 transition-all duration-300 ${getLevelBgColor(entry.level)}`}
              style={{
                animationDelay: `${index * 0.05}s`,
                animation: 'fadeInUp 0.3s ease-out forwards',
                opacity: 0
              }}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {getLevelIcon(entry.level)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${getLevelColor(entry.level)}`}>
                      [{formatTimestamp(entry.timestamp)}]
                    </span>
                    {entry.candidateNumber && (
                      <span className="text-xs text-gray-400">
                        #{entry.candidateNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white">
                    {entry.message}
                  </div>
                  {entry.candidateTime && (
                    <div className="text-xs text-gray-400 mt-1">
                      Time: {entry.candidateTime}
                    </div>
                  )}
                  {entry.details && (
                    <div className="text-xs text-gray-500 mt-1 ml-3">
                      └─ {entry.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <div>Activity log empty...</div>
            <div className="text-sm mt-2">Waiting for process to start</div>
          </div>
        </div>
      )}

      {/* Log Statistics */}
      {logEntries.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700/50">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
              <div className="text-gray-400">Total Entries</div>
              <div className="text-white font-bold text-lg">{logEntries.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
              <div className="text-gray-400">Last Activity</div>
              <div className="text-white font-bold">
                {logEntries[logEntries.length - 1]?.level || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};