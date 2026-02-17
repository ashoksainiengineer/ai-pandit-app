import React, { memo, useRef, useEffect, useState } from 'react';
import { Terminal, Cpu, Activity, Clock, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogItem {
    candidateTime: string;
    log: string;
    timestamp?: number;
    // ... support other props if needed
}

// Support updated props
interface LiveCalculationPanelProps {
    logs: any[]; // Use any to support both old/new log shapes compatible
    isConnected: boolean;
    engineName?: string;
    latency?: number;
}

export const LiveCalculationPanel = memo<LiveCalculationPanelProps>(({
    logs,
    isConnected,
    engineName = 'DeepSeek-V3 + Swiss Eph',
    latency = 0
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Auto-scroll to bottom
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    // Detect manual scroll
    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setAutoScroll(isAtBottom);
        }
    };

    return (
        <div className="rounded-xl border border-[#F0E8DE] bg-[#1e1e1e] text-white shadow-sm overflow-hidden flex flex-col h-[300px]">
            {/* Header */}
            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#3e3e3e] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-gray-300 tracking-wider">LIVE CALCULATION LOGS</span>
                </div>
                <div className="flex items-center gap-4">
                    {latency > 0 && (
                        <span className="text-[9px] text-emerald-600/60 font-mono font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            LATENCY: {latency}ms
                        </span>
                    )}
                    <span className="text-[9px] text-[#7A756F] font-mono font-bold flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {logs.length > 0 ? `${logs.length} OPS_LOGGED` : 'SYSTEM_READY'}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/20 border border-white/10">
                        <Cpu className="w-3 h-3 text-[#B8860B]" />
                        <span className="text-[9px] font-bold text-stone-400">{engineName}</span>
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
            >
                <AnimatePresence initial={false}>
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
                            <Activity className="w-8 h-8 animate-pulse" />
                            <p>Waiting for calculation stream...</p>
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-[80px_1fr] gap-3 hover:bg-white/5 px-2 py-0.5 rounded transition-colors"
                            >
                                <span className="text-emerald-500/80 font-bold border-r border-white/10 pr-2 truncate">
                                    {log.candidateTime || log.time || '-'}
                                </span>
                                <span className="text-gray-300 break-all leading-relaxed">
                                    {log.log || log.message || JSON.stringify(log)}
                                </span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Status */}
            <div className="bg-[#252526] px-3 py-1 border-t border-[#3e3e3e] flex justify-between items-center text-[9px] text-gray-500 shrink-0">
                <span className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {isConnected ? 'STREAM_ACTIVE' : 'DISCONNECTED'}
                </span>
                <span className="font-mono">
                    MEM_USAGE: OPTIMIZED
                </span>
            </div>
        </div>
    );
});

LiveCalculationPanel.displayName = 'LiveCalculationPanel';
