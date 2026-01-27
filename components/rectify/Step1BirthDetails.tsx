'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BirthData, TimeOffsetConfig, OffsetPreset, SpouseData } from '@/lib/types';
import BirthPlacePicker from './BirthPlacePicker';

interface Step1Props {
    data: BirthData;
    updateData: (updates: Partial<BirthData>) => void;
    offsetConfig?: TimeOffsetConfig;
    updateOffset?: (config: TimeOffsetConfig) => void;
    spouseData?: SpouseData;
    updateSpouse?: (updates: Partial<SpouseData>) => void;
}

const OFFSET_PRESETS: { value: OffsetPreset; label: string; minutes: number }[] = [
    { value: '30min', label: '±30 min', minutes: 30 },
    { value: '1hour', label: '±1 hour', minutes: 60 },
    { value: '2hours', label: '±2 hours', minutes: 120 },
    { value: '4hours', label: '±4 hours', minutes: 240 },
    { value: 'custom', label: 'Custom', minutes: 0 },
];

// Item animation variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Step1BirthDetails({ data, updateData, offsetConfig, updateOffset, spouseData, updateSpouse }: Step1Props) {
    const [showSpouse, setShowSpouse] = useState(false);

    const [dobParts, setDobParts] = useState({
        day: data.dateOfBirth?.split('-')[2] || '',
        month: data.dateOfBirth?.split('-')[1] || '',
        year: data.dateOfBirth?.split('-')[0] || ''
    });

    const [timeParts, setTimeParts] = useState({
        hour: '',
        minute: '',
        period: 'AM'
    });

    const [selectedOffset, setSelectedOffset] = useState<OffsetPreset>(offsetConfig?.preset || '1hour');
    const [customOffset, setCustomOffset] = useState<number>(offsetConfig?.customMinutes ?? 0);

    const [spouseDobParts, setSpouseDobParts] = useState({
        day: spouseData?.dateOfBirth?.split('-')[2] || '',
        month: spouseData?.dateOfBirth?.split('-')[1] || '',
        year: spouseData?.dateOfBirth?.split('-')[0] || ''
    });

    const [spouseTimeParts, setSpouseTimeParts] = useState({
        hour: '',
        minute: '',
        period: 'AM'
    });

    useEffect(() => {
        if (spouseData?.birthTime) {
            const [h, m] = spouseData.birthTime.split(':');
            let hour = parseInt(h);
            const period = hour >= 12 ? 'PM' : 'AM';
            if (hour > 12) hour -= 12;
            if (hour === 0) hour = 12;
            setSpouseTimeParts({ hour: hour.toString().padStart(2, '0'), minute: m, period });
        }
    }, []);

    const handleSpouseDateChange = (part: 'day' | 'month' | 'year', value: string) => {
        const newParts = { ...spouseDobParts, [part]: value };
        setSpouseDobParts(newParts);
        if (newParts.year && newParts.month && newParts.day) {
            updateSpouse?.({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
        }
    };

    const handleSpouseTimeChange = (part: 'hour' | 'minute' | 'period', value: string) => {
        const newParts = { ...spouseTimeParts, [part]: value };
        setSpouseTimeParts(newParts);
        if (newParts.hour && newParts.minute) {
            let hour = parseInt(newParts.hour);
            if (newParts.period === 'PM' && hour !== 12) hour += 12;
            if (newParts.period === 'AM' && hour === 12) hour = 0;
            updateSpouse?.({ birthTime: `${hour.toString().padStart(2, '0')}:${newParts.minute}:00` });
        }
    };

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
        setDobParts(newParts);
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

    const handleOffsetChange = (preset: OffsetPreset) => {
        setSelectedOffset(preset);
        if (preset !== 'custom') {
            const presetData = OFFSET_PRESETS.find(p => p.value === preset);
            updateOffset?.({ preset, customMinutes: presetData?.minutes || 60, description: presetData?.label || '' });
        } else {
            updateOffset?.({ preset: 'custom', customMinutes: customOffset, description: `±${customOffset} min` });
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
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                <p className="text-sm text-[#E8A849] font-medium tracking-widest mb-2">STEP 1 OF 4</p>
                <h1 className="text-3xl font-bold text-[#F5F0EB]">Birth Details</h1>
                <p className="text-[#C4B8AD] mt-2 text-sm">
                    Provide your birth information for accurate time rectification
                </p>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* FORM CARD */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="bg-[#241F1C] rounded-xl p-8 border border-[#C4B8AD]/10 space-y-8"
            >
                {/* Full Name */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#E8A849]">
                        👤 Full Name <span className="text-[#D64545]">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.fullName}
                        onChange={(e) => updateData({ fullName: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full h-[52px] px-5 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] placeholder-[#8C7F72] focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                    />
                </div>

                {/* Divider */}
                <div className="border-t border-[#C4B8AD]/10" />

                {/* Date of Birth */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#E8A849]">
                        📅 Date of Birth <span className="text-[#D64545]">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        <select
                            value={dobParts.day}
                            onChange={(e) => handleDateChange('day', e.target.value)}
                            className="h-[52px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                        >
                            <option value="">Day</option>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                            value={dobParts.month}
                            onChange={(e) => handleDateChange('month', e.target.value)}
                            className="h-[52px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                        >
                            <option value="">Month</option>
                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                        </select>
                        <select
                            value={dobParts.year}
                            onChange={(e) => handleDateChange('year', e.target.value)}
                            className="h-[52px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                        >
                            <option value="">Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#C4B8AD]/10" />

                {/* Time of Birth */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#E8A849]">
                        🕐 Approximate Birth Time <span className="text-[#D64545]">*</span>
                    </label>
                    <p className="text-xs text-[#8C7F72]">
                        Don&apos;t worry if it&apos;s not exact - that&apos;s what we&apos;re here to rectify!
                    </p>
                    <div className="flex items-center gap-3">
                        <select
                            value={timeParts.hour}
                            onChange={(e) => handleTimeChange('hour', e.target.value)}
                            className="h-[52px] w-24 px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                        >
                            <option value="">HH</option>
                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-2xl text-[#E8A849] font-bold">:</span>
                        <select
                            value={timeParts.minute}
                            onChange={(e) => handleTimeChange('minute', e.target.value)}
                            className="h-[52px] w-24 px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                        >
                            <option value="">MM</option>
                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex bg-[#2E2724] rounded-lg overflow-hidden border border-[#C4B8AD]/20">
                            {['AM', 'PM'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleTimeChange('period', p)}
                                    className={`h-[52px] px-5 font-medium transition-all ${timeParts.period === p
                                        ? 'bg-[#E8A849] text-[#1A1614]'
                                        : 'text-[#8C7F72] hover:text-[#F5F0EB]'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    {data.timezone !== undefined && (
                        <p className="text-xs text-[#6B9AC4] mt-2 flex items-center gap-2">
                            <span>🌍 Timezone:</span>
                            <span className="font-mono">UTC{data.timezone >= 0 ? '+' : ''}{data.timezone}</span>
                            <span className="text-[#8C7F72]">(based on Birth Place)</span>
                        </p>
                    )}
                </div>


                {/* Divider */}
                <div className="border-t border-[#C4B8AD]/10" />

                {/* Time Accuracy */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#6B9AC4]">
                        ⏱️ How accurate is this time?
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                        {OFFSET_PRESETS.map((preset) => (
                            <motion.button
                                key={preset.value}
                                type="button"
                                onClick={() => handleOffsetChange(preset.value)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`py-3 px-2 rounded-lg text-sm font-medium transition-all border-2 ${selectedOffset === preset.value
                                    ? 'bg-[#6B9AC4]/20 border-[#6B9AC4] text-[#6B9AC4]'
                                    : 'bg-[#2E2724] border-transparent text-[#C4B8AD] hover:border-[#6B9AC4]/30'
                                    }`}
                            >
                                {preset.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Custom Offset Input */}
                    {selectedOffset === 'custom' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center gap-3 pt-3"
                        >
                            <span className="text-[#C4B8AD] text-sm">±</span>
                            <input
                                type="number"
                                min="1"
                                max="720"
                                value={customOffset}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 60;
                                    setCustomOffset(val);
                                    updateOffset?.({ preset: 'custom', customMinutes: val, description: `±${val} min` });
                                }}
                                className="w-24 h-[44px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] text-center focus:border-[#6B9AC4] outline-none"
                            />
                            <span className="text-[#C4B8AD] text-sm">minutes</span>
                        </motion.div>
                    )}
                </div>

                {/* Vedic Guidance Alert */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={selectedOffset + (selectedOffset === 'custom' ? customOffset : '')}
                    className="p-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 space-y-2"
                >
                    <div className="flex items-center gap-2 text-[#D4AF37]">
                        <span className="text-lg">📜</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Astrological Guidance</span>
                    </div>
                    <p className="text-xs text-[#C4B8AD] leading-relaxed">
                        {selectedOffset === '30min' && "Ideal for high-precision records. 3-4 major life events (Marriage, Job, Travel) are typically sufficient for seconds-level locking."}
                        {selectedOffset === '1hour' && "Moderate window. 5-7 events recommended, including family-related dates and significant career transitions."}
                        {selectedOffset === '2hours' && "Significant uncertainty. 7-10 events + accurately described Physical Traits (height/build) are critical to resolve possible Sign & Nakshatra changes."}
                        {selectedOffset === '4hours' && "Large window. Requires 10+ events spanning decades + Spouse's birth data (if available) + Detailed physical markers for Vedic Shuddhi verification."}
                        {selectedOffset === 'custom' && customOffset > 240 && "Extreme uncertainty (Full Day Scan). Full life history (15+ events) + Major medical/accident dates + Complete physical profile mandatory for a 99% accurate resolve."}
                        {selectedOffset === 'custom' && customOffset <= 240 && "Custom window. Ensure you provide enough Life Events (5-10) to correlate with the chosen time range for accurate dasha alignment."}
                    </p>
                    <div className="flex gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[10px] text-[#8C7F72]">Precision: {selectedOffset === '30min' ? 'Elite' : (selectedOffset === '1hour' || selectedOffset === '2hours') ? 'High' : 'Complex'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div>
                            <span className="text-[10px] text-[#8C7F72]">Complexity: {selectedOffset === '30min' ? 'Low' : (selectedOffset === '1hour' || selectedOffset === '2hours') ? 'Medium' : 'High'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Divider */}
                <div className="border-t border-[#C4B8AD]/10" />

                {/* Birth Place */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#E8A849]">
                        📍 Birth Place <span className="text-[#D64545]">*</span>
                    </label>
                    <BirthPlacePicker
                        birthPlace={data.birthPlace}
                        latitude={data.latitude}
                        longitude={data.longitude}
                        timezone={data.timezone}
                        onUpdate={(updates) => updateData(updates)}
                    />
                </div>

                {/* Divider */}
                <div className="border-t border-[#C4B8AD]/10" />

                {/* Spouse Details (Optional) */}
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => setShowSpouse(!showSpouse)}
                        className="flex items-center justify-between w-full p-4 bg-[#2A3442]/30 border border-[#D4AF37]/20 rounded-xl hover:bg-[#D4AF37]/5 transition-all text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">👩‍❤️‍👨</span>
                            <div>
                                <h4 className="text-sm font-bold text-[#F5F0EB]">Spouse Details (Optional)</h4>
                                <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">Adds +15% precision for relationship-driven sub-charts</p>
                            </div>
                        </div>
                        <span className={`text-[#D4AF37] transition-transform ${showSpouse ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    <AnimatePresence>
                        {showSpouse && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-6 pt-2 px-2"
                            >
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-[#E8A849]">📅 Spouse Date of Birth</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <select
                                            value={spouseDobParts.day}
                                            onChange={(e) => handleSpouseDateChange('day', e.target.value)}
                                            className="h-[52px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none"
                                        >
                                            <option value="">Day</option>
                                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <select
                                            value={spouseDobParts.month}
                                            onChange={(e) => handleSpouseDateChange('month', e.target.value)}
                                            className="h-[52px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none"
                                        >
                                            <option value="">Month</option>
                                            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                                        </select>
                                        <select
                                            value={spouseDobParts.year}
                                            onChange={(e) => handleSpouseDateChange('year', e.target.value)}
                                            className="h-[52px] px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none"
                                        >
                                            <option value="">Year</option>
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-[#E8A849]">🕐 Spouse Birth Time</label>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={spouseTimeParts.hour}
                                            onChange={(e) => handleSpouseTimeChange('hour', e.target.value)}
                                            className="h-[52px] w-24 px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none"
                                        >
                                            <option value="">HH</option>
                                            {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                        <span className="text-2xl text-[#E8A849] font-bold">:</span>
                                        <select
                                            value={spouseTimeParts.minute}
                                            onChange={(e) => handleSpouseTimeChange('minute', e.target.value)}
                                            className="h-[52px] w-24 px-4 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] focus:border-[#E8A849] outline-none"
                                        >
                                            <option value="">MM</option>
                                            {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <div className="flex bg-[#2E2724] rounded-lg overflow-hidden border border-[#C4B8AD]/20">
                                            {['AM', 'PM'].map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => handleSpouseTimeChange('period', p)}
                                                    className={`h-[52px] px-5 font-medium transition-all ${spouseTimeParts.period === p
                                                        ? 'bg-[#E8A849] text-[#1A1614]'
                                                        : 'text-[#8C7F72] hover:text-[#F5F0EB]'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-[#E8A849]">📍 Spouse Birth Place</label>
                                    <BirthPlacePicker
                                        birthPlace={spouseData?.birthPlace || ''}
                                        latitude={spouseData?.latitude || 0}
                                        longitude={spouseData?.longitude || 0}
                                        timezone={parseFloat(spouseData?.timezone?.toString() || '5.5')}
                                        onUpdate={(updates) => updateSpouse?.(updates)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="border-t border-[#C4B8AD]/10" />

                {/* Gender */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#E8A849]">
                        👤 Gender
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: 'male', label: 'Male', icon: '👨' },
                            { value: 'female', label: 'Female', icon: '👩' },
                            { value: 'other', label: 'Other', icon: '🧑' },
                        ].map((g) => (
                            <motion.button
                                key={g.value}
                                type="button"
                                onClick={() => updateData({ gender: g.value as any })}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-5 rounded-xl text-center transition-all border-2 ${data.gender === g.value
                                    ? 'bg-[#E8A849]/20 border-[#E8A849]'
                                    : 'bg-[#2E2724] border-transparent hover:border-[#E8A849]/30'
                                    }`}
                            >
                                <span className="text-3xl">{g.icon}</span>
                                <div className="text-sm text-[#F5F0EB] mt-2 font-medium">{g.label}</div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ENCRYPTION BADGE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-2 text-sm text-[#5CB57B]"
            >
                <span>🔒</span>
                <span>Your data is end-to-end encrypted</span>
            </motion.div>
        </motion.div >
    );
}
