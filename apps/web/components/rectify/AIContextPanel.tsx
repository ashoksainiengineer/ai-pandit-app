import React, { useEffect, useState } from 'react';
import { AIContextData } from '@/lib/store/stream-types';
import { Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface AIContextPanelProps {
    data: AIContextData | null;
    currentStage: number;
}

export function AIContextPanel({ data, currentStage }: AIContextPanelProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (data) setIsVisible(true);
    }, [data]);

    if (!isVisible || !data) return null;

    // Only show during relevant stages (2, 5, 7)
    if (![2, 5, 7].includes(currentStage)) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-sm p-4 mt-4 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 border-b border-emerald-500/10 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-300 tracking-wide uppercase">
                    Engine Ground Truth
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full ml-auto border border-emerald-500/20">
                    Swiss Ephemeris Calculated
                </span>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* Planetary Positions */}
                <div className="space-y-2">
                    <p className="text-emerald-400/60 mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Planetary Positions ({data.candidateTime || 'Analyzing...'})
                    </p>
                    <div className="bg-black/30 p-2 rounded border border-emerald-500/10 space-y-1">
                        <div className="flex justify-between">
                            <span className="text-white/60">Ascendant</span>
                            <span className="text-emerald-300">{data.planetaryInfo?.ascendant || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Sun</span>
                            <span className="text-emerald-300">{data.planetaryInfo?.sun || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Moon</span>
                            <span className="text-emerald-300">{data.planetaryInfo?.moon || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Dasha & Charts */}
                <div className="space-y-2">
                    <p className="text-emerald-400/60 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Vedic Context
                    </p>
                    <div className="bg-black/30 p-2 rounded border border-emerald-500/10 space-y-1">
                        <div className="flex flex-col">
                            <span className="text-white/60">Current Dasha</span>
                            <span className="text-emerald-300 truncate">{data.dasha || '-'}</span>
                        </div>
                        {data.divCharts && (
                            <div className="flex flex-col pt-1 mt-1 border-t border-white/5">
                                <span className="text-white/60">Divisional Analysis</span>
                                <span className="text-emerald-300 truncate">{data.divCharts}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-2 text-[10px] text-center text-white/30 italic">
                AI is strictly verifying against this immutable engine data.
            </div>
        </div>
    );
}
