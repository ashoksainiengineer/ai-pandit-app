/**
 * Step2ForensicTraits - Forensic Traits Matrix Form
 * Comprehensive forensic data collection with gender-aware emojis
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ForensicTraits } from '@/lib/types';
import { FormCard } from '@/components/ui/form/FormCard';
import { FormField } from '@/components/ui/form/FormField';
import { getForensicEmoji, Gender } from '@/lib/forensic-emojis';
import {
  Brain, Activity, Speech, Users, User, HelpCircle, Info,
  ScanFace, Zap
} from 'lucide-react';

interface Step2Props {
  traits: ForensicTraits;
  updateTraits: (traits: Partial<ForensicTraits>) => void;
  gender?: Gender;
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
  gender: Gender;
}

function TraitGroup({ label, icon: Icon, options, value, onChange, description, columns = 3, gender }: TraitGroupProps) {
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
          <div className="p-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <Icon className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#F5F0EB] uppercase tracking-wide">{label}</h3>
            {description && <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">{description}</p>}
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-full transition-all ${showHelp ? 'bg-[#D4AF37] text-[#0A0F1C]' : 'hover:bg-white/5 text-[#8C7F72]'}`}
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
                ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                : 'bg-[#0F1419] border-[#2A3442] hover:border-[#D4AF37]/50'
            }`}
          >
            {value === opt.value && (
              <div className="absolute top-2 right-2">
                <span className="text-[#D4AF37]">✓</span>
              </div>
            )}
            <div className="text-2xl mb-2">{getForensicEmoji(opt.value, gender)}</div>
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

export default function Step2ForensicTraits({ traits, updateTraits, gender = 'other' }: Step2Props) {
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

  // Trait options (without emojis - emojis are computed based on gender)
  const FOREHEAD_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'broad', label: 'Broad/High', guide: 'Wide forehead indicates Sun/Jupiter prominence - leadership, intelligence' },
    { value: 'narrow', label: 'Narrow', guide: 'Narrow forehead shows Saturn influence - focused, practical mindset' },
    { value: 'average', label: 'Average', guide: 'Average width suggests mixed planetary influences' },
    { value: 'sloping', label: 'Sloping', guide: 'Sloping forehead indicates Mercury/Mars signature - quick thinking' }
  ], []);

  const EYE_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'deep_set', label: 'Deep Set', guide: 'Deep set eyes show Saturnine depth - introspective, serious nature' },
    { value: 'prominent', label: 'Prominent', guide: 'Prominent eyes indicate Mars/Moon intensity - emotional expressiveness' },
    { value: 'almond', label: 'Almond', guide: 'Almond shape reveals Venusian grace - artistic, harmonious nature' },
    { value: 'round', label: 'Round/Large', guide: 'Round eyes suggest Jupiterian expansiveness - optimistic, open-hearted' },
    { value: 'small', label: 'Small/Piercing', guide: 'Small piercing eyes indicate Mercurial sharpness - analytical, precise' }
  ], []);

  const VOICE_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'deep', label: 'Deep/Grave', guide: 'Deep voice indicates Saturn/Jupiter influence - authority, wisdom' },
    { value: 'high', label: 'High Pitch', guide: 'High pitch shows Mercury/Mars energy - quick, energetic communication' },
    { value: 'medium', label: 'Medium', guide: 'Medium voice suggests balanced Solar/Lunar energy' },
    { value: 'soft', label: 'Soft/Melodious', guide: 'Soft voice reveals Venusian beauty - diplomatic, charming' },
    { value: 'raspy', label: 'Raspy/Strong', guide: 'Raspy voice indicates Rahu/Mars power - unconventional strength' }
  ], []);

  const PRAKRITI_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'vata', label: 'Vata (Slim)', guide: 'Air/Space dominant. Bony frame, dry skin. Creative, energetic, anxious.' },
    { value: 'pitta', label: 'Pitta (Athletic)', guide: 'Fire/Water dominant. Medium build, muscular, warm body. Ambitious, focused.' },
    { value: 'kapha', label: 'Kapha (Solid)', guide: 'Earth/Water dominant. Heavy, robust, oily skin. Calm, loyal, steady.' },
    { value: 'vata-pitta', label: 'Vata-Pitta', guide: 'Air-Fire mix. Slim but intense. Creative drive with sharp intellect.' },
    { value: 'pitta-kapha', label: 'Pitta-Kapha', guide: 'Fire-Earth mix. Broad muscular build. Determined with emotional stability.' }
  ], []);

  const SPEECH_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'fast_loud', label: 'Fast & Loud', guide: 'Mars/Sun dominance. Assertive, commanding, impulsive speaker.' },
    { value: 'measured_soft', label: 'Measured & Soft', guide: 'Saturn/Jupiter influence. Thoughtful, wise, authoritative speech.' },
    { value: 'argumentative', label: 'Logical/Debate', guide: 'Mercury/Mars sharpness. Analytical, questioning, precise.' },
    { value: 'concise', label: 'Concise/Brief', guide: 'Ketu influence. Minimal words, spiritual detachment in speech.' },
    { value: 'talkative', label: 'Highly Talkative', guide: 'Rahu/Mercury combination. Versatile, clever, sometimes deceptive.' }
  ], []);

  const DECISION_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'impulsive', label: 'Impulsive/Fast', guide: 'Mars energy. Quick decisions, action-oriented, sometimes rash.' },
    { value: 'deliberate', label: 'Deliberate/Slow', guide: 'Saturnian caution. Careful analysis, methodical, patient.' },
    { value: 'indecisive', label: 'Indecisive', guide: 'Lunar influence. Emotionally swayed, changeable mind.' },
    { value: 'intuitive', label: 'Intuitive', guide: 'Jupiter/Neptune wisdom. Gut feeling, spiritual guidance.' }
  ], []);

  const SIBLING_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'eldest', label: 'Eldest', guide: 'Sun/Mars influence. Natural leader, responsible, authoritative.' },
    { value: 'middle', label: 'Middle', guide: 'Mercury/Venus influence. Diplomatic, adaptable, peacemaker.' },
    { value: 'youngest', label: 'Youngest', guide: 'Moon/Jupiter influence. Nurtured, creative, free-spirited.' },
    { value: 'only_child', label: 'Only Child', guide: 'Unique planetary focus. Self-centered, independent, mature early.' }
  ], []);

  const FATHER_STATUS_OPTIONS: TraitOption[] = useMemo(() => [
    { value: 'struggling', label: 'Struggling', guide: '9th Lord challenges. Financial difficulties, health issues for father.' },
    { value: 'stable', label: 'Stable/Middle', guide: 'Standard 9th strength. Average circumstances, comfortable life.' },
    { value: 'prosperous', label: 'Prosperous', guide: 'Strong 9th/10th houses. Wealthy, successful, respected father.' },
    { value: 'highly_distinguished', label: 'Distinguished', guide: 'Raja Yoga in 9th/10th. Very famous, powerful, elite status.' }
  ], []);

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4">
          <span>STEP 2 OF 4</span>
        </div>
        <h1 className="text-3xl font-black text-[#F5F0EB] mb-2">Forensic Traits Matrix</h1>
        <p className="text-[#8C7F72] text-sm max-w-xl mx-auto">
          We require absolute precision for sub-second rectification. Every detail here clears ambiguity in the Lagna and D-60 charts.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-[#0F1419] border border-[#2A3442] rounded-xl mb-8 sticky top-4 z-20 shadow-xl">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-[#D4AF37] text-[#0A0F1C] shadow-lg'
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
                  gender={gender}
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
                  gender={gender}
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
                  gender={gender}
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
                  gender={gender}
                />
              </FormCard>

              <FormCard>
                <FormField label="Significant Marks/Moles">
                  <textarea
                    className="w-full h-32 bg-[#0F1419] border border-[#2A3442] rounded-xl p-4 text-sm text-[#F5F0EB] outline-none focus:border-[#D4AF37] resize-none"
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
                  gender={gender}
                />
              </FormCard>

              <FormCard>
                <TraitGroup
                  label="Decision Making (Nirnaya)"
                  icon={Zap}
                  options={DECISION_OPTIONS}
                  value={safeTraits.psychographic?.decisionMaking}
                  onChange={(val) => updatePsychographic({ decisionMaking: val })}
                  gender={gender}
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
                  gender={gender}
                />
              </FormCard>

              <FormCard>
                <TraitGroup
                  label="Father's Status at Birth (Pitri)"
                  icon={User}
                  options={FATHER_STATUS_OPTIONS}
                  value={safeTraits.family?.fatherStatusAtBirth}
                  onChange={(val) => updateFamily({ fatherStatusAtBirth: val })}
                  gender={gender}
                />
              </FormCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
