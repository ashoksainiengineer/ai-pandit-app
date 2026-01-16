'use client';

import { useState, useEffect } from 'react';
import { BirthData } from '@/lib/types';

interface Step1Props {
    data: BirthData;
    updateData: (updates: Partial<BirthData>) => void;
}

export default function Step1BirthDetails({ data, updateData }: Step1Props) {
    // Local state for split inputs to avoid immediate validation errors
    const [dobParts, setDomParts] = useState({
        day: data.dateOfBirth.split('-')[2] || '',
        month: data.dateOfBirth.split('-')[1] || '',
        year: data.dateOfBirth.split('-')[0] || ''
    });

    const [timeParts, setTimeParts] = useState({
        hour: '',
        minute: '',
        period: 'AM'
    });

    useEffect(() => {
        if (data.tentativeTime) {
            const [h, m] = data.tentativeTime.split(':');
            let hour = parseInt(h);
            const period = hour >= 12 ? 'PM' : 'AM';
            if (hour > 12) hour -= 12;
            if (hour === 0) hour = 12;

            setTimeParts({
                hour: hour.toString().padStart(2, '0'),
                minute: m,
                period
            });
        }
    }, []); // Run once on mount

    const handleDateChange = (part: 'day' | 'month' | 'year', value: string) => {
        const newParts = { ...dobParts, [part]: value };
        setDomParts(newParts);

        if (newParts.year && newParts.month && newParts.day) {
            updateData({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
        }
    };

    const handleTimeChange = (part: 'hour' | 'minute' | 'period', value: string) => {
        const newParts = { ...timeParts, [part]: value };
        setTimeParts(newParts);

        if (newParts.hour && newParts.minute) {
            let hour = parseInt(newParts.hour);
            if (newParts.period === 'PM' && hour !== 12) hour += 12;
            if (newParts.period === 'AM' && hour === 12) hour = 0;

            updateData({ tentativeTime: `${hour.toString().padStart(2, '0')}:${newParts.minute}:00` });
        }
    };

    const months = [
        { val: '01', label: 'January' }, { val: '02', label: 'February' },
        { val: '03', label: 'March' }, { val: '04', label: 'April' },
        { val: '05', label: 'May' }, { val: '06', label: 'June' },
        { val: '07', label: 'July' }, { val: '08', label: 'August' },
        { val: '09', label: 'September' }, { val: '10', label: 'October' },
        { val: '11', label: 'November' }, { val: '12', label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="animate-fade-in-up space-y-6">
            <h2 className="text-2xl font-bold text-[#F5F0EB]">Basic Information</h2>
            <p className="text-[#C4B8AD]">Please provide your details as accurately as strictly possible.</p>

            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Full Name *</label>
                <input
                    type="text"
                    value={data.fullName}
                    onChange={(e) => updateData({ fullName: e.target.value })}
                    className="input-field"
                    placeholder="Enter your full name"
                />
            </div>

            {/* Date of Birth */}
            <div>
                <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Date of Birth *</label>
                <div className="grid grid-cols-3 gap-3">
                    <select
                        value={dobParts.day}
                        onChange={(e) => handleDateChange('day', e.target.value)}
                        className="input-field"
                    >
                        <option value="">Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        value={dobParts.month}
                        onChange={(e) => handleDateChange('month', e.target.value)}
                        className="input-field"
                    >
                        <option value="">Month</option>
                        {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <select
                        value={dobParts.year}
                        onChange={(e) => handleDateChange('year', e.target.value)}
                        className="input-field"
                    >
                        <option value="">Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Time of Birth */}
            <div>
                <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Tentative Birth Time *</label>
                <div className="flex gap-3">
                    <select
                        value={timeParts.hour}
                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                        className="input-field w-24"
                    >
                        <option value="">Hour</option>
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="self-center text-[#8C7F72]">:</span>
                    <select
                        value={timeParts.minute}
                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                        className="input-field w-24"
                    >
                        <option value="">Min</option>
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex bg-[#2A3442] rounded-lg p-1">
                        {['AM', 'PM'].map((p) => (
                            <button
                                key={p}
                                onClick={() => handleTimeChange('period', p)}
                                className={`px-4 py-2 rounded-md transition-all ${timeParts.period === p
                                    ? 'bg-[#D4AF37] text-[#0F1419] font-bold'
                                    : 'text-[#8C7F72] hover:text-[#C4B8AD]'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Birth Place */}
            <div>
                <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Birth Place *</label>
                <input
                    type="text"
                    value={data.birthPlace}
                    onChange={(e) => updateData({ birthPlace: e.target.value })}
                    className="input-field"
                    placeholder="City, State, Country"
                />
                <p className="text-xs text-[#8C7F72] mt-2">
                    Start typing to search for your city. We will auto-detect coordinates.
                </p>
            </div>

            {/* Gender */}
            <div>
                <label className="block text-sm font-medium text-[#C4B8AD] mb-2">Gender *</label>
                <select
                    value={data.gender}
                    onChange={(e) => updateData({ gender: e.target.value as any })}
                    className="input-field"
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>
        </div>
    );
}
