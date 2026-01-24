'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Crosshair, Filter, Activity, Lock, ChevronRight, Zap, Target, Gauge, Database } from 'lucide-react';
import { AIContextData } from '@/lib/use-stream-progress';

interface Candidate {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    reasoning?: string;
}

interface LiveGodModeTerminalProps {
    candidateScores: Candidate[];
    calculationLogs: Array<{ candidateTime: string; log: string }>;
    currentStage: number;
    isConnected: boolean;
    aiContext: AIContextData | null;
}

export function LiveGodModeTerminal({
    candidateScores,
    calculationLogs,
    currentStage,
    isConnected,
    aiContext
}: LiveGodModeTerminalProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [opsPerSec, setOpsPerSec] = useState(1.42);
    const [neuralLoad, setNeuralLoad] = useState(85);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Dynamic HUD logic
    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(() => {
            setOpsPerSec(prev => Math.max(0.8, Math.min(2.5, prev + (Math.random() - 0.5) * 0.1)));
            setNeuralLoad(prev => Math.max(60, Math.min(95, prev + (Math.random() - 0.5) * 5)));
        }, 2000);
        return () => clearInterval(interval);
    }, [isConnected]);

    // Auto-scroll console
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [calculationLogs]);

    const level1Candidates = useMemo(() => candidateScores.filter(c => c.stage <= 2), [candidateScores]);
    const level2Candidates = useMemo(() => candidateScores.filter(c => c.stage >= 4 && c.stage < 6), [candidateScores]);
    const level3Candidates = useMemo(() => candidateScores.filter(c => c.stage >= 6), [candidateScores]);

    const displayedLogs = selectedCandidate
        ? calculationLogs.filter(l => l.candidateTime === selectedCandidate)
        : calculationLogs;

    return (
        <div className="w-full bg-[#05080A] border border-[#1A2433] rounded-2xl overflow-hidden font-mono text-xs shadow-2xl relative">
            {/* Ambient Matrix Glow */}
            <div className="absolute inset-0 bg-[#D4AF37]/5 pointer-events-none z-0 mix-blend-screen" />

            {/* HEADER / HUD */}
            <div className="bg-[#0A0F14] border-b border-[#1A2433] p-4 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                        <Terminal className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#D4AF37] font-black tracking-[0.3em] uppercase text-[11px]">
                                GOD_MODE_TERMINAL_v5.0
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex gap-3 mt-1 items-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tighter ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {isConnected ? 'NEURAL_LINK_ESTABLISHED' : 'LINK_OFFLINE'}
                            </span>
                            <span className="text-[8px] text-[#3A4452] uppercase font-bold">Latency: 24ms</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-[10px]">
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-[#8C7F72] uppercase font-bold text-[9px] tracking-widest">
                            <Cpu className="w-3 h-3 text-cyan-500" />
                            <span>Vedic_Core_Ops</span>
                        </div>
                        <div className="text-[#F5F0EB] font-black text-sm">{opsPerSec.toFixed(2)} <span className="text-[9px] text-[#3A4452]">T/s</span></div>
                    </div>
                    <div className="h-8 w-px bg-[#1A2433]" />
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 text-[#8C7F72] uppercase font-bold text-[9px] tracking-widest">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span>Neural_Load</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#1A2433] rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${neuralLoad}%` }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                            <span className="text-[#F5F0EB] font-black text-sm">{Math.floor(neuralLoad)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN FUNNEL GRID (3 PANES) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 h-[500px] relative z-10">

                {/* L1: COARSE GRID (DOTS) */}
                <div className="lg:col-span-4 border-r border-[#1A2433] flex flex-col bg-[#05080A]">
                    <div className="p-3 border-b border-[#1A2433] bg-[#0A0F14]/80 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-orange-500 font-black uppercase tracking-widest text-[10px]">L1_COARSE_SCAN</span>
                        </div>
                        <span className="text-[#3A4452] font-bold text-[9px]">{level1Candidates.length} NODES (Showing Top 128)</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-8 gap-2">
                            {level1Candidates.slice(0, 128).map((c, i) => (
                                <motion.button
                                    key={`${c.time}-${i}`}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.2 }}
                                    onClick={() => setSelectedCandidate(c.time === selectedCandidate ? null : c.time)}
                                    className={`aspect-square rounded-full flex items-center justify-center transition-all duration-300 relative
                                        ${c.time === selectedCandidate ? 'ring-2 ring-white ring-offset-2 ring-offset-[#05080A] z-10' : ''}
                                        ${c.score > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                                            c.score > 50 ? 'bg-orange-500/40 border border-orange-500/30' :
                                                'bg-[#1A2433] opacity-30'}
                                    `}
                                >
                                    {c.time === selectedCandidate && <div className="absolute inset-0 rounded-full animate-ping bg-white/30" />}
                                </motion.button>
                            ))}
                            {Array.from({ length: Math.max(0, 128 - Math.min(128, level1Candidates.length)) }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square bg-[#1A2433]/10 rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* L2: FINE GRID (TILES) & GROUND TRUTH OVERLAY */}
                <div className="lg:col-span-4 border-r border-[#1A2433] flex flex-col bg-[#05080A] relative group">
                    <div className="p-3 border-b border-[#1A2433] bg-[#0A0F14]/80 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-blue-500 font-black uppercase tracking-widest text-[10px]">L2_FINE_TILES</span>
                        </div>
                        <span className="text-[#3A4452] font-bold text-[9px]">{level2Candidates.length} SECTORS</span>
                    </div>

                    {/* 🔱 GROUND TRUTH OVERLAY (TRANS-PANEL) */}
                    <AnimatePresence>
                        {aiContext?.groundTruth && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-x-2 bottom-2 z-30 p-2 bg-[#0A0F14] border border-[#D4AF37]/30 rounded-lg shadow-2xl overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="w-2.5 h-2.5 text-[#D4AF37] animate-pulse" />
                                        <span className="text-[8px] text-[#D4AF37] font-black uppercase tracking-widest">Ground_Truth_Payload</span>
                                    </div>
                                    <span className="text-[7px] text-[#3A4452] font-bold uppercase">Format: JSON_ARC</span>
                                </div>
                                <div className="bg-black/60 p-2 rounded border border-white/5 max-h-[100px] overflow-y-auto custom-scrollbar">
                                    <pre className="text-[9px] text-emerald-400/80 leading-tight whitespace-pre-wrap font-mono">
                                        {JSON.stringify(aiContext.groundTruth, null, 2)}
                                    </pre>
                                </div>
                                <div className="absolute top-0 right-0 p-1 opacity-20">
                                    <Activity className="w-10 h-10 text-[#D4AF37]" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        {level2Candidates.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <Zap className="w-8 h-8 mb-2 animate-pulse text-[#3A4452]" />
                                <span className="uppercase tracking-[0.3em] text-[9px] font-bold">Scanning_L1_Output</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {level2Candidates.sort((a, b) => b.score - a.score).slice(0, 30).map((c) => (
                                    <motion.div
                                        key={c.time}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setSelectedCandidate(c.time === selectedCandidate ? null : c.time)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 group
                                            ${c.time === selectedCandidate ? 'bg-blue-500/20 border-blue-500' : 'bg-[#0A0F14] border-[#1A2433] hover:border-[#3A4452]'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-[#F5F0EB] text-[10px] group-hover:text-blue-400 transition-colors">{c.time}</span>
                                            <div className="flex flex-col items-end">
                                                <span className="text-blue-500 font-black text-[11px]">{Math.round(c.score)}%</span>
                                                <div className="w-8 h-0.5 bg-[#1A2433] mt-1 overflow-hidden rounded-full">
                                                    <div className="h-full bg-blue-500" style={{ width: `${c.score}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full ${c.score > 70 ? 'bg-emerald-500/30' : 'bg-rose-500/10'}`} />
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* L3: MICRO PRECISION (CROSSHAIR/HUD) */}
                <div className="lg:col-span-4 flex flex-col bg-[#05080A] relative overflow-hidden">
                    <div className="p-3 border-b border-[#1A2433] bg-[#0A0F14]/80 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <Crosshair className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span className="text-[#D4AF37] font-black uppercase tracking-widest text-[10px]">L3_MICRO_PRECISION</span>
                        </div>
                        <Gauge className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
                    </div>

                    <div className="flex-1 p-4 relative z-10 overflow-y-auto custom-scrollbar">
                        {level3Candidates.length < 2 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <Lock className="w-8 h-8 mb-3 text-[#3A4452]" />
                                <span className="uppercase tracking-[0.3em] text-[9px] font-bold text-center">Awaiting_High_Confidence_Sync</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {level3Candidates.slice(0, 3).map((c, idx) => (
                                    <motion.div
                                        key={c.time}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`p-4 rounded-xl border-2 relative group overflow-hidden ${idx === 0
                                            ? 'bg-[#D4AF37]/5 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.15)]'
                                            : 'bg-[#0A0F14] border-[#1A2433]'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-[#3A4452] font-black uppercase tracking-widest">Candidate_Sig_{idx + 1}</span>
                                                <div className="text-2xl font-black text-[#F5F0EB] tracking-tighter leading-none mt-1">{c.time}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-xl font-black ${idx === 0 ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>{c.score}%</div>
                                                <div className="text-[8px] uppercase font-bold text-[#3A4452]">Stability_Index</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-black/40 p-2 rounded border border-[#1A2433]">
                                                <div className="text-[8px] text-[#3A4452] uppercase font-black mb-1">Varga_Sync</div>
                                                <div className="text-[10px] text-emerald-400 font-bold">D9+D10_LOCKED</div>
                                            </div>
                                            <div className="bg-black/40 p-2 rounded border border-[#1A2433]">
                                                <div className="text-[8px] text-[#3A4452] uppercase font-black mb-1">Transit_Hits</div>
                                                <div className="text-[10px] text-sky-400 font-bold">DOUBLE_TRANSIT</div>
                                            </div>
                                        </div>

                                        {idx === 0 && (
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#D4AF37]/20 overflow-hidden">
                                                <div className="h-full bg-[#D4AF37] animate-loading-bar shadow-[0_0_10px_#D4AF37]" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PERSISTENT REAL-TIME LOGS (CONSOLE) */}
            <div className="bg-[#000000] border-t border-[#1A2433] h-[180px] font-mono text-xs overflow-hidden flex flex-col relative z-20">
                <div className="flex justify-between items-center p-3 bg-[#0A0F14]/60 border-b border-[#1A2433] text-[9px] uppercase font-black tracking-widest">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <span className="text-emerald-500">Log_Stream_v1.0.4</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-[#3A4452]">{selectedCandidate ? `FILTER: [${selectedCandidate}]` : 'CORE: GLOBAL_BROADCAST'}</span>
                        <span className="text-cyan-500 animate-pulse">● POLLING_DB</span>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {displayedLogs.length === 0 ? (
                        <div className="text-[#1A2433] italic animate-pulse">System warm-up sequence initiated. Waiting for neural telemetry...</div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {displayedLogs.map((log, i) => (
                                <motion.div
                                    key={`${log.candidateTime}-${i}`}
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-4 hover:bg-[#1A2433]/40 p-1.5 rounded-lg transition-all duration-200 group border border-transparent hover:border-[#1A2433]"
                                >
                                    <span className="text-[#1A2433] font-bold tabular-nums">
                                        [{new Date().toLocaleTimeString('en-GB', { hour12: false })}]
                                    </span>
                                    <span className={`font-black uppercase tracking-tighter w-20 shrink-0 ${log.log.includes('Coarse') || log.log.includes('Minute') ? 'text-orange-500' :
                                        log.log.includes('Fine') || log.log.includes('30s') ? 'text-blue-500' :
                                            'text-[#D4AF37]'
                                        }`}>
                                        {log.candidateTime === 'Global' ? 'SYS_AUDIT' : log.candidateTime}
                                    </span>
                                    <span className="text-[#8C7F72] group-hover:text-[#F5F0EB] transition-colors flex-1 leading-relaxed">
                                        {log.log}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 h-4 bg-[#D4AF37] inline-block ml-2 align-middle shadow-[0_0_5px_#D4AF37]"
                    />
                </div>
            </div>
        </div>
    );
}
