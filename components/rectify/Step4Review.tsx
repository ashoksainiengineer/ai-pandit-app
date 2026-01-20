'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BirthData, PhysicalTraits, LifeEvent, TimeOffsetConfig } from '@/lib/types';

interface Step4Props {
    data: BirthData;
    events: LifeEvent[];
    traits: PhysicalTraits;
    onSubmit: () => void;
    isSubmitting: boolean;
    onEdit: (step: number) => void;
    offsetConfig?: TimeOffsetConfig;
}

// Animation variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Step4Review({ data, events, traits, onSubmit, isSubmitting, onEdit, offsetConfig }: Step4Props) {
    const [confirmed, setConfirmed] = useState(false);

    // Calculate Accuracy
    const calculateAccuracy = () => {
        let score = 30;
        // Basic event count score
        score += events.filter(e => e.description && e.eventDate).length * 10;
        return Math.min(98, score);
    };
    const accuracy = calculateAccuracy();

    // Estimate processing time based on offset
    const estimatedMinutes = Math.max(2, Math.ceil((offsetConfig?.customMinutes || 60) / 60) + 1);
    const timeRange = `${estimatedMinutes}-${estimatedMinutes + 1}`;

    // Identify missing high-impact categories for dynamic suggestions
    const getSuggestions = () => {
        const categoriesPresent = new Set(events.map(e => e.category));
        const suggestions = [];

        if (!categoriesPresent.has('career')) suggestions.push('Career (First Job, Promotion)');
        if (!categoriesPresent.has('marriage')) suggestions.push('Marriage');
        if (!categoriesPresent.has('family')) suggestions.push('Family Events (Child birth, etc)');
        if (!categoriesPresent.has('travel')) suggestions.push('Major Travel / Relocation');

        return suggestions.slice(0, 3); // Return top 3 missing
    };

    const suggestions = getSuggestions();
    const showLowAccuracyWarning = accuracy < 70; // Threshold for warning

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
            <motion.div variants={itemVariants} className="text-center">
                <p className="text-sm text-[#E8A849] font-medium tracking-widest mb-2">STEP 4 OF 4</p>
                <h1 className="text-3xl font-bold text-[#F5F0EB] mb-2">Review & Confirm</h1>
                <p className="text-[#C4B8AD]">
                    Verify everything before we begin the analysis
                </p>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ACCURACY BANNER */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="bg-[#E8A849]/10 border border-[#E8A849]/30 rounded-xl p-5 text-center"
            >
                <div className="text-4xl font-bold text-[#E8A849] mb-1">{accuracy}%</div>
                <div className="text-sm text-[#C4B8AD]">Expected Accuracy Based on Your Data</div>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* REVIEW CARDS */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Birth Details */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#241F1C] rounded-xl p-6 border border-[#C4B8AD]/10 relative group"
                >
                    <button
                        onClick={() => onEdit(1)}
                        className="absolute top-4 right-4 text-[#E8A849] opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline"
                    >
                        ✏️ Edit
                    </button>
                    <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4 pb-3 border-b border-[#C4B8AD]/10 flex items-center gap-2">
                        <span>📋</span> Birth Details
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Name</span>
                            <span className="text-[#F5F0EB] font-medium">{data.fullName || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Birth Date</span>
                            <span className="text-[#C4B8AD]">{data.dateOfBirth || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Tentative Time</span>
                            <span className="text-[#E8A849] font-mono">{data.tentativeTime || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Birth Place</span>
                            <span className="text-[#C4B8AD] text-right max-w-[200px] truncate">{data.birthPlace || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Gender</span>
                            <span className="text-[#C4B8AD] capitalize">{data.gender || 'Not specified'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Physical Traits */}
                <motion.div
                    variants={itemVariants}
                    className="bg-[#241F1C] rounded-xl p-6 border border-[#C4B8AD]/10 relative group"
                >
                    <button
                        onClick={() => onEdit(2)}
                        className="absolute top-4 right-4 text-[#E8A849] opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline"
                    >
                        ✏️ Edit
                    </button>
                    <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4 pb-3 border-b border-[#C4B8AD]/10 flex items-center gap-2">
                        <span>🧑</span> Physical Traits
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Height</span>
                            <span className="text-[#C4B8AD]">
                                {traits.height?.cm ? `${traits.height.cm} cm` : 'Not provided'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Build</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.build || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Complexion</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.complexion?.replace('_', ' ') || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Face Shape</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.faceShape || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#8C7F72]">Eye Size</span>
                            <span className="text-[#C4B8AD] capitalize">{traits.eyeColor || 'Not provided'}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Life Events */}
            <motion.div
                variants={itemVariants}
                className="bg-[#241F1C] rounded-xl p-6 border border-[#C4B8AD]/10 relative group"
            >
                <button
                    onClick={() => onEdit(3)}
                    className="absolute top-4 right-4 text-[#E8A849] opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:underline"
                >
                    ✏️ Edit
                </button>
                <h3 className="text-lg font-semibold text-[#F5F0EB] mb-4 pb-3 border-b border-[#C4B8AD]/10 flex items-center gap-2">
                    <span>📅</span> Life Events
                    <span className="text-[#E8A849] text-sm font-normal">({events.length} events)</span>
                </h3>

                {events.length === 0 ? (
                    <p className="text-[#8C7F72] text-center py-4">No events added yet</p>
                ) : (
                    <div className="space-y-3">
                        {events.map((e, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#2E2724]">
                                <span className="text-xl">{e.icon || '📅'}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-[#F5F0EB]">{e.eventType}</span>
                                        <span className="text-[#E8A849] text-xs bg-[#E8A849]/10 px-2 py-1 rounded">
                                            {e.datePrecision?.includes('range')
                                                ? `${e.eventDate?.split('-')[0]} → ${e.endDate}`
                                                : e.eventDate?.split('-')[0] || 'No date'}
                                        </span>
                                    </div>
                                    {e.description && (
                                        <p className="text-[#8C7F72] text-sm mt-1 line-clamp-1 italic">&quot;{e.description}&quot;</p>
                                    )}
                                </div>
                                {e.description ? (
                                    <span className="text-[#5CB57B]">✓</span>
                                ) : (
                                    <span className="text-[#D64545] text-xs">!</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* LOW ACCURACY WARNING POPUP */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {showLowAccuracyWarning && !confirmed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#D64545]/10 border border-[#D64545]/30 rounded-xl p-5 mb-6"
                    >
                        <div className="flex gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h4 className="text-[#D64545] font-bold mb-1">Accuracy Check: Low ({accuracy}%)</h4>
                                <p className="text-[#C4B8AD] text-sm mb-3">
                                    We noticed you have limited events. For the highest precision (90%+), we recommend adding:
                                </p>
                                <ul className="list-disc list-inside text-sm text-[#E8A849] space-y-1">
                                    {suggestions.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => onEdit(3)}
                                    className="mt-4 text-xs bg-[#D64545]/20 hover:bg-[#D64545]/30 text-[#F5F0EB] px-3 py-2 rounded-lg transition-colors"
                                >
                                    Go back to Add Events
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* CONFIRMATION & SUBMIT */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants} className="pt-6 border-t border-[#C4B8AD]/10">
                <label className="flex items-start gap-4 cursor-pointer group mb-8">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-[#C4B8AD]/30 bg-[#2E2724] text-[#E8A849] focus:ring-[#E8A849]/50 accent-[#E8A849]"
                    />
                    <span className={`text-sm transition-colors ${confirmed ? 'text-[#F5F0EB]' : 'text-[#C4B8AD] group-hover:text-[#E8A849]'}`}>
                        I confirm that all details provided are accurate to the best of my knowledge.
                        I understand that incorrect data will affect the rectification accuracy.
                    </span>
                </label>

                <motion.button
                    onClick={onSubmit}
                    disabled={isSubmitting || !confirmed}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 font-bold rounded-xl text-lg transition-all ${!confirmed
                        ? 'bg-[#2A3442] text-[#8C7F72] cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#E8A849] to-[#B8860B] text-[#1A1614] hover:shadow-[0_0_30px_rgba(232,168,73,0.3)]'
                        }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Processing...
                        </span>
                    ) : (
                        `🔮 Start Rectification Analysis (Approx. ${timeRange} mins)`
                    )}
                </motion.button>

                <p className="text-center text-xs text-[#8C7F72] mt-4">
                    Takes approximately {timeRange} minutes • AI-Powered Vedic Analysis based on ±{(offsetConfig?.customMinutes || 60) < 60 ? `${offsetConfig?.customMinutes || 60} min` : `${Math.round((offsetConfig?.customMinutes || 60) / 60)} hr`} range
                </p>

                {/* Encryption Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-[#5CB57B] mt-4">
                    <span>🔒</span>
                    <span>End-to-end encrypted</span>
                </div>
            </motion.div>
        </motion.div >
    );
}
