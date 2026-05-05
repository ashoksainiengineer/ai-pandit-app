'use client';

/**
 * Step2PhysicalTraits — Simplified Lagna Elimination
 *
 * Replaces the previous 55-option physical traits page with 3 simple
 * questions about broad body characteristics. Users can reliably self-assess
 * these without confusion. Each answer eliminates impossible Lagna signs
 * using classical Vedic Tattva/Guna frameworks.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User, Sun, Zap, CheckCircle2, AlertTriangle, Sparkles,
} from 'lucide-react';
import {
  type BodyFrame,
  type SkinTone,
  type NaturalSpeed,
  type LagnaScore,
  BODY_FRAME_LABELS,
  SKIN_TONE_LABELS,
  NATURAL_SPEED_LABELS,
  inferLagnaFromPhysical,
} from '@ai-pandit/shared';
import type { ForensicTraits } from '@/lib/types';

// ═══════════════════════ TYPES ═══════════════════════

interface Step2PhysicalTraitsProps {
  physicalTraits: ForensicTraits['physical'];
  updateTraits: (updates: Partial<ForensicTraits['physical']>) => void;
}

interface QuestionOption<T> {
  value: T;
  label: string;
  icon: React.ReactNode;
  description: string;
  indicatorSigns: string;
}

// ═══════════════════════ QUESTION DATA ═══════════════════════

const BODY_FRAME_OPTIONS: QuestionOption<BodyFrame>[] = [
  {
    value: 'thin_bony', label: 'Thin / Bony',
    icon: <User className="w-8 h-8" />,
    description: 'Bones visible, hard to gain weight. Naturally lean frame.',
    indicatorSigns: 'Mithuna, Kanya, Tula, Kumbha, Makara',
  },
  {
    value: 'athletic_muscular', label: 'Athletic / Muscular',
    icon: <Zap className="w-8 h-8" />,
    description: 'Medium build, defined muscles. Builds strength easily.',
    indicatorSigns: 'Mesha, Simha, Dhanu, Vrischika',
  },
  {
    value: 'soft_rounded', label: 'Soft / Rounded',
    icon: <Sparkles className="w-8 h-8" />,
    description: 'Gains weight easily. Softer body contours and curves.',
    indicatorSigns: 'Vrishabha, Karka, Meena',
  },
];

const SKIN_TONE_OPTIONS: QuestionOption<SkinTone>[] = [
  {
    value: 'very_fair', label: 'Very Fair / Pale',
    icon: <Sun className="w-8 h-8 text-amber-400" />,
    description: 'Light complexion, burns easily in the sun.',
    indicatorSigns: 'Vrishabha, Mithuna, Karka, Tula, Meena',
  },
  {
    value: 'wheatish_golden', label: 'Wheatish / Golden',
    icon: <Sun className="w-8 h-8 text-orange-500" />,
    description: 'Golden-brown complexion. Most common in Indian subcontinent.',
    indicatorSigns: 'Mesha, Simha, Kanya, Dhanu, Kumbha',
  },
  {
    value: 'dark_dusky', label: 'Dark / Dusky',
    icon: <Sun className="w-8 h-8 text-amber-800" />,
    description: 'Deep, rich dark complexion.',
    indicatorSigns: 'Vrischika, Makara, Kumbha',
  },
];

const NATURAL_SPEED_OPTIONS: QuestionOption<NaturalSpeed>[] = [
  {
    value: 'fast_quick', label: 'Fast & Quick',
    icon: <Zap className="w-8 h-8 text-red-500" />,
    description: 'Walk fast, talk fast, think fast. High innate energy.',
    indicatorSigns: 'Mesha, Mithuna, Simha, Kanya, Tula, Dhanu, Kumbha',
  },
  {
    value: 'balanced', label: 'Balanced Pace',
    icon: <Zap className="w-8 h-8 text-blue-500" />,
    description: 'Neither fast nor slow. Measured, moderate tempo.',
    indicatorSigns: 'Simha, Kanya, Tula, Vrischika, Dhanu, Kumbha',
  },
  {
    value: 'slow_deliberate', label: 'Slow & Steady',
    icon: <Zap className="w-8 h-8 text-emerald-600" />,
    description: 'Calm, steady, deliberate. You take your time by nature.',
    indicatorSigns: 'Vrishabha, Karka, Vrischika, Makara, Meena',
  },
];

// ═══════════════════════ SUB-COMPONENTS ═══════════════════════

function OptionCard<T extends string>({
  option, selected, onSelect,
}: {
  option: QuestionOption<T>;
  selected: boolean;
  onSelect: (v: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 w-full ${
        selected
          ? 'bg-gradient-to-br from-amber-50 to-white border-amber-500 shadow-lg ring-2 ring-amber-500/30'
          : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2.5 rounded-xl ${selected ? 'bg-amber-100' : 'bg-slate-100'}`}>
          {option.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#1A1612] text-sm sm:text-base">{option.label}</div>
          <div className="text-xs sm:text-sm text-[#5A554F] mt-1">{option.description}</div>
          <div className="text-[10px] sm:text-xs text-amber-700 mt-2 font-medium opacity-75">
            {option.indicatorSigns}
          </div>
        </div>
      </div>
    </button>
  );
}

function LagnaFeedback({ scores }: { scores: LagnaScore[] }) {
  const strong = scores.filter((s) => s.confidence === 'strong');
  const eliminated = scores.filter((s) => s.confidence === 'eliminated');
  if (!strong.length && !eliminated.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3"
    >
      {strong.length > 0 && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
          </div>
          <div>
            <div className="font-semibold text-emerald-800 text-xs sm:text-sm">
              Strong Match ({strong.length}/12 signs)
            </div>
            <div className="text-emerald-700 text-xs sm:text-sm mt-0.5">
              {strong.map((s) => s.sign).join(', ')}
            </div>
          </div>
        </div>
      )}
      {eliminated.length > 0 && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
          </div>
          <div>
            <div className="font-semibold text-red-800 text-xs sm:text-sm">
              Eliminated ({eliminated.length}/12)
            </div>
            <div className="text-red-700 text-xs sm:text-sm mt-0.5">
              {eliminated.map((s) => s.sign).join(', ')}
            </div>
            <div className="text-[10px] sm:text-xs text-red-500 mt-1">
              These contradict your body type — down-weighted in rectification.
            </div>
          </div>
        </div>
      )}
      {!strong.length && (
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
          </div>
          <div className="text-amber-700 text-xs sm:text-sm">
            No single perfect match — life events + dasha will be the tiebreaker.
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════ EXTRACT EXISTING VALUES ═══════════════════════

function extractBodyFrame(traits: ForensicTraits['physical']): BodyFrame | null {
  const build = traits?.build;
  if (build === 'slim') return 'thin_bony';
  if (build === 'athletic') return 'athletic_muscular';
  if (build === 'heavy') return 'soft_rounded';
  if (build === 'average') return 'athletic_muscular';
  return null;
}

function extractSkinTone(traits: ForensicTraits['physical']): SkinTone | null {
  const c = traits?.skinHair?.complexion;
  if (c === 'fair') return 'very_fair';
  if (c === 'wheatish') return 'wheatish_golden';
  if (c === 'dark') return 'dark_dusky';
  return null;
}

function extractNaturalSpeed(traits: ForensicTraits['physical']): NaturalSpeed | null {
  const voice = traits?.facialStructure?.voicePitch;
  if (voice === 'loud' || voice === 'fast') return 'fast_quick';
  if (voice === 'deep' || voice === 'soft') return 'slow_deliberate';
  return null;
}

// ═══════════════════════ MAIN ═══════════════════════

export default function Step2PhysicalTraits({
  physicalTraits, updateTraits,
}: Step2PhysicalTraitsProps) {
  const [bodyFrame, setBodyFrame] = useState<BodyFrame | null>(
    () => extractBodyFrame(physicalTraits) ?? null,
  );
  const [skinTone, setSkinTone] = useState<SkinTone | null>(
    () => extractSkinTone(physicalTraits) ?? null,
  );
  const [naturalSpeed, setNaturalSpeed] = useState<NaturalSpeed | null>(
    () => extractNaturalSpeed(physicalTraits) ?? null,
  );

  const lagnaResult = useMemo(() => {
    if (!bodyFrame || !skinTone || !naturalSpeed) return null;
    return inferLagnaFromPhysical({ bodyFrame, skinTone, naturalSpeed });
  }, [bodyFrame, skinTone, naturalSpeed]);

  const answeredCount = [bodyFrame, skinTone, naturalSpeed].filter(Boolean).length;

  const handleBodyFrame = useCallback((v: BodyFrame) => {
    setBodyFrame(v);
    const build = v === 'thin_bony' ? 'slim' : v === 'athletic_muscular' ? 'athletic' : 'heavy';
    updateTraits({ build });
  }, [updateTraits]);

  const handleSkinTone = useCallback((v: SkinTone) => {
    setSkinTone(v);
    const complexion = v === 'very_fair' ? 'fair' : v === 'wheatish_golden' ? 'wheatish' : 'dark';
    updateTraits({ skinHair: { ...physicalTraits?.skinHair, complexion } });
  }, [updateTraits, physicalTraits]);

  const handleNaturalSpeed = useCallback((v: NaturalSpeed) => {
    setNaturalSpeed(v);
    const voicePitch = v === 'fast_quick' ? 'fast' : 'deep';
    updateTraits({ facialStructure: { ...physicalTraits?.facialStructure, voicePitch } });
  }, [updateTraits, physicalTraits]);

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-full text-xs mb-4">
          <span className="text-amber-700 font-medium">Step 2 of 5</span>
        </div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-2xl sm:text-3xl font-semibold text-[#1A1612] mb-2">
          Your Natural <span className="text-amber-700">Body Type</span>
        </h1>
        <p className="text-sm text-[#5A554F] max-w-md mx-auto">
          Just 3 simple questions — no mirror analysis needed. Each answer helps eliminate wrong birth times.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex-1 max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-500"
            style={{ width: `${Math.round((answeredCount / 3) * 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-400">{answeredCount}/3</span>
      </div>

      {/* Q1: Body Frame */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-100"><User className="w-5 h-5 text-amber-700" /></div>
          <div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-bold text-[#1A1612]">
              What is your natural body frame?
            </h2>
            <p className="text-xs text-slate-400">Not your gym goal — your lifelong, natural build.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BODY_FRAME_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} option={opt} selected={bodyFrame === opt.value} onSelect={handleBodyFrame} />
          ))}
        </div>
      </div>

      {/* Q2: Skin Tone */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-100"><Sun className="w-5 h-5 text-amber-700" /></div>
          <div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-bold text-[#1A1612]">
              What is your natural skin tone?
            </h2>
            <p className="text-xs text-slate-400">Your untanned, natural complexion.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SKIN_TONE_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} option={opt} selected={skinTone === opt.value} onSelect={handleSkinTone} />
          ))}
        </div>
      </div>

      {/* Q3: Natural Speed */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-100"><Zap className="w-5 h-5 text-amber-700" /></div>
          <div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-bold text-[#1A1612]">
              What is your natural pace?
            </h2>
            <p className="text-xs text-slate-400">Your innate tempo — not learned behavior.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {NATURAL_SPEED_OPTIONS.map((opt) => (
            <OptionCard key={opt.value} option={opt} selected={naturalSpeed === opt.value} onSelect={handleNaturalSpeed} />
          ))}
        </div>
      </div>

      {/* Lagna elimination feedback */}
      {lagnaResult && <LagnaFeedback scores={lagnaResult.scores} />}

      {answeredCount < 3 && (
        <div className="mt-6 text-center text-xs text-slate-400">
          Answer all 3 questions to see Lagna elimination results.
        </div>
      )}
    </div>
  );
}
