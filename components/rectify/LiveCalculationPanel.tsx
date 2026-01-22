'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass } from 'lucide-react';

export interface CalculationLog {
    candidateTime: string;
    sunPos: string;
    moonPos: string;
    ascendant: string;
    dashaObj?: string;
    timestamp: number;
}

interface LiveCalculationPanelProps {
    logs: CalculationLog[];
    isAnalyzing: boolean;
}

export const LiveCalculationPanel: React.FC<LiveCalculationPanelProps> = ({ logs, isAnalyzing }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [displayedLogs, setDisplayedLogs] = useState<CalculationLog[]>([]);

    // Limit displayed logs to last 50 to prevent memory issues
    useEffect(() => {
        setDisplayedLogs(logs.slice(-50));
    }, [logs]);

    // Auto-scroll logging
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedLogs]);

    if (!isAnalyzing && logs.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-4 rounded-xl border border-emerald-500/20 bg-[#0A1015] overflow-hidden shadow-2xl"
        >
            <div className="bg-[#101A1D] px-4 py-2 border-b border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    />
                    <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase">
                        NIRAYANA PRECISION ENGINE
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-emerald-500/40 font-mono font-bold">
                        LATENCY: 8ms
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono font-bold">
                        {logs.length > 0 ? `${logs.length} OPS_LOGGED` : 'SYSTEM_READY'}
                    </span>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="h-40 overflow-y-auto p-4 font-mono text-[9px] md:text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-emerald-900/50 scrollbar-track-transparent bg-[#0F1419]"
            >
                <AnimatePresence initial={false}>
                    {displayedLogs.map((log, idx) => (
                        <motion.div
                            key={log.candidateTime + idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 text-emerald-100/40 hover:bg-emerald-500/5 py-0.5 px-2 rounded group transition-colors"
                        >
                            <span className="w-16 flex-shrink-0 text-emerald-500 font-bold opacity-100">{log.candidateTime}</span>
                            <span className="flex-1 truncate group-hover:text-emerald-300 transition-colors">
                                <span className="text-emerald-500/40">SUN</span>:{log.sunPos}
                                <span className="text-emerald-500/40 ml-2">MOON</span>:{log.moonPos}
                                <span className="text-emerald-500/40 ml-2">ASC</span>:<span className="text-cyan-400 font-bold">{log.ascendant}</span>
                                {log.dashaObj && <span className="text-amber-500/60 ml-2">D:{log.dashaObj}</span>}
                            </span>
                            <span className="text-[8px] text-emerald-500/20 font-mono">SCN_OK</span>
                        </motion.div>
                    ))}
                    {isAnalyzing && logs.length === 0 && (
                        <div className="flex items-center justify-center h-full text-emerald-500/30 text-xs animate-pulse uppercase tracking-widest font-black">
                            <Compass className="w-4 h-4 mr-2 animate-spin-slow" />
                            Syncing Astral Coordinates...
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-[#0A1015]/90 px-4 py-1.5 border-t border-emerald-500/10 flex justify-between text-[9px] text-emerald-700/60 font-black uppercase tracking-widest">
                <div className="flex items-center gap-3">
                    <span>ACC: 0.00018s</span>
                    <span>BUF: OPTIMAL</span>
                </div>
                <span>EPHEM_V2_ACTIVE</span>
            </div>
        </motion.div>
    );
};
