/**
 * Step1BirthDetails - Birth Information Form
 * Sacred Ivory Light Theme - Compact God Tier Design
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BirthData, TimeOffsetConfig, OffsetPreset, SpouseData } from '@/lib/types';
import BirthPlacePicker from './BirthPlacePicker';
import { FormField } from '@/components/ui/form/FormField';
import { FormCard } from '@/components/ui/form/FormCard';

interface Step1Props {
  data: BirthData;
  updateData: (updates: Partial<BirthData>) => void;
  offsetConfig?: TimeOffsetConfig;
  updateOffset?: (config: TimeOffsetConfig) => void;
  spouseData?: SpouseData;
  updateSpouse?: (updates: Partial<SpouseData>) => void;
}

const OFFSET_PRESETS: { value: OffsetPreset; label: string; minutes: number }[] = [
  { value: '30min', label: '±30 min', minutes: 30 },
  { value: '1hour', label: '±1 hour', minutes: 60 },
  { value: '2hours', label: '±2 hours', minutes: 120 },
  { value: '4hours', label: '±4 hours', minutes: 240 },
  { value: 'custom', label: 'Custom', minutes: 0 },
];

const MONTHS = [
  { val: '01', label: 'Jan' }, { val: '02', label: 'Feb' },
  { val: '03', label: 'Mar' }, { val: '04', label: 'Apr' },
  { val: '05', label: 'May' }, { val: '06', label: 'Jun' },
  { val: '07', label: 'Jul' }, { val: '08', label: 'Aug' },
  { val: '09', label: 'Sep' }, { val: '10', label: 'Oct' },
  { val: '11', label: 'Nov' }, { val: '12', label: 'Dec' }
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => (CURRENT_YEAR - i).toString());
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export default function Step1BirthDetails({ 
  data, 
  updateData, 
  offsetConfig, 
  updateOffset,
  spouseData, 
  updateSpouse 
}: Step1Props) {
  const [showSpouse, setShowSpouse] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [dobParts, setDobParts] = useState({
    day: data.dateOfBirth?.split('-')[2] || '',
    month: data.dateOfBirth?.split('-')[1] || '',
    year: data.dateOfBirth?.split('-')[0] || ''
  });

  const [timeParts, setTimeParts] = useState(() => {
    if (!data.tentativeTime) return { hour: '', minute: '', period: 'AM' as const };
    const [h, m] = data.tentativeTime.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return { hour: hour.toString().padStart(2, '0'), minute: m, period };
  });

  const [selectedOffset, setSelectedOffset] = useState<OffsetPreset>(offsetConfig?.preset || '1hour');
  const [customOffset, setCustomOffset] = useState<number>(offsetConfig?.customMinutes ?? 60);

  const [spouseDobParts, setSpouseDobParts] = useState({
    day: spouseData?.dateOfBirth?.split('-')[2] || '',
    month: spouseData?.dateOfBirth?.split('-')[1] || '',
    year: spouseData?.dateOfBirth?.split('-')[0] || ''
  });

  const [spouseTimeParts, setSpouseTimeParts] = useState(() => {
    if (!spouseData?.birthTime) return { hour: '', minute: '', period: 'AM' as const };
    const [h, m] = spouseData.birthTime.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return { hour: hour.toString().padStart(2, '0'), minute: m, period };
  });

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!data.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!dobParts.day || !dobParts.month || !dobParts.year) newErrors.dateOfBirth = 'Complete date of birth is required';
    if (!timeParts.hour || !timeParts.minute) newErrors.tentativeTime = 'Approximate birth time is required';
    if (!data.birthPlace?.trim()) newErrors.birthPlace = 'Birth place is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, dobParts, timeParts]);

  const handleDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
    const newParts = { ...dobParts, [part]: value };
    setDobParts(newParts);
    if (newParts.year && newParts.month && newParts.day) {
      updateData({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
    }
  }, [dobParts, updateData]);

  const handleTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
    const newParts = { ...timeParts, [part]: value };
    setTimeParts(newParts);
    if (newParts.hour && newParts.minute) {
      let hour = parseInt(newParts.hour);
      if (newParts.period === 'PM' && hour !== 12) hour += 12;
      if (newParts.period === 'AM' && hour === 12) hour = 0;
      updateData({ tentativeTime: `${hour.toString().padStart(2, '0')}:${newParts.minute}:00` });
    }
  }, [timeParts, updateData]);

  const handleOffsetChange = useCallback((preset: OffsetPreset) => {
    setSelectedOffset(preset);
    const presetData = OFFSET_PRESETS.find(p => p.value === preset);
    if (preset !== 'custom' && presetData) {
      updateOffset?.({ preset, customMinutes: presetData.minutes, description: presetData.label });
    } else {
      updateOffset?.({ preset: 'custom', customMinutes: customOffset, description: `±${customOffset} min` });
    }
  }, [customOffset, updateOffset]);

  const handleSpouseDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
    const newParts = { ...spouseDobParts, [part]: value };
    setSpouseDobParts(newParts);
    if (newParts.year && newParts.month && newParts.day) {
      updateSpouse?.({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
    }
  }, [spouseDobParts, updateSpouse]);

  const handleSpouseTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
    const newParts = { ...spouseTimeParts, [part]: value };
    setSpouseTimeParts(newParts);
    if (newParts.hour && newParts.minute) {
      let hour = parseInt(newParts.hour);
      if (newParts.period === 'PM' && hour !== 12) hour += 12;
      if (newParts.period === 'AM' && hour === 12) hour = 0;
      updateSpouse?.({ birthTime: `${hour.toString().padStart(2, '0')}:${newParts.minute}:00` });
    }
  }, [spouseTimeParts, updateSpouse]);

  return (
    <motion.div className="space-y-6 max-w-3xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Security Badge - Top of Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-xs text-[#2D7A5C] bg-[#2D7A5C]/5 py-2 px-4 rounded-full border border-[#2D7A5C]/10"
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
          <span className="text-[#B8860B] font-medium tracking-wider">STEP 1 OF 4</span>
        </motion.div>
        <motion.h1
          className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-[#1A1612] leading-tight mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Birth <span className="text-gradient-gold">Details</span>
        </motion.h1>
        <motion.p
          className="text-sm text-[#7A756F]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Provide your birth information for accurate time rectification
        </motion.p>
      </div>

      {/* Main Form Card - Compact */}
      <FormCard className="space-y-5 p-5 md:p-6">
        {/* Full Name - Compact */}
        <FormField label="Full Name" required error={errors.fullName}>
          <input 
            type="text" 
            value={data.fullName || ''} 
            onChange={(e) => updateData({ fullName: e.target.value })} 
            placeholder="Enter your full name" 
            className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm placeholder-[#A8A39D] focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/10 outline-none transition-all" 
          />
        </FormField>

        {/* Date of Birth - Compact */}
        <FormField 
          label="Date of Birth" 
          required 
          error={errors.dateOfBirth}
          description="Select your birth date"
        >
          <div className="grid grid-cols-3 gap-2">
            <select 
              value={dobParts.day} 
              onChange={(e) => handleDateChange('day', e.target.value)} 
              className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm focus:border-[#D4A853] outline-none cursor-pointer"
            >
              <option value="">Day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select 
              value={dobParts.month} 
              onChange={(e) => handleDateChange('month', e.target.value)} 
              className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm focus:border-[#D4A853] outline-none cursor-pointer"
            >
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select 
              value={dobParts.year} 
              onChange={(e) => handleDateChange('year', e.target.value)} 
              className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm focus:border-[#D4A853] outline-none cursor-pointer"
            >
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </FormField>

        {/* Time of Birth - Compact */}
        <FormField 
          label="Approximate Birth Time" 
          required 
          error={errors.tentativeTime}
          description="Don't worry if it's not exact"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <select 
              value={timeParts.hour} 
              onChange={(e) => handleTimeChange('hour', e.target.value)} 
              className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-base text-center focus:border-[#D4A853] outline-none"
            >
              <option value="">HH</option>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-xl text-[#B8860B]">:</span>
            <select 
              value={timeParts.minute} 
              onChange={(e) => handleTimeChange('minute', e.target.value)} 
              className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-base text-center focus:border-[#D4A853] outline-none"
            >
              <option value="">MM</option>
              {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex bg-white rounded-lg overflow-hidden border border-[#E8E0D5] h-11">
              {['AM', 'PM'].map((p) => (
                <button 
                  key={p} 
                  type="button" 
                  onClick={() => handleTimeChange('period', p)} 
                  className={`px-4 font-medium text-sm transition-all ${timeParts.period === p ? 'bg-[#B8860B] text-white' : 'text-[#7A756F] hover:text-[#1A1612]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </FormField>

        {/* Birth Place */}
        <div className="pt-4 border-t border-[#F0E8DE]">
          <FormField label="Birth Place" required error={errors.birthPlace}>
            <BirthPlacePicker
              birthPlace={data.birthPlace}
              latitude={data.latitude}
              longitude={data.longitude}
              timezone={data.timezone}
              onUpdate={(updates) => updateData(updates)}
            />
          </FormField>
        </div>

        {/* Gender - Compact */}
        <div className="pt-4 border-t border-[#F0E8DE]">
          <FormField label="Gender">
            <div className="grid grid-cols-3 gap-3">
              {[{ value: 'male', label: 'Male', icon: '👨' }, { value: 'female', label: 'Female', icon: '👩' }, { value: 'other', label: 'Other', icon: '🧑' }].map((g) => (
                <button 
                  key={g.value} 
                  type="button" 
                  onClick={() => updateData({ gender: g.value as any })} 
                  className={`p-4 rounded-xl text-center transition-all border ${data.gender === g.value ? 'bg-[#B8860B]/10 border-[#B8860B] shadow-sm' : 'bg-white border-[#E8E0D5] hover:border-[#D4A853]/50'}`}
                >
                  <span className="text-2xl mb-1 block">{g.icon}</span>
                  <div className="text-xs text-[#1A1612] font-medium">{g.label}</div>
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </FormCard>

      {/* Spouse Details - Compact */}
      <FormCard variant="subtle" className="p-5">
        <button 
          type="button" 
          onClick={() => setShowSpouse(!showSpouse)} 
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#E8E0D5] flex items-center justify-center text-xl">👩‍❤️‍👨</div>
            <div>
              <h4 className="font-[family-name:var(--font-cormorant)] text-base font-semibold text-[#1A1612]">Spouse Details <span className="text-[#7A756F] font-normal text-xs">(Optional)</span></h4>
              <p className="text-[10px] text-[#7A756F]">+15% precision boost</p>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full bg-white border border-[#E8E0D5] flex items-center justify-center text-xs transition-all ${showSpouse ? 'rotate-180 bg-[#B8860B] border-[#B8860B] text-white' : 'text-[#B8860B]'}`}>▼</div>
        </button>

        {showSpouse && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            className="mt-4 space-y-4 pt-4 border-t border-[#F0E8DE]"
          >
            <FormField label="Spouse Date of Birth">
              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={spouseDobParts.day} 
                  onChange={(e) => handleSpouseDateChange('day', e.target.value)} 
                  className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
                >
                  <option value="">Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  value={spouseDobParts.month} 
                  onChange={(e) => handleSpouseDateChange('month', e.target.value)} 
                  className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
                >
                  <option value="">Month</option>
                  {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
                <select 
                  value={spouseDobParts.year} 
                  onChange={(e) => handleSpouseDateChange('year', e.target.value)} 
                  className="h-11 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
                >
                  <option value="">Year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </FormField>

            <FormField label="Spouse Birth Time">
              <div className="flex items-center gap-2 flex-wrap">
                <select 
                  value={spouseTimeParts.hour} 
                  onChange={(e) => handleSpouseTimeChange('hour', e.target.value)} 
                  className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-base text-center outline-none focus:border-[#D4A853]"
                >
                  <option value="">HH</option>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="text-xl text-[#B8860B]">:</span>
                <select 
                  value={spouseTimeParts.minute} 
                  onChange={(e) => handleSpouseTimeChange('minute', e.target.value)} 
                  className="h-11 w-20 px-2 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-base text-center outline-none focus:border-[#D4A853]"
                >
                  <option value="">MM</option>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex bg-white rounded-lg overflow-hidden border border-[#E8E0D5] h-11">
                  {['AM', 'PM'].map((p) => (
                    <button 
                      key={p} 
                      type="button" 
                      onClick={() => handleSpouseTimeChange('period', p)} 
                      className={`px-4 font-medium text-sm transition-all ${spouseTimeParts.period === p ? 'bg-[#B8860B] text-white' : 'text-[#7A756F] hover:text-[#1A1612]'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </FormField>

            <FormField label="Spouse Birth Place">
              <BirthPlacePicker
                birthPlace={spouseData?.birthPlace || ''}
                latitude={spouseData?.latitude || 0}
                longitude={spouseData?.longitude || 0}
                timezone={parseFloat(spouseData?.timezone?.toString() || '5.5')}
                onUpdate={(updates) => updateSpouse?.(updates)}
              />
            </FormField>
          </motion.div>
        )}
      </FormCard>
    </motion.div>
  );
}
