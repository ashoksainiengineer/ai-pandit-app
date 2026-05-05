/**
 * Step3PhysicalTraits - Samudrika Shastra Biometric Verification
 * God-Tier UX Design - Crystal Clear Visual Selection
 * 
 * Key Features:
 * - Visual side-by-side comparisons
 * - Clear "how to check" instructions
 * - Mirror check guide with photos
 * - Zero ambiguity design
 */

'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
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
    Wind,
    Info,
    Glasses
} from 'lucide-react';

interface Step3Props {
    physicalTraits: ForensicTraits['physical'];
    updateTraits: (updates: Partial<ForensicTraits['physical']>) => void;
}

// ═════════════════════════════════════════════════════════════════════════════
// GOD TIER TRAIT DEFINITIONS - CRYSTAL CLEAR WITH VISUAL GUIDES
// ═════════════════════════════════════════════════════════════════════════════

interface TraitDefinition {
    id: string;
    name: string;
    sanskrit: string;
    icon: React.ElementType;
    howToCheck: string;
    whyItMatters: string;
    visualOptions: VisualOption[];
}

interface VisualOption {
    value: string;
    label: string;
    visual: string;
    description: string;
    astrologicalMeaning: string;
    example: string;
}

// Crystal clear visual options for each trait
const TRAIT_DEFINITIONS: TraitDefinition[] = [
    {
        id: 'eyes',
        name: 'Your Eyes',
        sanskrit: 'Netra - नेत्र',
        icon: Eye,
        howToCheck: 'Look straight at a mirror. Compare your eye shape to the pictures below.',
        whyItMatters: 'Eyes reveal your emotional nature (Moon) and mental state. Round eyes = emotional, almond = balanced, deep-set = private.',
        visualOptions: [
            { value: 'almond', label: 'Almond', visual: '👁️', description: 'Like an almond - tapered corners, iris partially visible', astrologicalMeaning: 'Moon well-placed - balanced emotions', example: 'Most Indian celebrities have almond eyes' },
            { value: 'round', label: 'Round', visual: '👀', description: 'Circular, fully visible iris, big appearance', astrologicalMeaning: 'Strong Moon influence - expressive, emotional', example: 'Like a curious child\'s eyes' },
            { value: 'deep_set', label: 'Deep Set', visual: '🕶️', description: 'Set back in skull, shadow under brow bone', astrologicalMeaning: 'Private, keeps emotions hidden', example: 'Like Hollywood actors often have' },
            { value: 'hooded', label: 'Hooded', visual: '😑', description: 'Upper lid covers the crease when open', astrologicalMeaning: 'Practical, protective of emotions', example: 'Look at your forehead - does lid cover crease?' },
            { value: 'protruding', label: 'Protruding', visual: '😮', description: 'Bulging outward, prominent', astrologicalMeaning: 'Emotional turbulence, artistic nature', example: 'Like a surprised expression always' },
        ]
    },
    {
        id: 'nose',
        name: 'Your Nose',
        sanskrit: 'Nakha - नाक',
        icon: Wind,
        howToCheck: 'Profile view in mirror. Look at the bridge and tip shape.',
        whyItMatters: 'Nose shows vitality (Mars), personality (Sun), and spouse relationships (7th house).',
        visualOptions: [
            { value: 'straight', label: 'Straight', visual: '📏', description: 'Perfectly straight bridge from brow to tip', astrologicalMeaning: 'Strong Mars - leadership quality', example: 'Like a model\'s nose' },
            { value: 'aquiline', label: 'Aquiline (Hooked)', visual: '🦅', description: 'Bridge curves like an eagle\'s beak', astrologicalMeaning: 'Ambitious, strategic thinker', example: 'Like Indian royal portraits' },
            { value: 'button', label: 'Button', visual: '🔴', description: 'Small, rounded tip, upturned', astrologicalMeaning: 'Venus influence - charming', example: 'Cute, button-like tip' },
            { value: 'snub', label: 'Snub', visual: '🔼', description: 'Tip turned up, short bridge', astrologicalMeaning: 'Optimistic, lucky', example: 'Pug nose style' },
            { value: 'broad', label: 'Broad/Wide', visual: '👃', description: 'Wide base, large nostrils', astrologicalMeaning: 'Mars strong - energetic', example: 'Wide at the bottom' },
        ]
    },
    {
        id: 'forehead',
        name: 'Your Forehead',
        sanskrit: 'Lalat - ललाट',
        icon: Brain,
        howToCheck: 'Side profile in mirror. Measure width and check for bumps.',
        whyItMatters: 'Forehead represents intellect (Mercury) and wisdom (Jupiter). Broad = smart.',
        visualOptions: [
            { value: 'high', label: 'High', visual: '🧠', description: 'From eyebrow to hairline is tall', astrologicalMeaning: 'Jupiter-Mercury - scholarly', example: 'High forehead = more智慧' },
            { value: 'broad', label: 'Broad', visual: '🌉', description: 'Wide from temple to temple', astrologicalMeaning: 'Logical, broad thinking', example: 'Wide across top' },
            { value: 'medium', label: 'Medium', visual: '👤', description: 'Average height and width', astrologicalMeaning: 'Balanced Mercury', example: 'Standard size' },
            { value: 'narrow', label: 'Narrow', visual: '🤏', description: 'Constricted, pointed at temples', astrologicalMeaning: 'Focused, practical', example: 'Narrower than average' },
            { value: 'rounded', label: 'Rounded/Mounds', visual: '🌙', description: 'Visible brow ridges or bumps', astrologicalMeaning: 'Moon influence - imaginative', example: 'Brow ridges visible' },
        ]
    },
    {
        id: 'jaw',
        name: 'Your Jawline',
        sanskrit: 'Hanu - हनु',
        icon: User,
        howToCheck: 'Look down at mirror or take a chin-up photo. Square vs round vs pointed.',
        whyItMatters: 'Jaw shows will power (Mars) and career success (10th house).',
        visualOptions: [
            { value: 'square', label: 'Square', visual: '⬛', description: 'Wide jaw, 90-degree angle at corners', astrologicalMeaning: 'Strong Mars - determined leader', example: 'Like famous male actors' },
            { value: 'round', label: 'Rounded', visual: '⚪', description: 'Soft curve, no sharp angles', astrologicalMeaning: 'Moon-Venus - artistic, peaceful', example: 'Soft, gentle face' },
            { value: 'pointed', label: 'Pointed', visual: '🔻', description: 'Narrow at chin, triangular', astrologicalMeaning: 'Mercury - quick thinker', example: 'V-shaped face' },
            { value: 'double', label: 'With Dimple', visual: '👤', description: 'Has chin cleft or dimples', astrologicalMeaning: 'Venus blessing - charming', example: 'Dimple on chin' },
            { value: 'medium', label: 'Medium', visual: '🧔', description: 'Neither square nor round', astrologicalMeaning: 'Balanced Mars', example: 'Average jawline' },
        ]
    },
    {
        id: 'lips',
        name: 'Your Lips',
        sanskrit: 'Osthau - ओष्ठ',
        icon: Sparkles,
        howToCheck: 'Natural smile in mirror. Observe thickness and shape.',
        whyItMatters: 'Lips represent speech (Mercury) and sensuality (Venus).',
        visualOptions: [
            { value: 'full', label: 'Full/Thick', visual: '👄', description: 'Voluminous, prominent lips', astrologicalMeaning: 'Venus strong - romantic', example: 'Full lips like film stars' },
            { value: 'thin', label: 'Thin', visual: '😗', description: 'Minimal width, pressed line', astrologicalMeaning: 'Mercury sharp - critical', example: 'Thin, precise lips' },
            { value: 'medium', label: 'Medium', visual: '😊', description: 'Balanced, neither thick nor thin', astrologicalMeaning: 'Balanced Mercury', example: 'Most common type' },
            { value: 'downturned', label: 'Downturned', visual: '😔', description: 'Corners point down naturally', astrologicalMeaning: 'Saturn-Moon - thoughtful', example: 'Serious expression' },
            { value: 'uptuned', label: 'Upturned/Smiling', visual: '😄', description: 'Corners naturally curve up', astrologicalMeaning: 'Jupiter - optimistic', example: 'Always looks happy' },
        ]
    },
    {
        id: 'ears',
        name: 'Your Ears',
        sanskrit: 'Karna - कर्ण',
        icon: Brain,
        howToCheck: 'Look in mirror - where do ears sit compared to eyes? High or low?',
        whyItMatters: 'Ears show inherited traits and early life fortune.',
        visualOptions: [
            { value: 'large', label: 'Large', visual: '👂', description: 'Big, prominent ears', astrologicalMeaning: 'Strong family fortune', example: 'Ears bigger than average' },
            { value: 'small', label: 'Small', visual: '🫣', description: 'Tiny, close to head', astrologicalMeaning: 'Self-made, early struggles', example: 'Small, neat ears' },
            { value: 'low_set', label: 'Low Set', visual: '⬇️', description: 'Below eye level', astrologicalMeaning: 'Rahu - unconventional', example: 'Ears sit lower on head' },
            { value: 'high_set', label: 'High Set', visual: '⬆️', description: 'Above eye level', astrologicalMeaning: 'Jupiter - spiritual', example: 'Ears high on head' },
            { value: 'detached', label: 'Detached Lobe', visual: '🔌', description: 'Lobe not attached to head', astrologicalMeaning: 'Venus - freedom, artistic', example: 'Can wiggle ears' },
        ]
    },
    {
        id: 'voice',
        name: 'Your Voice',
        sanskrit: 'Swara - स्वर',
        icon: Activity,
        howToCheck: 'Record yourself speaking. Listen to pitch and tone.',
        whyItMatters: 'Voice shows communication style (Mercury) and energy (Mars).',
        visualOptions: [
            { value: 'deep', label: 'Deep/Gravelly', visual: '🎸', description: 'Low pitch, rumbling', astrologicalMeaning: 'Saturn-Mars - authority', example: 'Like movie narrators' },
            { value: 'soft', label: 'Soft/Melodious', visual: '🎵', description: 'Gentle, pleasant tone', astrologicalMeaning: 'Venus-Moon', example: 'Soothing voice' },
            { value: 'loud', label: 'Loud/Booming', visual: '📢', description: 'High volume, projects well', astrologicalMeaning: 'Mars strong', example: 'Voice fills room' },
            { value: 'fast', label: 'Fast/Rapid', visual: '⚡', description: 'Quick, energetic speech', astrologicalMeaning: 'Mercury-Rahu', example: 'Talks quickly' },
            { value: 'clear', label: 'Clear/Resonant', visual: '🔔', description: 'Crystal clear, rings', astrologicalMeaning: 'Well-aspected Mercury', example: 'Radio voice' },
        ]
    },
    {
        id: 'skin',
        name: 'Your Skin',
        sanskrit: 'Twak - त्वचा',
        icon: Sparkles,
        howToCheck: 'Look at bare face in natural light. Note color and texture.',
        whyItMatters: 'Skin shows Sun (radiance) and health. Color matters in astrology.',
        visualOptions: [
            { value: 'fair', label: 'Fair/Florid', visual: '✨', description: 'Light, rosy complexion', astrologicalMeaning: 'Venus-Moon - attractive', example: 'Fair skin tone' },
            { value: 'wheatish', label: 'Wheatish', visual: '🌾', description: 'Golden-brown, warm', astrologicalMeaning: 'Sun-Mars', example: 'Common Indian skin' },
            { value: 'dark', label: 'Dark/Dusky', visual: '🌙', description: 'Rich, deep complexion', astrologicalMeaning: 'Saturn - mature', example: 'Beautiful dark skin' },
            { value: 'oily', label: 'Oily/Shiny', visual: '💧', description: 'Glossy, especially T-zone', astrologicalMeaning: 'Moon-Venus', example: 'Shiny by afternoon' },
            { value: 'dry', label: 'Dry/Matte', visual: '🏜️', description: 'Matte, sometimes flaky', astrologicalMeaning: 'Vata-Saturn', example: 'Feels tight often' },
        ]
    },
    {
        id: 'hair',
        name: 'Your Hair',
        sanskrit: 'Kesha - केश',
        icon: ScanFace,
        howToCheck: 'Air dried, natural state. Observe texture and volume.',
        whyItMatters: 'Hair represents Saturn (texture) and Venus (beauty).',
        visualOptions: [
            { value: 'straight', label: 'Straight', visual: '⬇️', description: 'Flat, falls straight', astrologicalMeaning: 'Venus - graceful', example: 'Falls flat without styling' },
            { value: 'wavy', label: 'Wavy', visual: '〰️', description: 'Soft S-curves', astrologicalMeaning: 'Moon - creative', example: 'Natural waves' },
            { value: 'curly', label: 'Curly', visual: '🌀', description: 'Tight curls or coils', astrologicalMeaning: 'Mars-Rahu', example: 'Bouncy curls' },
            { value: 'thick', label: 'Thick', visual: '🌿', description: 'Dense, full volume', astrologicalMeaning: 'Venus - fortunate', example: 'Lots of hair' },
            { value: 'thin', label: 'Thin/Sparse', visual: '🍃', description: 'Less density', astrologicalMeaning: 'Saturn', example: 'See scalp through hair' },
        ]
    },
    {
        id: 'build',
        name: 'Your Body Build',
        sanskrit: 'Sharira - शरीर',
        icon: Ruler,
        howToCheck: 'Look at yourself. Are bones visible? Muscular? Rounded?',
        whyItMatters: 'Body type relates to doshas - Vata (thin), Pitta (medium), Kapha (heavy).',
        visualOptions: [
            { value: 'slim', label: 'Slim (Vata)', visual: '🦴', description: 'Thin bones, visible veins, hard to gain weight', astrologicalMeaning: 'Vata dominant - quick mind, restless', example: 'Can eat anything, stay thin' },
            { value: 'athletic', label: 'Athletic (Pitta)', visual: '🔥', description: 'Medium, muscular, defined', astrologicalMeaning: 'Pitta - ambitious, competitive', example: 'Builds muscle easily' },
            { value: 'heavy', label: 'Solid (Kapha)', visual: '🐘', description: 'Broad, gains weight easily', astrologicalMeaning: 'Kapha - calm, patient, loyal', example: 'Big frame, stores energy' },
            { value: 'average', label: 'Average', visual: '🧑', description: 'Balanced, normal build', astrologicalMeaning: 'Balanced doshas', example: 'Neither thin nor heavy' },
        ]
    },
    {
        id: 'height',
        name: 'Your Height',
        sanskrit: 'Ayu - आयु',
        icon: Ruler,
        howToCheck: 'Compare to average. Short = below 5\'6", Tall = above 5\'10".',
        whyItMatters: 'Height relates to Jupiter (tall) and Saturn (short).',
        visualOptions: [
            { value: 'short', label: 'Short', visual: '📏', description: 'Below 5\'4"', astrologicalMeaning: 'Saturn prominent', example: 'Smaller than average' },
            { value: 'average', label: 'Average', visual: '🧑', description: '5\'4" to 5\'10"', astrologicalMeaning: 'Balanced', example: 'Most common height' },
            { value: 'tall', label: 'Tall', visual: '🗼', description: 'Above 5\'10"', astrologicalMeaning: 'Jupiter well-placed', example: 'Above average' },
        ]
    },
];

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

