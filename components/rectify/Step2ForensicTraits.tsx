/**
 * Step2ForensicTraits - Forensic Traits Matrix Form
 * Comprehensive forensic data collection for birth time rectification
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForensicTraits } from '@/lib/types';
import { FormCard } from '@/components/ui/form/FormCard';
import { FormField } from '@/components/ui/form/FormField';
import {
  Brain, Activity, Speech, Users, User, HelpCircle, Info,
  ScanFace, Moon, Zap, Ruler
} from 'lucide-react';

interface Step2Props {
  traits: ForensicTraits;
  updateTraits: (traits: Partial<ForensicTraits>) => void;
}

type TabId = 'mukha' | 'deha' | 'vyaktitva' | 'kula';

const TABS = [
  { id: 'mukha' as TabId, label: 'Mukha (Face)', icon: ScanFace },
  { id: 'deha' as TabId, label: 'Deha (Body)', icon: Activity },
  { id: 'vyaktitva' as TabId, label: 'Vyaktitva (Behavior)', icon: Speech },
  { id: 'kula' as TabId, label: 'Kula (Family)', icon: Users },
];

interface TraitOption {
  value: string;
  label: string;
  emoji: string;
  guide: string;
}

interface TraitGroupProps {
  label: string;
  icon: React.ElementType;
  options: TraitOption[];
  value?: string;
  onChange: (value: string) => void;
  description?: string;
  columns?: 2 | 3 | 4;
}

function TraitGroup({ label, icon: Icon, options, value, onChange, description, columns = 3 }: TraitGroupProps) {
  const [showHelp, setShowHelp] = useState(false);

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className="space-y-4">
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
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-full transition-all ${showHelp ? 'bg-[#E8A849] text-black' : 'hover:bg-white/5 text-[#8C7F72]'}`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#6B9AC4]/10 border border-[#6B9AC4]/20 rounded-xl p-4 mb-4 text-xs leading-relaxed text-[#C4B8AD] flex gap-3">
              <Info className="w-4 h-4 text-[#6B9AC4] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#6B9AC4]">Vedic Logic:</strong> These markers correlate to divisional chart degrees and help verify Lagna (Ascendant) accuracy.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid gap-3 ${gridCols[columns]}`}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${
              value === opt.value
                ? 'bg-[#E8A849]/10 border-[#E8A849] shadow-[0_0_20px_rgba(232,168,73,0.1)]'
                : 'bg-[#2E2724] border-[#C4B8AD]/20 hover:border-[#E8A849]/50'
            }`}
          >
            {value === opt.value && (
              <div className="absolute top-2 right-2">
                <span className="text-[#E8A849]">✓</span>
              </div>
            )}
            <div className="text-2xl mb-2">{opt.emoji}</div>
            <div className="font-bold text-[#F5F0EB] text-sm mb-1">{opt.label}</div>
            <div className="text-[10px] text-[#8C7F72] italic leading-tight group-hover:text-[#C4B8AD] transition-colors">
              &ldquo;{opt.guide}&rdquo;
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Step2ForensicTraits({ traits, updateTraits }: Step2Props) {
  const [activeTab, setActiveTab] = useState<TabId>('mukha');
  const safeTraits = traits || {};

  const updatePhysical = useCallback((updates: Partial<NonNullable<ForensicTraits['physical']>>) => {
    updateTraits({
      physical: { ...safeTraits.physical, ...updates }
    });
  }, [safeTraits.physical, updateTraits]);

  const updateFacial = useCallback((updates: Partial<NonNullable<NonNullable<ForensicTraits['physical']>>['facialStructure']>) => {
    updateTraits({
      physical: {
        ...safeTraits.physical,
        facialStructure: { ...safeTraits.physical?.facialStructure, ...updates }
      }
    });
  }, [safeTraits.physical, updateTraits]);

  const updateSkinHair = useCallback((updates: Partial<NonNullable<NonNullable<ForensicTraits['physical']>>['skinHair']>) => {
    updateTraits({
      physical: {
        ...safeTraits.physical,
        skinHair: { ...safeTraits.physical?.skinHair, ...updates }
      }
    });
  }, [safeTraits.physical, updateTraits]);

  const updatePsychographic = useCallback((updates: Partial<NonNullable<ForensicTraits['psychographic']>>) => {
    updateTraits({
      psychographic: { ...safeTraits.psychographic, ...updates }
    });
  }, [safeTraits.psychographic, updateTraits]);

  const updateBiological = useCallback((updates: Partial<NonNullable<ForensicTraits['biological']>>) => {
    updateTraits({
      biological: { ...safeTraits.biological, ...updates }
    });
  }, [safeTraits.biological, updateTraits]);

  const updateFamily = useCallback((updates: Partial<NonNullable<ForensicTraits['family']>>) => {
    updateTraits({
      family: { ...safeTraits.family, ...updates }
    });
  }, [safeTraits.family, updateTraits]);

  const FOREHEAD_OPTIONS: TraitOption[] = [
    { value: 'broad', label: 'Broad/High', emoji: '🧠', guide: 'Wide forehead indicates Sun/Jupiter prominence - leadership, intelligence' },
    { value: 'narrow', label: 'Narrow', emoji: '🤏', guide: 'Narrow forehead shows Saturn influence - focused, practical mindset' },
    { value: 'average', label: 'Average', emoji: '➖', guide: 'Average width suggests mixed planetary influences' },
    { value: 'sloping', label: 'Sloping', emoji: '📐', guide: 'Sloping forehead indicates Mercury/Mars signature - quick thinking' }
  ];

  const EYE_OPTIONS: TraitOption[] = [
    { value: 'deep_set', label: 'Deep Set', emoji: '🕶️', guide: 'Deep set eyes show Saturnine depth - introspective, serious nature' },
    { value: 'prominent', label: 'Prominent', emoji: '👁️', guide: 'Prominent eyes indicate Mars/Moon intensity - emotional expressiveness' },
    { value: 'almond', label: 'Almond', emoji: '🌰', guide: 'Almond shape reveals Venusian grace - artistic, harmonious nature' },
    { value: 'round', label: 'Round/Large', emoji: '😳', guide: 'Round eyes suggest Jupiterian expansiveness - optimistic, open-hearted' },
    { value: 'small', label: 'Small/Piercing', emoji: '🎯', guide: 'Small piercing eyes indicate Mercurial sharpness - analytical, precise' }
  ];

  const VOICE_OPTIONS: TraitOption[] = [
    { value: 'deep', label: 'Deep/Grave', emoji: '🎙️', guide: 'Deep voice indicates Saturn/Jupiter influence - authority, wisdom' },
    { value: 'high', label: 'High Pitch', emoji: '🎵', guide: 'High pitch shows Mercury/Mars energy - quick, energetic communication' },
    { value: 'medium', label: 'Medium', emoji: '🗣️', guide: 'Medium voice suggests balanced Solar/Lunar energy' },
    { value: 'soft', label: 'Soft/Melodious', emoji: '🎶', guide: 'Soft voice reveals Venusian beauty - diplomatic, charming' },
    { value: 'raspy', label: 'Raspy/Strong', emoji: '🐯', guide: 'Raspy voice indicates Rahu/Mars power - unconventional strength' }
  ];

  const PRAKRITI_OPTIONS: TraitOption[] = [
    { value: 'vata', label: 'Vata (Slim)', emoji: '🌬️', guide: 'Air/Space dominant. Bony frame, dry skin. Creative, energetic, anxious.' },
    { value: 'pitta', label: 'Pitta (Athletic)', emoji: '🔥', guide: 'Fire/Water dominant. Medium build, muscular, warm body. Ambitious, focused.' },
    { value: 'kapha', label: 'Kapha (Solid)', emoji: '🌍', guide: 'Earth/Water dominant. Heavy, robust, oily skin. Calm, loyal, steady.' },
    { value: 'vata-pitta', label: 'Vata-Pitta', emoji: '💨🔥', guide: 'Air-Fire mix. Slim but intense. Creative drive with sharp intellect.' },
    { value: 'pitta-kapha', label: 'Pitta-Kapha', emoji: '🔥🌍', guide: 'Fire-Earth mix. Broad muscular build. Determined with emotional stability.' }
  ];

  const SPEECH_OPTIONS: TraitOption[] = [
    { value: 'fast_loud', label: 'Fast & Loud', emoji: '🗣️', guide: 'Mars/Sun dominance. Assertive, commanding, impulsive speaker.' },
    { value: 'measured_soft', label: 'Measured & Soft', emoji: '🧘', guide: 'Saturn/Jupiter influence. Thoughtful, wise, authoritative speech.' },
    { value: 'argumentative', label: 'Logical/Debate', emoji: '⚖️', guide: 'Mercury/Mars sharpness. Analytical, questioning, precise.' },
    { value: 'concise', label: 'Concise/Brief', emoji: '✂️', guide: 'Ketu influence. Minimal words, spiritual detachment in speech.' },
    { value: 'talkative', label: 'Highly Talkative', emoji: '🎭', guide: 'Rahu/Mercury combination. Versatile, clever, sometimes deceptive.' }
  ];

  const DECISION_OPTIONS: TraitOption[] = [
    { value: 'impulsive', label: 'Impulsive/Fast', emoji: '⚡', guide: 'Mars energy. Quick decisions, action-oriented, sometimes rash.' },
    { value: 'deliberate', label: 'Deliberate/Slow', emoji: '🐢', guide: 'Saturnian caution. Careful analysis, methodical, patient.' },
    { value: 'indecisive', label: 'Indecisive', emoji: '🌊', guide: 'Lunar influence. Emotionally swayed, changeable mind.' },
    { value: 'intuitive', label: 'Intuitive', emoji: '🔮', guide: 'Jupiter/Neptune wisdom. Gut feeling, spiritual guidance.' }
  ];

  const SIBLING_OPTIONS: TraitOption[] = [
    { value: 'eldest', label: 'Eldest', emoji: '👑', guide: 'Sun/Mars influence. Natural leader, responsible, authoritative.' },
    { value: 'middle', label: 'Middle', emoji: '🤝', guide: 'Mercury/Venus influence. Diplomatic, adaptable, peacemaker.' },
    { value: 'youngest', label: 'Youngest', emoji: '👶', guide: 'Moon/Jupiter influence. Nurtured, creative, free-spirited.' },
    { value: 'only_child', label: 'Only Child', emoji: '🌟', guide: 'Unique planetary focus. Self-centered, independent, mature early.' }
  ];

  const FATHER_STATUS_OPTIONS: TraitOption[] = [
    { value: 'struggling', label: 'Struggling', emoji: '⛰️', guide: '9th Lord challenges. Financial difficulties, health issues for father.' },
    { value: 'stable', label: 'Stable/Middle', emoji: '⚖️', guide: 'Standard 9th strength. Average circumstances, comfortable life.' },
    { value: 'prosperous', label: 'Prosperous', emoji: '💎', guide: 'Strong 9th/10th houses. Wealthy, successful, respected father.' },
    { value: 'highly_distinguished', label: 'Distinguished', emoji: '🏆', guide: 'Raja Yoga in 9th/10th. Very famous, powerful, elite status.' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8A849]/10 border border-[#E8A849]/20 text-[#E8A849] text-xs font-bold uppercase tracking-widest mb-4">
          <span>STEP 2 OF 4</span>
        </div>
        <h1 className="text-3xl font-black text-[#F5F0EB] mb-2">Forensic Traits Matrix</h1>
        <p className="text-[#8C7F72] text-sm max-w-xl mx-auto">
          We require absolute precision for sub-second rectification. Every detail here clears ambiguity in the Lagna and D-60 charts.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-xl mb-8 sticky top-4 z-20 shadow-xl">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-[#E8A849] text-[#1A1614] shadow-lg'
                  : 'text-[#8C7F72] hover:text-[#F5F0EB] hover:bg-white/5'
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
          {activeTab === 'mukha' && (
            <motion.div
              key="mukha"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <FormCard>
                <TraitGroup
                  label="Forehead (Lalat)"
                  icon={Brain}
                  options={FOREHEAD_OPTIONS}
                  value={safeTraits.physical?.facialStructure?.forehead}
                  onChange={(val) => updateFacial({ forehead: val })}
                />
              </FormCard>

              <FormCard>
                <TraitGroup
                  label="Eyes (Netra)"
                  icon={ScanFace}
                  options={EYE_OPTIONS}
                  value={safeTraits.physical?.facialStructure?.eyeShape}
                  onChange={(val) => updateFacial({ eyeShape: val })}
                  columns={4}
                />
              </FormCard>

              <FormCard>
                <TraitGroup
                  label="Voice Texture"
                  icon={Speech}
                  options={VOICE_OPTIONS}
                  value={safeTraits.physical?.facialStructure?.voicePitch}
                  onChange={(val) => updateFacial({ voicePitch: val })}
                  columns={4}
                />
              </FormCard>
            </motion.div>
          )}

          {activeTab === 'deha' && (
            <motion.div
              key="deha"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <FormCard>
                <TraitGroup
                  label="Body Constitution (Prakriti)"
                  icon={Activity}
                  options={PRAKRITI_OPTIONS}
                  value={safeTraits.biological?.prakriti}
                  onChange={(val) => updateBiological({ prakriti: val })}
                />
              </FormCard>

              <FormCard>
                <FormField label="Significant Marks/Moles">
                  <textarea
                    className="w-full h-32 bg-[#2E2724] border border-[#C4B8AD]/20 rounded-xl p-4 text-sm text-[#F5F0EB] outline-none focus:border-[#E8A849] resize-none"
                    placeholder="e.g., Large mole on right cheek, birthmark on shoulder..."
                    value={(safeTraits.physical?.skinHair?.marks || []).join('\n')}
                    onChange={(e) => updateSkinHair({ marks: e.target.value.split('\n').filter(m => m.trim()) })}
                  />
                </FormField>
              </FormCard>
            </motion.div>
          )}

          {activeTab === 'vyaktitva' && (
            <motion.div
              key="vyaktitva"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <FormCard>
                <TraitGroup
                  label="Speech Style (Vani)"
                  icon={Speech}
                  options={SPEECH_OPTIONS}
                  value={safeTraits.psychographic?.speechStyle}
                  onChange={(val) => updatePsychographic({ speechStyle: val })}
                />
              </FormCard>

              <FormCard>
                <TraitGroup
                  label="Decision Making (Nirnaya)"
                  icon={Zap}
                  options={DECISION_OPTIONS}
                  value={safeTraits.psychographic?.decisionMaking}
                  onChange={(val) => updatePsychographic({ decisionMaking: val })}
                />
              </FormCard>
            </motion.div>
          )}

          {activeTab === 'kula' && (
            <motion.div
              key="kula"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <FormCard>
                <TraitGroup
                  label="Sibling Order (Anuj)"
                  icon={Users}
                  options={SIBLING_OPTIONS}
                  value={safeTraits.family?.siblingPosition}
                  onChange={(val) => updateFamily({ siblingPosition: val })}
                />
              </FormCard>

              <FormCard>
                <TraitGroup
                  label="Father's Status at Birth (Pitri)"
                  icon={User}
                  options={FATHER_STATUS_OPTIONS}
                  value={safeTraits.family?.fatherStatusAtBirth}
                  onChange={(val) => updateFamily({ fatherStatusAtBirth: val })}
                />
              </FormCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
