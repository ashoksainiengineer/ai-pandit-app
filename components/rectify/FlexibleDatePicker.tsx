'use client';

import { useState, useEffect } from 'react';

type DatePrecision = 'exact' | 'month' | 'year' | 'range';

interface FlexibleDatePickerProps {
    label: string;
    date: string; // YYYY-MM-DD or YYYY-MM or YYYY
    endDate?: string; // For ranges
    precision: DatePrecision;
    onChange: (date: string, precision: DatePrecision, endDate?: string) => void;
    minYear?: number;
    maxYear?: number;
}

export default function FlexibleDatePicker({
    label,
    date,
    endDate,
    precision,
    onChange,
    minYear = 1900,
    maxYear = new Date().getFullYear(),
}: FlexibleDatePickerProps) {
    const [mode, setMode] = useState<DatePrecision>(precision);

    // Parse initial values
    const getParts = (dateStr: string) => {
        const parts = dateStr.split('-');
        return {
            year: parts[0] || '',
            month: parts[1] || '',
            day: parts[2] || '',
        };
    };

    const [startParts, setStartParts] = useState(getParts(date));
    const [endParts, setEndParts] = useState(getParts(endDate || ''));

    // Sync state when props change
    useEffect(() => {
        setMode(precision);
        setStartParts(getParts(date));
        setEndParts(getParts(endDate || ''));
    }, [date, endDate, precision]);

    const handleModeChange = (newMode: DatePrecision) => {
        setMode(newMode);
        // When switching modes, we preserve as much info as possible but reset invalid parts
        onChange(date, newMode, endDate);
    };

    const updateDate = (part: 'year' | 'month' | 'day', value: string, isEnd = false) => {
        const currentParts = isEnd ? { ...endParts } : { ...startParts };
        currentParts[part] = value;

        if (isEnd) {
            setEndParts(currentParts);
        } else {
            setStartParts(currentParts);
        }

        // Construct date strings based on mode
        let newDateStr = '';
        let newEndDateStr = undefined;

        if (mode === 'year') {
            newDateStr = isEnd ? startParts.year : value; // Only update year
        } else if (mode === 'month') {
            newDateStr = `${currentParts.year}-${currentParts.month}`;
        } else {
            newDateStr = `${currentParts.year}-${currentParts.month}-${currentParts.day}`;
        }

        if (mode === 'range') {
            // For range, we assume year range for now as per "only range of year" request
            // But implementing full flexibility
            const sYear = isEnd ? startParts.year : value;
            const eYear = isEnd ? value : endParts.year;
            newDateStr = sYear;
            newEndDateStr = eYear;
        }

        // Simplified logic: just rebuild strings from parts based on mode
        // Note: Real implementation needs more robust handling of partial states

        const buildDateString = (p: typeof startParts) => {
            if (mode === 'year' || mode === 'range') return p.year;
            if (mode === 'month') return `${p.year}-${p.month}`;
            return `${p.year}-${p.month}-${p.day}`;
        };

        const finalStart = isEnd ? buildDateString(startParts) : buildDateString({ ...startParts, [part]: value });
        const finalEnd = mode === 'range' ? (isEnd ? buildDateString({ ...endParts, [part]: value }) : buildDateString(endParts)) : undefined;

        onChange(finalStart, mode, finalEnd);
    };

    const months = [
        { val: '01', label: 'January' }, { val: '02', label: 'February' },
        { val: '03', label: 'March' }, { val: '04', label: 'April' },
        { val: '05', label: 'May' }, { val: '06', label: 'June' },
        { val: '07', label: 'July' }, { val: '08', label: 'August' },
        { val: '09', label: 'September' }, { val: '10', label: 'October' },
        { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => (maxYear - i).toString());
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#C4B8AD]">{label}</label>
                <div className="flex bg-[#2A3442] rounded-lg p-1 text-xs">
                    {(['exact', 'month', 'year', 'range'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`px-3 py-1 rounded-md transition-all ${mode === m
                                ? 'bg-[#D4AF37] text-[#0F1419] font-semibold shadow-lg'
                                : 'text-[#8C7F72] hover:text-[#C4B8AD]'
                                }`}
                        >
                            {m === 'exact' ? 'Exact Date' :
                                m === 'month' ? 'Month & Year' :
                                    m === 'year' ? 'Year Only' : 'Range'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end bg-[#2A3442]/30 p-4 rounded-xl border border-[#D4AF37]/10">
                {/* Start Date */}
                <div className="flex gap-2">
                    {/* Day */}
                    {(mode === 'exact') && (
                        <select
                            value={startParts.day}
                            onChange={(e) => updateDate('day', e.target.value)}
                            className="input-field min-w-[70px]"
                        >
                            <option value="">Day</option>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    )}

                    {/* Month */}
                    {(mode === 'exact' || mode === 'month') && (
                        <select
                            value={startParts.month}
                            onChange={(e) => updateDate('month', e.target.value)}
                            className="input-field min-w-[120px]"
                        >
                            <option value="">Month</option>
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                    )}

                    {/* Year */}
                    <select
                        value={startParts.year}
                        onChange={(e) => updateDate('year', e.target.value)}
                        className="input-field min-w-[90px]"
                    >
                        <option value="">Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* Range Separator */}
                {mode === 'range' && (
                    <div className="text-[#8C7F72] font-medium pb-3">to</div>
                )}

                {/* End Date (Only for Range) */}
                {mode === 'range' && (
                    <div className="flex gap-2">
                        <select
                            value={endParts.year}
                            onChange={(e) => updateDate('year', e.target.value, true)}
                            className="input-field min-w-[90px]"
                        >
                            <option value="">End Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-[#8C7F72] italic">
                {mode === 'exact' && "Use exact date if you have documents or clear memory."}
                {mode === 'month' && "Good if you know the month but not the specific day."}
                {mode === 'year' && "Useful for old memories where only the year is known."}
                {mode === 'range' && "Best for 'around 2010-2011' or 'childhood' events."}
            </p>
        </div>
    );
}
