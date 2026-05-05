import React from 'react';
import { motion } from 'framer-motion';
import { LifeEvent } from '@/lib/types';
import { FormCard } from '@/components/ui/form/FormCard';
import { IMPORTANCE_OPTIONS } from '@/lib/events/types';
import { formatEventDate } from '../utils';

interface EventTimelineProps {
    sortedEvents: LifeEvent[];
    setEditingId: (id: string | null) => void;
}

export function EventTimeline({ sortedEvents, setEditingId }: EventTimelineProps) {
    if (sortedEvents.length === 0) return null;

    return (
        <FormCard className="p-5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#1A1612]">📜 Timeline</h3>
                <span className="text-xs text-[#5A554F] bg-[#F5EFE7] px-2 py-1 rounded-full">
                    {sortedEvents.length} events
                </span>
            </div>
            <div className="divide-y divide-[#F0E8DE]">
                {sortedEvents.map((event) => (
                    <motion.div
                        key={event.id}
                        onClick={() => setEditingId(event.id)}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F5EFE7] transition-colors rounded-lg"
                        whileHover={{ x: 4 }}
                    >
                        <span className="text-2xl">{event.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="text-[#1A1612] font-semibold text-sm truncate">{event.eventType}</div>
                                {event.importance && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${event.importance === 'critical'
                                        ? 'bg-[#C65D3B]/10 text-[#C65D3B]'
                                        : event.importance === 'high'
                                            ? 'bg-[#B8860B]/10 text-[#B8860B]'
                                            : event.importance === 'medium'
                                                ? 'bg-[#184131]/10 text-[#184131]'
                                                : 'bg-[#8A857F]/20 text-[#5A554F]'
                                        }`}>
                                        {IMPORTANCE_OPTIONS.find(i => i.level === event.importance)?.icon}
                                    </span>
                                )}
                                {event.isCustom && (
                                    <span className="text-[10px] px-2 py-0.5 bg-[#B8860B]/10 text-[#B8860B] rounded-full">
                                        Custom
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-[#B8860B] font-medium">{formatEventDate(event)}</div>
                            {event.description && (
                                <p className="text-xs text-[#5A554F] line-clamp-1 mt-0.5">{event.description}</p>
                            )}
                        </div>
                        {event.description && event.description.length >= 10 ? (
                            <span className="text-[#184131] text-lg">✓</span>
                        ) : (
                            <span className="px-2 py-1 bg-[#C65D3B]/10 text-[#C65D3B] text-[10px] rounded-full font-medium">
                                Add
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
        </FormCard>
    );
}
