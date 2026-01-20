'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-4 rounded-xl border border-[#3B82F6]/20 bg-[#0F172A]/50 backdrop-blur-sm overflow-hidden"
        >
            <div className="bg-[#1E293B]/50 px-4 py-2 border-b border-[#3B82F6]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                    <span className="text-xs font-semibold text-[#3B82F6] tracking-wider uppercase">
                        Swiss Ephemeris Engine Stream
                    </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                    {logs.length > 0 ? `${logs.length} ops` : 'Ready'}
                </span>
            </div>

            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto p-4 font-mono text-[10px] md:text-xs space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
            >
                <AnimatePresence initial={false}>
                    {displayedLogs.map((log, idx) => (
                        <motion.div
                            key={log.candidateTime + idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="grid grid-cols-12 gap-2 text-slate-400 hover:bg-slate-800/30 p-1 rounded border-b border-white/5"
                        >
                            <div className="col-span-2 text-[#60A5FA]">
                                {log.candidateTime}
                            </div>
                            <div className="col-span-3 text-slate-300">
                                ☀️ {log.sunPos}
                            </div>
                            <div className="col-span-3 text-slate-300">
                                🌙 {log.moonPos}
                            </div>
                            <div className="col-span-2 text-emerald-400">
                                ↑ {log.ascendant}
                            </div>
                            <div className="col-span-2 text-amber-400 truncate">
                                ☸ {log.dashaObj}
                            </div>
                        </motion.div>
                    ))}
                    {isAnalyzing && logs.length === 0 && (
                        <div className="text-center text-slate-500 py-10 animate-pulse">
                            Initializing calculation engine...
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="bg-[#0F172A] px-4 py-1 border-t border-[#3B82F6]/10 flex justify-between text-[10px] text-slate-600">
                <span>Precision: 0.0001°</span>
                <span>Mode: Sequential</span>
            </div>
        </motion.div>
    );
};
