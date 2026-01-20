'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BirthData, LifeEvent, TimeOffsetConfig } from '@/lib/types';
import EVENT_CATEGORIES, { EventCategory, EventTemplate } from '@/lib/event-categories';

interface Step2Props {
    lifeEvents: LifeEvent[];
    updateEvents: (events: LifeEvent[]) => void;
    offsetConfig?: TimeOffsetConfig;
}

// High-impact BTR events
const BTR_EVENTS = [
    { label: 'Marriage', icon: '💍', cat: 'marriage', boost: 10 },
    { label: 'First Child', icon: '👶', cat: 'children', boost: 10 },
    { label: 'Parent Death', icon: '🕯️', cat: 'family', boost: 9 },
    { label: 'First Job', icon: '💼', cat: 'career', boost: 8 },
    { label: 'Surgery/Accident', icon: '🏥', cat: 'health', boost: 8 },
    { label: 'Property Purchase', icon: '🏠', cat: 'financial', boost: 7 },
    { label: 'Foreign Move', icon: '✈️', cat: 'travel', boost: 7 },
    { label: 'Graduation', icon: '🎓', cat: 'education', boost: 6 },
];

// Date precision types - 5 options
// Date precision types - 6 options
type DateType = 'exact_date_time' | 'exact_date' | 'month_year' | 'month_range' | 'year_range' | 'exact_date_range';

const DATE_OPTIONS = [
    { val: 'exact_date_time', label: 'Exact Date & Time', desc: 'DD/MM/YYYY HH:MM' },
    { val: 'exact_date', label: 'Exact Date', desc: 'DD/MM/YYYY' },
    { val: 'exact_date_range', label: 'Date Range', desc: 'DD/MM/YYYY → DD/MM/YYYY' },
    { val: 'month_year', label: 'Month & Year', desc: 'MM/YYYY' },
    { val: 'month_range', label: 'Month Range', desc: 'MM/YYYY → MM/YYYY' },
    { val: 'year_range', label: 'Year Range', desc: 'YYYY → YYYY' },
];

