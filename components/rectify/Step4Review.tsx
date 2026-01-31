/**
 * Step4Review - Final Review & Confirmation
 * Sacred Ivory Light Theme - Compact God Tier Design
 * 
 * Bug Fixes:
 * - Fixed key prop issue using event.id instead of index
 * - Memoized accuracy calculation
 * - Added proper event validation
 * - Fixed missing categories logic
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BirthData, PhysicalTraits, LifeEvent, TimeOffsetConfig, ForensicTraits } from '@/lib/types';
import { FormCard } from '@/components/ui/form/FormCard';
import { ArrowRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface Step4Props {
  data: BirthData;
  events: LifeEvent[];
  traits: PhysicalTraits;
  forensicTraits: ForensicTraits;
  onSubmit: () => void;
  isSubmitting: boolean;
  onEdit: (step: number) => void;
  offsetConfig?: TimeOffsetConfig;
}

// Valid event check
const isValidEvent = (e: LifeEvent): boolean => {
  return !!(e.description && e.description.trim().length >= 10 && e.eventDate);
};

export default function Step4Review({
  data,
  events,
  traits,
  forensicTraits,
  onSubmit,
  isSubmitting,
  onEdit,
  offsetConfig
}: Step4Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setCooldown(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Memoized accuracy calculation
  const accuracy = useMemo(() => {
    let score = 40;
    const validEvents = events.filter(isValidEvent);
    score += validEvents.length * 8;
    
    // Bonus for forensic traits
    if (forensicTraits?.physical?.facialStructure?.forehead) score += 3;
    if (forensicTraits?.physical?.facialStructure?.eyeShape) score += 3;
    if (forensicTraits?.biological?.prakriti) score += 4;
    if ((forensicTraits?.family?.siblingPosition)) score += 5;
    
    return Math.min(99, score);
  }, [events, forensicTraits]);

  const estimatedMinutes = useMemo(() => {
    return Math.max(2, Math.ceil((offsetConfig?.customMinutes || 60) / 60) + 1);
  }, [offsetConfig]);

  // Memoized missing categories
  const missingCategories = useMemo(() => {
    const categories = new Set(events.filter(isValidEvent).map(e => e.category));
    const missing = [];
    if (!categories.has('career')) missing.push('Career events');
    if (!categories.has('marriage')) missing.push('Marriage');
    if (!categories.has('family_events')) missing.push('Family events');
    if (!categories.has('health')) missing.push('Health events');
    return missing.slice(0, 3);
  }, [events]);

  const showLowAccuracyWarning = accuracy < 70;

  // Handle submit with validation
  const handleSubmit = useCallback(() => {
    if (!confirmed || cooldown || isSubmitting) return;
    onSubmit();
  }, [confirmed, cooldown, isSubmitting, onSubmit]);

  return (
    <motion.div className="space-y-6 max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Security Badge - Top of Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-xs text-[#2D7A5C] bg-[#2D7A5C]/5 py-2.5 px-4 rounded-full border border-[#2D7A5C]/10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-medium">🔐 End-to-End Encrypted</span>
        <span className="text-[#2D7A5C]/60">•</span>
        <span className="text-[#7A756F]">Nobody can read your data except you</span>
      </motion.div>

      {/* Header - Centered */}
      <div className="text-center my-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FDF8F3] to-white border border-[#F0E8DE] rounded-full text-xs mb-6 shadow-sm"
        >
          <span className="text-[#B8860B] font-medium tracking-wider">STEP 4 OF 4</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-[#1A1612] leading-tight mb-2">
          Review & <span className="text-gradient-gold">Confirm</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-[#7A756F]">
          Verify before AI analysis
        </motion.p>
      </div>

      {/* Accuracy Banner - Compact */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-[#FDF8F3] to-white border border-[#D4A853]/30 rounded-xl p-6 text-center">
        <div className="font-[family-name:var(--font-cormorant)] text-5xl font-bold text-[#B8860B] mb-1">{accuracy}%</div>
        <div className="text-[#4A453F] text-sm font-medium">Expected Accuracy</div>
        {events.filter(isValidEvent).length < 5 && (
          <div className="mt-2 text-xs text-[#C65D3B]">
            ⚠️ Add at least 5 detailed events for better accuracy
          </div>
        )}
      </motion.div>

      {/* Review Cards Grid - Compact */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Birth Details */}
        <FormCard className="relative group p-5">
          <button onClick={() => onEdit(1)} className="absolute top-4 right-4 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold hover:underline flex items-center gap-1">
            Edit <ArrowRight className="w-3 h-3" />
          </button>
          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#1A1612] mb-4 pb-3 border-b border-[#F0E8DE] flex items-center gap-2">
            <span>📋</span> Birth Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-[#7A756F]">Name</span><span className="text-[#1A1612] font-semibold">{data.fullName || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-[#7A756F]">Birth Date</span><span className="text-[#4A453F]">{data.dateOfBirth || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-[#7A756F]">Time</span><span className="text-[#B8860B] font-mono font-semibold">{data.tentativeTime || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-[#7A756F]">Place</span><span className="text-[#4A453F] truncate max-w-[120px]">{data.birthPlace || '—'}</span></div>
            <div className="flex justify-between items-center"><span className="text-[#7A756F]">Gender</span><span className="text-[#4A453F] capitalize font-medium">{data.gender || '—'}</span></div>
          </div>
        </FormCard>

        {/* Forensic Traits */}
        <FormCard className="relative group p-5">
          <button onClick={() => onEdit(2)} className="absolute top-4 right-4 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold hover:underline flex items-center gap-1">
            Edit <ArrowRight className="w-3 h-3" />
          </button>
          <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#1A1612] mb-4 pb-3 border-b border-[#F0E8DE] flex items-center gap-2">
            <span>🧬</span> Traits
          </h3>
          <div className="space-y-3 text-xs">
            <div><span className="text-[#7A756F] block text-[10px] uppercase tracking-wider mb-0.5">Face</span><span className="text-[#4A453F]">{(forensicTraits?.physical?.facialStructure?.forehead || '—').replace('_', ' ')} forehead, {(forensicTraits?.physical?.facialStructure?.eyeShape || '—').replace('_', ' ')} eyes</span></div>
            <div><span className="text-[#7A756F] block text-[10px] uppercase tracking-wider mb-0.5">Speech</span><span className="text-[#4A453F]">{(forensicTraits?.psychographic?.speechStyle || '—').replace(/_/g, ' ')}</span></div>
            <div><span className="text-[#7A756F] block text-[10px] uppercase tracking-wider mb-0.5">Family</span><span className="text-[#4A453F]">{(forensicTraits?.family?.siblingPosition || '—').replace(/_/g, ' ')}</span></div>
            <div><span className="text-[#7A756F] block text-[10px] uppercase tracking-wider mb-0.5">Prakriti</span><span className="text-[#4A453F] uppercase font-medium">{forensicTraits?.biological?.prakriti || '—'}</span></div>
          </div>
        </FormCard>
      </div>

      {/* Life Events */}
      <FormCard className="relative group p-5">
        <button onClick={() => onEdit(3)} className="absolute top-4 right-4 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold hover:underline flex items-center gap-1">
          Edit <ArrowRight className="w-3 h-3" />
        </button>
        <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#1A1612] mb-4 pb-3 border-b border-[#F0E8DE] flex items-center gap-2">
          <span>📅</span> Life Events <span className="text-[#B8860B] text-sm font-normal">({events.filter(isValidEvent).length}/{events.length})</span>
        </h3>

        {events.length === 0 ? (
          <p className="text-[#7A756F] text-center py-6 text-sm">No events added</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {events.filter(e => e.description).map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#F5EFE7]">
                <span className="text-xl">{e.icon || '📅'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-[#1A1612] text-sm truncate">{e.eventType}</span>
                    <span className="text-[#B8860B] text-xs font-medium bg-[#B8860B]/10 px-2 py-0.5 rounded-full">{e.eventDate?.split('-')[0] || '—'}</span>
                  </div>
                  {e.description && <p className="text-[#7A756F] text-xs mt-1 line-clamp-1 italic">&ldquo;{e.description.slice(0, 100)}{e.description.length > 100 ? '...' : ''}&rdquo;</p>}
                </div>
                {isValidEvent(e) ? <span className="text-[#2D7A5C]">✓</span> : <span className="text-[#C65D3B] text-xs">!</span>}
              </div>
            ))}
          </div>
        )}
      </FormCard>

      {/* Low Accuracy Warning */}
      <AnimatePresence>
        {showLowAccuracyWarning && !confirmed && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-[#C65D3B]/5 border border-[#C65D3B]/30 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#C65D3B] shrink-0" />
              <div>
                <h4 className="text-[#C65D3B] font-semibold mb-1 text-sm">Low Accuracy ({accuracy}%)</h4>
                <p className="text-[#4A453F] text-xs mb-2">For 90%+ accuracy, add:</p>
                {missingCategories.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-[#B8860B] space-y-0.5 font-medium">
                    {missingCategories.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs text-[#7A756F]">More detailed events with complete descriptions</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation & Submit */}
      <div className="pt-4 border-t border-[#F0E8DE]">
        <label className="flex items-start gap-3 cursor-pointer group mb-6 p-4 rounded-xl hover:bg-[#F5EFE7] transition-colors">
          <input 
            type="checkbox" 
            checked={confirmed} 
            onChange={(e) => setConfirmed(e.target.checked)} 
            className="mt-0.5 w-5 h-5 rounded border-2 border-[#D4A853] bg-white text-[#B8860B] accent-[#B8860B] cursor-pointer" 
          />
          <span className={`text-sm leading-relaxed transition-colors ${confirmed ? 'text-[#1A1612]' : 'text-[#4A453F] group-hover:text-[#B8860B]'}`}>
            I confirm all details are accurate. Incorrect data will affect rectification accuracy.
          </span>
        </label>

        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting || !confirmed || cooldown}
          whileHover={{ scale: confirmed && !isSubmitting && !cooldown ? 1.02 : 1 }}
          whileTap={{ scale: confirmed && !isSubmitting && !cooldown ? 0.98 : 1 }}
          className={`w-full py-4 font-bold rounded-xl text-lg transition-all flex items-center justify-center gap-2 ${
            !confirmed || cooldown ? 'bg-[#F0E8DE] text-[#A8A39D] cursor-not-allowed' : 'bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white shadow-lg shadow-[#B8860B]/20 hover:shadow-xl'
          }`}
        >
          {isSubmitting ? <><span className="animate-spin">⏳</span> Processing...</> : cooldown ? <><span className="animate-pulse">⏳</span> Preparing...</> : <><Sparkles className="w-5 h-5" /> Start Analysis (~{estimatedMinutes}m)</>}
        </motion.button>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#7A756F]">
          <span>~{estimatedMinutes} minutes</span>
          <span>•</span>
          <span className="flex items-center gap-1"><span>🔐</span> End-to-end encrypted</span>
          <span>•</span>
          <span>Nobody except you can access this data</span>
        </div>
      </div>
    </motion.div>
  );
}
