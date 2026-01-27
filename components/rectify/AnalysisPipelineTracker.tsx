import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageStat } from '@/lib/use-stream-progress';

interface AnalysisPipelineTrackerProps {
    stats: StageStat[];
    allSteps: Array<{ id: string; name: string; icon?: string }>;
    currentStage: number; // 0-based index
    isConnected: boolean;
    isComplete?: boolean; // 🏁 Completion flag
}

const ScanLine = () => (
    <motion.div
        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-10 opacity-50 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
        initial={{ top: '0%' }}
        animate={{ top: '100%' }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
    />
);

export const AnalysisPipelineTracker: React.FC<AnalysisPipelineTrackerProps> = ({ stats, allSteps, currentStage, isConnected, isComplete = false }) => {
    const [load, setLoad] = useState(72.4);

    // 💓 Neural Load Logic (Responsive to Stage)
    useEffect(() => {
        if (isComplete) {
            setLoad(0); // Load drops to zero on completion
            return;
        }

        const interval = setInterval(() => {
            setLoad(prev => {
                const step = allSteps[currentStage];
                const isAIStage = step?.id === 'discovery' || step?.id === 'seal';
                const baseLoad = isAIStage ? 85 : currentStage > 0 ? 45 : 12;
                const jitter = (Math.random() - 0.5) * 10;
                const next = Math.max(10, Math.min(99, baseLoad + jitter));
                return Number(next.toFixed(1));
            });
        }, 1200);
        return () => clearInterval(interval);
    }, [currentStage, allSteps, isComplete]);

    const activeStat = stats[stats.length - 1];
    const candidateCount = activeStat?.candidateCount || 0;
    const currentStep = allSteps[currentStage];
    const isAIStage = currentStep?.id === 'discovery' || currentStep?.id === 'seal';

    return (
        <div className="w-full bg-[#0F1419] border-t border-[#3A4452] p-4 font-mono text-xs overflow-hidden relative">
            {/* Background Data Stream Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none font-mono text-[8px] leading-none overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="whitespace-nowrap animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                        {Array.from({ length: 50 }).map(() => Math.random().toString(16).substring(2, 8)).join(' ')}
                    </div>
                ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[#8C7F72] text-[8px] uppercase tracking-[0.2em]">System Status</span>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'} animate-pulse`} />
                                <span className="text-[#F5F0EB] font-bold">{isConnected ? 'ONLINE' : 'LINK LOST'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-right">
                            <div className="text-[#8C7F72] text-[8px] uppercase tracking-[0.2em]">Buffer Sessions</div>
                            <div className={`font-bold ${isConnected ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                                {isConnected ? 'STABLE' : 'DRAINING'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[#8C7F72] text-[8px] uppercase tracking-[0.2em]">Compute Pool</div>
                            <div className={`${currentStage >= 0 ? 'text-[#D4AF37]' : 'text-[#8C7F72]'} font-bold whitespace-nowrap overflow-hidden max-w-[120px]`}>
                                {currentStage >= 0 ? (isAIStage ? 'R1-REASONER-V1' : 'SWISS-EPHEM-V2') : 'IDLE'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pipeline Blocks */}
                <div className="relative flex items-center justify-between gap-1 overflow-x-auto pb-4 pt-2 scrollbar-none">
                    {allSteps.map((stage, idx) => {
                        const isPast = currentStage > idx;
                        const isActive = currentStage === idx;
                        const stat = stats.find(s => s.stage === idx);
                        const isAI = stage.id === 'discovery' || stage.id === 'seal';

                        return (
                            <div key={stage.id} className="flex-1 min-w-[120px] relative">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        borderColor: isActive ? '#D4AF37' : isPast ? 'rgba(212,175,55,0.4)' : '#2A3442',
                                        backgroundColor: isActive ? 'rgba(212,175,55,0.08)' : isPast ? 'transparent' : '#0F1419',
                                    }}
                                    className={`relative z-10 border p-2 rounded-sm transition-all duration-500
                                    ${isActive ? 'shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/20 scale-[1.02]' : 'opacity-60'}`}
                                >
                                    {isActive && !isComplete && <ScanLine />}

                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[8px] font-bold ${isActive ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>
                                            PH-{(idx + 1).toString().padStart(2, '0')}
                                        </span>
                                        {isAI && (
                                            <span className={`text-[7px] px-1 rounded-full ${isActive ? 'bg-purple-500 text-white animate-pulse' : 'bg-purple-900/30 text-purple-400'}`}>
                                                AI
                                            </span>
                                        )}
                                    </div>

                                    <div className={`text-[9px] font-black uppercase tracking-tighter truncate ${isActive ? 'text-[#F5F0EB]' : 'text-[#8C7F72]'}`}>
                                        {stage.name}
                                    </div>

                                    <div className="mt-1 h-3 flex items-center justify-between">
                                        {stat ? (
                                            <motion.span
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="text-[#D4AF37] font-bold text-[10px]"
                                            >
                                                {stat.candidateCount}
                                            </motion.span>
                                        ) : isActive ? (
                                            <span className="text-emerald-400 animate-pulse text-[8px]">ACTIVE</span>
                                        ) : (
                                            <span className="text-[#2A3442]">---</span>
                                        )}
                                        {isPast && <span className="text-emerald-500 font-bold ml-1 text-[8px]">✓</span>}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                {/* Sub-Metric Bar */}
                <div className="mt-4 grid grid-cols-4 gap-6 items-center border-t border-[#3A4452]/50 pt-4">
                    <div className="group cursor-help">
                        <div className="text-[8px] text-[#8C7F72] uppercase tracking-[0.2em] mb-1 group-hover:text-[#D4AF37]">Active Thread</div>
                        <div className="text-[#F5F0EB] text-xs font-bold truncate">
                            {activeStat?.description || 'WAITING_FOR_TASK...'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[8px] text-[#8C7F72] uppercase tracking-[0.2em] mb-1">Resolution</div>
                        <div className="text-cyan-400 text-xs font-bold">
                            {currentStage >= 8 ? '± 3.00 SECS' : currentStage >= 6 ? '± 6.00 SECS' : currentStage >= 4 ? '± 30.00 SECS' : '± 60.00 SECS'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[8px] text-[#8C7F72] uppercase tracking-[0.2em] mb-1">Compute Throughput</div>
                        <div className="text-[#F5F0EB] text-xs font-mono">
                            {currentStage > 0 ? (isAIStage ? '1.42 T-OPS/S' : `${(candidateCount * 420).toLocaleString()} OPS/S`) : '0.00 OPS/S'}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] text-[#8C7F72] uppercase tracking-[0.2em]">Neural Load</span>
                            <span className={`text-[9px] font-bold ${load > 90 ? 'text-red-400' : 'text-[#D4AF37]'}`}>{load}%</span>
                        </div>
                        <div className="w-full bg-[#1A222C] h-1 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${load > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-amber-500'}`}
                                initial={{ width: '0%' }}
                                animate={{ width: `${load}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
