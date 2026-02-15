/**
 * Step3PhysicalTraits - Samudrika Shastra Biometric Verification
 * Part of the God-Tier 5-Step Rectification Flow
 * Sacred Ivory Light Theme - Production Grade
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForensicTraits } from '@/lib/types';
import {
    Brain,
    User,
    Activity,
    Eye,
    ScanFace,
    Fingerprint,
    Ruler,
    Sparkles,
    CheckCircle2,
    Wind
} from 'lucide-react';

interface Step3Props {
    physicalTraits: ForensicTraits['physical'];
    updateTraits: (updates: Partial<ForensicTraits['physical']>) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// SAMUDRIKA SHASTRA DATASETS (UNIFORM THEME)
// ═════════════════════════════════════════════════════════════════════════════

const TABS = [
    { id: 'face', label: 'Mukha (Face)', icon: ScanFace },
    { id: 'structure', label: 'Deha (Structure)', icon: Activity },
    { id: 'details', label: 'Lakshan (Details)', icon: Fingerprint },
];

const EYE_SHAPES = [
    { value: 'almond', label: 'Almond', emoji: '👁️', guide: 'Tapered ends, balanced.' },
    { value: 'round', label: 'Round/Large', emoji: '👀', guide: 'Open, expressive gaze.' },
    { value: 'deep_set', label: 'Deep Set', emoji: '🕶️', guide: 'Prominent brow, shadowed.' },
    { value: 'hooded', label: 'Hooded', emoji: '😑', guide: 'Upper lid covers crease.' },
    { value: 'average', label: 'Average/Balanced', emoji: '🧿', guide: 'Standard shape, no extreme features.' },
];

const FOREHEAD_TYPES = [
    { value: 'high', label: 'High/Broad', emoji: '🧠', guide: 'Logical and expansive.' },
    { value: 'narrow', label: 'Narrow', emoji: '🤏', guide: 'Focused and practical.' },
    { value: 'rounded', label: 'Rounded', emoji: '🌕', guide: 'Imaginative and soft.' },
    { value: 'average', label: 'Average', emoji: '👤', guide: 'Standard width and height.' },
];

const JAW_TYPES = [
    { value: 'strong', label: 'Strong/Square', emoji: '⬛', guide: 'Willpower, determination.' },
    { value: 'pointed', label: 'Pointed', emoji: '🔻', guide: 'Quick wit, sharp speech.' },
    { value: 'round', label: 'Soft/Round', emoji: '⚪', guide: 'Gentle, peace-loving.' },
    { value: 'average', label: 'Average', emoji: '🧔', guide: 'Slightly defined, balanced.' },
];

const HEIGHT_OPTIONS = [
    { value: 'short', label: 'Short', emoji: '🧒', guide: 'Below average stature.' },
    { value: 'medium', label: 'Average', emoji: '🧑', guide: 'Standard height.' },
    { value: 'tall', label: 'Tall', emoji: '🧍', guide: 'Noticeably tall.' },
];

const BUILD_OPTIONS = [
    { value: 'slim', label: 'Slim (Vata)', emoji: '🦴', guide: 'Thin, light-boned.' },
    { value: 'athletic', label: 'Athletic (Pitta)', emoji: '🔥', guide: 'Medium, muscular build.' },
    { value: 'heavy', label: 'Solid (Kapha)', emoji: '🐘', guide: 'Broad, heavy frame.' },
];

const NOSE_TYPES = [
    { value: 'sharp', label: 'Sharp/Straight', emoji: '👃', guide: 'Keen intelligence, focused.' },
    { value: 'aquiline', label: 'Hooked/Aquiline', emoji: '🦅', guide: 'Strategic thinking, ambitious.' },
    { value: 'blunt', label: 'Blunt/Round', emoji: '⏺️', guide: 'Practical, stable, earthy.' },
    { value: 'small', label: 'Small/Upturned', emoji: '🔼', guide: 'Curious, cheerful, youthful.' },
];

const HAIR_OPTIONS = [
    { value: 'straight', label: 'Straight', emoji: '⬇️', guide: 'Flat or smooth texture.' },
    { value: 'wavy', label: 'Wavy', emoji: '〰️', guide: 'Soft S-shaped waves.' },
    { value: 'curly', label: 'Curly', emoji: '🌀', guide: 'Tight coils or curls.' },
    { value: 'thick', label: 'Thick', emoji: '🌿', guide: 'Dense and full volume.' },
    { value: 'unknown', label: 'Not Sure', emoji: '🤷', guide: 'Variable or mixed texture.' },
];

export default function Step3PhysicalTraits({ physicalTraits, updateTraits }: Step3Props) {
    const [activeTab, setActiveTab] = useState('face');

    // Helper to calculate height category from CM if available
    const currentHeightCategory = useMemo(() => {
        const cm = physicalTraits.height?.cm || 168;
        if (cm < 162) return 'short';
        if (cm > 178) return 'tall';
        return 'medium';
    }, [physicalTraits.height]);

    const handleHeightChange = (val: string) => {
        const cm = val === 'short' ? 155 : val === 'tall' ? 180 : 168;
        updateTraits({ height: { cm, feet: Math.floor(cm / 30.48), inches: Math.round((cm % 30.48) / 2.54) } });
    };

    const TraitSelector = ({ label, icon: Icon, options, value, onChange, description, grid = 3 }: any) => (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#B8860B]/5 border border-[#B8860B]/10">
                    <Icon className="w-5 h-5 text-[#B8860B]" />
                </div>
                <div>
                    <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-bold text-[#1A1612] leading-none mb-1">{label}</h3>
                    {description && <p className="text-[10px] text-[#7A756F] uppercase tracking-wider font-semibold">{description}</p>}
                </div>
            </div>

            <div className={`grid gap-3 ${grid === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                {options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`relative p-4 rounded-xl border text-left transition-all duration-300 group ${value === opt.value
                            ? 'bg-gradient-to-br from-[#FDF8F3] to-white border-[#B8860B] shadow-md ring-1 ring-[#B8860B]'
                            : 'bg-white border-[#F0E8DE] hover:border-[#B8860B]/30 hover:bg-[#FDF8F3]/30'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-2xl">{opt.emoji}</span>
                            {value === opt.value && <CheckCircle2 className="w-4 h-4 text-[#B8860B]" />}
                        </div>
                        <div className="font-bold text-[#1A1612] text-sm mb-1">{opt.label}</div>
                        <div className="text-[10px] text-[#7A756F] italic leading-tight">{opt.guide}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#2D7A5C] bg-[#2D7A5C]/5 py-2.5 px-4 rounded-full border border-[#2D7A5C]/10 mb-8">
                <ScanFace className="w-4 h-4" />
                <span className="font-medium">🔐 Biometric DNA Analysis Engaged</span>
            </div>

            {/* Header */}
            <div className="mb-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FDF8F3] to-white border border-[#F0E8DE] rounded-full text-xs mb-6 shadow-sm"
                >
                    <span className="text-[#B8860B] font-medium tracking-wider uppercase">Step 3 of 5</span>
                </motion.div>
                <h1 className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-[#1A1612] leading-tight mb-2">
                    Samudrika <span className="text-gradient-gold">Biometrics</span>
                </h1>
                <p className="text-sm text-[#7A756F] max-w-md mx-auto italic">
                    Mapping the vertical and horizontal dimensions of your physical karma.
                </p>
            </div>

            {/* Navigation Tabs (Sacred Ivory Style) */}
            <div className="flex p-1 bg-[#F5EFE7]/50 border border-[#F0E8DE] rounded-xl mb-10 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${isActive
                                ? 'bg-white text-[#B8860B] shadow-sm border border-[#F0E8DE]'
                                : 'text-[#7A756F] hover:text-[#1A1612]'
                                }`}
                        >
                            <TabIcon className="w-4 h-4" />
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'face' && (
                        <motion.div
                            key="face"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-10"
                        >
                            <TraitSelector
                                label="Netra (Eyes)"
                                icon={Eye}
                                description="Window to the Chandra (Moon) influence"
                                options={EYE_SHAPES}
                                value={physicalTraits.facialStructure.eyeShape}
                                onChange={(val: any) => updateTraits({ facialStructure: { ...physicalTraits.facialStructure, eyeShape: val } })}
                                grid={4}
                            />
                            <TraitSelector
                                label="Lalat (Forehead)"
                                icon={Brain}
                                description="Seat of Mercury/Jupiter intellect"
                                options={FOREHEAD_TYPES}
                                value={physicalTraits.facialStructure.forehead}
                                onChange={(val: any) => updateTraits({ facialStructure: { ...physicalTraits.facialStructure, forehead: val } })}
                            />
                            <TraitSelector
                                label="Hanu (Jawline)"
                                icon={User}
                                description="Willpower and Mars vitality indicator"
                                options={JAW_TYPES}
                                value={physicalTraits.facialStructure.jawLine || ''}
                                onChange={(val: any) => updateTraits({ facialStructure: { ...physicalTraits.facialStructure, jawLine: val } })}
                            />

                            <TraitSelector
                                label="Nasika (Nose)"
                                icon={Wind}
                                description="Personality and prosperity indicator"
                                options={NOSE_TYPES}
                                value={physicalTraits.facialStructure.noseShape || ''}
                                onChange={(val: any) => updateTraits({ facialStructure: { ...physicalTraits.facialStructure, noseShape: val } })}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'structure' && (
                        <motion.div
                            key="structure"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-10"
                        >
                            <TraitSelector
                                label="Deha (Height)"
                                icon={Ruler}
                                description="The vertical dimension of build"
                                options={HEIGHT_OPTIONS}
                                value={currentHeightCategory}
                                onChange={handleHeightChange}
                            />
                            <TraitSelector
                                label="Sharira (Build)"
                                icon={Activity}
                                description="Constitution (Dosha Body Type)"
                                options={BUILD_OPTIONS}
                                value={physicalTraits.build}
                                onChange={(val: any) => updateTraits({ build: val })}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'details' && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-10"
                        >
                            <TraitSelector
                                label="Kesha (Hair)"
                                icon={Sparkles}
                                description="Subtle texture markers (Saturn/Venus)"
                                options={HAIR_OPTIONS}
                                value={physicalTraits.skinHair.hairType}
                                onChange={(val: any) => updateTraits({ skinHair: { ...physicalTraits.skinHair, hairType: val } })}
                                grid={4}
                            />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#B8860B]/5 border border-[#B8860B]/10">
                                        <Fingerprint className="w-5 h-5 text-[#B8860B]" />
                                    </div>
                                    <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-bold text-[#1A1612]">Special Marks</h3>
                                </div>
                                <textarea
                                    className="w-full min-h-[120px] p-4 rounded-xl border border-[#F0E8DE] bg-white focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] outline-none text-sm transition-all shadow-sm italic placeholder:text-stone-300"
                                    placeholder="Scars, birthmarks, or high-definition physical features..."
                                    value={physicalTraits.skinHair.marks.join(', ')}
                                    onChange={(e) => updateTraits({ skinHair: { ...physicalTraits.skinHair, marks: e.target.value.split(',').map(s => s.trim()) } })}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
