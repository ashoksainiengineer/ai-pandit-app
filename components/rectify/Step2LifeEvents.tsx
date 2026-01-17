'use client';

import { useState } from 'react';
import { LifeEvent } from '@/lib/types';
import EVENT_CATEGORIES, { EventCategory, EventTemplate } from '@/lib/event-categories';
import FlexibleDatePicker, { DateValue, DatePrecision } from './FlexibleDatePicker';
import AccuracyMeter from './AccuracyMeter';
import TimelineVisualizer from './TimelineVisualizer';
import EVENT_REQUIREMENTS from '@/lib/event-requirements';

interface Step2Props {
    lifeEvents: LifeEvent[];
    updateEvents: (events: LifeEvent[]) => void;
}

export default function Step2LifeEvents({ lifeEvents, updateEvents }: Step2Props) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeCategoryObj, setActiveCategoryObj] = useState<EventCategory | null>(null);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(true);

    const handleCategoryClick = (catId: string) => {
        if (selectedCategory === catId) {
            setSelectedCategory(null);
            setActiveCategoryObj(null);
        } else {
            setSelectedCategory(catId);
            setActiveCategoryObj(EVENT_CATEGORIES.find(c => c.id === catId) || null);
        }
    };

    const addEvent = (template: EventTemplate) => {
        if (!activeCategoryObj) return;
        const newEvent: LifeEvent = {
            id: `${template.id}_${Date.now()}`,
            category: activeCategoryObj.id as any,
            eventType: template.label,
            datePrecision: 'year',
            eventDate: '',
            description: '',
            importance: template.importance,
            icon: activeCategoryObj.icon,
            color: activeCategoryObj.color
        };
        updateEvents([...lifeEvents, newEvent]);
        setEditingEventId(newEvent.id);
        setSelectedCategory(null);
        setActiveCategoryObj(null);
    };

    const quickAddEvent = (eventData: { label: string; category: string; icon: string; boost: number }) => {
        const cat = EVENT_CATEGORIES.find(c => c.id === eventData.category);
        const template = cat?.events.find(e => e.label.toLowerCase().includes(eventData.label.toLowerCase().split('/')[0]) || eventData.label.toLowerCase().includes(e.label.toLowerCase().split('/')[0]));
        const newEvent: LifeEvent = {
            id: `quick_${Date.now()}`,
            category: eventData.category as any,
            eventType: template?.label || eventData.label,
            datePrecision: 'year',
            eventDate: '',
            description: '',
            importance: 'high',
            icon: cat?.icon || eventData.icon,
            color: cat?.color
        };
        updateEvents([...lifeEvents, newEvent]);
        setEditingEventId(newEvent.id);
        setShowQuickAdd(false);
    };

    const removeEvent = (id: string) => {
        updateEvents(lifeEvents.filter(e => e.id !== id));
        if (editingEventId === id) setEditingEventId(null);
    };

    const updateEventField = (id: string, updates: Partial<LifeEvent>) => {
        updateEvents(lifeEvents.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const handleDateChange = (eventId: string, dateValue: DateValue) => {
        updateEventField(eventId, { eventDate: dateValue.startDate, endDate: dateValue.endDate, eventTime: dateValue.time, datePrecision: dateValue.precision });
    };

    const getCategoryEventCount = (catId: string) => lifeEvents.filter(e => e.category === catId).length;
    const getCategoryMinimum = (catId: string) => EVENT_REQUIREMENTS.find(r => r.id === catId)?.minimumEvents || 0;

    const QUICK_ADD_EVENTS = [
        { label: 'Wedding / Marriage', category: 'marriage', icon: '💒', boost: 8 },
        { label: 'First Child Born', category: 'children', icon: '👶', boost: 8 },
        { label: 'First Job Started', category: 'career', icon: '💼', boost: 7 },
        { label: "Father's Death", category: 'family', icon: '🕯️', boost: 6 },
        { label: 'Major Surgery', category: 'health', icon: '🏥', boost: 5 },
        { label: 'Bought House', category: 'financial', icon: '🏠', boost: 5 },
    ];

    return (
        <div className="animate-fade-in-up space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">📅 Your Life Story</h2>
                <p className="text-[#C4B8AD] max-w-2xl mx-auto">
                    🎯 Share your important life events. <span className="text-[#8B5CF6] font-semibold">More events = Higher accuracy!</span>
                </p>
            </div>

            <AccuracyMeter lifeEvents={lifeEvents} />

            {/* Quick Add */}
            {showQuickAdd && lifeEvents.length < 6 && (
                <div className="glass-card p-6 border border-[#FF9F43]/30 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-8xl opacity-10">⚡</div>
                    <h3 className="font-bold text-[#F5F0EB] mb-3 flex items-center gap-2">
                        <span className="text-2xl">⚡</span> Quick Start - High-Impact Events
                    </h3>
                    <p className="text-sm text-[#8C7F72] mb-4">🚀 These events provide the biggest accuracy boost:</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_ADD_EVENTS.map((item, i) => (
                            <button key={i} onClick={() => quickAddEvent(item)}
                                className="group px-4 py-3 bg-[#2A3442] hover:bg-[#D4AF37]/10 text-[#C4B8AD] hover:text-[#D4AF37] rounded-xl text-sm transition-all flex items-center gap-2 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50">
                                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#2D7A5C]/20 text-[#2D7A5C] font-bold">+{item.boost}%</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Grid */}
            <div>
                <h3 className="text-sm font-semibold text-[#8C7F72] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span>📂</span> Browse by Category
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {EVENT_CATEGORIES.map((cat) => {
                        const count = getCategoryEventCount(cat.id);
                        const isMet = count >= getCategoryMinimum(cat.id);
                        return (
                            <button key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                                className={`p-4 rounded-xl text-center transition-all border-2 flex flex-col items-center gap-2 relative ${selectedCategory === cat.id ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105' : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'}`}>
                                {count > 0 && (
                                    <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isMet ? 'bg-[#2D7A5C] text-white' : 'bg-[#FF9F43] text-white'}`}>{count}</span>
                                )}
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="text-xs font-semibold text-[#F5F0EB]">{cat.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Event Selector */}
            {activeCategoryObj && (
                <div className="glass-card p-6 animate-fade-in border border-[#8B5CF6]/30">
                    <h3 className="font-bold text-[#F5F0EB] mb-4 flex items-center gap-2">
                        <span className="text-2xl">{activeCategoryObj.icon}</span> Select Event from {activeCategoryObj.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {activeCategoryObj.events.map((template) => {
                            const req = EVENT_REQUIREMENTS.find(r => r.id === activeCategoryObj.id);
                            const boost = req?.events.find(e => e.eventType.toLowerCase().includes(template.label.toLowerCase().split('/')[0]))?.accuracyBoost || 2;
                            return (
                                <button key={template.id} onClick={() => addEvent(template)}
                                    className="group px-4 py-2 bg-[#2A3442] hover:bg-[#8B5CF6]/10 text-[#C4B8AD] hover:text-[#8B5CF6] rounded-xl text-sm transition-all border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 flex items-center gap-2">
                                    <span>➕</span>
                                    <span className="font-medium">{template.label}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2D7A5C]/20 text-[#2D7A5C] font-bold">+{boost}%</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Editing Card */}
            {editingEventId && (() => {
                const event = lifeEvents.find(e => e.id === editingEventId);
                if (!event) return null;
                return (
                    <div className="glass-card p-6 border border-[#D4AF37]/50 shadow-xl animate-fade-in">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{event.icon}</span>
                                <div>
                                    <h3 className="text-xl font-bold text-[#F5F0EB]">{event.eventType}</h3>
                                    <span className="text-sm text-[#8C7F72]">{event.category?.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingEventId(null)} className="px-5 py-2 bg-[#2D7A5C] text-white rounded-xl text-sm font-bold hover:bg-[#2D7A5C]/80">✓ Done</button>
                                <button onClick={() => removeEvent(event.id)} className="px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-xl text-sm hover:bg-[#EF4444]/20 border border-[#EF4444]/30">🗑️</button>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <FlexibleDatePicker label="📅 When did this happen?" date={event.eventDate} endDate={event.endDate} time={event.eventTime} precision={event.datePrecision as DatePrecision} onChange={(val) => handleDateChange(event.id, val)} />
                            <div>
                                <label className="block text-sm font-semibold text-[#D4AF37] mb-2">📝 Details / Notes (optional)</label>
                                <textarea value={event.description} onChange={(e) => updateEventField(event.id, { description: e.target.value })} className="input-field min-h-[100px] resize-none" placeholder="✍️ Any additional details..." />
                            </div>
                        </div>
                    </div>
                );
            })()}

            <TimelineVisualizer events={lifeEvents} selectedEventId={editingEventId || undefined} onSelectEvent={(id) => setEditingEventId(id)} />

            {/* Encouragement */}
            {lifeEvents.length > 0 && lifeEvents.length < 5 && !editingEventId && (
                <div className="p-4 bg-[#FF9F43]/10 border border-[#FF9F43]/30 rounded-xl animate-fade-in">
                    <p className="text-[#FF9F43] flex items-center gap-3 font-medium">
                        <span className="text-2xl">💪</span> Great start! Add {5 - lifeEvents.length} more event{5 - lifeEvents.length > 1 ? 's' : ''} for better accuracy!
                    </p>
                </div>
            )}
            {lifeEvents.length >= 10 && (
                <div className="p-4 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-xl animate-fade-in">
                    <p className="text-[#2D7A5C] flex items-center gap-3 font-medium">
                        <span className="text-2xl">🏆</span> Excellent! You've provided comprehensive data for maximum accuracy! ✨
                    </p>
                </div>
            )}
        </div>
    );
}
