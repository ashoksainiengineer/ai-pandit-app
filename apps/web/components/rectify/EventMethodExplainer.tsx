'use client';

// components/rectify/EventMethodExplainer.tsx
// Shows which Vedic methods an event helps with and its accuracy contribution

import { useState } from 'react';
import EVENT_REQUIREMENTS, { EventRequirement, CategoryRequirement } from '@/lib/event-requirements';

interface EventMethodExplainerProps {
    categoryId: string;
    eventType: string;
}

export default function EventMethodExplainer({ categoryId, eventType }: EventMethodExplainerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const category = EVENT_REQUIREMENTS.find(c => c.id === categoryId);
    const event = category?.events.find(e =>
        e.eventType.toLowerCase().includes(eventType.toLowerCase()) ||
        eventType.toLowerCase().includes(e.eventType.toLowerCase().split('/')[0])
    );

    if (!event) {
        // Fallback for events not in the detailed list
        return (
            <div className="p-3 bg-[#F5EFE7] rounded-lg mt-2">
                <div className="flex items-center gap-2">
                    <span className="text-[#78611D]">📊</span>
                    <span className="text-xs text-[#4A453F]">
                        This event contributes to overall dasha verification
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3 space-y-2">
            {/* Accuracy Badge */}
            <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${event.importance === 'critical'
                        ? 'bg-[#184131]/20 text-[#184131] border border-[#184131]/30'
                        : event.importance === 'high'
                            ? 'bg-[#78611D]/20 text-[#78611D] border border-[#78611D]/30'
                            : 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30'
                    }`}>
                    +{event.accuracyBoost}% Accuracy
                </div>
                <span className="text-xs text-[#4A453F]">
                    {event.importance === 'critical' ? '⭐⭐⭐ Maximum Impact' :
                        event.importance === 'high' ? '⭐⭐ High Impact' :
                            '⭐ Medium Impact'}
                </span>
            </div>

            {/* Methods Used - Collapsible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-3 bg-[#F5EFE7] rounded-lg hover:bg-[#F0E8DE] transition-colors"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[#78611D]">🔮</span>
                        <span className="text-xs text-[#4A453F]">
                            Verifies {event.methods.length} Vedic methods
                        </span>
                    </div>
                    <span className={`text-[#4A453F] text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </div>

                {/* Method Pills - Always visible */}
                <div className="flex flex-wrap gap-1 mt-2">
                    {event.methods.slice(0, isExpanded ? undefined : 3).map((method, i) => (
                        <span
                            key={i}
                            className="px-2 py-0.5 bg-white rounded text-[10px] text-[#7A756F]"
                            title={method.description}
                        >
                            {method.shortName}
                        </span>
                    ))}
                    {!isExpanded && event.methods.length > 3 && (
                        <span className="px-2 py-0.5 bg-white rounded text-[10px] text-[#78611D]">
                            +{event.methods.length - 3} more
                        </span>
                    )}
                </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="p-4 bg-[#FDF8F3] rounded-lg border border-[#F0E8DE] animate-fade-in-up">
                    {/* Explanation */}
                    <p className="text-sm text-[#4A453F] mb-4 leading-relaxed">
                        💡 {event.explanation}
                    </p>

                    {/* Methods Grid */}
                    <h5 className="text-xs font-semibold text-[#7A756F] uppercase tracking-wider mb-2">
                        Analysis Methods Used:
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                        {event.methods.map((method, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 p-2 bg-white rounded"
                            >
                                <span className="text-[#78611D] font-mono text-sm font-bold min-w-[40px]">
                                    {method.shortName}
                                </span>
                                <div>
                                    <p className="text-xs font-medium text-[#1A1612]">{method.name}</p>
                                    <p className="text-xs text-[#7A756F]">{method.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Component to show category requirements summary
export function CategoryRequirementsSummary() {
    return (
        <div className="glass-card p-6 mb-8 border border-[#78611D]/20 bg-white rounded-xl">
            <h3 className="text-lg font-bold text-[#1A1612] mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Minimum Events for 99%+ Accuracy
            </h3>
            <p className="text-sm text-[#4A453F] mb-6">
                Our algorithm uses 15 Vedic methods to cross-verify your birth time.
                The more events you provide, the more methods we can apply for higher accuracy.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
                {EVENT_REQUIREMENTS.filter(c => c.minimumEvents > 0).map(category => (
                    <div
                        key={category.id}
                        className="flex items-start gap-3 p-3 bg-[#F5EFE7] rounded-lg"
                    >
                        <span className="text-2xl">{category.icon}</span>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-[#1A1612] text-sm">{category.name}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#78611D]/20 text-[#78611D] font-bold">
                                    Min: {category.minimumEvents}
                                </span>
                            </div>
                            <p className="text-xs text-[#7A756F] mt-1">{category.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-[#184131]">
                                    +{category.totalAccuracyContribution}% potential accuracy
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-[#184131]/10 rounded-lg border border-[#184131]/20">
                <p className="text-sm text-[#184131] flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    Aim for at least 12 total events across all categories for maximum rectification precision.
                </p>
            </div>
        </div>
    );
}

export { EventMethodExplainer };
