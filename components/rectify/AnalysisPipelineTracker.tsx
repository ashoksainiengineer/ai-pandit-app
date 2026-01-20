import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageStat } from '@/lib/use-stream-progress';

interface AnalysisPipelineTrackerProps {
    stats: StageStat[];
    currentStage: number; // 1-10 scale
    isConnected: boolean;
}

const STAGE_CONFIG = [
    { id: 1, label: 'COARSE GRID', type: 'calc', color: 'blue' },
    { id: 2, label: 'LEVEL 1 SCREENING', type: 'ai', color: 'cyan' },
    { id: 3, label: 'REFINEMENT', type: 'calc', color: 'blue' },
    { id: 4, label: 'FINE GRID', type: 'calc', color: 'blue' },
    { id: 5, label: 'LEVEL 2 ANALYSIS', type: 'ai', color: 'purple' },
    { id: 6, label: 'MICRO GRID', type: 'calc', color: 'blue' },
    { id: 7, label: 'LEVEL 3 FINAL', type: 'ai', color: 'green' },
];

const ScanLine = () => (
    <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#D4AF37]/20 to-transparent z-0 pointer-events-none"
        initial={{ top: '-100%' }}
        animate={{ top: '200%' }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
    />
);

export const AnalysisPipelineTracker: React.FC<AnalysisPipelineTrackerProps> = ({ stats, currentStage, isConnected }) => {

    // Find active stats for display
    const activeStat = stats[stats.length - 1];

    return (
        <div className="w-full bg-[#0F1419] border-t border-[#3A4452] p-4 font-mono text-xs">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[#8C7F72] uppercase tracking-widest">Pipeline Status</span>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                    <div className="text-[#D4AF37]">
                        {activeStat ? `${activeStat.candidateCount} CANDIDATES ACTIVE` : 'INITIALIZING...'}
                    </div>
                </div>

                {/* Pipeline Visualization */}
                <div className="relative flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {STAGE_CONFIG.map((stage, idx) => {
                        const isPast = currentStage > stage.id;
                        const isActive = currentStage === stage.id;
                        const stat = stats.find(s => s.stage === stage.id);

                        // Map internal stage ID to progress stage
                        // We need to map the "stage" from stats (which matches backend stage IDs) to visual blocks

                        return (
                            <div key={stage.id} className="flex-1 min-w-[120px] relative group">
                                {/* Connector Line */}
                                {idx < STAGE_CONFIG.length - 1 && (
                                    <div className={`absolute top-1/2 left-full w-full h-[1px] -translate-y-1/2 z-0 
                                        ${isPast ? 'bg-[#D4AF37]/50' : 'bg-[#3A4452]'}`}
                                    />
                                )}

                                <motion.div
                                    initial={false}
                                    animate={{
                                        borderColor: isActive ? '#D4AF37' : isPast ? 'rgba(212,175,55,0.3)' : '#3A4452',
                                        backgroundColor: isActive ? 'rgba(212,175,55,0.05)' : '#0F1419',
                                        boxShadow: isActive ? '0 0 15px rgba(212,175,55,0.2)' : 'none'
                                    }}
                                    className={`relative z-10 border p-2 rounded transition-all duration-300 overflow-hidden
                                    ${isPast ? 'opacity-70' : isActive ? 'opacity-100' : 'opacity-40'}`}
                                >
                                    {isActive && <ScanLine />}

                                    <div className="flex justify-between items-start mb-1 relative z-10">
                                        <span className={`text-[9px] font-bold ${isActive ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>
                                            {stage.id.toString().padStart(2, '0')}
                                        </span>
                                        {stage.type === 'ai' && (
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.span
                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                        className="text-[8px] bg-purple-500/20 text-purple-300 px-1 rounded animate-pulse"
                                                    >
                                                        AI
                                                    </motion.span>
                                                )}
                                                {!isActive && (
                                                    <span className="text-[8px] bg-purple-500/10 text-purple-300/50 px-1 rounded">AI</span>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>

                                    <div className={`text-[10px] font-bold truncate mb-1 relative z-10 ${isActive ? 'text-[#F5F0EB]' : 'text-[#8C7F72]'}`}>
                                        {stage.label}
                                    </div>

                                    <div className="h-4 flex items-center relative z-10">
                                        {stat ? (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="flex items-center gap-1 text-[#D4AF37]"
                                            >
                                                <span className="text-lg animate-pulse">⚡</span>
                                                <span className="font-bold">{stat.candidateCount}</span>
                                            </motion.div>
                                        ) : isActive ? (
                                            <div className="w-full h-1 bg-[#3A4452] rounded overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-[#D4AF37]"
                                                    animate={{ x: ['-100%', '100%'] }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-[#3A4452]">-</span>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                {/* Grid Details (Matrix Style) */}
                <div className="mt-4 grid grid-cols-4 gap-4 border-t border-[#3A4452] pt-4 opacity-80">
                    <div>
                        <div className="text-[9px] text-[#8C7F72] mb-1">CURRENT STAGE</div>
                        <div className="text-[#F5F0EB] text-xs">
                            {activeStat?.description || 'System Idle'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] mb-1">PRECISION LEVEL</div>
                        <div className="text-[#D4AF37] text-xs font-bold">
                            {currentStage >= 6 ? 'MICRO-SECOND (6s)' : currentStage >= 4 ? 'FINE (30s)' : 'MINUTE (60s)'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] mb-1">DATA POINTS</div>
                        <div className="text-[#F5F0EB] text-xs font-mono">
                            {activeStat ? (activeStat.candidateCount * 150).toLocaleString() : '0'} OPS
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-[#8C7F72] mb-1">SYSTEM LOAD</div>
                        <div className="w-full bg-[#3A4452] h-2 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 w-[60%] animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
