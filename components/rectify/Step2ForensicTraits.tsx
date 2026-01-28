'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ForensicTraits } from '@/lib/types';
import {
    Brain, User, Zap, Sparkles, HelpCircle, Info, Eye, ScanFace,
    Activity, Fingerprint, Ruler, Speech, ZapOff, Moon, Users
} from 'lucide-react';
import { useState } from 'react';

interface Step2Props {
    traits: ForensicTraits;
    updateTraits: (traits: Partial<ForensicTraits>) => void;
}

const TABS = [
    { id: 'mukha', label: 'Mukha (Face)', icon: ScanFace },
    { id: 'deha', label: 'Deha (Body)', icon: Activity },
    { id: 'vyaktitva', label: 'Vyaktitva (Behavior)', icon: Speech },
    { id: 'kula', label: 'Kula (Family)', icon: Users },
];

export default function Step2ForensicTraits({ traits, updateTraits }: Step2Props) {
    const [activeTab, setActiveTab] = useState('mukha');
    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    const updatePhysical = (updates: any) => {
        updateTraits({ physical: { ...(traits?.physical || {}), ...updates } } as any);
    };

    const updateFacial = (updates: any) => {
        const physical = traits?.physical || {};
        updateTraits({
            physical: {
                ...physical,
                facialStructure: { ...((physical as any).facialStructure || {}), ...updates }
            }
        } as any);
    };

    const updateSkinHair = (updates: any) => {
        const physical = traits?.physical || {};
        updateTraits({
            physical: {
                ...physical,
                skinHair: { ...((physical as any).skinHair || {}), ...updates }
            }
        } as any);
    };

    const updatePsychographic = (updates: any) => {
        updateTraits({ psychographic: { ...(traits?.psychographic || {}), ...updates } } as any);
    };

    const updateBiological = (updates: any) => {
        updateTraits({ biological: { ...(traits?.biological || {}), ...updates } } as any);
    };

    const updateFamily = (updates: any) => {
        updateTraits({ family: { ...(traits?.family || {}), ...updates } } as any);
    };

    const TraitSelector = ({ label, icon: Icon, options, value, onChange, groupId, description, grid = 3 }: any) => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#E8A849]/10 border border-[#E8A849]/20">
                        <Icon className="w-5 h-5 text-[#E8A849]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[#F5F0EB] uppercase tracking-wide">{label}</h3>
                        {description && <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">{description}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setActiveHelp(activeHelp === groupId ? null : groupId)}
                    className={`p-2 rounded-full transition-all ${activeHelp === groupId ? 'bg-[#E8A849] text-black' : 'hover:bg-white/5 text-[#8C7F72]'}`}
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence>
                {activeHelp === groupId && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#6B9AC4]/10 border border-[#6B9AC4]/20 rounded-xl p-4 mb-4 text-xs leading-relaxed text-[#C4B8AD] flex gap-3">
                            <Info className="w-4 h-4 text-[#6B9AC4] shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-[#6B9AC4]">Vedic Logic:</strong> This specific marker correlates to divisional chart degrees.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`grid gap-3 ${grid === 4 ? 'grid-cols-2 md:grid-cols-4' : grid === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                {options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${value === opt.value
                            ? 'bg-[#E8A849]/10 border-[#E8A849] shadow-[0_0_20px_rgba(232,168,73,0.1)]'
                            : 'bg-[#151a21] border-[#3A4452]/40 hover:border-[#E8A849]/50'
                            }`}
                    >
                        {value === opt.value && (
                            <div className="absolute top-2 right-2">
                                <Sparkles className="w-3 h-3 text-[#E8A849] animate-pulse" />
                            </div>
                        )}
                        {opt.emoji && <div className="text-2xl mb-2">{opt.emoji}</div>}
                        <div className="font-bold text-[#F5F0EB] text-sm mb-1">{opt.label}</div>
                        {opt.guide && <div className="text-[10px] text-[#8C7F72] italic leading-tight group-hover:text-[#C4B8AD] transition-colors">
                            "{opt.guide}"
                        </div>}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto pb-12">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8A849]/10 border border-[#E8A849]/20 text-[#E8A849] text-xs font-bold uppercase tracking-widest mb-4">
                    <Fingerprint className="w-3 h-3" />
                    God-Tier Forensic Audit
                </div>
                <h1 className="text-3xl font-black text-[#F5F0EB] mb-2">Forensic Traits Matrix</h1>
                <p className="text-[#8C7F72] text-sm max-w-xl mx-auto">
                    We require absolute precision for sub-second rectification. Every detail here clears ambiguity in the Lagna and D-60 charts.
                </p>
            </div>

            <div className="flex p-1 bg-[#151a21] border border-[#3A4452] rounded-xl mb-8 sticky top-4 z-20 shadow-xl backdrop-blur-xl">
                {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isActive
                                ? 'bg-[#E8A849] text-black shadow-lg'
                                : 'text-[#8C7F72] hover:text-[#F5F0EB] hover:bg-white/5'
                                }`}
                        >
                            <TabIcon className="w-4 h-4" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'mukha' && (
                        <motion.div key="mukha" className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <TraitSelector
                                label="Forehead (Lalat)"
                                icon={Brain}
                                options={[
                                    { value: 'broad', label: 'Broad/High', emoji: '🧠', guide: 'Wide forehead indicates Sun/Jupiter prominence - leadership qualities, intelligence' },
                                    { value: 'narrow', label: 'Narrow', emoji: '🤏', guide: 'Narrow forehead shows Saturn influence - focused, practical mindset' },
                                    { value: 'average', label: 'Average', emoji: '➖', guide: 'Average width suggests mixed planetary influences' },
                                    { value: 'sloping', label: 'Sloping', emoji: '📐', guide: 'Sloping forehead indicates Mercury/Mars signature - quick thinking' }
                                ]}
                                value={traits?.physical?.facialStructure?.forehead}
                                onChange={(val: any) => updateFacial({ forehead: val })}
                            />
                            <TraitSelector
                                label="Eyes (Netra)"
                                icon={Eye}
                                options={[
                                    { value: 'deep_set', label: 'Deep Set', emoji: '🕶️', guide: 'Deep set eyes show Saturnine depth - introspective, serious nature' },
                                    { value: 'prominent', label: 'Prominent', emoji: '👁️', guide: 'Prominent eyes indicate Mars/Moon intensity - emotional expressiveness' },
                                    { value: 'almond', label: 'Almond', emoji: '🌰', guide: 'Almond shape reveals Venusian grace - artistic, harmonious nature' },
                                    { value: 'round', label: 'Round/Large', emoji: '😳', guide: 'Round eyes suggest Jupiterian expansiveness - optimistic, open-hearted' },
                                    { value: 'small', label: 'Small/Piercing', emoji: '🎯', guide: 'Small piercing eyes indicate Mercurial sharpness - analytical, precise' }
                                ]}
                                value={traits?.physical?.facialStructure?.eyeShape}
                                onChange={(val: any) => updateFacial({ eyeShape: val })}
                                grid={4}
                            />
                            <TraitSelector
                                label="Voice Texture"
                                icon={Speech}
                                options={[
                                    { value: 'deep', label: 'Deep/Grave', emoji: '🎙️', guide: 'Deep voice indicates Saturn/Jupiter influence - authority, wisdom' },
                                    { value: 'high', label: 'High Pitch', emoji: '🎵', guide: 'High pitch shows Mercury/Mars energy - quick, energetic communication' },
                                    { value: 'medium', label: 'Medium', emoji: '🗣️', guide: 'Medium voice suggests balanced Solar/Lunar energy' },
                                    { value: 'soft', label: 'Soft/Melodious', emoji: '🎶', guide: 'Soft voice reveals Venusian beauty - diplomatic, charming' },
                                    { value: 'raspy', label: 'Raspy/Strong', emoji: '🐯', guide: 'Raspy voice indicates Rahu/Mars power - unconventional strength' }
                                ]}
                                value={traits?.physical?.facialStructure?.voicePitch}
                                onChange={(val: any) => updateFacial({ voicePitch: val })}
                                grid={4}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'deha' && (
                        <motion.div key="deha" className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <TraitSelector
                                label="Body Constitution (Prakriti)"
                                icon={Activity}
                                options={[
                                    { value: 'vata', label: 'Vata (Slim/Dry)', emoji: '🌬️', guide: 'Air/Space dominant. Bony frame, visible joints, dry skin. Creative, energetic, anxious.' },
                                    { value: 'pitta', label: 'Pitta (Athletic)', emoji: '🔥', guide: 'Fire/Water dominant. Medium build, muscular, warm body. Ambitious, focused, irritable.' },
                                    { value: 'kapha', label: 'Kapha (Solid)', emoji: '🌍', guide: 'Earth/Water dominant. Heavy, robust, oily skin. Calm, loyal, sluggish.' },
                                    { value: 'vata-pitta', label: 'Vata-Pitta', emoji: '💨🔥', guide: 'Air-Fire mix. Slim but intense. Creative drive with sharp intellect.' },
                                    { value: 'pitta-kapha', label: 'Pitta-Kapha', emoji: '🔥🌍', guide: 'Fire-Earth mix. Broad muscular build. Determined with emotional stability.' }
                                ]}
                                value={traits?.biological?.prakriti}
                                onChange={(val: any) => updateBiological({ prakriti: val })}
                            />
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-[#F5F0EB] uppercase tracking-wide">Significant Marks/Moles</h3>
                                <textarea
                                    className="w-full h-32 bg-[#151a21] border border-[#3A4452] rounded-xl p-4 text-sm text-[#F5F0EB] outline-none focus:border-[#E8A849]"
                                    placeholder="e.g., Large mole on right cheek, birthmark on shoulder..."
                                    value={(traits?.physical?.skinHair?.marks || []).join('\n')}
                                    onChange={(e) => updateSkinHair({ marks: e.target.value.split('\n').filter(m => m.trim()) })}
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'vyaktitva' && (
                        <motion.div key="vyaktitva" className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <TraitSelector
                                label="Speech Style (Vani)"
                                icon={Speech}
                                options={[
                                    { value: 'fast_loud', label: 'Fast & Loud', emoji: '🗣️', guide: 'Mars/Sun dominance. Assertive, commanding, impulsive speaker.' },
                                    { value: 'measured_soft', label: 'Measured & Soft', emoji: '🧘', guide: 'Saturn/Jupiter influence. Thoughtful, wise, authoritative speech.' },
                                    { value: 'argumentative', label: 'Logical/Debate', emoji: '⚖️', guide: 'Mercury/Mars sharpness. Analytical, questioning, precise.' },
                                    { value: 'concise', label: 'Concise/Brief', emoji: '✂️', guide: 'Ketu influence. Minimal words, spiritual detachment in speech.' },
                                    { value: 'talkative', label: 'Highly Talkative', emoji: '🎭', guide: 'Rahu/Mercury combination. Versatile, clever, sometimes deceptive.' }
                                ]}
                                value={traits?.psychographic?.speechStyle}
                                onChange={(val: any) => updatePsychographic({ speechStyle: val })}
                            />
                            <TraitSelector
                                label="Decision Making (Nirnaya)"
                                icon={Zap}
                                options={[
                                    { value: 'impulsive', label: 'Impulsive/Fast', emoji: '⚡', guide: 'Mars energy. Quick decisions, action-oriented, sometimes rash.' },
                                    { value: 'deliberate', label: 'Deliberate/Slow', emoji: '🐢', guide: 'Saturnian caution. Careful analysis, methodical, patient.' },
                                    { value: 'indecisive', label: 'Indecisive', emoji: '🌊', guide: 'Lunar influence. Emotionally swayed, changeable mind.' },
                                    { value: 'intuitive', label: 'Intuitive', emoji: '🔮', guide: 'Jupiter/Neptune wisdom. Gut feeling, spiritual guidance.' }
                                ]}
                                value={traits?.psychographic?.decisionMaking}
                                onChange={(val: any) => updatePsychographic({ decisionMaking: val })}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'kula' && (
                        <motion.div key="kula" className="space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <TraitSelector
                                label="Sibling Order (Anuj)"
                                icon={Users}
                                options={[
                                    { value: 'eldest', label: 'Eldest', emoji: '👑', guide: 'Sun/Mars influence. Natural leader, responsible, authoritative.' },
                                    { value: 'middle', label: 'Middle', emoji: '🤝', guide: 'Mercury/Venus influence. Diplomatic, adaptable, peacemaker.' },
                                    { value: 'youngest', label: 'Youngest', emoji: '👶', guide: 'Moon/Jupiter influence. Nurtured, creative, free-spirited.' },
                                    { value: 'only_child', label: 'Only Child', emoji: '🌟', guide: 'Unique planetary focus. Self-centered, independent, mature early.' }
                                ]}
                                value={traits?.family?.siblingPosition}
                                onChange={(val: any) => updateFamily({ siblingPosition: val })}
                            />
                            <TraitSelector
                                label="Father's Status at Birth (Pitri)"
                                icon={User}
                                options={[
                                    { value: 'struggling', label: 'Struggling', emoji: '⛰️', guide: '9th Lord challenges. Financial difficulties, health issues for father.' },
                                    { value: 'stable', label: 'Stable/Middle', emoji: '⚖️', guide: 'Standard 9th strength. Average circumstances, comfortable life.' },
                                    { value: 'prosperous', label: 'Prosperous', emoji: '💎', guide: 'Strong 9th/10th houses. Wealthy, successful, respected father.' },
                                    { value: 'highly_distinguished', label: 'Distinguished', emoji: '🏆', guide: 'Raja Yoga in 9th/10th. Very famous, powerful, elite status.' }
                                ]}
                                value={traits?.family?.fatherStatusAtBirth}
                                onChange={(val: any) => updateFamily({ fatherStatusAtBirth: val })}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