interface VisualSelectorProps {
    definition: TraitDefinition;
    value: string;
    onChange: (val: string) => void;
}

const VisualSelector = memo(({ definition, value, onChange }: VisualSelectorProps) => (
    <div className="space-y-6">
        {/* How to Check */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Glasses className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
                <div className="font-semibold text-blue-800 text-sm">How to check:</div>
                <div className="text-blue-700 text-sm">{definition.howToCheck}</div>
            </div>
        </div>

        {/* Why it Matters */}
        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
                <div className="font-semibold text-purple-800 text-sm">Why it matters:</div>
                <div className="text-purple-700 text-sm">{definition.whyItMatters}</div>
            </div>
        </div>

        {/* Visual Options - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {definition.visualOptions.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${value === option.value
                        ? 'bg-gradient-to-br from-[#FDF8F3] to-white border-[#B8860B] shadow-lg ring-2 ring-[#B8860B]'
                        : 'bg-white border-gray-100 hover:border-[#B8860B]/30 hover:bg-[#FDF8F3]/30'
                        }`}
                >
                    {value === option.value && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-[#B8860B] rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    )}

                    {/* Visual Icon - Big and Clear */}
                    <div className="text-5xl text-center mb-3">{option.visual}</div>

                    {/* Label */}
                    <div className="font-bold text-[#1A1612] text-lg text-center mb-2">{option.label}</div>

                    {/* Clear Description */}
                    <div className="text-sm text-[#5A554F] text-center mb-3">{option.description}</div>

                    {/* Example */}
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded text-center">
                        {option.example}
                    </div>
                </button>
            ))}
        </div>

        {/* Not Sure Option */}
        <button
            type="button"
            onClick={() => onChange('skip')}
            className={`w-full p-4 rounded-xl border-2 text-center transition-all ${value === 'skip'
                ? 'bg-amber-50 border-amber-400 text-amber-800'
                : 'border-dashed border-gray-300 text-gray-500 hover:border-amber-300 hover:bg-amber-50'
                }`}
        >
            <span className="font-medium">↪ Not sure / Cannot determine</span>
        </button>
    </div>
));
VisualSelector.displayName = 'VisualSelector';

