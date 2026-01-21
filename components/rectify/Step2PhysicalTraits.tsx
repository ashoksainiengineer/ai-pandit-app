'use client';

import { motion } from 'framer-motion';
import { PhysicalTraits } from '@/lib/types';
import { Brain, User, Zap, Sparkles, HelpCircle, Info } from 'lucide-react';
import { useState } from 'react';

interface Step2Props {
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// VEDIC-GRADE OPTIONS (Samudrik Shastra inspired)
// ═════════════════════════════════════════════════════════════════════════════

const HEIGHT_OPTIONS = [
    {
        value: 'short',
        label: 'Short',
        emoji: '🧒',
        signs: 'Cancer, Capricorn, Pisces Influence',
        guide: 'Below 5\'3" for men, 5\'0" for women.'
    },
    {
        value: 'medium',
        label: 'Average',
        emoji: '🧑',
        signs: 'Taurus, Virgo, Libra Influence',
        guide: 'Standard average height for your region/ethnicity.'
    },
    {
        value: 'tall',
        label: 'Tall',
        emoji: '🧑‍🦰',
        signs: 'Aries, Sagittarius, Aquarius Influence',
        guide: 'Noticeably taller than peers (Above 5\'11" men).'
    },
];

const PRAKRITI_OPTIONS = [
    {
        value: 'vata',
        label: 'Vata (Thin)',
        emoji: '💨',
        signs: 'Light Frame, Quick, Dry Skin',
        guide: 'Bony joints, thin hair, difficulty gaining weight, feels cold easily.'
    },
    {
        value: 'pitta',
        label: 'Pitta (Medium)',
        emoji: '🔥',
        signs: 'Moderate Build, Fiery, Sharp Eyes',
        guide: 'Fair/Reddish skin, early graying, sharp intellect, medium muscularity.'
    },
    {
        value: 'kapha',
        label: 'Kapha (Strong)',
        emoji: '💧',
        signs: 'Large Frame, Calm, Oily Skin',
        guide: 'Broad shoulders, thick hair, gains weight easily, deep steady voice.'
    },
];

const HAIR_TYPE_OPTIONS = [
    {
        value: 'straight',
        label: 'Straight',
        emoji: '💇‍♂️',
        signs: 'Saturn influence (Structured)',
        guide: 'Hair falls straight, rarely curls even when damp.'
    },
    {
        value: 'curly',
        label: 'Curly/Kinky',
        emoji: '🌀',
        signs: 'Rahu/Mercury influence (Dynamic)',
        guide: 'Natural coils, springs, or tight ringlets.'
    },
    {
        value: 'wavy',
        label: 'Wavy',
        emoji: '🌊',
        signs: 'Venus/Moon influence (Soft)',
        guide: 'Loose curves or "S" shape pattern.'
    },
    {
        value: 'thin',
        label: 'Fine/Thin',
        emoji: '🌱',
        signs: 'Sun/Mars influence (Sharp)',
        guide: 'Sparse or silky hair, scalp visible in light.'
    },
];

const NOSE_TYPE_OPTIONS = [
    {
        value: 'sharp',
        label: 'Sharp/Pointed',
        emoji: '👃',
        signs: 'Mars/Sun - Sharp intellect',
        guide: 'Prominent bridge, pointed tip, "arrow" like.'
    },
    {
        value: 'blunt',
        label: 'Blunt/Rounded',
        emoji: '👃',
        signs: 'Venus/Moon - Emotional',
        guide: 'Softer edges, rounded tip, fleshy.'
    },
    {
        value: 'aquiline',
        label: 'Aquiline (Eagle)',
        emoji: '🦅',
        signs: 'Saturn/Rahu - Leadership',
        guide: 'Curved or hooked profile, prominent middle.'
    },
];

const FACE_SHAPES = [
    { value: 'round', label: 'Round', emoji: '🌕', signs: 'Moon Ruled', guide: 'Width and length are almost equal.' },
    { value: 'oval', label: 'Oval', emoji: '🥚', signs: 'Mercury Ruled', guide: 'Length is more than width, tapered chin.' },
    { value: 'square', label: 'Square', emoji: '⬜', signs: 'Mars Ruled', guide: 'Strong angular jawline, broad forehead.' },
    { value: 'long', label: 'Long', emoji: '📏', signs: 'Saturn Ruled', guide: 'Narrow and long, prominent cheekbones.' },
];

// Item animation variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Step2PhysicalTraits({ physicalTraits, updateTraits }: Step2Props) {
    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    // Reusable Selection Card
    const TraitSelector = ({
        label,
        icon: Icon,
        options,
        value,
        onChange,
        cols = 3,
        description,
        groupId
    }: {
        label: string;
        icon: any;
        options: { value: string; label: string; emoji: string; signs: string; guide: string }[];
        value: string;
        onChange: (val: string) => void;
        cols?: number;
        description?: string;
        groupId: string;
    }) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#E8A849]/10 flex items-center justify-center border border-[#E8A849]/20 shadow-[0_0_10px_rgba(232,168,73,0.05)]">
                        <Icon className="w-4 h-4 text-[#E8A849]" />
                    </div>
                    <div>
                        <label className="block text-sm font-black text-[#F5F0EB] tracking-wide uppercase">{label}</label>
                        {description && <p className="text-[10px] text-[#8C7F72] uppercase tracking-[0.1em] font-medium">{description}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setActiveHelp(activeHelp === groupId ? null : groupId)}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors group"
                >
                    <HelpCircle className={`w-4 h-4 transition-colors ${activeHelp === groupId ? 'text-[#E8A849]' : 'text-[#8C7F72] group-hover:text-[#F5F0EB]'}`} />
                </button>
            </div>

