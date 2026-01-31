import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StageStat } from '@/lib/use-stream-progress';
import { Cpu, Activity, Zap, Settings } from 'lucide-react';

interface AnalysisPipelineTrackerProps {
    stats: StageStat[];
    allSteps: Array<{ id: string; name: string; icon?: string }>;
    currentStage: number; // 0-based index
    isConnected: boolean;
    isComplete?: boolean; // 🏁 Completion flag
}

// Sacred Ivory Theme Constants
const THEME = {
    bg: '#FFFFFF',
    bgWarm: '#FDF8F3',
    bgCream: '#FAF5EF',
    border: '#F0E8DE',
    borderHover: '#E8E0D5',
    textPrimary: '#1A1612',
    textSecondary: '#4A453F',
    textMuted: '#7A756F',
    textSubtle: '#A8A39D',
    gold: '#B8860B',
    goldLight: '#D4A853',
    goldPale: '#F2E4C6',
    success: '#2D7A5C',
    successLight: '#D4E5DE',
    warning: '#E8A849',
    error: '#C65D3B',
    plum: '#6B1F7A',
} as const;

const ScanLine = () => (
    <motion.div
        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#B8860B] to-transparent z-10 opacity-50"
        style={{ boxShadow: '0 0 10px rgba(184,134,11,0.3)' }}
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
        <div className="w-full bg-white border border-[#F0E8DE] rounded-2xl p-6 font-sans text-sm overflow-hidden relative shadow-sm">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8860B]/20 to-[#D4A853]/10 flex items-center justify-center border border-[#D4A853]/20">
                        <Settings className="w-5 h-5 text-[#B8860B]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1A1612] font-[family-name:var(--font-cormorant)] text-lg">Analysis Pipeline</h3>
                        <p className="text-xs text-[#7A756F]">Real-time processing stages</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    {/* System Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FDF8F3] rounded-lg border border-[#F0E8DE]">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2D7A5C]' : 'bg-[#C65D3B]'} animate-pulse`} />
                        <span className={`text-xs font-semibold ${isConnected ? 'text-[#2D7A5C]' : 'text-[#C65D3B]'}`}>
                            {isConnected ? 'Online' : 'Reconnecting'}
                        </span>
                    </div>
                    
                    {/* Active Engine */}
                    <div className="text-right">
                        <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-0.5">Active Engine</div>
                        <div className="text-xs font-semibold text-[#B8860B]">
                            {currentStage >= 0 ? (isAIStage ? 'DeepSeek R1' : 'Swiss Ephemeris') : 'Idle'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Blocks */}
            <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-4 pt-2 scrollbar-none">
                {allSteps.map((stage, idx) => {
                    const isPast = currentStage > idx;
                    const isActive = currentStage === idx;
                    const stat = stats.find(s => s.stage === idx);
                    const isAI = stage.id === 'discovery' || stage.id === 'seal';

                    return (
                        <div key={stage.id} className="flex-1 min-w-[100px] relative">
                            <motion.div
                                initial={false}
                                animate={{
                                    borderColor: isActive ? '#B8860B' : isPast ? 'rgba(184,134,11,0.4)' : '#F0E8DE',
                                    backgroundColor: isActive ? 'rgba(184,134,11,0.05)' : isPast ? '#FDF8F3' : '#FFFFFF',
                                }}
                                className={`relative z-10 border-2 p-3 rounded-xl transition-all duration-500
                                ${isActive ? 'shadow-lg shadow-[#B8860B]/10 ring-1 ring-[#B8860B]/20 scale-[1.02]' : ''}`}
                            >
                                {isActive && !isComplete && <ScanLine />}

                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[10px] font-bold ${isActive ? 'text-[#B8860B]' : 'text-[#7A756F]'}`}>
                                        Step {idx + 1}
                                    </span>
                                    {isAI && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#6B1F7A] text-white' : 'bg-[#6B1F7A]/10 text-[#6B1F7A]'}`}>
                                            AI
                                        </span>
                                    )}
                                </div>

                                <div className={`text-xs font-semibold truncate mb-2 ${isActive ? 'text-[#1A1612]' : 'text-[#7A756F]'}`}>
                                    {stage.name}
                                </div>

                                <div className="flex items-center justify-between">
                                    {stat ? (
                                        <motion.span
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="text-[#B8860B] font-bold text-sm"
                                        >
                                            {stat.candidateCount}
                                        </motion.span>
                                    ) : isActive ? (
                                        <span className="text-[#2D7A5C] animate-pulse text-xs font-medium">Processing</span>
                                    ) : (
                                        <span className="text-[#D0CBC5]">—</span>
                                    )}
                                    {isPast && <CheckCircleIcon />}
                                </div>
                            </motion.div>
                            
                            {/* Connector Line */}
                            {idx < allSteps.length - 1 && (
                                <div className="absolute top-1/2 -right-1 w-2 h-0.5 bg-[#F0E8DE]" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sub-Metrics Bar */}
            <div className="mt-6 grid grid-cols-4 gap-4 items-center border-t border-[#F0E8DE] pt-4">
                <div className="group">
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-1">Current Task</div>
                    <div className="text-[#1A1612] text-xs font-medium truncate">
                        {activeStat?.description || 'Waiting for task...'}
                    </div>
                </div>
                
                <div>
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-1">Precision</div>
                    <div className="text-[#B8860B] text-xs font-semibold">
                        {currentStage >= 8 ? '±3 seconds' : currentStage >= 6 ? '±6 seconds' : currentStage >= 4 ? '±30 seconds' : '±60 seconds'}
                    </div>
                </div>
                
                <div>
                    <div className="text-[10px] text-[#7A756F] uppercase tracking-wider mb-1">Candidates</div>
                    <div className="text-[#1A1612] text-xs font-mono font-semibold">
                        {candidateCount > 0 ? candidateCount.toLocaleString() : '0'}
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-[#7A756F] uppercase tracking-wider">Load</span>
                        <span className={`text-[10px] font-bold ${load > 90 ? 'text-[#C65D3B]' : 'text-[#B8860B]'}`}>{load}%</span>
                    </div>
                    <div className="w-full bg-[#F5EFE7] h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${load > 90 ? 'bg-[#C65D3B]' : 'bg-gradient-to-r from-[#2D7A5C] to-[#B8860B]'}`}
                            initial={{ width: '0%' }}
                            animate={{ width: `${load}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for completed checkmark
function CheckCircleIcon() {
    return (
        <svg className="w-4 h-4 text-[#2D7A5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}
