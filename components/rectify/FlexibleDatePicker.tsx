'use client';

import { useState, useEffect } from 'react';

export type DatePrecision = 'exact' | 'month' | 'year' | 'date_range' | 'month_range' | 'year_range';

export interface DateValue {
    startDate: string;
    endDate?: string;
    time?: string;
    precision: DatePrecision;
}

interface FlexibleDatePickerProps {
    label: string;
    date: string;
    endDate?: string;
    time?: string;
    precision: DatePrecision;
    onChange: (value: DateValue) => void;
    minYear?: number;
    maxYear?: number;
    showEncouragement?: boolean;
}

const PRECISION_OPTIONS: { value: DatePrecision; label: string; icon: string; hint: string }[] = [
    { value: 'exact', label: 'Exact', icon: '📅', hint: 'I know the exact date' },
    { value: 'month', label: 'Month', icon: '🗓️', hint: 'Month & year only' },
    { value: 'year', label: 'Year', icon: '📆', hint: 'Year only' },
    { value: 'date_range', label: 'Dates', icon: '↔️', hint: 'Between two dates' },
    { value: 'month_range', label: 'Months', icon: '📊', hint: 'Between two months' },
    { value: 'year_range', label: 'Years', icon: '🔄', hint: 'Between years' },
];

export default function FlexibleDatePicker({ label, date, endDate, time, precision, onChange, minYear = 1920, maxYear = new Date().getFullYear(), showEncouragement = true }: FlexibleDatePickerProps) {
    const [mode, setMode] = useState<DatePrecision>(precision);
    const [showModeSelector, setShowModeSelector] = useState(false);

    const parseParts = (dateStr: string) => { const parts = (dateStr || '').split('-'); return { year: parts[0] || '', month: parts[1] || '', day: parts[2] || '' }; };
    const [startParts, setStartParts] = useState(parseParts(date));
    const [endParts, setEndParts] = useState(parseParts(endDate || ''));
    const [timeValue, setTimeValue] = useState(time || '');

    useEffect(() => { setMode(precision); setStartParts(parseParts(date)); setEndParts(parseParts(endDate || '')); setTimeValue(time || ''); }, [date, endDate, time, precision]);

    const buildDateString = (parts: { year: string; month: string; day: string }, forMode: DatePrecision): string => {
        if (forMode === 'year' || forMode === 'year_range') return parts.year;
        if (forMode === 'month' || forMode === 'month_range') return parts.year && parts.month ? `${parts.year}-${parts.month}` : parts.year;
        if (parts.year && parts.month && parts.day) return `${parts.year}-${parts.month}-${parts.day}`;
        return parts.year && parts.month ? `${parts.year}-${parts.month}` : parts.year;
    };

    const emitChange = (newStartParts: typeof startParts, newEndParts: typeof endParts, newMode: DatePrecision, newTime?: string) => {
        const startStr = buildDateString(newStartParts, newMode);
        const isRange = newMode.includes('range');
        onChange({ startDate: startStr, endDate: isRange ? buildDateString(newEndParts, newMode) : undefined, time: newMode === 'exact' ? newTime : undefined, precision: newMode });
    };

    const handleModeChange = (newMode: DatePrecision) => { setMode(newMode); setShowModeSelector(false); emitChange(startParts, endParts, newMode, timeValue); };

    const updateField = (field: 'year' | 'month' | 'day', value: string, isEnd = false) => {
        if (isEnd) { const newParts = { ...endParts, [field]: value }; setEndParts(newParts); emitChange(startParts, newParts, mode, timeValue); }
        else { const newParts = { ...startParts, [field]: value }; setStartParts(newParts); emitChange(newParts, endParts, mode, timeValue); }
    };

    const updateTime = (value: string) => { setTimeValue(value); emitChange(startParts, endParts, mode, value); };

    const months = [
        { val: '01', label: '🌸 Jan' }, { val: '02', label: '❄️ Feb' }, { val: '03', label: '🌱 Mar' }, { val: '04', label: '🌷 Apr' },
        { val: '05', label: '🌺 May' }, { val: '06', label: '☀️ Jun' }, { val: '07', label: '🌴 Jul' }, { val: '08', label: '🌻 Aug' },
        { val: '09', label: '🍂 Sep' }, { val: '10', label: '🎃 Oct' }, { val: '11', label: '🍁 Nov' }, { val: '12', label: '🎄 Dec' }
    ];
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => (maxYear - i).toString());
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const isComplete = () => {
        if (mode === 'year') return !!startParts.year;
        if (mode === 'month') return !!startParts.year && !!startParts.month;
        if (mode === 'exact') return !!startParts.year && !!startParts.month && !!startParts.day;
        if (mode === 'year_range') return !!startParts.year && !!endParts.year;
        if (mode === 'month_range') return !!startParts.year && !!startParts.month && !!endParts.year && !!endParts.month;
        if (mode === 'date_range') return !!startParts.year && !!startParts.month && !!startParts.day && !!endParts.year && !!endParts.month && !!endParts.day;
        return false;
    };

    const currentPrecision = PRECISION_OPTIONS.find(p => p.value === mode);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <label className="text-sm font-semibold text-[#D4AF37]">{label}</label>
                <button type="button" onClick={() => setShowModeSelector(!showModeSelector)} className="flex items-center gap-2 px-4 py-2 bg-[#2A3442] hover:bg-[#D4AF37]/10 rounded-xl text-sm transition-colors border border-[#D4AF37]/30 hover:border-[#D4AF37]/50">
                    <span>{currentPrecision?.icon}</span>
                    <span className="text-[#D4AF37] font-medium">{currentPrecision?.label}</span>
                    <span className="text-[#8C7F72]">▼</span>
                </button>
            </div>

            {showModeSelector && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-[#2A3442] rounded-xl border border-[#D4AF37]/30 shadow-lg animate-fade-in">
                    {PRECISION_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => handleModeChange(opt.value)}
                            className={`p-3 rounded-xl text-left transition-all ${mode === opt.value ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37]' : 'bg-[#1A1F2E] border-2 border-transparent hover:border-[#D4AF37]/30'}`}>
                            <div className="flex items-center gap-2 mb-1"><span className="text-xl">{opt.icon}</span><span className="font-semibold text-[#F5F0EB] text-sm">{opt.label}</span></div>
                            <p className="text-xs text-[#8C7F72]">{opt.hint}</p>
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-[#2A3442] p-4 rounded-xl border border-[#D4AF37]/20">
                <div className="flex flex-wrap items-center gap-3">
                    {(mode === 'exact' || mode === 'date_range') && <select value={startParts.day} onChange={(e) => updateField('day', e.target.value)} className="input-field w-24"><option value="">📅 Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>}
                    {(mode === 'exact' || mode === 'month' || mode === 'date_range' || mode === 'month_range') && <select value={startParts.month} onChange={(e) => updateField('month', e.target.value)} className="input-field w-32"><option value="">🗓️ Month</option>{months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}</select>}
                    <select value={startParts.year} onChange={(e) => updateField('year', e.target.value)} className="input-field w-28"><option value="">📆 Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    {mode === 'exact' && <><span className="text-[#8C7F72]">at</span><input type="time" value={timeValue} onChange={(e) => updateTime(e.target.value)} className="input-field w-32" /></>}
                    {mode.includes('range') && <div className="px-3 py-2 bg-[#D4AF37]/20 rounded-lg"><span className="text-[#D4AF37] font-bold">→</span></div>}
                    {mode.includes('range') && <>
                        {mode === 'date_range' && <select value={endParts.day} onChange={(e) => updateField('day', e.target.value, true)} className="input-field w-24"><option value="">📅 Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>}
                        {(mode === 'date_range' || mode === 'month_range') && <select value={endParts.month} onChange={(e) => updateField('month', e.target.value, true)} className="input-field w-32"><option value="">🗓️ Month</option>{months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}</select>}
                        <select value={endParts.year} onChange={(e) => updateField('year', e.target.value, true)} className="input-field w-28"><option value="">📆 Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </>}
                </div>
                {showEncouragement && <div className="mt-3 flex items-center gap-2">{isComplete() ? <><span className="w-3 h-3 rounded-full bg-[#2D7A5C] animate-pulse" /><span className="text-xs text-[#2D7A5C] font-medium">✓ Date recorded</span></> : <><span className="w-3 h-3 rounded-full bg-[#FF9F43]" /><span className="text-xs text-[#FF9F43] font-medium">Please complete the date</span></>}</div>}
            </div>
            <p className="text-xs text-[#8C7F72] italic flex items-center gap-1"><span>💡</span> {currentPrecision?.hint}</p>
        </div>
    );
}