interface SpecialMarksInputProps {
    value: string[];
    onChange: (marks: string[]) => void;
}

const SpecialMarksInput = memo(({ value, onChange }: SpecialMarksInputProps) => {
    const [localValue, setLocalValue] = useState(value.join(', '));

    // Sync local state when external value changes (e.g. draft load)
    useEffect(() => {
        const joined = value.join(', ');
        if (joined !== localValue) {
            setLocalValue(joined);
        }
    }, [value]);

    const commitSpecialMarksOnBlur = () => {
        const marks = localValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (JSON.stringify(marks) !== JSON.stringify(value)) {
            onChange(marks);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#B8860B]/10">
                    <Fingerprint className="w-5 h-5 text-[#B8860B]" />
                </div>
                <div>
                    <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-bold text-[#1A1612]">Special Marks (Optional)</h3>
                    <p className="text-xs text-[#5A554F]">Birthmarks, moles, scars - these help with accuracy</p>
                </div>
            </div>
            <textarea
                className="w-full min-h-[100px] p-4 rounded-xl border border-[#F0E8DE] bg-white focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] outline-none text-sm"
                placeholder="Mole on left cheek, scar on right arm, birthmark on back..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={commitSpecialMarksOnBlur}
            />
        </div>
    );
});
SpecialMarksInput.displayName = 'SpecialMarksInput';

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function Step3PhysicalTraits({ physicalTraits, updateTraits }: Step3Props) {
    const [activeTraitId, setActiveTraitId] = useState<string>(TRAIT_DEFINITIONS[0].id);

    const activeDefinition = TRAIT_DEFINITIONS.find(d => d.id === activeTraitId)!;

    // Get current value for a trait
    const getValue = (traitId: string): string => {
        const traits = physicalTraits || {};
        switch (traitId) {
            case 'eyes': return traits?.facialStructure?.eyeShape || '';
            case 'nose': return traits?.facialStructure?.noseShape || '';
            case 'forehead': return traits?.facialStructure?.forehead || '';
            case 'jaw': return traits?.facialStructure?.jawLine || '';
            case 'lips': return traits?.facialStructure?.lips || '';
            case 'ears': return traits?.facialStructure?.ears || '';
            case 'voice': return traits?.facialStructure?.voicePitch || '';
            case 'skin': return traits?.skinHair?.complexion || '';
            case 'hair': return traits?.skinHair?.hairType || '';
            case 'build': return traits?.build || '';
            case 'height':
                const h = traits?.height;
                const cmValue = typeof h === 'number' ? h : (typeof h === 'object' && h !== null ? h.cm : null);
                if (cmValue !== null) {
                    if (cmValue < 163) return 'short';
                    if (cmValue > 178) return 'tall';
                    return 'average';
                }
                return '';
            default: return '';
        }
    };

    const updatePhysicalTraitValue = useCallback((val: string) => {
        switch (activeTraitId) {
            case 'eyes': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, eyeShape: val } }); break;
            case 'nose': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, noseShape: val } }); break;
            case 'forehead': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, forehead: val } }); break;
            case 'jaw': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, jawLine: val } }); break;
            case 'lips': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, lips: val } }); break;
            case 'ears': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, ears: val } }); break;
            case 'voice': updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, voicePitch: val } }); break;
            case 'skin': updateTraits({ skinHair: { ...physicalTraits?.skinHair, complexion: val } }); break;
            case 'hair': updateTraits({ skinHair: { ...physicalTraits?.skinHair, hairType: val } }); break;
            case 'build': updateTraits({ build: val }); break;
            case 'height':
                const cm = val === 'short' ? 155 : val === 'tall' ? 183 : 170;
                updateTraits({ height: { cm, feet: Math.floor(cm / 30.48), inches: Math.round((cm % 30.48) / 2.54) } });
                break;
            default:
                break;
        }
    }, [activeTraitId, physicalTraits, updateTraits]);

    // Calculate progress
    const answeredCount = TRAIT_DEFINITIONS.filter(d => getValue(d.id) && getValue(d.id) !== 'skip').length;
    const progress = Math.round((answeredCount / TRAIT_DEFINITIONS.length) * 100);

    return (
        <div className="w-full max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Progress */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex-1 max-w-xs h-2 bg-[#F0E8DE] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#B8860B] to-[#78611D] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-medium text-[#5A554F] whitespace-nowrap">{answeredCount}/{TRAIT_DEFINITIONS.length} done</span>
            </div>

            {/* Header */}
            <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FDF8F3] to-white border border-[#F0E8DE] rounded-full text-xs mb-4">
                    <span className="text-[#B8860B] font-medium">Step 2 of 5</span>
                </div>
                <h1 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-[#1A1612] mb-2">
                    Physical <span className="text-[#B8860B]">Appearance</span>
                </h1>
                <p className="text-sm text-[#5A554F] max-w-md mx-auto">
                    Look in a mirror and select what matches you best. No astrology knowledge needed - just honest self-observation.
                </p>
            </div>

            {/* Trait Selector Tabs */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                    {TRAIT_DEFINITIONS.map((def) => {
                        const Icon = def.icon;
                        const isActive = activeTraitId === def.id;
                        const isAnswered = getValue(def.id) && getValue(def.id) !== 'skip';
                        return (
                            <button
                                key={def.id}
                                onClick={() => setActiveTraitId(def.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-[#B8860B] text-white shadow-md'
                                    : isAnswered
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-white text-[#5A554F] border border-[#F0E8DE] hover:border-[#B8860B]/30'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{def.name}</span>
                                {isAnswered && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl border border-[#F0E8DE] p-6 shadow-sm">
                {/* Trait Header */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#F0E8DE]">
                    <div className="p-3 rounded-xl bg-[#B8860B]/10">
                        {React.createElement(activeDefinition.icon, { className: 'w-6 h-6 text-[#B8860B]' })}
                    </div>
                    <div>
                        <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-bold text-[#1A1612]">
                            {activeDefinition.name}
                        </h2>
                        <p className="text-xs text-[#5A554F]">{activeDefinition.sanskrit}</p>
                    </div>
                </div>

                {/* Visual Selector */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTraitId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <VisualSelector
                            definition={activeDefinition}
                            value={getValue(activeTraitId)}
                            onChange={updatePhysicalTraitValue}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Special Marks */}
                <div className="mt-8 pt-6 border-t border-[#F0E8DE]">
                    <SpecialMarksInput
                        value={physicalTraits?.skinHair?.marks || []}
                        onChange={(marks) => updateTraits({ skinHair: { ...physicalTraits?.skinHair, marks } })}
                    />
                </div>
            </div>

            {/* Navigation Hint */}
            <div className="mt-6 flex justify-between items-center text-sm">
                <div className="text-[#5A554F]">
                    {progress < 100 && (
                        <span>Tip: You can skip traits you&apos;re unsure about</span>
                    )}
                </div>
                <div className="text-[#B8860B] font-medium">
                    {progress === 100 ? '✓ All traits selected!' : `${100 - progress}% remaining`}
                </div>
            </div>
        </div>
    );
}
