'use client';

import { motion } from 'framer-motion';
import { PhysicalTraits } from '@/lib/types';

interface Step2Props {
    physicalTraits: PhysicalTraits;
    updateTraits: (traits: Partial<PhysicalTraits>) => void;
}

// Astrologically significant options
const HEIGHT_OPTIONS = [
    { value: 'short', label: 'Short', emoji: '🧒', cm: 155, signs: 'Cancer, Capricorn, Pisces Ascendants' },
    { value: 'medium', label: 'Average', emoji: '🧑', cm: 168, signs: 'Taurus, Virgo, Libra Ascendants' },
    { value: 'tall', label: 'Tall', emoji: '🧑‍🦰', cm: 180, signs: 'Aries, Sagittarius, Aquarius Ascendants' },
];

const BUILD_OPTIONS = [
    { value: 'slim', label: 'Slim', emoji: '🧍', signs: 'Gemini, Virgo, Aquarius (Vata dosha)' },
    { value: 'medium', label: 'Medium', emoji: '🧑‍💼', signs: 'Aries, Leo, Scorpio (Pitta dosha)' },
    { value: 'heavy', label: 'Heavy', emoji: '🧔', signs: 'Taurus, Cancer, Pisces (Kapha dosha)' },
];

const COMPLEXION_OPTIONS = [
    { value: 'fair', label: 'Fair', emoji: '👱', signs: 'Cancer, Libra, Pisces Ascendants' },
    { value: 'medium', label: 'Wheatish', emoji: '👨', signs: 'Taurus, Gemini, Virgo Ascendants' },
    { value: 'dark', label: 'Dark', emoji: '👨🏿', signs: 'Aries, Scorpio, Capricorn Ascendants' },
];

const FACE_SHAPES = [
    { value: 'round', label: 'Round', emoji: '🌕', signs: 'Cancer, Taurus' },
    { value: 'oval', label: 'Oval', emoji: '🥚', signs: 'Libra, Virgo' },
    { value: 'square', label: 'Square', emoji: '⬜', signs: 'Aries, Capricorn' },
    { value: 'long', label: 'Long', emoji: '📏', signs: 'Sagittarius, Aquarius' },
];

const EYE_OPTIONS = [
    { value: 'large', label: 'Large', emoji: '👀', signs: 'Moon/Venus ruled signs' },
    { value: 'medium', label: 'Normal', emoji: '👁️', signs: 'Balanced Ascendants' },
    { value: 'small', label: 'Small', emoji: '👁️‍🗨️', signs: 'Saturn/Mars ruled signs' },
];

// Animation variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Step2PhysicalTraits({ physicalTraits, updateTraits }: Step2Props) {

    // Reusable Selection Card
    const TraitSelector = ({
        label,
        options,
        value,
        onChange,
        cols = 3
    }: {
        label: string;
        options: { value: string; label: string; emoji: string; signs: string; cm?: number }[];
        value: string;
        onChange: (val: string) => void;
        cols?: number;
    }) => (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-[#E8A849]">{label}</label>
            <div className={`grid gap-3 ${cols === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
                {options.map((opt) => (
                    <motion.button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-5 rounded-xl text-center transition-all border-2 ${value === opt.value
                            ? 'bg-[#E8A849]/15 border-[#E8A849]'
                            : 'bg-[#2E2724] border-transparent hover:border-[#E8A849]/30'
                            }`}
                    >
                        <div className="text-4xl mb-2">{opt.emoji}</div>
                        <div className="text-base font-medium text-[#F5F0EB]">{opt.label}</div>
                        <div className="text-xs text-[#6B9AC4] mt-1">{opt.signs}</div>
                    </motion.button>
                ))}
            </div>
        </div>
    );

    const getHeightValue = () => {
        const cm = physicalTraits.height?.cm || 168;
        if (cm < 160) return 'short';
        if (cm >= 175) return 'tall';
        return 'medium';
    };

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
                <p className="text-sm text-[#E8A849] font-medium tracking-widest mb-2">STEP 2 OF 4</p>
                <h1 className="text-3xl font-bold text-[#F5F0EB]">Physical Traits</h1>
                <p className="text-[#C4B8AD] mt-2 text-sm">
                    Your physical characteristics help verify your Lagna (Ascendant)
                </p>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* INFO CARD */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="bg-[#6B9AC4]/10 border border-[#6B9AC4]/30 rounded-xl p-5"
            >
                <div className="flex items-start gap-4">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h4 className="text-[#F5F0EB] font-medium mb-1">Why does this matter?</h4>
                        <p className="text-sm text-[#C4B8AD]">
                            In Vedic Astrology, each Lagna (Ascendant) produces specific physical traits.
                            Your characteristics help us cross-verify the calculated birth time with your actual appearance.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* TRAITS FORM */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <motion.div
                variants={itemVariants}
                className="bg-[#241F1C] rounded-xl p-8 border border-[#C4B8AD]/10 space-y-8"
            >
                {/* Height */}
                <TraitSelector
                    label="📏 Height"
                    options={HEIGHT_OPTIONS}
                    value={getHeightValue()}
                    onChange={(val) => {
                        const opt = HEIGHT_OPTIONS.find(o => o.value === val);
                        updateTraits({ height: { cm: opt?.cm || 168, feet: 5, inches: 6 } });
                    }}
                />

                <div className="border-t border-[#C4B8AD]/10" />

                {/* Body Build */}
                <TraitSelector
                    label="🧍 Body Build"
                    options={BUILD_OPTIONS}
                    value={physicalTraits.build || 'medium'}
                    onChange={(val) => updateTraits({ build: val as any })}
                />

                <div className="border-t border-[#C4B8AD]/10" />

                {/* Complexion */}
                <TraitSelector
                    label="🎨 Complexion"
                    options={COMPLEXION_OPTIONS}
                    value={physicalTraits.complexion || 'medium'}
                    onChange={(val) => updateTraits({ complexion: val as any })}
                />

                <div className="border-t border-[#C4B8AD]/10" />

                {/* Face Shape */}
                <TraitSelector
                    label="😊 Face Shape"
                    options={FACE_SHAPES}
                    value={physicalTraits.faceShape || 'oval'}
                    onChange={(val) => updateTraits({ faceShape: val as any })}
                    cols={4}
                />

                <div className="border-t border-[#C4B8AD]/10" />

                {/* Eyes */}
                <TraitSelector
                    label="👁️ Eye Size"
                    options={EYE_OPTIONS}
                    value={physicalTraits.eyeColor || 'medium'}
                    onChange={(val) => updateTraits({ eyeColor: val })}
                />

                <div className="border-t border-[#C4B8AD]/10" />

                {/* Special Features */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-[#E8A849]">
                        ✨ Distinguishing Marks <span className="text-[#8C7F72] font-normal">(Optional)</span>
                    </label>
                    <p className="text-xs text-[#8C7F72]">
                        As per Samudrik Shastra - prominent moles, birthmarks on visible areas
                    </p>
                    <textarea
                        value={physicalTraits.specialFeatures || ''}
                        onChange={(e) => updateTraits({ specialFeatures: e.target.value })}
                        placeholder="e.g., Mole on left cheek, birthmark on right hand..."
                        className="w-full h-[100px] p-5 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-lg text-[#F5F0EB] placeholder-[#8C7F72] resize-none focus:border-[#E8A849] focus:ring-2 focus:ring-[#E8A849]/20 outline-none transition-all"
                    />
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
        </motion.div>
    );
}
