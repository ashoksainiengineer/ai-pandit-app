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
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-medium text-black">Your Timeline</h3>
                <span className="text-xs text-black/40 bg-[var(--prism-canvas)] px-2.5 py-1 rounded-full font-medium">
                    {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="relative pl-6">
                {/* Vertical timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[#184131]/20 via-[#000000]/10 to-transparent" />

                <div className="space-y-1">
                    {sortedEvents.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.06 }}
                            onClick={() => setEditingId(event.id)}
                            className="relative group cursor-pointer"
                        >
                            {/* Timeline dot */}
                            <div className="absolute -left-[23px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#184131] ring-2 ring-[#184131]/10 group-hover:ring-[#184131]/30 transition-all" />

                            {/* Event card */}
                            <div className="p-3 rounded-xl border border-transparent hover:border-[rgba(0,0,0,0.06)] hover:bg-[var(--prism-canvas)] transition-all duration-200">
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--prism-canvas)] to-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-lg flex-shrink-0">
                                        {event.icon || '📌'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Top row: title + badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-black">
                                                {event.eventType}
                                            </span>
                                            {event.importance && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                    event.importance === 'critical'
                                                        ? 'bg-[#C65D3B]/10 text-[#C65D3B]'
                                                        : event.importance === 'high'
                                                            ? 'bg-[#000000]/10 text-black'
                                                            : event.importance === 'medium'
                                                                ? 'bg-[#184131]/10 text-[#184131]'
                                                                : 'bg-[#959595]/15 text-black/50'
                                                }`}>
                                                    {IMPORTANCE_OPTIONS.find(i => i.level === event.importance)?.icon}
                                                </span>
                                            )}
                                            {event.isCustom && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-[#000000]/5 text-black/50 rounded font-medium">
                                                    Custom
                                                </span>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <div className="text-xs text-black/40 mt-0.5 font-medium">
                                            {formatEventDate(event)}
                                        </div>

                                        {/* Description */}
                                        {event.description && (
                                            <p className="text-xs text-black/50 mt-1 line-clamp-2 leading-relaxed">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action indicator */}
                                    <div className="flex-shrink-0 self-center">
                                        {event.description && event.description.length >= 10 ? (
                                            <div className="w-5 h-5 rounded-full bg-[#184131]/10 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-[#184131]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-[#C65D3B] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Edit
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </FormCard>
    );
}
