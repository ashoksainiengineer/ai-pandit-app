'use client';

// components/rectify/AccuracyMeter.tsx
// Visual accuracy meter that updates as users add events

import { useMemo } from 'react';
import EVENT_REQUIREMENTS, { calculateAccuracy, getMinimumRequirements, CategoryRequirement } from '@/lib/event-requirements';
import { LifeEvent } from '@/lib/types';

interface AccuracyMeterProps {
    lifeEvents: LifeEvent[];
    hasPhysicalTraits?: boolean;
}

export default function AccuracyMeter({ lifeEvents, hasPhysicalTraits = false }: AccuracyMeterProps) {
    const accuracyData = useMemo(() => {
        // Count events by category
        const categoryEventCounts: Record<string, number> = {};
        lifeEvents.forEach(event => {
            categoryEventCounts[event.category] = (categoryEventCounts[event.category] || 0) + 1;
        });

        // Add physical traits as a category if provided
        if (hasPhysicalTraits) {
            categoryEventCounts['physical'] = 1;
        }

        return calculateAccuracy(categoryEventCounts);
    }, [lifeEvents, hasPhysicalTraits]);

    const requirements = getMinimumRequirements();
    const totalEvents = lifeEvents.length;

    // Determine accuracy level color
    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 97) return '#2D7A5C'; // Green - Excellent
        if (accuracy >= 90) return '#10B981'; // Emerald - Very Good
        if (accuracy >= 80) return '#D4AF37'; // Gold - Good
        if (accuracy >= 70) return '#F97316'; // Orange - Fair
        return '#EF4444'; // Red - Needs more data
    };

    const getAccuracyLabel = (accuracy: number) => {
        if (accuracy >= 97) return 'Excellent';
        if (accuracy >= 90) return 'Very Good';
        if (accuracy >= 80) return 'Good';
        if (accuracy >= 70) return 'Fair';
        return 'Needs More Data';
    };

    const accuracyColor = getAccuracyColor(accuracyData.totalAccuracy);

    return (
        <div className="glass-card p-6 border-2 border-[#D4AF37]/30 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#F5F0EB] flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Accuracy Potential
                </h3>
                <span
                    className="text-sm font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${accuracyColor}20`, color: accuracyColor }}
                >
                    {getAccuracyLabel(accuracyData.totalAccuracy)}
                </span>
            </div>

            {/* Main Accuracy Display */}
            <div className="flex items-center gap-6 mb-6">
                {/* Circular Progress */}
                <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#2A3442"
                            strokeWidth="10"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={accuracyColor}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${accuracyData.totalAccuracy * 2.64} 264`}
                            className="transition-all duration-700 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: accuracyColor }}>
                            {accuracyData.totalAccuracy}%
                        </span>
                        <span className="text-[8px] text-[#8C7F72] uppercase tracking-wider">Accuracy</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C4B8AD]">Events Added</span>
                        <span className="font-mono font-bold text-[#F5F0EB]">{totalEvents}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C4B8AD]">Minimum Required</span>
                        <span className="font-mono font-bold text-[#D4AF37]">{requirements.totalMinimumEvents}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[#C4B8AD]">Target Accuracy</span>
                        <span className="font-mono font-bold text-[#2D7A5C]">{requirements.targetAccuracy}</span>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-2 mb-4">
                <h4 className="text-xs font-semibold text-[#8C7F72] uppercase tracking-wider mb-3">
                    Category Requirements
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {EVENT_REQUIREMENTS.filter(c => c.minimumEvents > 0).map(category => {
                        const eventsInCategory = lifeEvents.filter(e => e.category === category.id).length;
                        const isMet = eventsInCategory >= category.minimumEvents;

                        return (
                            <div
                                key={category.id}
                                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${isMet ? 'bg-[#2D7A5C]/10' : 'bg-[#2A3442]'
                                    }`}
                            >
                                <span className="text-lg">{category.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-[#C4B8AD] truncate">{category.name}</div>
                                    <div className="text-xs font-mono">
                                        <span className={isMet ? 'text-[#2D7A5C]' : 'text-[#F97316]'}>
                                            {eventsInCategory}
                                        </span>
                                        <span className="text-[#8C7F72]">/{category.minimumEvents}</span>
                                    </div>
                                </div>
                                {isMet && (
                                    <span className="text-[#2D7A5C] text-sm">✓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Suggestions */}
            {accuracyData.suggestions.length > 0 && accuracyData.totalAccuracy < 97 && (
                <div className="mt-4 p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                    <h4 className="text-sm font-semibold text-[#D4AF37] mb-2">
                        💡 Boost Your Accuracy
                    </h4>
                    <ul className="space-y-1">
                        {accuracyData.suggestions.slice(0, 3).map((suggestion, i) => (
                            <li key={i} className="text-xs text-[#C4B8AD]">
                                • {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Success Message */}
            {accuracyData.totalAccuracy >= 97 && (
                <div className="mt-4 p-3 bg-[#2D7A5C]/10 rounded-lg border border-[#2D7A5C]/20">
                    <p className="text-sm text-[#2D7A5C] flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        Excellent! You've provided enough data for maximum accuracy rectification.
                    </p>
                </div>
            )}
        </div>
    );
}
