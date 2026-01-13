'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Info, ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { BirthData } from '@/types';
import { searchCities } from '@/lib/cities';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-32 bg-slate-700 rounded-xl animate-pulse" />
});

interface BirthDataFormProps {
  birthData: Partial<BirthData>;
  setBirthData: (data: Partial<BirthData>) => void;
}

interface ValidationState {
  fullName: boolean;
  dateOfBirth: boolean;
  tentativeTime: boolean;
  birthPlace: boolean;
  latitude: boolean;
  longitude: boolean;
  gender: boolean;
}

export default function BirthDataForm({ birthData, setBirthData }: BirthDataFormProps) {
  const [locationMode, setLocationMode] = useState<'search' | 'manual' | 'map'>('search');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showTimeHelp, setShowTimeHelp] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    fullName: false,
    dateOfBirth: false,
    tentativeTime: false,
    birthPlace: false,
    latitude: false,
    longitude: false,
    gender: false
  });
  const [touched, setTouched] = useState<Record<keyof ValidationState, boolean>>({
    fullName: false,
    dateOfBirth: false,
    tentativeTime: false,
    birthPlace: false,
    latitude: false,
    longitude: false,
    gender: false
  });
  
  // Simple state for raw inputs - what user is currently typing
  const [dateInputs, setDateInputs] = useState({
    day: '',
    month: '',
    year: ''
  });
  
  const [timeInputs, setTimeInputs] = useState({
    hour: '',
    minute: '',
    period: 'AM' as 'AM' | 'PM'
  });
  
  const citiesDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Display values - show what user types, fall back to saved data
  const displayDate = useMemo(() => {
    if (dateInputs.day || dateInputs.month || dateInputs.year) {
      return dateInputs;
    }
    if (!birthData.dateOfBirth) return { day: '', month: '', year: '' };
    
    const date = new Date(birthData.dateOfBirth);
    return {
      day: date.getDate().toString(),
      month: date.getMonth().toString(),
      year: date.getFullYear().toString()
    };
  }, [birthData.dateOfBirth, dateInputs]);
  
  const displayTime = useMemo(() => {
    if (timeInputs.hour || timeInputs.minute) {
      return timeInputs;
    }
    if (!birthData.tentativeTime) return { hour: '', minute: '', period: 'AM' as const };
    
    const [hours, minutes] = birthData.tentativeTime.split(':');
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    
    return {
      hour: displayHour.toString().padStart(2, '0'),
      minute: minutes || '00',
      period
    };
  }, [birthData.tentativeTime, timeInputs]);
  
  // Validation logic
  const validateField = useCallback((field: keyof ValidationState, value: any): boolean => {
    switch (field) {
      case 'fullName':
        return typeof value === 'string' && value.trim().length >= 2;
      case 'dateOfBirth':
        return typeof value === 'string' && value.trim().length > 0 && !isNaN(new Date(value).getTime());
      case 'tentativeTime':
        return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
      case 'birthPlace':
        return typeof value === 'string' && value.trim().length >= 2;
      case 'latitude':
        return typeof value === 'number' && value >= -90 && value <= 90;
      case 'longitude':
        return typeof value === 'number' && value >= -180 && value <= 180;
      case 'gender':
        return value === 'male' || value === 'female';
      default:
        return false;
    }
  }, []);
  
  // Run validation on all fields
  useEffect(() => {
    const newValidation: ValidationState = {
      fullName: validateField('fullName', birthData.fullName),
      dateOfBirth: validateField('dateOfBirth', birthData.dateOfBirth),
      tentativeTime: validateField('tentativeTime', birthData.tentativeTime),
      birthPlace: validateField('birthPlace', birthData.birthPlace),
      latitude: validateField('latitude', birthData.latitude),
      longitude: validateField('longitude', birthData.longitude),
      gender: validateField('gender', birthData.gender)
    };
    setValidation(newValidation);
  }, [birthData, validateField]);
  
  // Handle city search with debouncing
  const handleCitySearch = useCallback((value: string) => {
    setBirthData({ ...birthData, birthPlace: value });
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length >= 2) {
      setIsSearchingCities(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchCities(value);
          setCitySuggestions(results);
          setShowCitySuggestions(results.length > 0);
        } catch (error) {
          console.error('City search error:', error);
          setCitySuggestions([]);
        } finally {
          setIsSearchingCities(false);
        }
      }, 300);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setIsSearchingCities(false);
    }
  }, [birthData, setBirthData]);
  
  // Handle city selection
  const handleCitySelect = useCallback((city: any) => {
    const cityDisplay = [city.name, city.district, city.state, city.country]
      .filter(Boolean)
      .join(', ');
    
    setBirthData({
      ...birthData,
      birthPlace: cityDisplay,
      latitude: city.latitude,
      longitude: city.longitude
    });
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  }, [birthData, setBirthData]);
  
  // Simple date handler - just store and display what user types
  const handleDateChange = useCallback((field: 'day' | 'month' | 'year', value: string) => {
    // Update the input state immediately so user sees what they type
    setDateInputs(prev => ({ ...prev, [field]: value }));
    
    // Only numbers allowed
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    // Basic length limits
    if (field === 'day' && value.length > 2) return;
    if (field === 'month' && value.length > 2) return;
    if (field === 'year' && value.length > 4) return;
    
    // Try to create date only when we have all 3 values
    const day = field === 'day' ? value : dateInputs.day;
    const month = field === 'month' ? value : dateInputs.month;
    const year = field === 'year' ? value : dateInputs.year;
    
    if (day.length === 2 && month.length >= 1 && year.length === 4) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 0 && monthNum <= 11 && yearNum >= 1900 && yearNum <= 2100) {
        const date = new Date(yearNum, monthNum, dayNum);
        if (!isNaN(date.getTime())) {
          setBirthData({ ...birthData, dateOfBirth: date.toISOString().split('T')[0] });
          setValidation(prev => ({ ...prev, dateOfBirth: true }));
          return;
        }
      }
    }
    
    // If we get here, validation failed
    setValidation(prev => ({ ...prev, dateOfBirth: false }));
  }, [dateInputs, birthData, setBirthData]);
  
  // Simple time handler - just store and display what user types
  const handleTimeChange = useCallback((field: 'hour' | 'minute' | 'period', value: string) => {
    if (field === 'hour' || field === 'minute') {
      // Update the input state immediately so user sees what they type
      setTimeInputs(prev => ({ ...prev, [field]: value }));
      
      // Only numbers allowed
      if (value !== '' && !/^\d+$/.test(value)) return;
      
      // Basic length limits
      if (field === 'hour' && value.length > 2) return;
      if (field === 'minute' && value.length > 2) return;
    } else {
      // AM/PM change
      setTimeInputs(prev => ({ ...prev, period: value as 'AM' | 'PM' }));
    }
    
    // Try to create time only when we have hour and minute
    const hour = field === 'hour' ? value : timeInputs.hour;
    const minute = field === 'minute' ? value : timeInputs.minute;
    const period = field === 'period' ? value : timeInputs.period;
    
    if (hour.length === 2 && minute.length === 2) {
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      
      if (hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59) {
        // Convert to 24-hour format
        const hour24 = period === 'AM'
          ? (hourNum === 12 ? 0 : hourNum)
          : (hourNum === 12 ? 12 : hourNum + 12);
        
        setBirthData({
          ...birthData,
          tentativeTime: `${String(hour24).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`
        });
        setValidation(prev => ({ ...prev, tentativeTime: true }));
        return;
      }
    }
    
    // If we get here, validation failed
    setValidation(prev => ({ ...prev, tentativeTime: false }));
  }, [timeInputs, birthData, setBirthData]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citiesDropdownRef.current && !citiesDropdownRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Time uncertainty options with better UX
  const timeUncertaintyOptions = [
    { value: 'exact', label: '🎯 Exact Time', description: 'Verified from birth certificate', interval: '±0 min' },
    { value: '5min', label: '⏰ Very Accurate', description: 'Within 5 minutes', interval: '±5 min' },
    { value: '15min', label: '🕐 Accurate', description: 'Within 15 minutes', interval: '±15 min' },
    { value: '30min', label: '🕑 Fairly Accurate', description: 'Within 30 minutes', interval: '±30 min' },
    { value: '1hour', label: '🕒 Approximate', description: 'Within 1 hour', interval: '±1 hour' },
    { value: '2hour', label: '🕓 Rough Estimate', description: 'Within 2 hours', interval: '±2 hours' },
    { value: '4hour', label: '🕔 Very Uncertain', description: 'Within 4 hours', interval: '±4 hours' },
    { value: 'unknown', label: '❓ Unknown', description: 'No information available', interval: 'Unknown' }
  ];
  
  // Manual time uncertainty input
  const [manualUncertainty, setManualUncertainty] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const handleManualUncertainty = (value: string) => {
    setManualUncertainty(value);
    if (value && /^\d+$/.test(value)) {
      const minutes = parseInt(value);
      if (minutes >= 0 && minutes <= 240) {
        setBirthData({ ...birthData, timeUncertainty: `manual:${minutes}` as any });
      }
    }
  };
  
  // Popular Indian cities
  const popularCities = [
    { name: 'Delhi', district: 'Delhi', state: 'Delhi', country: 'India', latitude: 28.7041, longitude: 77.1025 },
    { name: 'Mumbai', district: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
    { name: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
    { name: 'Kolkata', district: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 },
    { name: 'Bangalore', district: 'Bangalore', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
    { name: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
    { name: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
    { name: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 }
  ];
  
  // Input component with validation and accessibility
  const ValidatedInput = ({
    id,
    label,
    value,
    onChange,
    onBlur,
    isValid,
    touched: fieldTouched,
    type = 'text',
    placeholder = '',
    ariaLabel,
    errorMessage,
    ...props
  }: any) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    
    return (
      <div className="relative mb-6">
        <label htmlFor={inputId} className="block text-sm font-medium text-white/80 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
              fieldTouched && !isValid
                ? 'border-red-500 focus:ring-red-500'
                : fieldTouched && isValid
                ? 'border-green-500 focus:ring-green-500'
                : 'border-white/20 focus:ring-amber-500'
            }`}
            placeholder={placeholder}
            aria-label={ariaLabel || label}
            aria-describedby={`${helpId} ${errorId}`}
            aria-invalid={fieldTouched && !isValid}
            {...props}
          />
          {fieldTouched && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
              )}
            </div>
          )}
        </div>
        {fieldTouched && !isValid && errorMessage && (
          <p id={errorId} className="text-sm text-red-400 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Let's start with basic details...
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Every piece of information helps us find your exact birth time with precision
          </p>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          
          {/* Name */}
          <div className="mb-8">
            <ValidatedInput
              id="fullName"
              label="What's your name?"
              value={birthData.fullName || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // Sanitize input to prevent XSS
                const sanitized = e.target.value.replace(/[<>"']/g, '');
                const newData = { ...birthData, fullName: sanitized };
                setBirthData(newData);
              }}
              onBlur={() => setTouched((prev: any) => ({ ...prev, fullName: true }))}
              isValid={validation.fullName}
              touched={touched.fullName}
              placeholder="Enter your full name (e.g., Rahul Sharma)"
              required
              aria-label="Full name"
              aria-describedby="name-help"
              aria-invalid={touched.fullName && !validation.fullName}
            />
            <p id="name-help" className="text-sm text-white/60 mt-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              This appears on your rectification report
            </p>
            {touched.fullName && !validation.fullName && (
              <p className="text-sm text-red-400 mt-1">
                Please enter your full name (minimum 2 characters)
              </p>
            )}
          </div>
          
          {/* Date of Birth */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              When were you born?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ValidatedInput
                id="day"
                label="Day"
                type="number"
                min="1"
                max="31"
                value={displayDate.day}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange('day', e.target.value)}
                onBlur={() => setTouched((prev: any) => ({ ...prev, dateOfBirth: true }))}
                isValid={validation.dateOfBirth}
                touched={touched.dateOfBirth}
                placeholder="DD"
                required
                errorMessage="Please enter a valid day (1-31)"
              />
              
              <div className="mb-6">
                <label htmlFor="month" className="block text-sm font-medium text-white/80 mb-2">Month</label>
                <select
                  id="month"
                  value={displayDate.month}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDateChange('month', e.target.value)}
                  onBlur={() => setTouched((prev: any) => ({ ...prev, dateOfBirth: true }))}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    touched.dateOfBirth && !validation.dateOfBirth
                      ? 'border-red-500 focus:ring-red-500'
                      : touched.dateOfBirth && validation.dateOfBirth
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-white/20 focus:ring-amber-500'
                  }`}
                  required
                  aria-label="Month of birth"
                  aria-describedby="month-help"
                >
                  <option value="">Select Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <p id="month-help" className="text-sm text-white/60 mt-2">
                  Select the month you were born
                </p>
              </div>
              
              <ValidatedInput
                id="year"
                label="Year"
                type="number"
                min="1900"
                max="2100"
                value={displayDate.year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateChange('year', e.target.value)}
                onBlur={() => setTouched((prev: any) => ({ ...prev, dateOfBirth: true }))}
                isValid={validation.dateOfBirth}
                touched={touched.dateOfBirth}
                placeholder="YYYY"
                required
                errorMessage="Please enter a valid year (1900-2100)"
              />
            </div>
            {touched.dateOfBirth && !validation.dateOfBirth && (
              <p className="text-sm text-red-400 mt-2">
                Please enter a valid date of birth
              </p>
            )}
          </div>
          
          {/* Birth Time */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              What time were you born? (approximately)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <ValidatedInput
                id="hour"
                label="Hour"
                type="number"
                min="1"
                max="12"
                value={displayTime.hour}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange('hour', e.target.value)}
                onBlur={() => setTouched((prev: any) => ({ ...prev, tentativeTime: true }))}
                isValid={validation.tentativeTime}
                touched={touched.tentativeTime}
                placeholder="HH"
                required
                errorMessage="Please enter a valid hour (1-12)"
              />
              
              <ValidatedInput
                id="minute"
                label="Minute"
                type="number"
                min="0"
                max="59"
                value={displayTime.minute}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTimeChange('minute', e.target.value)}
                onBlur={() => setTouched((prev: any) => ({ ...prev, tentativeTime: true }))}
                isValid={validation.tentativeTime}
                touched={touched.tentativeTime}
                placeholder="MM"
                required
                errorMessage="Please enter a valid minute (0-59)"
              />
              
              <div className="mb-6">
                <label htmlFor="period" className="block text-sm font-medium text-white/80 mb-2">Period</label>
                <select
                  id="period"
                  value={displayTime.period}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleTimeChange('period', e.target.value)}
                  onBlur={() => setTouched((prev: any) => ({ ...prev, tentativeTime: true }))}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    touched.tentativeTime && !validation.tentativeTime
                      ? 'border-red-500 focus:ring-red-500'
                      : touched.tentativeTime && validation.tentativeTime
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-white/20 focus:ring-amber-500'
                  }`}
                  required
                  aria-label="AM or PM"
                >
                  <option value="AM">🌅 AM</option>
                  <option value="PM">🌆 PM</option>
                </select>
              </div>
            </div>
            
            {/* Time Uncertainty */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-3">
                How sure are you about this time?
              </label>
              
              {/* Quick selection grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {timeUncertaintyOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setBirthData({ ...birthData, timeUncertainty: option.value as any });
                      setShowManualInput(false);
                    }}
                    className={`p-3 rounded-xl text-center transition-all duration-300 border-2 min-w-0 ${
                      birthData.timeUncertainty === option.value
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                        : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                    }`}
                    aria-pressed={birthData.timeUncertainty === option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-lg mb-1">{option.label.split(' ')[0]}</div>
                    <div className="text-xs font-medium">{option.label.split(' ')[1] || ''}</div>
                    <div className="text-xs text-white/60 mt-1">{option.interval}</div>
                    <div className="text-xs text-white/50 mt-1">{option.description}</div>
                  </motion.button>
                ))}
              </div>
              
              {/* Manual input option */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showManualInput
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {showManualInput ? '✏️ Manual Entry' : '✏️ Enter Custom Minutes'}
                </button>
                
                {birthData.timeUncertainty?.toString().startsWith('manual:') && (
                  <span className="text-sm text-amber-400">
                    Custom: ±{birthData.timeUncertainty.toString().split(':')[1]} minutes
                  </span>
                )}
              </div>
              
              {/* Manual input field */}
              <AnimatePresence>
                {showManualInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/5 border border-white/20 rounded-xl p-4"
                  >
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Enter uncertainty in minutes (0-240)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="240"
                        value={manualUncertainty}
                        onChange={(e) => handleManualUncertainty(e.target.value)}
                        placeholder="e.g., 30"
                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-sm text-white/70">minutes</span>
                    </div>
                    <p className="text-xs text-white/60 mt-2">
                      Enter how many minutes your birth time might be off by
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Time Help Panel */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <button
                onClick={() => setShowTimeHelp(!showTimeHelp)}
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300 mb-2 w-full text-left"
                type="button"
                aria-expanded={showTimeHelp}
                aria-controls="time-help-content"
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Where to find your birth time</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTimeHelp ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showTimeHelp && (
                  <motion.div
                    id="time-help-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-white/80 space-y-2"
                  >
                    <p>• Hospital birth certificate (most accurate)</p>
                    <p>• Family records or kundli</p>
                    <p>• Ask parents/grandparents</p>
                    <p>• School admission records sometimes have it</p>
                    <p className="text-amber-300 font-medium">👉 Even approximate time works! That's why we do rectification.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {touched.tentativeTime && !validation.tentativeTime && (
              <p className="text-sm text-red-400 mt-2">
                Please enter a valid time
              </p>
            )}
          </div>
          
          {/* Birth Place */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              Where were you born?
            </label>
            
            {/* Location Mode Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['search', 'manual', 'map'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocationMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    locationMode === mode
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  aria-pressed={locationMode === mode}
                >
                  {mode === 'search' && '🔍 Search'}
                  {mode === 'manual' && '✏️ Manual'}
                  {mode === 'map' && '🗺️ Map'}
                </button>
              ))}
            </div>
            
            {/* Search Mode */}
            {locationMode === 'search' && (
              <div className="space-y-4">
                <div className="relative mb-6" ref={citiesDropdownRef}>
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                  <input
                    type="text"
                    value={birthData.birthPlace || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      // Sanitize input to prevent XSS
                      const sanitized = e.target.value.replace(/[<>"']/g, '');
                      handleCitySearch(sanitized);
                    }}
                    onFocus={() => birthData.birthPlace && citySuggestions.length > 0 && setShowCitySuggestions(true)}
                    placeholder="Start typing city name (e.g., Mumbai, Delhi, Bangalore)..."
                    className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      touched.birthPlace && !validation.birthPlace
                        ? 'border-red-500 focus:ring-red-500'
                        : touched.birthPlace && validation.birthPlace
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-white/20 focus:ring-amber-500'
                    }`}
                    aria-label="Birth place search"
                    aria-describedby="birthplace-help"
                    required
                  />
                  {isSearchingCities && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" aria-hidden="true" />
                  )}
                </div>
                <p id="birthplace-help" className="text-sm text-white/60 mt-2">
                  Start typing to search for your birth city
                </p>
                
                {/* Popular Cities */}
                <div>
                  <p className="text-sm text-white/60 mb-2">Popular cities in India:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularCities.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleCitySelect(city)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/80 transition-all"
                        type="button"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* City Suggestions */}
                <AnimatePresence>
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-slate-800 border border-white/20 rounded-xl overflow-hidden z-50 shadow-xl"
                      role="listbox"
                      aria-label="City suggestions"
                    >
                      {citySuggestions.map((city, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-500/20 transition-colors border-b border-white/10 last:border-b-0 flex flex-col"
                          type="button"
                          role="option"
                        >
                          <div className="font-medium text-white">{city.name}</div>
                          <div className="text-sm text-white/60 mt-1">
                            {[city.district, city.state, city.country].filter(Boolean).join(' • ')}
                          </div>
                          <div className="text-xs text-amber-400 mt-1 font-mono">
                            {city.latitude.toFixed(4)}° N, {city.longitude.toFixed(4)}° E
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* Manual Entry Mode */}
            {locationMode === 'manual' && (
              <div className="space-y-4">
                <ValidatedInput
                  id="birthPlace"
                  label="Birth Place Name"
                  value={birthData.birthPlace || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    // Sanitize input to prevent XSS
                    const sanitized = e.target.value.replace(/[<>"']/g, '');
                    setBirthData({ ...birthData, birthPlace: sanitized });
                  }}
                  onBlur={() => setTouched((prev: any) => ({ ...prev, birthPlace: true }))}
                  isValid={validation.birthPlace}
                  touched={touched.birthPlace}
                  placeholder="Enter city/town name (e.g., Jaipur, Rajasthan)"
                  required
                  errorMessage="Please enter a valid birth place"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ValidatedInput
                    id="latitude"
                    label="Latitude"
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    value={birthData.latitude?.toString() || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseFloat(e.target.value);
                      setBirthData({ ...birthData, latitude: isNaN(value) ? 0 : value });
                    }}
                    onBlur={() => setTouched((prev: any) => ({ ...prev, latitude: true }))}
                    isValid={validation.latitude}
                    touched={touched.latitude}
                    placeholder="e.g., 28.7041 (Delhi)"
                    required
                    errorMessage="Latitude must be between -90 and 90"
                    aria-label="Latitude coordinate"
                  />
                  <ValidatedInput
                    id="longitude"
                    label="Longitude"
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    value={birthData.longitude?.toString() || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = parseFloat(e.target.value);
                      setBirthData({ ...birthData, longitude: isNaN(value) ? 0 : value });
                    }}
                    onBlur={() => setTouched((prev: any) => ({ ...prev, longitude: true }))}
                    isValid={validation.longitude}
                    touched={touched.longitude}
                    placeholder="e.g., 77.1025 (Delhi)"
                    required
                    errorMessage="Longitude must be between -180 and 180"
                    aria-label="Longitude coordinate"
                  />
                </div>
              </div>
            )}
            
            {/* Map Mode */}
            {locationMode === 'map' && (
              <div className="space-y-4">
                <div className="mb-6">
                  <MapPicker
                    initialLat={birthData.latitude || 20}
                    initialLon={birthData.longitude || 77}
                    onCoordinateSelect={(lat, lon) => {
                      setBirthData({ ...birthData, latitude: lat, longitude: lon });
                      setTouched((prev: any) => ({ ...prev, latitude: true, longitude: true }));
                    }}
                  />
                  <p className="text-sm text-white/60 mt-2">
                    Click on the map to select your exact birth location
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Gender */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              What's your gender?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setBirthData({ ...birthData, gender: 'male' });
                  setTouched((prev: any) => ({ ...prev, gender: true }));
                }}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2 ${
                  birthData.gender === 'male'
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
                aria-pressed={birthData.gender === 'male'}
              >
                <div className="text-4xl mb-2">👨</div>
                <div className="text-lg font-semibold">Male</div>
                {touched.gender && validation.gender && birthData.gender === 'male' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBirthData({ ...birthData, gender: 'female' });
                  setTouched((prev: any) => ({ ...prev, gender: true }));
                }}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2 ${
                  birthData.gender === 'female'
                    ? 'bg-pink-500/20 border-pink-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
                aria-pressed={birthData.gender === 'female'}
              >
                <div className="text-4xl mb-2">👩</div>
                <div className="text-lg font-semibold">Female</div>
                {touched.gender && validation.gender && birthData.gender === 'female' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-sm text-white/60 mt-3 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              Used for Tattwa Shodhana verification - an ancient method that cross-checks gender from birth chart
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
