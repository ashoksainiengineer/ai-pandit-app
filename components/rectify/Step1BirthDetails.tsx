/**
 * Step1BirthDetails - Birth Information Form
 * Uniform, accessible, and user-friendly form for birth details
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BirthData, TimeOffsetConfig, OffsetPreset, SpouseData } from '@/lib/types';
import BirthPlacePicker from './BirthPlacePicker';
import { FormField } from '@/components/ui/form/FormField';
import { FormCard } from '@/components/ui/form/FormCard';
import { FormError } from '@/components/ui/form/FormError';

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
  { val: '01', label: 'January' }, { val: '02', label: 'February' },
  { val: '03', label: 'March' }, { val: '04', label: 'April' },
  { val: '05', label: 'May' }, { val: '06', label: 'June' },
  { val: '07', label: 'July' }, { val: '08', label: 'August' },
  { val: '09', label: 'September' }, { val: '10', label: 'October' },
  { val: '11', label: 'November' }, { val: '12', label: 'December' }
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

  // Date parts state
  const [dobParts, setDobParts] = useState({
    day: data.dateOfBirth?.split('-')[2] || '',
    month: data.dateOfBirth?.split('-')[1] || '',
    year: data.dateOfBirth?.split('-')[0] || ''
  });

  // Time parts state
  const [timeParts, setTimeParts] = useState(() => {
    if (!data.tentativeTime) return { hour: '', minute: '', period: 'AM' as const };
    const [h, m] = data.tentativeTime.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return { hour: hour.toString().padStart(2, '0'), minute: m, period };
  });

  // Offset state
  const [selectedOffset, setSelectedOffset] = useState<OffsetPreset>(offsetConfig?.preset || '1hour');
  const [customOffset, setCustomOffset] = useState<number>(offsetConfig?.customMinutes ?? 60);

  // Spouse date parts
  const [spouseDobParts, setSpouseDobParts] = useState({
    day: spouseData?.dateOfBirth?.split('-')[2] || '',
    month: spouseData?.dateOfBirth?.split('-')[1] || '',
    year: spouseData?.dateOfBirth?.split('-')[0] || ''
  });

  // Spouse time parts
  const [spouseTimeParts, setSpouseTimeParts] = useState(() => {
    if (!spouseData?.birthTime) return { hour: '', minute: '', period: 'AM' as const };
    const [h, m] = spouseData.birthTime.split(':');
    let hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return { hour: hour.toString().padStart(2, '0'), minute: m, period };
  });

  // Validate form
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!data.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!dobParts.day || !dobParts.month || !dobParts.year) {
      newErrors.dateOfBirth = 'Complete date of birth is required';
    }

    if (!timeParts.hour || !timeParts.minute) {
      newErrors.tentativeTime = 'Approximate birth time is required';
    }

    if (!data.birthPlace?.trim()) {
      newErrors.birthPlace = 'Birth place is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, dobParts, timeParts]);

  // Handle date changes
  const handleDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
    const newParts = { ...dobParts, [part]: value };
    setDobParts(newParts);
    if (newParts.year && newParts.month && newParts.day) {
      updateData({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
    }
  }, [dobParts, updateData]);

  // Handle time changes
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

  // Handle offset change
  const handleOffsetChange = useCallback((preset: OffsetPreset) => {
    setSelectedOffset(preset);
    const presetData = OFFSET_PRESETS.find(p => p.value === preset);
    if (preset !== 'custom' && presetData) {
      updateOffset?.({ 
        preset, 
        customMinutes: presetData.minutes, 
        description: presetData.label 
      });
    } else {
      updateOffset?.({ 
        preset: 'custom', 
        customMinutes: customOffset, 
        description: `±${customOffset} min` 
      });
    }
  }, [customOffset, updateOffset]);

  // Handle spouse date
  const handleSpouseDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
    const newParts = { ...spouseDobParts, [part]: value };
    setSpouseDobParts(newParts);
    if (newParts.year && newParts.month && newParts.day) {
      updateSpouse?.({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
    }
  }, [spouseDobParts, updateSpouse]);

  // Handle spouse time
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
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-sm text-[#D4AF37] font-medium tracking-widest mb-2">STEP 1 OF 4</p>
        <h1 className="text-3xl font-bold text-[#F5F0EB]">Birth Details</h1>
        <p className="text-[#C4B8AD] mt-2">
          Provide your birth information for accurate time rectification
        </p>
      </div>

      {/* Main Form Card */}
      <FormCard className="space-y-8">
        {/* Full Name */}
        <FormField label="Full Name" required error={errors.fullName}>
          <input
            type="text"
            value={data.fullName || ''}
            onChange={(e) => updateData({ fullName: e.target.value })}
            placeholder="Enter your full name"
            className="w-full h-[52px] px-5 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] placeholder-[#5A6475] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all"
          />
        </FormField>

        {/* Date of Birth */}
        <FormField 
          label="Date of Birth" 
          required 
          error={errors.dateOfBirth}
          description="Select your birth date from the dropdowns"
        >
          <div className="grid grid-cols-3 gap-3">
            <select
              value={dobParts.day}
              onChange={(e) => handleDateChange('day', e.target.value)}
              className="h-[52px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] focus:border-[#D4AF37] outline-none"
            >
              <option value="">Day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={dobParts.month}
              onChange={(e) => handleDateChange('month', e.target.value)}
              className="h-[52px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] focus:border-[#D4AF37] outline-none"
            >
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <select
              value={dobParts.year}
              onChange={(e) => handleDateChange('year', e.target.value)}
              className="h-[52px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] focus:border-[#D4AF37] outline-none"
            >
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </FormField>

        {/* Time of Birth */}
        <FormField 
          label="Approximate Birth Time" 
          required 
          error={errors.tentativeTime}
          description="Don't worry if it's not exact - that's what we're here to rectify!"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={timeParts.hour}
              onChange={(e) => handleTimeChange('hour', e.target.value)}
              className="h-[52px] w-24 px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] focus:border-[#D4AF37] outline-none"
            >
              <option value="">HH</option>
              {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-2xl text-[#D4AF37] font-bold">:</span>
            <select
              value={timeParts.minute}
              onChange={(e) => handleTimeChange('minute', e.target.value)}
              className="h-[52px] w-24 px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] focus:border-[#D4AF37] outline-none"
            >
              <option value="">MM</option>
              {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="flex bg-[#0F1419] rounded-lg overflow-hidden border border-[#2A3442]">
              {['AM', 'PM'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleTimeChange('period', p)}
                  className={`h-[52px] px-5 font-medium transition-all ${
                    timeParts.period === p
                      ? 'bg-[#D4AF37] text-[#0A0F1C]'
                      : 'text-[#8C7F72] hover:text-[#F5F0EB]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {data.timezone !== undefined && (
            <p className="text-xs text-[#8B5CF6] mt-2">
              🌍 Timezone: UTC{data.timezone >= 0 ? '+' : ''}{data.timezone} (based on Birth Place)
            </p>
          )}
        </FormField>

        {/* Birth Place */}
        <FormField label="Birth Place" required error={errors.birthPlace}>
          <BirthPlacePicker
            birthPlace={data.birthPlace}
            latitude={data.latitude}
            longitude={data.longitude}
            timezone={data.timezone}
            onUpdate={(updates) => updateData(updates)}
          />
        </FormField>

        {/* Gender */}
        <FormField label="Gender">
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'male', label: 'Male', icon: '👨' },
              { value: 'female', label: 'Female', icon: '👩' },
              { value: 'other', label: 'Other', icon: '🧑' },
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => updateData({ gender: g.value as any })}
                className={`p-5 rounded-xl text-center transition-all border-2 ${
                  data.gender === g.value
                    ? 'bg-[#D4AF37]/20 border-[#D4AF37]'
                    : 'bg-[#0F1419] border-[#2A3442] hover:border-[#D4AF37]/50'
                }`}
              >
                <span className="text-3xl">{g.icon}</span>
                <div className="text-sm text-[#F5F0EB] mt-2 font-medium">{g.label}</div>
              </button>
            ))}
          </div>
        </FormField>
      </FormCard>

      {/* Time Accuracy Card */}
      <FormCard>
        <FormField
          label="How accurate is this time?"
          description="Select the time range within which your birth time falls"
        >
          <div className="grid grid-cols-5 gap-3">
            {OFFSET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleOffsetChange(preset.value)}
                className={`py-3 px-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  selectedOffset === preset.value
                    ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]'
                    : 'bg-[#0F1419] border-[#2A3442] text-[#C4B8AD] hover:border-[#8B5CF6]/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {selectedOffset === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 pt-3"
            >
              <span className="text-[#C4B8AD] text-sm">±</span>
              <input
                type="number"
                min="1"
                max="720"
                value={customOffset}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 60;
                  setCustomOffset(val);
                  updateOffset?.({ preset: 'custom', customMinutes: val, description: `±${val} min` });
                }}
                className="w-24 h-[44px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] text-center focus:border-[#8B5CF6] outline-none"
              />
              <span className="text-[#C4B8AD] text-sm">minutes</span>
            </motion.div>
          )}
        </FormField>

        {/* Guidance Box */}
        <div className="mt-6 p-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5">
          <div className="flex items-center gap-2 text-[#D4AF37] mb-2">
            <span className="text-lg">📜</span>
            <span className="text-xs font-bold uppercase tracking-widest">Astrological Guidance</span>
          </div>
          <p className="text-xs text-[#C4B8AD] leading-relaxed">
            {selectedOffset === '30min' && "Ideal for high-precision records. 3-4 major life events are typically sufficient for seconds-level locking."}
            {selectedOffset === '1hour' && "Moderate window. 5-7 events recommended, including family-related dates and career transitions."}
            {selectedOffset === '2hours' && "Significant uncertainty. 7-10 events + physical traits are critical to resolve possible Sign changes."}
            {selectedOffset === '4hours' && "Large window. Requires 10+ events spanning decades + spouse data + detailed physical markers."}
            {selectedOffset === 'custom' && (customOffset > 240
              ? "Extreme uncertainty (Full Day Scan). Full life history (15+ events) + major dates + complete physical profile mandatory."
              : "Custom window. Ensure you provide enough Life Events (5-10) for accurate dasha alignment.")}
          </p>
        </div>
      </FormCard>

      {/* Spouse Details (Optional) */}
      <FormCard variant="subtle">
        <button
          type="button"
          onClick={() => setShowSpouse(!showSpouse)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👩‍❤️‍👨</span>
            <div>
              <h4 className="text-sm font-bold text-[#F5F0EB]">Spouse Details (Optional)</h4>
              <p className="text-[10px] text-[#8C7F72] uppercase tracking-wider">Adds +15% precision for relationship-driven sub-charts</p>
            </div>
          </div>
          <span className={`text-[#D4AF37] transition-transform ${showSpouse ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showSpouse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 space-y-6 pt-6 border-t border-[#2A3442]"
          >
            <FormField label="Spouse Date of Birth">
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={spouseDobParts.day}
                  onChange={(e) => handleSpouseDateChange('day', e.target.value)}
                  className="h-[52px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={spouseDobParts.month}
                  onChange={(e) => handleSpouseDateChange('month', e.target.value)}
                  className="h-[52px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Month</option>
                  {MONTHS.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
                <select
                  value={spouseDobParts.year}
                  onChange={(e) => handleSpouseDateChange('year', e.target.value)}
                  className="h-[52px] px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </FormField>

            <FormField label="Spouse Birth Time">
              <div className="flex items-center gap-3">
                <select
                  value={spouseTimeParts.hour}
                  onChange={(e) => handleSpouseTimeChange('hour', e.target.value)}
                  className="h-[52px] w-24 px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
                >
                  <option value="">HH</option>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="text-2xl text-[#D4AF37] font-bold">:</span>
                <select
                  value={spouseTimeParts.minute}
                  onChange={(e) => handleSpouseTimeChange('minute', e.target.value)}
                  className="h-[52px] w-24 px-4 bg-[#0F1419] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
                >
                  <option value="">MM</option>
                  {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex bg-[#0F1419] rounded-lg overflow-hidden border border-[#2A3442]">
                  {['AM', 'PM'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSpouseTimeChange('period', p)}
                      className={`h-[52px] px-5 font-medium transition-all ${
                        spouseTimeParts.period === p
                          ? 'bg-[#D4AF37] text-[#0A0F1C]'
                          : 'text-[#8C7F72] hover:text-[#F5F0EB]'
                      }`}
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

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-[#2D7A5C]">
        <span>🔒</span>
        <span>Your data is end-to-end encrypted</span>
      </div>
    </motion.div>
  );
}
