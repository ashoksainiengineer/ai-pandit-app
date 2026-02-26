'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PhysicalTraits } from '@/lib/types';
import { Brain, User, Zap, Sparkles, HelpCircle, Info, Eye, ScanFace, Activity, Fingerprint, Ruler } from 'lucide-react';
import { useState } from 'react';

interface Step2Props {
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// SAMUDRIKA SHASTRA DATASETS (GOD TIER)
// ═════════════════════════════════════════════════════════════════════════════

const TABS = [
    { id: 'face', label: 'Mukha (Face)', icon: ScanFace },
    { id: 'structure', label: 'Deha (Structure)', icon: Activity },
    { id: 'details', label: 'Lakshan (Details)', icon: Fingerprint },
];

const EYE_SHAPES = [
    { value: 'almond', label: 'Almond', emoji: '👁️', signs: 'Venus/Mercury (Artist)', guide: 'Tapered ends, classic shape.' },
    { value: 'round', label: 'Round/Large', emoji: '👀', signs: 'Moon/Jupiter (Empath)', guide: 'Open, innocent, watery gaze.' },
    { value: 'deep_set', label: 'Deep Set', emoji: '🕶️', signs: 'Saturn/Scorpio (Observer)', guide: 'Brow bone prominent, eyes shadown.' },
    { value: 'hooded', label: 'Hooded', emoji: '😑', signs: 'Mars/Lion (Intense)', guide: 'Upper lid covers crease.' },
];

const FOREHEAD_TYPES = [
    { value: 'high', label: 'High/Broad', emoji: '🧠', signs: 'Sun/Jupiter (Intellect)', guide: 'Sign of wisdom and leadership.' },
    { value: 'narrow', label: 'Narrow', emoji: '🤏', signs: 'Saturn/Mercury (Practical)', guide: 'Focused, grounded nature.' },
    { value: 'rounded', label: 'Rounded', emoji: '🌕', signs: 'Moon (Creative)', guide: 'Imaginative and emotional.' },
];

const JAW_TYPES = [
    { value: 'strong', label: 'Strong/Square', emoji: '⬛', signs: 'Mars (Warrior)', guide: 'Willpower, determination.' },
    { value: 'pointed', label: 'Pointed', emoji: '🔻', signs: 'Mercury (Analyst)', guide: 'Quick wit, sharp speech.' },
    { value: 'round', label: 'Soft/Round', emoji: '⚪', signs: 'Venus (Harmony)', guide: 'Gentle nature, peace lover.' },
];

const HEIGHT_OPTIONS = [
    { value: 'short', label: 'Short', emoji: '🧒', signs: 'Water/Earth Signs', guide: '< 5\'4" (M) | < 5\'1" (F)' },
    { value: 'medium', label: 'Average', emoji: '🧑', signs: 'Variable/Mixed', guide: 'Standard for region.' },
    { value: 'tall', label: 'Tall', emoji: '🧍', signs: 'Fire/Air Signs', guide: '> 5\'11" (M) | > 5\'7" (F)' },
];

const FRAME_OPTIONS = [
    { value: 'vata', label: 'Vata (Slim)', emoji: '🦴', signs: 'Saturn/Mercury', guide: 'Thin frame, visible joints.' },
    { value: 'pitta', label: 'Pitta (Athletic)', emoji: '🔥', signs: 'Mars/Sun', guide: 'Medium build, muscular.' },
    { value: 'kapha', label: 'Kapha (Solid)', emoji: '🐘', signs: 'Jupiter/Moon', guide: 'Broad, heavy, endurance.' },
];

const SHOULDER_OPTIONS = [
    { value: 'broad', label: 'Broad', emoji: '💪', signs: 'Mars (Action)', guide: 'Wider than hips.' },
    { value: 'sloping', label: 'Sloping', emoji: '📉', signs: 'Mercury (Fluid)', guide: 'Gentle slope from neck.' },
    { value: 'narrow', label: 'Narrow', emoji: '🥢', signs: 'Saturn (Restriction)', guide: 'Compact frame.' },
];

const HAIR_OPTIONS = [
    { value: 'straight', label: 'Straight', emoji: '⬇️', signs: 'Saturn', guide: 'Falls flat/straight.' },
    { value: 'wavy', label: 'Wavy', emoji: '〰️', signs: 'Venus/Moon', guide: 'Soft curls/S-waves.' },
    { value: 'curly', label: 'Curly', emoji: '🌀', signs: 'Rahu/Mars', guide: 'Tight curls/coils.' },
    { value: 'thin', label: 'Fine/Thin', emoji: '🌿', signs: 'Sun (Heat)', guide: 'Silky or receding.' },
];


export default function Step2PhysicalTraits({ physicalTraits, updateTraits }: Step2Props) {
    const [activeTab, setActiveTab] = useState('face');
    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    // Helper to get helper text color
    const getSignColor = (signs: string) => {
        if (signs.includes('Mars') || signs.includes('Sun')) return 'text-red-600';
        if (signs.includes('Venus') || signs.includes('Moon')) return 'text-emerald-600';
        if (signs.includes('Saturn')) return 'text-blue-600';
        return 'text-[#6B9AC4]';
    }

    const TraitSelector = ({ label, icon: Icon, options, value, onChange, groupId, description, grid = 3 }: any) => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#78611D]/10 border border-[#78611D]/20">
                        <Icon className="w-5 h-5 text-[#78611D]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#1A1612] uppercase tracking-wide">{label}</h3>
                        {description && <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">{description}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setActiveHelp(activeHelp === groupId ? null : groupId)}
                    className={`p-2 rounded-full transition-all ${activeHelp === groupId ? 'bg-[#78611D] text-white' : 'hover:bg-[#F5EFE7] text-[#7A756F]'}`}
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>

            {/* Context Help */}
            <AnimatePresence>
                {activeHelp === groupId && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#6B9AC4]/10 border border-[#6B9AC4]/20 rounded-xl p-4 mb-4 text-xs leading-relaxed text-[#4A453F] flex gap-3">
                            <Info className="w-4 h-4 text-[#6B9AC4] shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-[#6B9AC4]">Astrological Logic:</strong> This trait helps the AI differentiate between planetary influences on your Ascendant.
                                <br />
                                <span className="italic opacity-70">Example: A &quot;Mars&quot; jawline rules out soft ascendants like Pisces.</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`grid gap-3 ${grid === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                {options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${value === opt.value
                            ? 'bg-[#78611D]/10 border-[#78611D] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                            : 'bg-white border-[#F0E8DE] hover:border-[#78611D]/50'
                            }`}
                    >
                        {value === opt.value && (
                            <div className="absolute top-0 right-0 p-2">
                                <Sparkles className="w-3 h-3 text-[#78611D] animate-pulse" />
                            </div>
                        )}
                        <div className="text-2xl mb-2">{opt.emoji}</div>
                        <div className="font-bold text-[#1A1612] text-sm mb-1">{opt.label}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${getSignColor(opt.signs)}`}>
                            {opt.signs}
                        </div>
                        <div className="text-[10px] text-[#7A756F] italic leading-tight group-hover:text-[#4A453F] transition-colors">
                            &quot;{opt.guide}&quot;
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#78611D]/10 border border-[#78611D]/20 text-[#78611D] text-xs font-bold uppercase tracking-widest mb-4">
                    <ScanFace className="w-3 h-3" />
                    Samudrika Shastra 2.0
                </div>
                <h1 className="text-3xl font-black text-[#1A1612] mb-2">Biometric Verification</h1>
                <p className="text-[#7A756F] text-sm max-w-xl mx-auto">
                    Your physical form is a map of your karma. Providing accurate details helps us fingerprint your true Ascendant.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-[#F5EFE7] border border-[#F0E8DE] rounded-xl mb-8 sticky top-4 z-20 shadow-xl backdrop-blur-xl">
                {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isActive
                                ? 'bg-[#78611D] text-white shadow-lg'
                                : 'text-[#7A756F] hover:text-[#1A1612] hover:bg-white'
                                }`}
                        >
                            <TabIcon className="w-4 h-4" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'face' && (
                        <motion.div
                            key="face"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-10"
                        >
                            <TraitSelector
                                label="Netra (The Gaze)"
                                icon={Eye}
                                groupId="eyes"
                                description="Window to the Moon Sign"
                                options={EYE_SHAPES}
                                value={physicalTraits.eyeShape || 'almond'}
                                onChange={(val: any) => updateTraits({ eyeShape: val })}
                                grid={4}
                            />
                            <TraitSelector
                                label="Lalat (Forehead)"
                                icon={Brain}
                                groupId="forehead"
                                description="Seat of Intelligence (Mercury/Jupiter)"
                                options={FOREHEAD_TYPES}
                                value={physicalTraits.foreheadHeight || 'high'}
                                onChange={(val: any) => updateTraits({ foreheadHeight: val })}
                            />
                            <TraitSelector
                                label="Hanu (Jawline)"
                                icon={ScanFace}
                                groupId="jaw"
                                description="Determine Willpower (Mars Strength)"
                                options={JAW_TYPES}
                                value={physicalTraits.jawLine || 'defined'}
                                onChange={(val: any) => updateTraits({ jawLine: val })}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'structure' && (
                        <motion.div
                            key="structure"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-10"
                        >
                            <TraitSelector
                                label="Sharira (Constitution)"
                                icon={Activity}
                                groupId="frame"
                                description="Overall Elemental Balance"
                                options={FRAME_OPTIONS}
                                value={physicalTraits.prakriti || 'pitta'}
                                onChange={(val: any) => updateTraits({ prakriti: val })}
                            />
                            <TraitSelector
                                label="Deha (Height)"
                                icon={Ruler}
                                groupId="height"
                                description="Vertical Aspect"
                                options={HEIGHT_OPTIONS}
                                value={(() => {
                                    const height = physicalTraits.height;
                                    const cm = typeof height === 'number' ? height : (typeof height === 'object' && height !== null ? height.cm : 168);
                                    return (cm || 168) < 162 ? 'short' : (cm || 168) > 178 ? 'tall' : 'medium';
                                })()}
                                onChange={(val: any) => {
                                    const cm = val === 'short' ? 155 : val === 'tall' ? 180 : 168;
                                    updateTraits({ height: { cm, feet: 5, inches: 6 } });
                                }}
                            />
                            <TraitSelector
                                label="Skandha (Shoulders)"
                                icon={User}
                                groupId="shoulders"
                                description="Planetary Strength Indicator"
                                options={SHOULDER_OPTIONS}
                                value={physicalTraits.shoulderWidth || 'average'}
                                onChange={(val: any) => updateTraits({ shoulderWidth: val })}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-10"
                        >
                            <TraitSelector
                                label="Kesha (Hair Texture)"
                                icon={Sparkles}
                                groupId="hair"
                                description="Influence of Saturn/Venus"
                                options={HAIR_OPTIONS}
                                value={physicalTraits.hairType || 'straight'}
                                onChange={(val: any) => updateTraits({ hairType: val })}
                                grid={4}
                            />

                            {/* Special Marks */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#78611D]/10 border border-[#78611D]/20">
                                        <Fingerprint className="w-5 h-5 text-[#78611D]" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-[#1A1612] uppercase tracking-wide">Vishesha Lakshan</h3>
                                        <p className="text-[10px] text-[#7A756F] uppercase tracking-wider">Unique Distinguishing Marks</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={physicalTraits.specialFeatures || ''}
                                        onChange={(e) => updateTraits({ specialFeatures: e.target.value })}
                                        placeholder="Describe scars, moles (tilaks), or unique physical features..."
                                        className="w-full h-32 bg-white border border-[#F0E8DE] rounded-xl p-4 text-sm text-[#1A1612] placeholder-[#7A756F] focus:border-[#78611D] focus:ring-1 focus:ring-[#78611D] outline-none transition-all resize-none"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-[#7A756F] flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-[#78611D]" />
                                        Encrypted
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Validation Badge */}
            <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#184131]/10 border border-[#184131]/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#184131]">
                        AI-PANDIT LOGIC SYNC: ACTIVE
                    </span>
                </div>
            </div>
        </div>
    );
}
