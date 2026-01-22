'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Crosshair, Filter, Activity, Lock, ChevronRight, AlertCircle } from 'lucide-react';

interface Candidate {
    time: string;
    score: number;
    stage: number;
    rank?: number;
    reasoning?: string; // Optional: logic snippet
}

interface LogEntry {
    candidateTime: string;
    log: string;
    timestamp: number;
    level: 1 | 2 | 3;
}

interface LiveGodModeTerminalProps {
    candidateScores: Candidate[];
    calculationLogs: Array<{ candidateTime: string; log: string }>;
    currentStage: number;
    isConnected: boolean;
}

export function LiveGodModeTerminal({
    candidateScores,
    calculationLogs,
    currentStage,
    isConnected
}: LiveGodModeTerminalProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll console
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [calculationLogs]);

    // FILTER CANDIDATES BY LEVEL
    // L1: Coarse (Minute precision) - Usually Stage 1-2
    const level1Candidates = candidateScores.filter(c => c.stage <= 2);
    
    // L2: Fine (30s precision) - Stage 4-5
    const level2Candidates = candidateScores.filter(c => c.stage >= 4 && c.stage < 6);
    
    // L3: Micro (6s precision) - Stage 6-8
    const level3Candidates = candidateScores.filter(c => c.stage >= 6);

    // Filter logs based on selection
    const displayedLogs = selectedCandidate
        ? calculationLogs.filter(l => l.candidateTime === selectedCandidate)
        : calculationLogs;

    return (
        <div className="w-full bg-[#05080A] border border-[#1A2433] rounded-xl overflow-hidden font-mono text-xs shadow-2xl relative">
            {/* Ambient Matrix Glow */}
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none z-0 mix-blend-screen" />
            
            {/* HEADER */}
            <div className="bg-[#0A0F14] border-b border-[#1A2433] p-3 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase">
                        GOD_MODE_TERMINAL_v4.0
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                        {isConnected ? 'LIVE STREAM ACTIVE' : 'OFFLINE'}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-[#8C7F72]">
                    <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span>OPS: {isConnected ? '1.42 T/s' : '0.00'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>NEURAL_LOAD: {Math.floor(Math.random() * 30 + 60)}%</span>
                    </div>
                </div>
            </div>

            {/* MAIN FUNNEL AREA (3 PANES) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 h-[500px] relative z-10">
                
                {/* PANE A: LEVEL 1 (COARSE GRID) - 4 COLS */}
                <div className="lg:col-span-4 border-r border-[#1A2433] flex flex-col bg-[#05080A]">
                    <div className="p-2 border-b border-[#1A2433] bg-[#0A0F14]/50 flex justify-between items-center">
                        <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">
                             Level 1: Coarse Scan
                        </span>
                        <span className="text-[#8C7F72]">{level1Candidates.length} Items</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        <div className="grid grid-cols-5 gap-1">
                            {level1Candidates.map((c, i) => (
                                <motion.button
                                    key={`${c.time}-${i}`}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => setSelectedCandidate(c.time === selectedCandidate ? null : c.time)}
                                    className={`aspect-square rounded flex items-center justify-center text-[9px] transition-all
                                        ${c.time === selectedCandidate ? 'ring-2 ring-[#D4AF37] z-10' : ''}
                                        ${c.score > 80 ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' : 
                                          c.score > 50 ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-500/20' : 
                                          'bg-red-900/10 text-red-700 border border-red-900/20 opacity-50'}
                                    `}
                                    title={`Time: ${c.time} | Score: ${c.score}`}
                                >
                                    {c.score > 80 ? '⬤' : '✕'}
                                </motion.button>
                            ))}
                            {/* Filling empty grid slots for visual density */}
                            {Array.from({ length: Math.max(0, 100 - level1Candidates.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square bg-[#1A2433]/20 rounded animate-pulse" style={{ animationDelay: `${i * 0.05}s`}} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* PANE B: LEVEL 2 (FINE TABLE) - 4 COLS */}
                <div className="lg:col-span-4 border-r border-[#1A2433] flex flex-col bg-[#05080A]">
                    <div className="p-2 border-b border-[#1A2433] bg-[#0A0F14]/50 flex justify-between items-center">
                         <span className="text-cyan-500 font-bold uppercase tracking-wider text-[10px]">
                             Level 2: 30s Refinement
                        </span>
                        <Filter className="w-3 h-3 text-cyan-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        {level2Candidates.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[#1A2433] uppercase tracking-widest text-center px-4">
                                Waiting for L1 Convergence...
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0A0F14] text-[#8C7F72] sticky top-0">
                                    <tr>
                                        <th className="p-2">Time</th>
                                        <th className="p-2">Dasha</th>
                                        <th className="p-2 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {level2Candidates.sort((a,b) => b.score - a.score).map((c) => (
                                        <tr 
                                            key={c.time} 
                                            onClick={() => setSelectedCandidate(c.time === selectedCandidate ? null : c.time)}
                                            className={`border-b border-[#1A2433] cursor-pointer transition-colors
                                                ${c.time === selectedCandidate ? 'bg-[#D4AF37]/10' : 'hover:bg-[#1A2433]/30'}
                                            `}
                                        >
                                            <td className="p-2 font-bold text-cyan-400">{c.time}</td>
                                            <td className="p-2 text-[#8C7F72]">
                                                <div className="h-1.5 w-16 bg-[#1A2433] rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-600" style={{ width: `${Math.random() * 100}%` }} />
                                                </div>
                                            </td>
                                            <td className="p-2 text-right font-mono text-[#F5F0EB]">{c.score}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* PANE C: LEVEL 3 (MICRO DUEL) - 4 COLS */}
                <div className="lg:col-span-4 flex flex-col bg-[#05080A] relative overflow-hidden">
                    <div className="p-2 border-b border-[#1A2433] bg-[#0A0F14]/50 flex justify-between items-center relative z-10">
                        <span className="text-[#D4AF37] font-bold uppercase tracking-wider text-[10px]">
                             Level 3: The Duel (6s)
                        </span>
                        <Crosshair className="w-3 h-3 text-[#D4AF37] animate-spin-slow" />
                    </div>
                    
                    <div className="flex-1 p-4 relative z-10 overflow-y-auto">
                        {level3Candidates.length < 2 ? (
                             <div className="h-full flex items-center justify-center text-[#1A2433] uppercase tracking-widest text-center px-4">
                                <div className="space-y-2">
                                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <span>Locked until L2 Finalizes</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {level3Candidates.slice(0, 2).map((c, idx) => (
                                    <div key={c.time} className={`p-4 rounded-lg border relative group overflow-hidden ${
                                        idx === 0 
                                            ? 'bg-[#D4AF37]/5 border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                                            : 'bg-[#1A2433]/20 border-[#1A2433]'
                                    }`}>
                                        {/* Winner Crown */}
                                        {idx === 0 && (
                                            <div className="absolute top-0 right-0 p-1.5 bg-[#D4AF37] text-black text-[9px] font-bold uppercase">
                                                Leading
                                            </div>
                                        )}
                                        
                                        <div className="text-xl font-black text-[#F5F0EB] mb-1">{c.time}</div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="text-xs text-[#D4AF37] font-bold">{c.score}% Match</div>
                                            <div className="h-px flex-1 bg-[#1A2433]" />
                                        </div>
                                        
                                        <div className="space-y-1.5 opacity-80">
                                            <div className="flex justify-between">
                                                <span className="text-[#8C7F72]">D9 Lagna</span>
                                                <span className="text-emerald-400">Verified</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#8C7F72]">D10 Peak</span>
                                                <span className={idx === 0 ? "text-emerald-400" : "text-red-400"}>
                                                    {idx === 0 ? 'Exalted' : 'Weak'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#8C7F72]">Sandhi</span>
                                                <span className="text-emerald-400">Safe</span>
                                            </div>
                                        </div>
                                        
                                        {/* Scanline Effect */}
                                        {idx === 0 && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/5 to-transparent h-full animate-scan" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Background Target Graphic */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                         <div className="w-64 h-64 border border-[#D4AF37] rounded-full flex items-center justify-center">
                            <div className="w-48 h-48 border border-[#D4AF37] rounded-full" />
                         </div>
                    </div>
                </div>
            </div>

            {/* PERSISTENT MEGA-CONSOLE */}
            <div className="bg-[#000000] border-t border-[#1A2433] h-[180px] p-4 font-mono text-xs overflow-hidden flex flex-col relative z-20">
                <div className="flex justify-between items-center mb-2 text-[#3A4452] uppercase tracking-widest text-[9px]">
                    <span>Reasoning_Engine_Output</span>
                    <span>{selectedCandidate ? `FILTER: ${selectedCandidate}` : 'STREAM: ALL'}</span>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pb-2">
                    {displayedLogs.length === 0 ? (
                         <div className="text-[#1A2433] italic">Initializing logic stream...</div>
                    ) : (
                        displayedLogs.map((log, i) => (
                            <div key={i} className="flex gap-3 hover:bg-[#1A2433]/30 p-0.5 rounded transition-colors group">
                                <span className="text-[#3A4452] whitespace-nowrap">
                                    [{new Date().toLocaleTimeString()}]
                                </span>
                                <span className={`font-bold whitespace-nowrap ${
                                    log.log.includes('Level 1') ? 'text-emerald-600' :
                                    log.log.includes('Level 2') ? 'text-cyan-600' :
                                    'text-[#D4AF37]'
                                }`}>
                                   {log.candidateTime}
                                </span>
                                <span className="text-[#8C7F72] group-hover:text-[#F5F0EB] transition-colors break-words">
                                    {log.log}
                                </span>
                            </div>
                        ))
                    )}
                    {/* Typing Cursor to show liveness */}
                    <motion.div 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-2 h-4 bg-[#D4AF37] inline-block ml-1 align-text-bottom"
                    />
                </div>
            </div>
        </div>
    );
}
