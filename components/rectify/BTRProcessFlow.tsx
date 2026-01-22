'use client';

import { motion } from 'framer-motion';
import {
    Zap,
    Search,
    Filter,
    ShieldCheck,
    Database,
    Brain,
    Cpu,
    Activity,
    CheckCircle2
} from 'lucide-react';

interface BTRProcessFlowProps {
    currentStepIndex: number;
}

// 🗂️ BTR PIPELINE DEFINITION (God-Tier Presentation)
const PIPELINE = [
    {
        id: 'setup',
        name: 'Initialization',
        icon: Database,
        description: 'Establishing grid parameters & loading ephemeris data',
        methods: ['Global Grid Setup', 'NASA JPL Ephemeris', 'Session Encryption'],
        stepRange: [0, 0] // Steps 0-0
    },
    {
        id: 'calc',
        name: 'Calculation',
        icon: Cpu,
        description: 'High-precision planetary position computation',
        methods: ['Swiss Ephemeris v2', '30s Cusp Mapping', 'Ayanamsa Correction'],
        stepRange: [1, 2] // Steps 1-2
    },
    {
        id: 'screen',
        name: 'Screening',
        icon: Filter,
        description: 'Multi-level candidate filtration tournament',
        methods: ['Neural Screening (L1)', 'Dasha Boundary Scan', 'Divisional Charts (D9/D10)'],
        stepRange: [3, 5] // Steps 3-5
    },
    {
        id: 'verify',
        name: 'Verification',
        icon: Brain,
        description: 'Logic-heavy AI reasoning & life event correlation',
        methods: ['DeepSeek R1 (Reasoning)', 'Event Correlation', 'Transit Sync'],
        stepRange: [6, 7] // Steps 6-7
    },
    {
        id: 'final',
        name: 'Finalization',
        icon: ShieldCheck,
        description: 'Final audit & sealing of rectified birth time',
        methods: ['Vedic Shuddhi Audit', 'Result Synthesis', 'PDF Generation'],
        stepRange: [8, 9] // Steps 8-9
    }
];

export function BTRProcessFlow({ currentStepIndex }: BTRProcessFlowProps) {

    // Determine active phase based on step index
    const activePhaseIndex = PIPELINE.findIndex(
        phase => currentStepIndex >= phase.stepRange[0] && currentStepIndex <= phase.stepRange[1]
    );

    // If completed (stepIndex > last range), activePhase is last + 1 (all complete)
    const effectivePhase = activePhaseIndex === -1 ? (
        currentStepIndex > 9 ? 5 : 0
    ) : activePhaseIndex;

    return (
        <div className="w-full mb-8 relative">
            {/* Title */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="text-xs font-bold text-[#8C7F72] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#D4AF37]" />
                    Process Analysis Pipeline
                </div>
                <div className="text-[10px] text-[#8C7F72]/60 font-mono">
                    LIVE ENGINE VIEW
                </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="relative flex justify-between items-start w-full px-4">

                {/* Connecting Line (Background) */}
                <div className="absolute top-6 left-8 right-8 h-0.5 bg-[#2A3442] -z-10" />

                {/* Connecting Line (Progress) */}
                <motion.div
                    className="absolute top-6 left-8 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#F5D061] -z-10 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, (effectivePhase / (PIPELINE.length - 1)) * 100)}%` }} // Adjust width logic to span between nodes
                    transition={{ duration: 1, ease: "easeInOut" }}
                    // Note: This simple width approach assumes equal spacing. 
                    // For perfect node-to-node line, we'd calculate based on container width % but this is a good approximation.
                    style={{
                        // Refined calc: Each gap is 20% (for 5 items). 
                        // 0 -> 0%, 1 -> 25%, 2 -> 50%, 3 -> 75%, 4 -> 100%
                        width: `calc(${Math.min(100, effectivePhase * 25)}% - 4rem)`
                    }}
                />

                {PIPELINE.map((phase, idx) => {
                    const isActive = idx === effectivePhase;
                    const isCompleted = idx < effectivePhase;

                    return (
                        <div key={phase.id} className="flex flex-col items-center group relative w-32">
                            {/* Node */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-4 relative z-10 transition-all duration-500
                                    ${isActive
                                        ? 'bg-[#1A1F2E] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                        : isCompleted
                                            ? 'bg-[#0F1419] border-[#2D7A5C] shadow-[0_0_10px_rgba(45,122,92,0.5)]'
                                            : 'bg-[#0F1419] border-[#3A4452]'
                                    }`}
                            >
                                <phase.icon
                                    className={`w-5 h-5 transition-colors duration-500
                                        ${isActive ? 'text-[#D4AF37]' : isCompleted ? 'text-[#2D7A5C]' : 'text-[#3A4452]'}
                                    `}
                                />

                                {/* Pulse Effect for Active */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-full border border-[#D4AF37] animate-ping opacity-20" />
                                )}
                                {isCompleted && (
                                    <div className="absolute -top-1 -right-1 bg-[#1A1F2E] rounded-full">
                                        <CheckCircle2 className="w-4 h-4 text-[#2D7A5C]" />
                                    </div>
                                )}
                            </motion.div>

                            {/* Label */}
                            <div className={`text-center transition-colors duration-300 ${isActive ? 'text-[#F5F0EB]' : 'text-[#8C7F72]'}`}>
                                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">
                                    {phase.name}
                                </div>

                            </div>

                            {/* 🔮 HOVER CARD (God Tier Detail) */}
                            <div className="absolute top-full mt-4 w-48 bg-[#1A1F2E]/95 backdrop-blur-md border border-[#3A4452] rounded-lg p-3 shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-20">
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[#3A4452]" />
                                <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider mb-2 border-b border-[#3A4452] pb-1">
                                    Methods Used
                                </div>
                                <div className="space-y-1.5">
                                    {phase.methods.map((method, mIdx) => (
                                        <div key={mIdx} className="flex items-center gap-2 text-[10px] text-[#C4B8AD]">
                                            <Zap className="w-2.5 h-2.5 text-[#D4AF37]/70" />
                                            {method}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-[9px] text-[#8C7F72] leading-tight italic border-t border-[#3A4452] pt-2">
                                    {phase.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