            {activeHelp === groupId && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#6B9AC4]/10 border border-[#6B9AC4]/20 rounded-xl p-4 mb-4"
                >
                    <div className="flex gap-3">
                        <Info className="w-4 h-4 text-[#6B9AC4] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#C4B8AD] leading-relaxed">
                            <span className="text-[#6B9AC4] font-bold">Identification Guide:</span> Select the option that most closely matches your <span className="text-[#F5F0EB] font-bold italic">Natural State</span> (excluding enhancements or medical procedures). Vedic analysis relies on genetic markers.
                        </div>
                    </div>
                </motion.div>
            )}

            <div className={`grid gap-3 ${cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                {options.map((opt) => (
                    <motion.button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-5 rounded-2xl text-left transition-all border relative overflow-hidden group ${value === opt.value
                            ? 'bg-gradient-to-br from-[#E8A849]/20 to-transparent border-[#E8A849] shadow-[0_10px_30px_rgba(232,168,73,0.1)]'
                            : 'bg-[#1A1614] border-[#C4B8AD]/10 hover:border-[#E8A849]/30 hover:bg-[#201C1A]'
                            }`}
                    >
                        {value === opt.value && (
                            <div className="absolute top-3 right-3">
                                <Sparkles className="w-4 h-4 text-[#E8A849] animate-pulse" />
                            </div>
                        )}
                        <div className="flex items-center gap-4 md:block">
                            <div className="text-4xl mb-3 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">{opt.emoji}</div>
                            <div>
                                <div className="text-base font-black text-[#F5F0EB] group-hover:text-[#E8A849] transition-colors tracking-tight">
                                    {opt.label}
                                </div>
                                <div className="text-[10px] text-[#6B9AC4] font-bold uppercase tracking-widest mt-1 opacity-80">
                                    {opt.signs}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#F5F0EB]/5">
                            <p className="text-xs text-[#8C7F72] leading-relaxed group-hover:text-[#C4B8AD] transition-colors italic">
                                "{opt.guide}"
                            </p>
                        </div>

                        {/* Interactive selection highlight */}
                        {value === opt.value && (
                            <motion.div
                                layoutId="active-highlight"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E8A849] to-transparent"
                            />
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );

    const getHeightValue = () => {
        const cm = physicalTraits.height?.cm || 168;
        if (cm < 162) return 'short';
        if (cm >= 178) return 'tall';
        return 'medium';
    };

    return (
        <motion.div
            className="space-y-12 pb-12"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
            {/* ══════════════════════════════════════════════════════════════ */}
            {/* HEADER */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div variants={itemVariants}>
                <p className="text-sm text-[#E8A849] font-medium tracking-widest mb-2">STEP 2 OF 4</p>
                <h1 className="text-3xl font-bold text-[#F5F0EB]">Physical Traits</h1>
                <p className="text-[#C4B8AD] mt-2 text-sm max-w-2xl leading-relaxed">
                    Vedic rectification uses <span className="text-[#E8A849] font-bold italic">Samudrik Shastra</span> (Body Signatures) to verify Lagna (Ascendant) and Dasha sequences.
                </p>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* VEDIC CONTEXT CARD */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="bg-[#241F1C] border border-[#C4B8AD]/10 rounded-xl p-6 flex flex-col md:flex-row items-center gap-5"
            >
                <div className="p-3 rounded-xl bg-[#E8A849]/10 border border-[#E8A849]/20 shrink-0">
                    <Brain className="w-6 h-6 text-[#E8A849]" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-[#F5F0EB] mb-1">
                        Lagna-Varnada Verification
                    </h4>
                    <p className="text-sm text-[#C4B8AD] leading-relaxed">
                        Each of the 12 Ascendants produces distinct skeletal and muscular structures.
                        Your biological patterns act as a <span className="text-[#E8A849]/80 font-mono">Dasha-Sync Validation</span> for the AI engine.
                    </p>
                </div>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TRAITS FORM */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="space-y-16"
            >
                {/* 1. Body Prakriti */}
                <TraitSelector
                    label="Ayurvedic Constitution (Prakriti)"
                    icon={Zap}
                    groupId="prakriti"
                    description="Overall Energy & Skeletal Frame"
                    options={PRAKRITI_OPTIONS}
                    value={physicalTraits.prakriti || 'pitta'}
                    onChange={(val) => updateTraits({ prakriti: val as any })}
                />

                {/* 2. Height */}
                <TraitSelector
                    label="Vertical Stature (Deha)"
                    icon={User}
                    groupId="height"
                    description="General Height Category"
                    options={HEIGHT_OPTIONS}
                    value={getHeightValue()}
                    onChange={(val) => {
                        const opt = HEIGHT_OPTIONS.find(o => o.value === val);
                        updateTraits({ height: { cm: opt?.value === 'short' ? 155 : opt?.value === 'tall' ? 180 : 168, feet: 5, inches: 6 } });
                    }}
                />

                {/* 3. Hair Type */}
                <TraitSelector
                    label="Crowning Glory (Kesha)"
                    icon={Sparkles}
                    groupId="hair"
                    description="Texture & Growth Pattern"
                    options={HAIR_TYPE_OPTIONS}
                    value={physicalTraits.hairType || 'straight'}
                    onChange={(val) => updateTraits({ hairType: val as any })}
                />

                {/* 4. Nose Type */}
                <TraitSelector
                    label="Nasik (The Bridge)"
                    icon={User}
                    groupId="nose"
                    description="Planetary Influence Marker"
                    options={NOSE_TYPE_OPTIONS}
                    value={physicalTraits.noseType || 'sharp'}
                    onChange={(val) => updateTraits({ noseType: val as any })}
                />

                {/* 5. Face Shape */}
                <TraitSelector
                    label="Mukha (Face Geometry)"
                    icon={User}
                    groupId="face"
                    description="Geometric Facial Signature"
                    options={FACE_SHAPES}
                    value={physicalTraits.faceShape || 'oval'}
                    onChange={(val) => updateTraits({ faceShape: val as any })}
                    cols={4}
                />

                {/* Special Features */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#E8A849]/10 flex items-center justify-center border border-[#E8A849]/20">
                            <Sparkles className="w-4 h-4 text-[#E8A849]" />
                        </div>
                        <div>
                            <label className="block text-sm font-black text-[#F5F0EB] tracking-wide uppercase">
                                Distinguishing Marks (Tilak/Lakshan)
                            </label>
                            <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider font-medium">Moles, Scars, or Unusual Markers</p>
                        </div>
                    </div>
                    <textarea
                        value={physicalTraits.specialFeatures || ''}
                        onChange={(e) => updateTraits({ specialFeatures: e.target.value })}
                        placeholder="e.g., Mole on left forehead (Sun), birthmark on lower neck (Venus)..."
                        className="w-full h-[150px] p-6 bg-[#1A1614] border border-[#C4B8AD]/10 rounded-2xl text-[#F5F0EB] placeholder-[#8C7F72]/50 resize-none focus:border-[#E8A849] focus:ring-1 focus:ring-[#E8A849]/30 outline-none transition-all shadow-2xl font-medium"
                    />
                </motion.div>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TRUST BADGE */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-3 text-xs text-[#5CB57B] font-bold bg-[#5CB57B]/5 py-3 rounded-full border border-[#5CB57B]/10 max-w-sm mx-auto"
            >
                <div className="w-2 h-2 rounded-full bg-[#5CB57B] animate-pulse shadow-[0_0_8px_rgba(92,181,123,0.5)]" />
                <span className="tracking-widest uppercase">Encrypted Physiological Profile Active</span>
            </motion.div>
        </motion.div >
    );
}
