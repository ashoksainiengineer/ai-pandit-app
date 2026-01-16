'use client';

import { useState } from 'react';
import { LifeEvent } from '@/lib/types';
import EVENT_CATEGORIES, { EventCategory, EventTemplate, templateToLifeEvent } from '@/lib/event-categories';
import FlexibleDatePicker from './FlexibleDatePicker';

interface Step2Props {
    lifeEvents: LifeEvent[];
    updateEvents: (events: LifeEvent[]) => void;
}

export default function Step2LifeEvents({ lifeEvents, updateEvents }: Step2Props) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeCategoryObj, setActiveCategoryObj] = useState<EventCategory | null>(null);

    const handleCategoryClick = (catId: string) => {
        if (selectedCategory === catId) {
            setSelectedCategory(null);
            setActiveCategoryObj(null);
        } else {
            setSelectedCategory(catId);
            const cat = EVENT_CATEGORIES.find(c => c.id === catId);
            setActiveCategoryObj(cat || null);
        }
    };

    const addEvent = (template: EventTemplate) => {
        if (!activeCategoryObj) return;

        // Create new event with default structure
        const newEvent: LifeEvent = {
            id: `${template.id}_${Date.now()}`,
            category: activeCategoryObj.id as any,
            eventType: template.label,
            datePrecision: 'year', // Default to year as it's easiest
            eventDate: '',
            description: '',
            importance: template.importance,
            icon: activeCategoryObj.icon,
            color: activeCategoryObj.color
        };

        updateEvents([...lifeEvents, newEvent]);
    };

    const removeEvent = (id: string) => {
        updateEvents(lifeEvents.filter(e => e.id !== id));
    };

    const updateEventField = (id: string, updates: Partial<LifeEvent>) => {
        updateEvents(lifeEvents.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    // Calculate age helper
    // Note: This requires birth date from parent, but for now we just show the field

    return (
        <div className="animate-fade-in-up space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-[#F5F0EB]">Life Events</h2>
                <p className="text-[#C4B8AD]">
                    Add at least 3 major life events. The more precise the dates, the better the rectification.
                </p>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {EVENT_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`p-4 rounded-xl text-center transition-all border-2 flex flex-col items-center gap-2 ${selectedCategory === cat.id
                                ? 'bg-[#D4AF37]/20 border-[#D4AF37] transform scale-105'
                                : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'
                            }`}
                    >
                        <span className="text-3xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-[#C4B8AD]">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Event Selection Area */}
            {activeCategoryObj && (
                <div className="glass-card p-6 animate-fade-in-up border border-[#D4AF37]/20">
                    <h3 className="font-semibold text-[#F5F0EB] mb-4 flex items-center gap-2">
                        {activeCategoryObj.icon} Select {activeCategoryObj.label} Events
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {activeCategoryObj.events.map((template) => {
                            const isAdded = lifeEvents.some(e => e.eventType === template.label); // Simple check
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => addEvent(template)}
                                    // We allow adding multiple of same type (e.g. "Child Birth") so no disable
                                    className="px-4 py-2 bg-[#2A3442] hover:bg-[#D4AF37]/20 text-[#C4B8AD] hover:text-[#D4AF37] rounded-lg text-sm transition-colors border border-white/5"
                                >
                                    + {template.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Added Events List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#D4AF37] border-b border-[#D4AF37]/20 pb-2">
                    Your Timeline ({lifeEvents.length})
                </h3>

                {lifeEvents.length === 0 && (
                    <div className="text-center py-12 text-[#8C7F72] bg-[#2A3442]/20 rounded-xl border border-dashed border-[#8C7F72]/30">
                        <p>No events added yet.</p>
                        <p className="text-sm">Click a category above to start.</p>
                    </div>
                )}

                {lifeEvents.map((event, index) => (
                    <div key={event.id} className="glass-card p-6 relative group transition-all hover:bg-white/5">
                        <button
                            onClick={() => removeEvent(event.id)}
                            className="absolute top-4 right-4 text-[#EF4444] opacity-50 hover:opacity-100 transition-opacity"
                            title="Remove Event"
                        >
                            ✕
                        </button>

                        <div className="flex gap-4 items-start mb-6">
                            <div className="text-3xl bg-[#2A3442] p-3 rounded-xl">
                                {event.icon || '📅'}
                            </div>
                            <div>
                                <h4 className="font-bold text-[#F5F0EB] text-lg">{event.eventType}</h4>
                                <span className="text-xs text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20">
                                    {event.importance.toUpperCase()} IMPORTANCE
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Left Col: Date Input */}
                            <div>
                                <FlexibleDatePicker
                                    label="When did this happen?"
                                    date={event.eventDate}
                                    endDate={event.endDate}
                                    precision={event.datePrecision}
                                    onChange={(date, precision, endDate) => updateEventField(event.id, {
                                        eventDate: date,
                                        datePrecision: precision,
                                        endDate: endDate
                                    })}
                                />
                            </div>

                            {/* Right Col: Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Description / Notes</label>
                                    <textarea
                                        value={event.description}
                                        onChange={(e) => updateEventField(event.id, { description: e.target.value })}
                                        className="input-field min-h-[80px]"
                                        placeholder="E.g., Got promoted to Senior Manager, Moved to London for studies..."
                                    />
                                </div>

                                {event.category === 'marriage' && (
                                    <div className="p-3 bg-[#E879F9]/10 rounded-lg border border-[#E879F9]/20">
                                        <p className="text-xs text-[#E879F9]">
                                            💡 Astro Tip: Marriage events connect deeply with the 7th house and Venus/Jupiter periods.
                                        </p>
                                    </div>
                                )}
                                {event.category === 'career' && (
                                    <div className="p-3 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
                                        <p className="text-xs text-[#D4AF37]">
                                            💡 Astro Tip: Career changes often trigger 10th house or Saturn transits.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
