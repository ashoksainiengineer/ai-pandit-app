'use client';

import { useState, useEffect } from 'react';
import { BirthData, TimeOffsetConfig, OffsetPreset } from '@/lib/types';
import BirthPlacePicker from './BirthPlacePicker';

interface Step1Props {
    data: BirthData;
    updateData: (updates: Partial<BirthData>) => void;
    offsetConfig?: TimeOffsetConfig;
    updateOffset?: (config: TimeOffsetConfig) => void;
}

const OFFSET_PRESETS: { value: OffsetPreset | 'custom'; label: string; icon: string; minutes: number; description: string }[] = [
    { value: '30min', label: '±30 min', icon: '🎯', minutes: 30, description: 'Very confident' },
    { value: '1hour', label: '±1 hour', icon: '⏰', minutes: 60, description: 'Pretty sure' },
    { value: '2hours', label: '±2 hours', icon: '🤔', minutes: 120, description: 'Somewhat unsure' },
    { value: '4hours', label: '±4 hours', icon: '💭', minutes: 240, description: 'Morning/Evening known' },
    { value: 'custom', label: 'Custom', icon: '✏️', minutes: 0, description: 'Set your own' },
];

export default function Step1BirthDetails({ data, updateData, offsetConfig, updateOffset }: Step1Props) {
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

    const [selectedOffset, setSelectedOffset] = useState<OffsetPreset | 'custom'>(offsetConfig?.preset || '1hour');
    const [customMinutes, setCustomMinutes] = useState(offsetConfig?.customMinutes || 60);

    useEffect(() => {
        if (data.tentativeTime) {
            const [h, m] = data.tentativeTime.split(':');
            let hour = parseInt(h);
            const period = hour >= 12 ? 'PM' : 'AM';
            if (hour > 12) hour -= 12;
            if (hour === 0) hour = 12;
            setTimeParts({ hour: hour.toString().padStart(2, '0'), minute: m, period });
        }
    }, []);

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

    const handleOffsetChange = (preset: OffsetPreset | 'custom', customMins?: number) => {
        setSelectedOffset(preset);
        if (customMins !== undefined) setCustomMinutes(customMins);
        const presetData = OFFSET_PRESETS.find(p => p.value === preset);
        updateOffset?.({
            preset: preset === 'custom' ? undefined : preset as OffsetPreset,
            customMinutes: preset === 'custom' ? (customMins || customMinutes) : presetData?.minutes,
            description: presetData?.description || 'Custom offset'
        });
    };

    const months = [
        { val: '01', label: '🌸 January' }, { val: '02', label: '❄️ February' },
        { val: '03', label: '🌱 March' }, { val: '04', label: '🌷 April' },
        { val: '05', label: '🌺 May' }, { val: '06', label: '☀️ June' },
        { val: '07', label: '🌴 July' }, { val: '08', label: '🌻 August' },
        { val: '09', label: '🍂 September' }, { val: '10', label: '🎃 October' },
        { val: '11', label: '🍁 November' }, { val: '12', label: '🎄 December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div className="animate-fade-in-up space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">✨ Your Birth Details</h2>
                <p className="text-[#C4B8AD] max-w-xl mx-auto">
                    🎯 The more accurate your details, the more precise your results will be!
                </p>
            </div>

            {/* Name */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
                    <span className="text-xl">👤</span> Full Name
                </label>
                <input
                    type="text"
                    value={data.fullName}
                    onChange={(e) => updateData({ fullName: e.target.value })}
                    className="input-field text-lg"
                    placeholder="Enter your full name ✍️"
                />
            </div>

            {/* Date of Birth */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">🎂</span> Date of Birth
                </label>
                <div className="grid grid-cols-3 gap-3">
                    <select value={dobParts.day} onChange={(e) => handleDateChange('day', e.target.value)} className="input-field">
                        <option value="">📅 Day</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select value={dobParts.month} onChange={(e) => handleDateChange('month', e.target.value)} className="input-field">
                        <option value="">🗓️ Month</option>
                        {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <select value={dobParts.year} onChange={(e) => handleDateChange('year', e.target.value)} className="input-field">
                        <option value="">📆 Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Time of Birth */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">⏰</span> Tentative Birth Time
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                    <select value={timeParts.hour} onChange={(e) => handleTimeChange('hour', e.target.value)} className="input-field w-28">
                        <option value="">🕐 Hour</option>
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-2xl text-[#D4AF37] font-bold">:</span>
                    <select value={timeParts.minute} onChange={(e) => handleTimeChange('minute', e.target.value)} className="input-field w-28">
                        <option value="">⏱️ Min</option>
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex bg-[#2A3442] rounded-xl p-1 border border-[#D4AF37]/20">
                        {['AM', 'PM'].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handleTimeChange('period', p)}
                                className={`px-5 py-2 rounded-lg transition-all font-bold ${timeParts.period === p
                                        ? 'bg-[#D4AF37] text-[#0F1419] shadow-lg'
                                        : 'text-[#8C7F72] hover:text-[#C4B8AD]'
                                    }`}
                            >
                                {p === 'AM' ? '🌅 AM' : '🌙 PM'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Time Offset Selector */}
            <div className="glass-card p-6 border border-[#8B5CF6]/30">
                <label className="block text-sm font-semibold text-[#8B5CF6] mb-4 flex items-center gap-2">
                    <span className="text-xl">🎯</span> Time Accuracy Level
                </label>
                <p className="text-sm text-[#8C7F72] mb-4">
                    📊 How confident are you about your birth time? This helps us determine the search range.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {OFFSET_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => handleOffsetChange(preset.value)}
                            className={`p-4 rounded-xl text-center transition-all border-2 ${selectedOffset === preset.value
                                    ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] scale-105'
                                    : 'bg-[#2A3442] border-transparent hover:border-[#8B5CF6]/30'
                                }`}
                        >
                            <div className="text-2xl mb-1">{preset.icon}</div>
                            <div className="text-sm font-semibold text-[#F5F0EB]">{preset.label}</div>
                            <div className="text-[10px] text-[#8C7F72]">{preset.description}</div>
                        </button>
                    ))}
                </div>
                {selectedOffset === 'custom' && (
                    <div className="mt-4 flex items-center gap-3 animate-fade-in">
                        <span className="text-[#C4B8AD]">±</span>
                        <input type="number" value={customMinutes} onChange={(e) => handleOffsetChange('custom', parseInt(e.target.value) || 60)} className="input-field w-24" min="15" max="720" />
                        <span className="text-[#C4B8AD]">minutes</span>
                    </div>
                )}
                <div className="mt-4 p-3 bg-[#2A3442]/50 rounded-lg flex items-center gap-3">
                    <span className="text-lg">💡</span>
                    <span className="text-sm text-[#C4B8AD]">
                        We'll search within <span className="text-[#8B5CF6] font-bold">
                            ±{selectedOffset === 'custom' ? customMinutes : OFFSET_PRESETS.find(p => p.value === selectedOffset)?.minutes}
                        </span> minutes of your given time
                    </span>
                </div>
            </div>

            {/* Birth Place */}
            <BirthPlacePicker birthPlace={data.birthPlace} latitude={data.latitude} longitude={data.longitude} timezone={data.timezone} onUpdate={(updates) => updateData(updates)} />

            {/* Gender */}
            <div className="glass-card p-6">
                <label className="block text-sm font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                    <span className="text-xl">⚧️</span> Gender
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { value: 'male', label: 'Male', icon: '👨' },
                        { value: 'female', label: 'Female', icon: '👩' },
                        { value: 'other', label: 'Other', icon: '🧑' },
                    ].map((g) => (
                        <button
                            key={g.value}
                            type="button"
                            onClick={() => updateData({ gender: g.value as any })}
                            className={`p-5 rounded-xl text-center transition-all border-2 ${data.gender === g.value
                                    ? 'bg-[#D4AF37]/20 border-[#D4AF37] scale-105'
                                    : 'bg-[#2A3442] border-transparent hover:border-[#D4AF37]/30'
                                }`}
                        >
                            <div className="text-4xl mb-2">{g.icon}</div>
                            <div className="text-sm font-medium text-[#F5F0EB]">{g.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Completion */}
            {data.fullName && data.dateOfBirth && data.tentativeTime && data.birthPlace && data.gender && (
                <div className="p-4 bg-[#2D7A5C]/10 border border-[#2D7A5C]/30 rounded-xl animate-fade-in">
                    <p className="text-[#2D7A5C] flex items-center gap-3 font-medium">
                        <span className="text-2xl">🎉</span>
                        All basic details complete! You're ready for the next step. →
                    </p>
                </div>
            )}
        </div>
    );
}
