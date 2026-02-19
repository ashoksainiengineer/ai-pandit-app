/**
 * Step1BirthDetails - Birth Information Form
 * Sacred Ivory Light Theme - Compact God Tier Design
 * 
 * Bug Fixes:
 * - Fixed 12-hour to 24-hour time conversion (midnight/noon edge cases)
 * - Added comprehensive date validation (leap year, month lengths)
 * - Fixed timezone propagation for spouse data
 * - Added input sanitization
 * - Optimized validation with useMemo
 * - Fixed offset config sync issues
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  { val: '01', label: 'Jan', days: 31 },
  { val: '02', label: 'Feb', days: 28 },
  { val: '03', label: 'Mar', days: 31 },
  { val: '04', label: 'Apr', days: 30 },
  { val: '05', label: 'May', days: 31 },
  { val: '06', label: 'Jun', days: 30 },
  { val: '07', label: 'Jul', days: 31 },
  { val: '08', label: 'Aug', days: 31 },
  { val: '09', label: 'Sep', days: 30 },
  { val: '10', label: 'Oct', days: 31 },
  { val: '11', label: 'Nov', days: 30 },
  { val: '12', label: 'Dec', days: 31 }
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => (CURRENT_YEAR - i).toString());

// Generate days dynamically based on month and year
const getDaysForMonth = (month: string, year: string): string[] => {
  if (!month || !year) return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  let daysInMonth = MONTHS.find(m => m.val === month)?.days || 31;

  // Handle February leap year
  if (monthNum === 2) {
    const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
    daysInMonth = isLeapYear ? 29 : 28;
  }

  return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));
};

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const AM_PM_OPTIONS = ['AM', 'PM'] as const;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: '👨' },
  { value: 'female', label: 'Female', icon: '👩' },
  { value: 'other', label: 'Other', icon: '🧑' }
] as const;

// Sanitize input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .slice(0, 100); // Limit to 100 characters
};

// Validate if date is real (accounts for leap years and month lengths)
const isValidDate = (year: string, month: string, day: string): boolean => {
  if (!year || !month || !day) return false;

  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;

  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

// Convert 12-hour format to 24-hour format
const convertTo24Hour = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
  let h = parseInt(hour, 10);
  const m = minute.padStart(2, '0');

  if (period === 'PM' && h !== 12) {
    h += 12;
  } else if (period === 'AM' && h === 12) {
    h = 0;
  }

  return `${h.toString().padStart(2, '0')}:${m}:00`;
};

// Parse 24-hour time to 12-hour parts
const parseTimeToParts = (timeString: string | undefined): { hour: string; minute: string; period: 'AM' | 'PM' } => {
  if (!timeString) return { hour: '', minute: '', period: 'AM' };

  const [h, m] = timeString.split(':');
  let hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' as const : 'AM' as const;

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  return {
    hour: hour.toString().padStart(2, '0'),
    minute: m,
    period
  };
};

export default function Step1BirthDetails({
  data,
  updateData,
  offsetConfig,
  updateOffset,
  spouseData,
  updateSpouse
}: Step1Props) {
  const [showSpouse, setShowSpouse] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Parse date of birth
  const [dobParts, setDobParts] = useState({
    day: data.dateOfBirth?.split('-')[2] || '',
    month: data.dateOfBirth?.split('-')[1] || '',
    year: data.dateOfBirth?.split('-')[0] || ''
  });

  // Parse time with useEffect to sync with external data changes
  const [timeParts, setTimeParts] = useState(() => parseTimeToParts(data.tentativeTime));

  // Sync time parts when data changes externally
  useEffect(() => {
    setTimeParts(parseTimeToParts(data.tentativeTime));
  }, [data.tentativeTime]);

  // Offset state
  const [selectedOffset, setSelectedOffset] = useState<OffsetPreset>(offsetConfig?.preset || '1hour');
  const [customOffset, setCustomOffset] = useState<number>(offsetConfig?.customMinutes ?? 60);

  // Sync offset with parent config
  useEffect(() => {
    if (offsetConfig?.preset) {
      setSelectedOffset(offsetConfig.preset);
    }
    if (offsetConfig?.customMinutes !== undefined) {
      setCustomOffset(offsetConfig.customMinutes);
    }
  }, [offsetConfig?.preset, offsetConfig?.customMinutes]);

  // Spouse date parts
  const [spouseDobParts, setSpouseDobParts] = useState({
    day: spouseData?.dateOfBirth?.split('-')[2] || '',
    month: spouseData?.dateOfBirth?.split('-')[1] || '',
    year: spouseData?.dateOfBirth?.split('-')[0] || ''
  });

  // Spouse time parts
  const [spouseTimeParts, setSpouseTimeParts] = useState(() => parseTimeToParts(spouseData?.birthTime));

  // Sync spouse time when data changes
  useEffect(() => {
    setSpouseTimeParts(parseTimeToParts(spouseData?.birthTime));
  }, [spouseData?.birthTime]);

  // Get available days based on selected month/year
  const availableDays = useMemo(() =>
    getDaysForMonth(dobParts.month, dobParts.year),
    [dobParts.month, dobParts.year]
  );

  const spouseAvailableDays = useMemo(() =>
    getDaysForMonth(spouseDobParts.month, spouseDobParts.year),
    [spouseDobParts.month, spouseDobParts.year]
  );

  // Memoized validation
  const errors = useMemo(() => {
    const newErrors: Record<string, string> = {};

    if (touched.fullName || data.fullName) {
      if (!data.fullName?.trim()) {
        newErrors.fullName = 'Full name is required';
      } else if (data.fullName.trim().length < 2) {
        newErrors.fullName = 'Name must be at least 2 characters';
      }
    }

    if (touched.dateOfBirth || dobParts.day) {
      if (!dobParts.day || !dobParts.month || !dobParts.year) {
        newErrors.dateOfBirth = 'Complete date of birth is required';
      } else if (!isValidDate(dobParts.year, dobParts.month, dobParts.day)) {
        newErrors.dateOfBirth = 'Invalid date (e.g., Feb 30 doesn\'t exist)';
      }
    }

    if (touched.tentativeTime || timeParts.hour) {
      if (!timeParts.hour || !timeParts.minute) {
        newErrors.tentativeTime = 'Approximate birth time is required';
      }
    }

    if (touched.birthPlace || data.birthPlace) {
      if (!data.birthPlace?.trim()) {
        newErrors.birthPlace = 'Birth place is required';
      }
    }

    return newErrors;
  }, [data.fullName, data.birthPlace, dobParts, timeParts, touched]);

  const handleDateChange = useCallback((part: 'day' | 'month' | 'year', value: string) => {
    setTouched(prev => ({ ...prev, dateOfBirth: true }));
    const newParts = { ...dobParts, [part]: value };

    // Reset day if it's invalid for the new month
    if (part === 'month' || part === 'year') {
      const maxDays = getDaysForMonth(newParts.month, newParts.year).length;
      if (parseInt(newParts.day, 10) > maxDays) {
        newParts.day = '';
      }
    }

    setDobParts(newParts);

    if (newParts.year && newParts.month && newParts.day &&
      isValidDate(newParts.year, newParts.month, newParts.day)) {
      updateData({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
    }
  }, [dobParts, updateData]);

  const handleTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
    setTouched(prev => ({ ...prev, tentativeTime: true }));
    const newParts = { ...timeParts, [part]: value } as typeof timeParts;
    setTimeParts(newParts);

    if (newParts.hour && newParts.minute) {
      const time24 = convertTo24Hour(newParts.hour, newParts.minute, newParts.period);
      updateData({ tentativeTime: time24 });
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

    // Reset day if it's invalid for the new month
    if (part === 'month' || part === 'year') {
      const maxDays = getDaysForMonth(newParts.month, newParts.year).length;
      if (parseInt(newParts.day, 10) > maxDays) {
        newParts.day = '';
      }
    }

    setSpouseDobParts(newParts);

    if (newParts.year && newParts.month && newParts.day &&
      isValidDate(newParts.year, newParts.month, newParts.day)) {
      updateSpouse?.({ dateOfBirth: `${newParts.year}-${newParts.month}-${newParts.day}` });
    }
  }, [spouseDobParts, updateSpouse]);

  const handleSpouseTimeChange = useCallback((part: 'hour' | 'minute' | 'period', value: string) => {
    const newParts = { ...spouseTimeParts, [part]: value } as typeof spouseTimeParts;
    setSpouseTimeParts(newParts);

    if (newParts.hour && newParts.minute) {
      const time24 = convertTo24Hour(newParts.hour, newParts.minute, newParts.period);
      updateSpouse?.({ birthTime: time24 });
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
          <span className="text-[#B8860B] font-medium tracking-wider">STEP 1 OF 5</span>
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
            onChange={(e) => {
              setTouched(prev => ({ ...prev, fullName: true }));
              updateData({ fullName: sanitizeInput(e.target.value) });
            }}
            placeholder="Enter your full name"
            className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm placeholder-[#A8A39D] focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/10 outline-none transition-all"
            maxLength={100}
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
              {availableDays.map(d => <option key={d} value={d}>{d}</option>)}
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
              {AM_PM_OPTIONS.map((p) => (
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

        {/* Birth Time Window (Offset) - Compact */}
        <div className="pt-4 border-t border-[#F0E8DE]">
          <FormField
            label="Birth Time Window"
            description="How uncertain is this time?"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {OFFSET_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleOffsetChange(preset.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedOffset === preset.value
                      ? 'bg-[#B8860B] text-white border-[#B8860B]'
                      : 'bg-white text-[#7A756F] border-[#E8E0D5] hover:border-[#B8860B]/50'
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
                  className="flex items-center gap-3 bg-[#FDF8F3] p-3 rounded-lg border border-[#E8E0D5]"
                >
                  <label className="text-sm text-[#1A1612] font-medium whitespace-nowrap">
                    Unknown by ±
                  </label>
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={customOffset}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        if (val > 720) val = 720; // Max 12 hours
                        setCustomOffset(val);
                        updateOffset?.({
                          preset: 'custom',
                          customMinutes: val,
                          description: `±${val} min`
                        });
                      }}
                      className="w-full h-9 px-2 text-center bg-white border border-[#E8E0D5] rounded-md text-[#1A1612] focus:border-[#B8860B] outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#7A756F] pointer-events-none">
                      min
                    </span>
                  </div>
                  <span className="text-xs text-[#7A756F]">
                    (Max 720 mins)
                  </span>
                </motion.div>
              )}
            </div>
          </FormField>
        </div>

        {/* Birth Place */}
        <div className="pt-4 border-t border-[#F0E8DE]">
          <FormField label="Birth Place" required error={errors.birthPlace}>
            <BirthPlacePicker
              birthPlace={data.birthPlace}
              latitude={data.latitude}
              longitude={data.longitude}
              timezone={data.timezone}
              onUpdate={(updates) => {
                setTouched(prev => ({ ...prev, birthPlace: true }));
                updateData(updates);
              }}
            />
          </FormField>
        </div>

        {/* Gender - Compact */}
        <div className="pt-4 border-t border-[#F0E8DE]">
          <FormField label="Gender">
            <div className="grid grid-cols-3 gap-3">
              {GENDER_OPTIONS.map((g) => (
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
                  {spouseAvailableDays.map(d => <option key={d} value={d}>{d}</option>)}
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
