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
  
  const citiesDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Derived date values with memoization
  const dateValues = useMemo(() => {
    if (!birthData.dateOfBirth) {
      return { day: '', month: '', year: '' };
    }
    const date = new Date(birthData.dateOfBirth);
    if (isNaN(date.getTime())) {
      return { day: '', month: '', year: '' };
    }
    return {
      day: date.getDate().toString(),
      month: date.getMonth().toString(),
      year: date.getFullYear().toString()
    };
  }, [birthData.dateOfBirth]);
  
  // Time values
  const timeValues = useMemo(() => {
    if (!birthData.tentativeTime) {
      return { hour: '', minute: '', period: 'AM' as const };
    }
    const [hours, minutes] = birthData.tentativeTime.split(':');
    const hourNum = parseInt(hours);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    
    return {
      hour: displayHour.toString().padStart(2, '0'),
      minute: minutes || '00',
      period
    };
  }, [birthData.tentativeTime]);
  
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
  
  // Date handlers
  const handleDateChange = useCallback((field: 'day' | 'month' | 'year', value: string) => {
    const currentDate = birthData.dateOfBirth ? new Date(birthData.dateOfBirth) : new Date();
    const day = field === 'day' ? parseInt(value) : currentDate.getDate();
    const month = field === 'month' ? parseInt(value) : currentDate.getMonth();
    const year = field === 'year' ? parseInt(value) : currentDate.getFullYear();
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const newDate = new Date(year, month, day);
      if (!isNaN(newDate.getTime())) {
        setBirthData({ ...birthData, dateOfBirth: newDate.toISOString().split('T')[0] });
      }
    }
  }, [birthData.dateOfBirth, birthData, setBirthData]);
  
  // Time handlers
  const handleTimeChange = useCallback((field: 'hour' | 'minute' | 'period', value: string) => {
    const currentTime = birthData.tentativeTime || '12:00';
    const [currentHour, currentMinute] = currentTime.split(':');
    let hour24 = parseInt(currentHour) || 12;
    const minute = parseInt(currentMinute) || 0;
    
    if (field === 'period') {
      const isPM = value === 'PM';
      if (isPM && hour24 < 12) hour24 += 12;
      if (!isPM && hour24 === 12) hour24 = 0;
    } else if (field === 'hour') {
      const displayHour = parseInt(value) || 12;
      const isPM = hour24 >= 12;
      hour24 = displayHour === 12 ? (isPM ? 12 : 0) : (isPM ? displayHour + 12 : displayHour);
    } else if (field === 'minute') {
      const newMinute = parseInt(value) || 0;
      setBirthData({ ...birthData, tentativeTime: `${String(hour24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}` });
      return;
    }
    
    setBirthData({ ...birthData, tentativeTime: `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}` });
  }, [birthData.tentativeTime, birthData, setBirthData]);
  
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
  
  // Time uncertainty options
  const timeUncertaintyOptions = [
    { value: 'exact', label: '🎯 Exact Time', description: 'Verified from birth certificate' },
    { value: '5min', label: '⏰ ±5 minutes', description: 'Very accurate estimate' },
    { value: '15min', label: '🕐 ±15 minutes', description: 'Accurate estimate' },
    { value: '30min', label: '🕑 ±30 minutes', description: 'Fairly accurate' },
    { value: '1hour', label: '🕒 ±1 hour', description: 'Approximate time' },
    { value: '2hour', label: '🕓 ±2 hours', description: 'Rough estimate' },
    { value: '4hour', label: '🕔 ±4 hours', description: 'Very uncertain' },
    { value: 'unknown', label: '❓ Unknown', description: 'No information' }
  ];
  
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
  
  // Input component with validation
  const ValidatedInput = ({ id, label, value, onChange, onBlur, isValid, touched: fieldTouched, type = 'text', ...props }: any) => {
    return (
      <div className="relative">
        <label htmlFor={id} className="block text-sm font-medium text-white/80 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
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
            {...props}
          />
          {fieldTouched && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {isValid ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
        </div>
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
          <div>
            <ValidatedInput
              id="fullName"
              label="What's your name?"
              value={birthData.fullName || ''}
              onChange={(e: any) => setBirthData({ ...birthData, fullName: e.target.value })}
              onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
              isValid={validation.fullName}
              touched={touched.fullName}
              placeholder="Enter your full name"
              required
            />
            <p className="text-sm text-white/60 mt-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              This appears on your rectification report
            </p>
          </div>
          
          {/* Date of Birth */}
          <div>
            <label className="block text-lg font-medium text-white mb-3">
              When were you born?
            </label>
            <div className="grid grid-cols-3 gap-4">
              <ValidatedInput
                id="day"
                label="Day"
                type="number"
                min="1"
                max="31"
                value={dateValues.day}
                onChange={(e: any) => handleDateChange('day', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, dateOfBirth: true }))}
                isValid={validation.dateOfBirth}
                touched={touched.dateOfBirth}
                placeholder="DD"
                required
              />
              
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-white/80 mb-2">Month</label>
                <select
                  id="month"
                  value={dateValues.month}
                  onChange={(e) => handleDateChange('month', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, dateOfBirth: true }))}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    touched.dateOfBirth && !validation.dateOfBirth 
                      ? 'border-red-500 focus:ring-red-500' 
                      : touched.dateOfBirth && validation.dateOfBirth
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-white/20 focus:ring-amber-500'
                  }`}
                  required
                >
                  <option value="">Select</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <ValidatedInput
                id="year"
                label="Year"
                type="number"
                min="1900"
                max="2100"
                value={dateValues.year}
                onChange={(e: any) => handleDateChange('year', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, dateOfBirth: true }))}
                isValid={validation.dateOfBirth}
                touched={touched.dateOfBirth}
                placeholder="YYYY"
                required
              />
            </div>
          </div>
          
          {/* Birth Time */}
          <div>
            <label className="block text-lg font-medium text-white mb-3">
              What time were you born? (approximately)
            </label>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <ValidatedInput
                id="hour"
                label="Hour"
                type="number"
                min="1"
                max="12"
                value={timeValues.hour}
                onChange={(e: any) => handleTimeChange('hour', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, tentativeTime: true }))}
                isValid={validation.tentativeTime}
                touched={touched.tentativeTime}
                placeholder="HH"
                required
              />
              
              <ValidatedInput
                id="minute"
                label="Minute"
                type="number"
                min="0"
                max="59"
                value={timeValues.minute}
                onChange={(e: any) => handleTimeChange('minute', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, tentativeTime: true }))}
                isValid={validation.tentativeTime}
                touched={touched.tentativeTime}
                placeholder="MM"
                required
              />
              
              <div>
                <label htmlFor="period" className="block text-sm font-medium text-white/80 mb-2">Period</label>
                <select
                  id="period"
                  value={timeValues.period}
                  onChange={(e) => handleTimeChange('period', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, tentativeTime: true }))}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    touched.tentativeTime && !validation.tentativeTime 
                      ? 'border-red-500 focus:ring-red-500' 
                      : touched.tentativeTime && validation.tentativeTime
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-white/20 focus:ring-amber-500'
                  }`}
                  required
                >
                  <option value="AM">🌅 AM</option>
                  <option value="PM">🌆 PM</option>
                </select>
              </div>
            </div>
            
            {/* Time Uncertainty */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/70 mb-3">
                How sure are you about this time?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {timeUncertaintyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBirthData({ ...birthData, timeUncertainty: option.value as any })}
                    className={`p-3 rounded-xl text-center transition-all duration-300 border-2 ${
                      birthData.timeUncertainty === option.value
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                    }`}
                  >
                    <div className="text-lg mb-1">{option.label.split(' ')[0]}</div>
                    <div className="text-xs">{option.label.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Help Panel */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <button
                onClick={() => setShowTimeHelp(!showTimeHelp)}
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300 mb-2 w-full text-left"
                type="button"
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Where to find your birth time</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTimeHelp ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showTimeHelp && (
                  <motion.div
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
          </div>
          
          {/* Birth Place */}
          <div>
            <label className="block text-lg font-medium text-white mb-3">
              Where were you born?
            </label>
            
            {/* Location Mode Tabs */}
            <div className="flex gap-2 mb-4">
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
                <div className="relative" ref={citiesDropdownRef}>
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                  <input
                    type="text"
                    value={birthData.birthPlace || ''}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onFocus={() => birthData.birthPlace && citySuggestions.length > 0 && setShowCitySuggestions(true)}
                    placeholder="Start typing city name..."
                    className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      touched.birthPlace && !validation.birthPlace 
                        ? 'border-red-500 focus:ring-red-500' 
                        : touched.birthPlace && validation.birthPlace
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-white/20 focus:ring-amber-500'
                    }`}
                    aria-label="Birth place search"
                    required
                  />
                  {isSearchingCities && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
                  )}
                </div>
                
                {/* Popular Cities */}
                <div>
                  <p className="text-sm text-white/60 mb-2">Popular cities:</p>
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
                    >
                      {citySuggestions.map((city, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-500/20 transition-colors border-b border-white/10 last:border-b-0 flex flex-col"
                          type="button"
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
                  onChange={(e: any) => setBirthData({ ...birthData, birthPlace: e.target.value })}
                  onBlur={() => setTouched(prev => ({ ...prev, birthPlace: true }))}
                  isValid={validation.birthPlace}
                  touched={touched.birthPlace}
                  placeholder="Enter city/town name"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    id="latitude"
                    label="Latitude"
                    type="number"
                    step="0.0001"
                    value={birthData.latitude?.toString() || ''}
                    onChange={(e: any) => setBirthData({ ...birthData, latitude: parseFloat(e.target.value) })}
                    onBlur={() => setTouched(prev => ({ ...prev, latitude: true }))}
                    isValid={validation.latitude}
                    touched={touched.latitude}
                    placeholder="e.g., 28.7041"
                    required
                  />
                  <ValidatedInput
                    id="longitude"
                    label="Longitude"
                    type="number"
                    step="0.0001"
                    value={birthData.longitude?.toString() || ''}
                    onChange={(e: any) => setBirthData({ ...birthData, longitude: parseFloat(e.target.value) })}
                    onBlur={() => setTouched(prev => ({ ...prev, longitude: true }))}
                    isValid={validation.longitude}
                    touched={touched.longitude}
                    placeholder="e.g., 77.1025"
                    required
                  />
                </div>
              </div>
            )}
            
            {/* Map Mode */}
            {locationMode === 'map' && (
              <div className="space-y-4">
                <MapPicker
                  initialLat={birthData.latitude || 20}
                  initialLon={birthData.longitude || 77}
                  onCoordinateSelect={(lat, lon) => {
                    setBirthData({ ...birthData, latitude: lat, longitude: lon });
                    setTouched(prev => ({ ...prev, latitude: true, longitude: true }));
                  }}
                />
              </div>
            )}
          </div>
          
          {/* Gender */}
          <div>
            <label className="block text-lg font-medium text-white mb-3">
              What's your gender?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setBirthData({ ...birthData, gender: 'male' });
                  setTouched(prev => ({ ...prev, gender: true }));
                }}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2 ${
                  birthData.gender === 'male'
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-4xl mb-2">👨</div>
                <div className="text-lg font-semibold">Male</div>
                {touched.gender && validation.gender && birthData.gender === 'male' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBirthData({ ...birthData, gender: 'female' });
                  setTouched(prev => ({ ...prev, gender: true }));
                }}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2 ${
                  birthData.gender === 'female'
                    ? 'bg-pink-500/20 border-pink-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-4xl mb-2">👩</div>
                <div className="text-lg font-semibold">Female</div>
                {touched.gender && validation.gender && birthData.gender === 'female' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
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
