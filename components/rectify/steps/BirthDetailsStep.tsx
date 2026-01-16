'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  User,
  Calendar,
  Clock,
  MapPin,
  Globe,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { BirthData, TimeOffsetConfig, OffsetPreset } from '../../../lib/types';
import { searchCities, City } from '../../../lib/cities';
import { timezones } from '../../../lib/timezones';
import { debounce } from '../../../lib/debounce';

interface BirthDetailsStepProps {
  birthData: Partial<BirthData>;
  setBirthData: (data: Partial<BirthData>) => void;
  offsetConfig: TimeOffsetConfig;
  setOffsetConfig: (config: TimeOffsetConfig) => void;
  onContinue: () => void;
}

const OFFSET_PRESETS: { value: OffsetPreset; label: string; description: string }[] = [
  {
    value: '30min',
    label: '±30 minutes',
    description: 'For very accurate tentative time',
  },
  {
    value: '1hour',
    label: '±1 hour',
    description: 'Most common uncertainty',
  },
  {
    value: '2hours',
    label: '±2 hours',
    description: 'Significant uncertainty',
  },
  {
    value: '4hours',
    label: '±4 hours',
    description: 'High uncertainty',
  },
];

const GENDERS = ['male', 'female', 'other'] as const;

interface FormErrors {
  fullName?: string;
  dateOfBirth?: string;
  tentativeTime?: string;
  offsetConfig?: string;
  birthPlace?: string;
  gender?: string;
  timezone?: string;
}

