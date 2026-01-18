'use client';

import { useMemo } from 'react';
import { LifeEvent } from '@/lib/types';

interface TimelineVisualizerProps {
    events: LifeEvent[];
    onSelectEvent?: (id: string) => void;
    selectedEventId?: string;
}

export default function TimelineVisualizer({ events, onSelectEvent, selectedEventId }: TimelineVisualizerProps) {
    const sortedEvents = useMemo(() => {
        return [...events].filter(e => e.eventDate).sort((a, b) => {
            const dateA = a.eventDate?.split('-')[0] || '0';
            const dateB = b.eventDate?.split('-')[0] || '0';
            return dateA.localeCompare(dateB);
        });
    }, [events]);

    const formatDisplayDate = (event: LifeEvent): string => {
        if (!event.eventDate) return 'Unknown';
        const precision = event.datePrecision;
        const start = event.eventDate;
        const end = event.endDate;
        if (precision === 'year_range') return end ? `${start} → ${end}` : start;
        if (precision === 'month_year' || precision === 'month_range') {
            const formatMonth = (d: string) => { const [y, m] = d.split('-'); const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return m ? `${months[parseInt(m) - 1]} ${y}` : y; };
            return end ? `${formatMonth(start)} → ${formatMonth(end)}` : formatMonth(start);
        }
        const formatExact = (d: string) => { const [y, m, day] = d.split('-'); if (!m) return y; const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${day || ''} ${months[parseInt(m) - 1]} ${y}`.trim(); };
        return end ? `${formatExact(start)} → ${formatExact(end)}` : formatExact(start);
    };

    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'critical': return 'bg-[#2D7A5C]';
            case 'high': return 'bg-[#8B5CF6]';
            default: return 'bg-[#D4AF37]';
        }
    };

    if (events.length === 0) {
        return (
            <div className="text-center py-16 bg-[#2A3442]/50 rounded-2xl border-2 border-dashed border-[#D4AF37]/30">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-[#F5F0EB] mb-2">Your Timeline Starts Here</h3>
                <p className="text-[#8C7F72] max-w-md mx-auto">✨ Add life events above and watch your personal timeline come to life!</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
                    <span>📜</span> Your Life Timeline
                    <span className="text-sm font-normal text-[#8C7F72] ml-2">({sortedEvents.length} events)</span>
                </h3>
                {sortedEvents.length >= 8 && (
                    <span className="px-4 py-2 rounded-full bg-[#2D7A5C]/20 text-[#2D7A5C] text-sm font-bold border border-[#2D7A5C]/30">✨ Rich Timeline!</span>
                )}
            </div>

            <div className="relative pl-10">
                <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D4AF37] via-[#8B5CF6] to-transparent rounded-full" />

                <div className="space-y-4">
                    {sortedEvents.map((event, index) => {
                        const isSelected = event.id === selectedEventId;
                        const isFirst = index === 0;
                        const isLast = index === sortedEvents.length - 1;
                        return (
                            <div key={event.id} onClick={() => onSelectEvent?.(event.id)} className={`relative group cursor-pointer transition-all duration-300 ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                                <div className={`absolute -left-6 top-4 w-5 h-5 rounded-full ${getImportanceColor(event.importance)} shadow-lg transition-transform ${isSelected ? 'scale-125 ring-4 ring-[#D4AF37]/30' : ''}`} />
                                <div className={`ml-4 p-5 rounded-xl border-2 transition-all ${isSelected ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-lg' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl flex-shrink-0 p-2 bg-[#1A1F2E] rounded-xl">{event.icon || '📅'}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <h4 className="font-bold text-[#F5F0EB] truncate">{event.eventType}</h4>
                                                <span className="text-xs px-3 py-1 rounded-full bg-[#1A1F2E] text-[#D4AF37] font-mono font-medium">{formatDisplayDate(event)}</span>
                                            </div>
                                            {event.description && <p className="text-sm text-[#8C7F72] mt-2 line-clamp-2">{event.description}</p>}
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${event.importance === 'critical' ? 'bg-[#2D7A5C]/20 text-[#2D7A5C]' : event.importance === 'high' ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'}`}>{event.importance?.toUpperCase()}</span>
                                                <span className="text-xs text-[#8C7F72]">{event.category?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {isFirst && <div className="absolute -left-20 top-4 text-xs text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-1 rounded">🏁 FIRST</div>}
                                {isLast && sortedEvents.length > 1 && <div className="absolute -left-20 top-4 text-xs text-[#2D7A5C] font-bold bg-[#2D7A5C]/10 px-2 py-1 rounded">🎯 LATEST</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {sortedEvents.length >= 3 && (
                <div className="mt-8 p-5 bg-[#2A3442]/50 rounded-xl flex items-center justify-around text-center border border-[#D4AF37]/20">
                    <div><div className="text-3xl font-bold text-[#D4AF37]">{sortedEvents.length}</div><div className="text-xs text-[#8C7F72]">📅 Events</div></div>
                    <div className="w-px h-10 bg-[#D4AF37]/20" />
                    <div><div className="text-3xl font-bold text-[#2D7A5C]">{sortedEvents.filter(e => e.importance === 'critical').length}</div><div className="text-xs text-[#8C7F72]">⭐ Critical</div></div>
                    <div className="w-px h-10 bg-[#D4AF37]/20" />
                    <div><div className="text-3xl font-bold text-[#8B5CF6]">{new Set(sortedEvents.map(e => e.category)).size}</div><div className="text-xs text-[#8C7F72]">📂 Categories</div></div>
                </div>
            )}

            {sortedEvents.length < 5 && <div className="mt-6 p-4 bg-[#FF9F43]/10 border border-[#FF9F43]/30 rounded-xl flex items-center gap-3"><span className="text-3xl">💡</span><p className="text-sm text-[#FF9F43] font-medium">Add {5 - sortedEvents.length} more event{5 - sortedEvents.length > 1 ? 's' : ''} to unlock better accuracy!</p></div>}
            {sortedEvents.length >= 5 && sortedEvents.length < 10 && <div className="mt-6 p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl flex items-center gap-3"><span className="text-3xl">🎯</span><p className="text-sm text-[#8B5CF6] font-medium">Great progress! Just {10 - sortedEvents.length} more for maximum precision.</p></div>}
            {sortedEvents.length >= 10 && <div className="mt-6 p-4 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-xl flex items-center gap-3"><span className="text-3xl">🏆</span><p className="text-sm text-[#2D7A5C] font-medium">Excellent! Your timeline is comprehensive for maximum accuracy!</p></div>}
        </div>
    );
}