export default function Step2LifeEvents({ lifeEvents, updateEvents }: Step2Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCat, setSelectedCat] = useState<EventCategory | null>(null);

    // Add new event
    const addEvent = (label: string, icon: string, category: string, isCustom: boolean = false) => {
        const newEvent: LifeEvent = {
            id: `evt_${Date.now()}`,
            category: category as any,
            eventType: label,
            icon: icon,
            datePrecision: 'month_year',
            eventDate: '',
            description: '',
            importance: 'high',
            isCustom
        };
        updateEvents([...lifeEvents, newEvent]);
        setEditingId(newEvent.id);
        setSelectedCat(null);
    };

    const updateEvent = (id: string, updates: Partial<LifeEvent>) => {
        updateEvents(lifeEvents.map(e => e.id === id ? { ...e, ...updates } : e));
    };

    const deleteEvent = (id: string) => {
        updateEvents(lifeEvents.filter(e => e.id !== id));
        setEditingId(null);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);


    // Calculate Accuracy Score based on diversity and depth of events
    const calculateAccuracy = () => {
        // Base score just for reaching this step
        let score = 30;

        // Weights for different categories (High impact > Medium > Low)
        const catWeights: Record<string, number> = {
            marriage: 15,      // High importance for rectification
            children: 15,      // High importance
            family_events: 12, // Death/Birth of family often critical
            health: 12,
            career: 10,
            education: 10,
            financial: 8,
            travel: 6,
            spiritual: 5,
            legal: 5,
            other: 5
        };

        // Track usage per category for diminishing returns
        const catUsage: Record<string, number> = {};

        const validEvents = lifeEvents.filter(e => e.description && e.eventDate);

        validEvents.forEach(evt => {
            const cat = evt.category;
            const weight = catWeights[cat] || 5;

            // Increment usage count
            catUsage[cat] = (catUsage[cat] || 0) + 1;
            const count = catUsage[cat];

            // Diminishing returns logic
            if (count === 1) {
                score += weight; // 1st event: 100% value
            } else if (count === 2) {
                score += weight * 0.4; // 2nd event: 40% value
            } else if (count === 3) {
                score += weight * 0.1; // 3rd event: 10% value
            }
            // 4th+ event adds 0 to score
        });

        return Math.min(98, Math.round(score));
    };

    const accuracy = calculateAccuracy();

    // Sort events chronologically so timeline makes sense
    const sortedEvents = [...lifeEvents].sort((a, b) => {
        // Events with no date go to end, or we filters them? 
        // User wants timeline, so date is key. 
        if (!a.eventDate) return 1;
        if (!b.eventDate) return -1;
        return a.eventDate.localeCompare(b.eventDate);
    });

    const formatEventDate = (e: LifeEvent) => {
        if (!e.eventDate) return 'No date';
        const [y, m, d] = e.eventDate.split('-');
        const mn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mon = m ? mn[parseInt(m) - 1] : '';

        if (e.datePrecision === 'month_year' && mon) return `${mon} ${y}`;
        if ((e.datePrecision === 'exact_date' || e.datePrecision === 'exact_date_time') && mon && d) return `${d} ${mon} ${y}`;

        if (e.datePrecision === 'exact_date_range' && e.endDate) {
            const [ey, em, ed] = e.endDate.split('-');
            const emon = em ? mn[parseInt(em) - 1] : '';
            return `${d} ${mon} ${y} → ${ed} ${emon} ${ey}`;
        }

        if (e.endDate) return `${y} → ${e.endDate}`;
        return y;
    };

    const isAdded = (label: string) => lifeEvents.some(e => e.eventType === label);

    return (
        <div className="space-y-8">
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-[#E8A849] font-medium tracking-widest mb-2">STEP 3 OF 4</p>
                    <h1 className="text-3xl font-bold text-[#F5F0EB]">Life Events</h1>
                    <p className="text-[#C4B8AD] mt-2 text-sm leading-relaxed max-w-md">
                        Add significant events to correlate with planetary transits.
                        {offsetConfig?.preset === '30min' && " Aim for 3-5 precise events."}
                        {offsetConfig?.preset === '1hour' && " Aim for 5-7 diverse events."}
                        {offsetConfig?.preset === '2hours' && " Aim for 7-10 events + Physical traits."}
                        {(offsetConfig?.preset === '4hours' || (offsetConfig?.customMinutes && offsetConfig.customMinutes > 120)) &&
                            " Required: 10+ major life-altering events to navigate this large window."}
                    </p>
                </div>
                <div className="flex gap-8 items-start">
                    <div className="text-right p-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 min-w-[150px]">
                        <div className="text-xs text-[#8C7F72] uppercase tracking-wider mb-1">Vedic Status</div>
                        <div className={`text-sm font-bold ${accuracy > 80 ? 'text-emerald-500' : accuracy > 50 ? 'text-[#E8A849]' : 'text-[#D64545]'}`}>
                            {accuracy > 80 ? '🔒 Pinned' : accuracy > 50 ? '⚡ Calibrating' : '🔍 Searching'}
                        </div>
                        <div className="text-[10px] text-[#8C7F72] mt-1">
                            {lifeEvents.length} of {
                                offsetConfig?.preset === '30min' ? 4 :
                                    offsetConfig?.preset === '1hour' ? 6 :
                                        offsetConfig?.preset === '2hours' ? 8 : 12
                            } Target
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-[#E8A849]">{accuracy}%</div>
                        <div className="text-xs text-[#8C7F72]">Accuracy Potential</div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* EVENT EDITOR (when editing) */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {editingId && (() => {
                    const event = lifeEvents.find(e => e.id === editingId);
                    if (!event) return null;

                    const [y, m, d] = (event.eventDate || '').split('-');
                    const dateType = (event.datePrecision || 'month_year') as DateType;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-[#241F1C] border-2 border-[#E8A849] rounded-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-[#E8A849]/10 px-8 py-5 flex items-center justify-between border-b border-[#E8A849]/20">
                                <div className="flex items-center gap-5">
                                    <span className="text-5xl">{event.icon}</span>
                                    <div>
                                        {event.isCustom ? (
                                            <input
                                                type="text"
                                                autoFocus
                                                value={event.eventType}
                                                onChange={(e) => updateEvent(event.id, { eventType: e.target.value })}
                                                className="bg-transparent text-xl font-semibold text-[#F5F0EB] border-b border-[#E8A849]/50 focus:border-[#E8A849] outline-none w-full min-w-[200px]"
                                                placeholder="Enter Event Name"
                                            />
                                        ) : (
                                            <h2 className="text-xl font-semibold text-[#F5F0EB]">{event.eventType}</h2>
                                        )}
                                        <span className="text-sm text-[#C4B8AD]">{event.category}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setEditingId(null)} className="px-6 py-3 bg-[#5CB57B] text-white font-semibold rounded-lg hover:bg-[#4EA36A] transition-colors">
                                        ✓ Save Event
                                    </button>
                                    <button onClick={() => deleteEvent(event.id)} className="px-4 py-3 border border-[#D64545] text-[#D64545] rounded-lg hover:bg-[#D64545]/10 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Date Type Selector - 5 Options */}
                                <div>
                                    <label className="block text-sm font-medium text-[#E8A849] mb-4">📅 When did this happen?</label>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
                                        {DATE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.val}
                                                onClick={() => updateEvent(event.id, { datePrecision: opt.val as any })}
                                                className={`py-3 px-2 rounded-lg text-center transition-all border-2 ${dateType === opt.val
                                                    ? 'bg-[#E8A849]/20 border-[#E8A849] text-[#F5F0EB]'
                                                    : 'bg-[#2E2724] border-transparent text-[#C4B8AD] hover:border-[#E8A849]/30'
                                                    }`}
                                            >
                                                <div className="font-medium text-xs">{opt.label}</div>
                                                <div className="text-[10px] mt-1 opacity-60">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dynamic Date Fields */}
                                    <div className="flex gap-4 items-center flex-wrap bg-[#2E2724] p-5 rounded-lg">
                                        {/* Exact Date & Time */}
                                        {dateType === 'exact_date_time' && (
                                            <>
                                                <select value={d || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${m || '01'}-${e.target.value.padStart(2, '0')}` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                    <option value="">Day</option>
                                                    {days.map(day => <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>)}
                                                </select>
                                                <select value={m || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${e.target.value}-${d || '01'}` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none flex-1 min-w-[120px]">
                                                    <option value="">Month</option>
                                                    {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon}</option>)}
                                                </select>
                                                <select value={y || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${e.target.value}-${m || '01'}-${d || '01'}` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none min-w-[100px]">
                                                    <option value="">Year</option>
                                                    {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                </select>
                                                <span className="text-[#8C7F72]">at</span>
                                                <select className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none w-20">
                                                    <option value="">HH</option>
                                                    {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                                <span className="text-[#E8A849]">:</span>
                                                <select className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none w-20">
                                                    <option value="">MM</option>
                                                    <option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option>
                                                </select>
                                                <select className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] outline-none">
                                                    <option>AM</option><option>PM</option>
                                                </select>
                                            </>
                                        )}

                                        {/* Exact Date */}
                                        {dateType === 'exact_date' && (
                                            <>
                                                <select value={d || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${m || '01'}-${e.target.value.padStart(2, '0')}` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                    <option value="">Day</option>
                                                    {days.map(day => <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>)}
                                                </select>
                                                <select value={m || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${e.target.value}-${d || '01'}` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none flex-1">
                                                    <option value="">Month</option>
                                                    {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon}</option>)}
                                                </select>
                                                <select value={y || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${e.target.value}-${m || '01'}-${d || '01'}` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                    <option value="">Year</option>
                                                    {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                </select>
                                            </>
                                        )}

                                        {/* Exact Date Range */}
                                        {dateType === 'exact_date_range' && (
                                            <div className="flex flex-col gap-3 w-full">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#8C7F72] w-10">From:</span>
                                                    <select value={d || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${m || '01'}-${e.target.value.padStart(2, '0')}` })}
                                                        className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                        <option value="">Day</option>
                                                        {days.map(day => <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>)}
                                                    </select>
                                                    <select value={m || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${e.target.value}-${d || '01'}` })}
                                                        className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none flex-1">
                                                        <option value="">Month</option>
                                                        {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon}</option>)}
                                                    </select>
                                                    <select value={y || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${e.target.value}-${m || '01'}-${d || '01'}` })}
                                                        className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none w-24">
                                                        <option value="">Year</option>
                                                        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                    </select>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#8C7F72] w-10">To:</span>
                                                    {(() => {
                                                        const [ey, em, ed] = (event.endDate || '').split('-');
                                                        return (
                                                            <>
                                                                <select value={ed || ''} onChange={(e) => updateEvent(event.id, { endDate: `${ey || currentYear}-${em || '01'}-${e.target.value.padStart(2, '0')}` })}
                                                                    className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                                    <option value="">Day</option>
                                                                    {days.map(day => <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>)}
                                                                </select>
                                                                <select value={em || ''} onChange={(e) => updateEvent(event.id, { endDate: `${ey || currentYear}-${e.target.value}-${ed || '01'}` })}
                                                                    className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none flex-1">
                                                                    <option value="">Month</option>
                                                                    {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon}</option>)}
                                                                </select>
                                                                <select value={ey || ''} onChange={(e) => updateEvent(event.id, { endDate: `${e.target.value}-${em || '01'}-${ed || '01'}` })}
                                                                    className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none w-24">
                                                                    <option value="">Year</option>
                                                                    {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                                </select>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Month & Year */}
                                        {dateType === 'month_year' && (
                                            <>
                                                <select value={m || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${e.target.value}-01` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none flex-1">
                                                    <option value="">Select Month</option>
                                                    {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon}</option>)}
                                                </select>
                                                <select value={y || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${e.target.value}-${m || '01'}-01` })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                    <option value="">Select Year</option>
                                                    {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                </select>
                                            </>
                                        )}

                                        {/* Month Range */}
                                        {dateType === 'month_range' && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#8C7F72]">From:</span>
                                                    <select value={m || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${y || currentYear}-${e.target.value}-01` })}
                                                        className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] outline-none">
                                                        <option value="">Month</option>
                                                        {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon.slice(0, 3)}</option>)}
                                                    </select>
                                                    <select value={y || ''} onChange={(e) => updateEvent(event.id, { eventDate: `${e.target.value}-${m || '01'}-01` })}
                                                        className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] outline-none">
                                                        <option value="">Year</option>
                                                        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                    </select>
                                                </div>
                                                <span className="text-[#E8A849] text-xl font-bold">→</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-[#8C7F72]">To:</span>
                                                    <select className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] outline-none">
                                                        <option value="">Month</option>
                                                        {months.map((mon, i) => <option key={mon} value={(i + 1).toString().padStart(2, '0')}>{mon.slice(0, 3)}</option>)}
                                                    </select>
                                                    <select value={event.endDate || ''} onChange={(e) => updateEvent(event.id, { endDate: e.target.value })}
                                                        className="h-[48px] px-3 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] outline-none">
                                                        <option value="">Year</option>
                                                        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {/* Year Range */}
                                        {dateType === 'year_range' && (
                                            <>
                                                <span className="text-sm text-[#8C7F72]">From:</span>
                                                <select value={y || ''} onChange={(e) => updateEvent(event.id, { eventDate: e.target.value })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                    <option value="">Start Year</option>
                                                    {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                </select>
                                                <span className="text-[#E8A849] text-xl font-bold">→</span>
                                                <span className="text-sm text-[#8C7F72]">To:</span>
                                                <select value={event.endDate || ''} onChange={(e) => updateEvent(event.id, { endDate: e.target.value })}
                                                    className="h-[48px] px-4 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none">
                                                    <option value="">End Year</option>
                                                    {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                                </select>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-[#E8A849] mb-3">
                                        📝 Describe your experience <span className="text-[#D64545]">*</span>
                                    </label>
                                    <textarea
                                        value={event.description || ''}
                                        onChange={(e) => updateEvent(event.id, { description: e.target.value })}
                                        placeholder="What happened? How did you feel? Any memorable circumstances..."
                                        className={`w-full h-[100px] p-5 bg-[#2E2724] border rounded-lg text-[#F5F0EB] placeholder-[#8C7F72] resize-none focus:ring-2 outline-none transition-all ${event.description ? 'border-[#5CB57B]/50' : 'border-[#D64545]/50'
                                            }`}
                                    />
                                    <div className="flex items-center gap-2 mt-3 text-xs text-[#5CB57B]">
                                        <span>🔒</span><span>End-to-end encrypted</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ADD EVENTS CONTAINER (Categories on TOP, BTR below) */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {!editingId && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#241F1C] rounded-xl border border-[#C4B8AD]/10 overflow-hidden">
                    {/* Categories Header */}
                    <div className="px-6 py-4 border-b border-[#C4B8AD]/10">
                        <h3 className="text-sm font-semibold text-[#F5F0EB]">📂 Browse Categories</h3>
                    </div>

                    {/* Category Buttons */}
                    <div className="p-5 border-b border-[#C4B8AD]/10">
                        <div className="flex flex-wrap gap-2">
                            {EVENT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCat(selectedCat?.id === cat.id ? null : cat)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedCat?.id === cat.id
                                        ? 'bg-[#E8A849] text-[#1A1614] font-medium'
                                        : 'bg-[#2E2724] text-[#C4B8AD] hover:bg-[#3A3330]'
                                        }`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Sub-categories */}
                        <AnimatePresence>
                            {selectedCat && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 p-4 bg-[#2E2724] rounded-lg"
                                >
                                    <p className="text-xs text-[#8C7F72] mb-3">{selectedCat.icon} {selectedCat.label} events:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCat.events.map(evt => (
                                            <button
                                                key={evt.id}
                                                onClick={() => addEvent(evt.label, selectedCat.icon, selectedCat.id)}
                                                className="px-3 py-2 bg-[#241F1C] border border-[#C4B8AD]/20 rounded-lg text-sm text-[#C4B8AD] hover:border-[#E8A849]/50 hover:text-[#F5F0EB] transition-all"
                                            >
                                                + {evt.label}
                                            </button>
                                        ))}
                                        {/* Custom Event Button */}
                                        <button
                                            onClick={() => addEvent("Custom Event", selectedCat.icon, selectedCat.id, true)}
                                            className="px-3 py-2 bg-[#2E2724] border border-[#E8A849] border-dashed rounded-lg text-sm text-[#E8A849] hover:bg-[#E8A849]/10 transition-all font-medium"
                                        >
                                            + Custom Event
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* High Impact Events (smaller, same container) */}
                    <div className="p-5">
                        <h4 className="text-xs font-semibold text-[#E8A849] mb-3 flex items-center gap-2">
                            <span>🎯</span> High-Impact Events
                            <span className="text-[#8C7F72] font-normal">(recommended for accuracy)</span>
                        </h4>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {BTR_EVENTS.map((evt, i) => {
                                const added = isAdded(evt.label);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => !added && addEvent(evt.label, evt.icon, evt.cat)}
                                        disabled={added}
                                        className={`p-3 rounded-lg text-center transition-all border ${added
                                            ? 'bg-[#5CB57B]/10 border-[#5CB57B]/30 cursor-default'
                                            : 'bg-[#2E2724] border-transparent hover:border-[#E8A849]/30'
                                            }`}
                                    >
                                        <div className="text-xl">{evt.icon}</div>
                                        <div className="text-[10px] text-[#C4B8AD] mt-1 truncate">{evt.label}</div>
                                        {!added && <div className="text-[9px] text-[#E8A849]">+{evt.boost}%</div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TIMELINE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {lifeEvents.length > 0 && (
                <div className="bg-[#241F1C] rounded-xl border border-[#C4B8AD]/10">
                    <div className="px-6 py-4 border-b border-[#C4B8AD]/10 flex justify-between">
                        <h3 className="text-sm font-semibold text-[#F5F0EB]">📜 Your Timeline</h3>
                        <span className="text-xs text-[#8C7F72]">{lifeEvents.length} events</span>
                    </div>
                    <div className="divide-y divide-[#C4B8AD]/10">
                        {sortedEvents.map((event) => (
                            <motion.div
                                key={event.id}
                                onClick={() => setEditingId(event.id)}
                                className="flex items-center gap-5 p-5 cursor-pointer hover:bg-[#2E2724] transition-colors"
                                whileHover={{ x: 4 }}
                            >
                                <span className="text-3xl">{event.icon}</span>
                                <div className="flex-1">
                                    <div className="text-[#F5F0EB] font-medium">{event.eventType}</div>
                                    <div className="text-xs text-[#E8A849] mb-1">
                                        {formatEventDate(event)}
                                    </div>
                                    {event.description && (
                                        <p className="text-sm text-[#C4B8AD] line-clamp-2 leading-relaxed">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                                {!event.description ? (
                                    <span className="px-3 py-1 bg-[#D64545]/10 border border-[#D64545]/30 text-[#D64545] text-xs rounded-full">Add details</span>
                                ) : (
                                    <span className="text-[#5CB57B] text-lg">✓</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {lifeEvents.length === 0 && !editingId && (
                <div className="bg-[#241F1C] rounded-xl border border-[#C4B8AD]/10 p-12 text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">Your timeline starts here</h3>
                    <p className="text-[#8C7F72]">Select a category above to add your first event</p>
                </div>
            )}
        </div>
    );
}