export default function BirthDetailsStep({ birthData, setBirthData, offsetConfig, setOffsetConfig, onContinue }: BirthDetailsStepProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setCitySuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchCities(query);
        setCitySuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('City search error:', error);
        setCitySuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleCitySearch = (query: string) => {
    setCityQuery(query);
    debouncedSearch(query);
  };

  const selectCity = (city: City) => {
    setBirthData({
      ...birthData,
      birthPlace: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: Math.round(city.longitude / 15) // Convert longitude to timezone offset
    });
    setCityQuery(city.name);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };



  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value || value.length < 2) return 'Full name must be at least 2 characters';
        break;
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required';
        const date = new Date(value);
        if (date > new Date()) return 'Date of birth cannot be in the future';
        break;
      case 'tentativeTime':
        if (!value) return 'Tentative time is required';
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) return 'Time must be in HH:MM format';
        break;
      case 'timeUncertainty':
        if (!value) return 'Time uncertainty is required';
        break;
      case 'birthPlace':
        if (!value) return 'Birth place is required';
        break;
      case 'gender':
        if (!value) return 'Gender is required';
        break;
      case 'timezone':
        if (!value) return 'Timezone is required';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    Object.keys(birthData).forEach(field => {
      const error = validateField(field, birthData[field as keyof BirthData]);
      if (error) newErrors[field as keyof FormErrors] = error;
    });

    // Check required fields
    const requiredFields = ['fullName', 'dateOfBirth', 'tentativeTime', 'birthPlace', 'gender'];
    requiredFields.forEach(field => {
      if (!birthData[field as keyof BirthData]) {
        newErrors[field as keyof FormErrors] = `${field} is required`;
      }
    });

    // Check offset config
    if (!offsetConfig || (!offsetConfig.preset && offsetConfig.customMinutes === undefined)) {
      newErrors.offsetConfig = 'Time offset configuration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setBirthData({ ...birthData, [field]: value });
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, birthData[field as keyof BirthData]);
    setErrors({ ...errors, [field]: error });
  };

  const handleContinue = () => {
    if (validateForm()) {
      onContinue();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Birth Details</h2>
        <p className="text-gray-300">Enter your basic birth information</p>
      </motion.div>

      {/* Full Name */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          Full Name *
        </label>
        <input
          type="text"
          value={birthData.fullName || ''}
          onChange={(e) => handleFieldChange('fullName', e.target.value)}
          onBlur={() => handleFieldBlur('fullName')}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="Enter your full name"
        />
        {errors.fullName && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.fullName}
          </p>
        )}
      </motion.div>

      {/* Date of Birth */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar className="w-4 h-4" />
          Date of Birth *
        </label>
        <input
          type="date"
          value={birthData.dateOfBirth || ''}
          onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
          onBlur={() => handleFieldBlur('dateOfBirth')}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.dateOfBirth}
          </p>
        )}
      </motion.div>

      {/* Tentative Time */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <Clock className="w-4 h-4" />
          Tentative Birth Time *
        </label>
        <input
          type="time"
          value={birthData.tentativeTime || ''}
          onChange={(e) => handleFieldChange('tentativeTime', e.target.value)}
          onBlur={() => handleFieldBlur('tentativeTime')}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
        />
        {errors.tentativeTime && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.tentativeTime}
          </p>
        )}
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* TIME OFFSET SELECTION (NEW) */}
      {/* ═════════════════════════════════════════════════════════════════ */}

      <motion.div variants={itemVariants} className="border-t pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Time Uncertainty Range (Important for Accuracy!)
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Select how much the actual birth time might differ from your tentative time.
            Wider range = more candidates to analyze = longer processing time.
          </p>
        </div>

        {/* Preset Options */}
        <div className="space-y-3">
          <p className="font-medium text-sm text-gray-300">Quick Select:</p>

          {OFFSET_PRESETS.map((preset) => (
            <label
              key={preset.value}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                offsetConfig?.preset === preset.value
                  ? 'border-blue-500 bg-blue-50/10'
                  : 'border-slate-600 hover:border-blue-400'
              }`}
            >
              <input
                type="radio"
                name="offsetType"
                value={preset.value}
                checked={offsetConfig?.preset === preset.value}
                onChange={() => {
                  setOffsetConfig({
                    preset: preset.value,
                    description: preset.label,
                  });
                }}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-white">{preset.label}</p>
                <p className="text-sm text-gray-400">{preset.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Custom Option */}
        <div className="border-t border-slate-600 pt-4">
          <label
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
              offsetConfig?.customMinutes !== undefined
                ? 'border-blue-500 bg-blue-50/10'
                : 'border-slate-600 hover:border-blue-400'
            }`}
          >
            <input
              type="radio"
              name="offsetType"
              value="custom"
              checked={offsetConfig?.customMinutes !== undefined}
              onChange={() => setOffsetConfig({ customMinutes: 60, description: 'Custom range' })}
              className="mr-3"
            />
            <span className="font-medium text-white">Custom Time Range</span>
          </label>

          {offsetConfig?.customMinutes !== undefined && (
            <div className="mt-4 ml-8 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ±{offsetConfig.customMinutes} minutes
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={offsetConfig.customMinutes}
                  onChange={(e) => {
                    setOffsetConfig({
                      customMinutes: Number(e.target.value),
                      description: `±${Number(e.target.value)} minutes`,
                    });
                  }}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter minutes (1-1440). E.g., 45 for ±45 minutes search range.
                </p>
              </div>

              <div className="bg-yellow-50/10 border border-yellow-600 rounded-lg p-3">
                <p className="font-medium text-yellow-400">⚠️ Processing Time</p>
                <p className="text-yellow-300 text-sm">
                  {offsetConfig.customMinutes <= 30 && 'Fast analysis (~2-3 minutes)'}
                  {offsetConfig.customMinutes > 30 && offsetConfig.customMinutes <= 60 && 'Normal analysis (~3-5 minutes)'}
                  {offsetConfig.customMinutes > 60 && offsetConfig.customMinutes <= 120 && 'Longer analysis (~5-7 minutes)'}
                  {offsetConfig.customMinutes > 120 && 'Extended analysis (~7-10+ minutes)'}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Birth Place */}
      <motion.div variants={itemVariants} className="space-y-2 relative">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <MapPin className="w-4 h-4" />
          Birth Place *
        </label>
        <div className="relative">
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => handleCitySearch(e.target.value)}
            onFocus={() => setShowSuggestions(citySuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Search for your birth city"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showSuggestions && citySuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-slate-700/90 border border-slate-600 rounded-lg mt-1 max-h-48 overflow-y-auto z-10"
            >
              {citySuggestions.map((city, index) => (
                <button
                  key={index}
                  onClick={() => selectCity(city)}
                  className="w-full px-4 py-2 text-left text-white hover:bg-slate-600/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{city.name}</div>
                    <div className="text-sm text-gray-400">
                      {city.district && `${city.district}, `}{city.state && `${city.state}, `}{city.country}
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-blue-400" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {errors.birthPlace && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.birthPlace}
          </p>
        )}
      </motion.div>

      {/* Gender */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          Gender *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map(gender => (
            <button
              key={gender}
              onClick={() => handleFieldChange('gender', gender)}
              className={`px-4 py-3 rounded-lg border transition-all ${
                birthData.gender === gender
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
              }`}
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.gender}
          </p>
        )}
      </motion.div>

      {/* Timezone */}
      <motion.div variants={itemVariants} className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <Globe className="w-4 h-4" />
          Timezone *
        </label>
        <select
          value={birthData.timezone || ''}
          onChange={(e) => handleFieldChange('timezone', parseFloat(e.target.value))}
          onBlur={() => handleFieldBlur('timezone')}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="">Select timezone</option>
          {timezones.map(tz => (
            <option key={tz.offset} value={tz.offset}>{tz.label}</option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.timezone}
          </p>
        )}
      </motion.div>

      {/* Continue Button */}
      <motion.div variants={itemVariants} className="pt-6">
        <motion.button
          onClick={handleContinue}
          disabled={!birthData.fullName || !birthData.dateOfBirth || !birthData.tentativeTime || !offsetConfig || !birthData.birthPlace || !birthData.gender || !birthData.timezone}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Continue to Life Events
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
