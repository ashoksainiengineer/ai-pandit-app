'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

export default function BirthDataForm({ birthData, setBirthData }: BirthDataFormProps) {
  const [locationMode, setLocationMode] = useState<'search' | 'manual' | 'map'>('search');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [showTimeHelp, setShowTimeHelp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Simple state for raw inputs
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
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!birthData.fullName || birthData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name';
    }
    
    if (!birthData.dateOfBirth) {
      newErrors.dateOfBirth = 'Please enter a valid date';
    }
    
    if (!birthData.tentativeTime) {
      newErrors.tentativeTime = 'Please enter a valid time';
    }
    
    if (!birthData.birthPlace || birthData.birthPlace.trim().length < 2) {
      newErrors.birthPlace = 'Please enter your birth place';
    }
    
    if (!birthData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthData]);
  
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
          setShowCitySuggestions(false);
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
    setErrors(prev => ({ ...prev, birthPlace: '' }));
  }, [birthData, setBirthData]);
  
  // Simple date handler
  const handleDateChange = useCallback((field: 'day' | 'month' | 'year', value: string) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    const newDateInputs = { ...dateInputs, [field]: value };
    setDateInputs(newDateInputs);
    
    // Try to create date when we have all values
    const { day, month, year } = newDateInputs;
    
    if (day && month && year) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 0 && monthNum <= 11 && yearNum >= 1900 && yearNum <= 2100) {
        const date = new Date(yearNum, monthNum, dayNum);
        if (!isNaN(date.getTime())) {
          const isoDate = date.toISOString().split('T')[0];
          setBirthData({ ...birthData, dateOfBirth: isoDate });
          setErrors(prev => ({ ...prev, dateOfBirth: '' }));
          return;
        }
      }
    }
    
    // Clear date if invalid
    setBirthData({ ...birthData, dateOfBirth: '' });
  }, [dateInputs, birthData, setBirthData]);
  
  // Simple time handler
  const handleTimeChange = useCallback((field: 'hour' | 'minute' | 'period', value: string) => {
    const newTimeInputs = { ...timeInputs, [field]: value };
    setTimeInputs(newTimeInputs);
    
    // Try to create time when we have hour and minute
    const { hour, minute, period } = newTimeInputs;
    
    if (hour && minute) {
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      
      if (hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59) {
        // Convert to 24-hour format
        const hour24 = period === 'AM'
          ? (hourNum === 12 ? 0 : hourNum)
          : (hourNum === 12 ? 12 : hourNum + 12);
        
        const timeStr = `${String(hour24).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`;
        setBirthData({ ...birthData, tentativeTime: timeStr });
        setErrors(prev => ({ ...prev, tentativeTime: '' }));
        return;
      }
    }
    
    // Clear time if invalid
    setBirthData({ ...birthData, tentativeTime: '' });
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
  
  // Time uncertainty options
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
  
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Let's start with basic details...
        </h2>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          Every piece of information helps us find your exact birth time with precision
        </p>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          
          {/* Name */}
          <div className="mb-8">
            <div className="relative mb-6">
              <label htmlFor="fullName" className="block text-sm font-medium text-white/80 mb-2">
                What's your name?
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={birthData.fullName || ''}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[<>'"]/g, '');
                    setBirthData({ ...birthData, fullName: sanitized });
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                  }}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  placeholder="Enter your full name (e.g., Rahul Sharma)"
                  required
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-red-400 mt-1">{errors.fullName}</p>
              )}
            </div>
            <p className="text-sm text-white/60 mt-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              This appears on your rectification report
            </p>
          </div>
          
          {/* Date of Birth */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              When were you born?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative mb-6">
                <label htmlFor="day" className="block text-sm font-medium text-white/80 mb-2">Day</label>
                <input
                  id="day"
                  type="number"
                  min="1"
                  max="31"
                  value={dateInputs.day}
                  onChange={(e) => handleDateChange('day', e.target.value)}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  placeholder="DD"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="month" className="block text-sm font-medium text-white/80 mb-2">Month</label>
                <select
                  id="month"
                  value={dateInputs.month}
                  onChange={(e) => handleDateChange('month', e.target.value)}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  required
                >
                  <option value="">Select Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative mb-6">
                <label htmlFor="year" className="block text-sm font-medium text-white/80 mb-2">Year</label>
                <input
                  id="year"
                  type="number"
                  min="1900"
                  max="2100"
                  value={dateInputs.year}
                  onChange={(e) => handleDateChange('year', e.target.value)}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  placeholder="YYYY"
                  required
                />
              </div>
            </div>
            {errors.dateOfBirth && (
              <p className="text-sm text-red-400 mt-2">{errors.dateOfBirth}</p>
            )}
          </div>
          
          {/* Birth Time */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              What time were you born? (approximately)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative mb-6">
                <label htmlFor="hour" className="block text-sm font-medium text-white/80 mb-2">Hour</label>
                <input
                  id="hour"
                  type="number"
                  min="1"
                  max="12"
                  value={timeInputs.hour}
                  onChange={(e) => handleTimeChange('hour', e.target.value)}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.tentativeTime ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  placeholder="HH"
                  required
                />
              </div>
              
              <div className="relative mb-6">
                <label htmlFor="minute" className="block text-sm font-medium text-white/80 mb-2">Minute</label>
                <input
                  id="minute"
                  type="number"
                  min="0"
                  max="59"
                  value={timeInputs.minute}
                  onChange={(e) => handleTimeChange('minute', e.target.value)}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.tentativeTime ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  placeholder="MM"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="period" className="block text-sm font-medium text-white/80 mb-2">Period</label>
                <select
                  id="period"
                  value={timeInputs.period}
                  onChange={(e) => handleTimeChange('period', e.target.value)}
                  onBlur={() => validateForm()}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.tentativeTime ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                  }`}
                  required
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {timeUncertaintyOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setBirthData({ ...birthData, timeUncertainty: option.value as any });
                    }}
                    className={`p-3 rounded-xl text-center transition-all duration-300 border-2 min-w-0 ${
                      birthData.timeUncertainty === option.value
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                        : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40 hover:bg-white/10'
                    }`}
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
            </div>
            
            {errors.tentativeTime && (
              <p className="text-sm text-red-400 mt-2">{errors.tentativeTime}</p>
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
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[<>'"]/g, '');
                      handleCitySearch(sanitized);
                      if (errors.birthPlace) setErrors(prev => ({ ...prev, birthPlace: '' }));
                    }}
                    onFocus={() => birthData.birthPlace && citySuggestions.length > 0 && setShowCitySuggestions(true)}
                    placeholder="Start typing city name (e.g., Mumbai, Delhi, Bangalore)..."
                    className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.birthPlace ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                    }`}
                    required
                  />
                  {isSearchingCities && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
                  )}
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
                
                {errors.birthPlace && (
                  <p className="text-sm text-red-400 mt-1">{errors.birthPlace}</p>
                )}
              </div>
            )}
            
            {/* Manual Entry Mode */}
            {locationMode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="manualBirthPlace" className="block text-sm font-medium text-white/80 mb-2">
                    Birth Place Name
                  </label>
                  <input
                    id="manualBirthPlace"
                    type="text"
                    value={birthData.birthPlace || ''}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[<>'"]/g, '');
                      setBirthData({ ...birthData, birthPlace: sanitized });
                      if (errors.birthPlace) setErrors(prev => ({ ...prev, birthPlace: '' }));
                    }}
                    onBlur={() => validateForm()}
                    placeholder="Enter city/town name (e.g., Jaipur, Rajasthan)"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.birthPlace ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'
                    }`}
                    required
                  />
                  {errors.birthPlace && (
                    <p className="text-sm text-red-400 mt-1">{errors.birthPlace}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-white/80 mb-2">Latitude</label>
                    <input
                      id="latitude"
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                      value={birthData.latitude?.toString() || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setBirthData({ ...birthData, latitude: isNaN(value) ? 0 : value });
                      }}
                      placeholder="e.g., 28.7041 (Delhi)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-white/80 mb-2">Longitude</label>
                    <input
                      id="longitude"
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      value={birthData.longitude?.toString() || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setBirthData({ ...birthData, longitude: isNaN(value) ? 0 : value });
                      }}
                      placeholder="e.g., 77.1025 (Delhi)"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Map Mode */}
            {locationMode === 'map' && (
              <div className="space-y-4">
                <div>
                  <MapPicker
                    initialLat={birthData.latitude || 20}
                    initialLon={birthData.longitude || 77}
                    onCoordinateSelect={(lat, lon) => {
                      setBirthData({ ...birthData, latitude: lat, longitude: lon });
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
                  setErrors(prev => ({ ...prev, gender: '' }));
                }}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2 ${
                  birthData.gender === 'male'
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-4xl mb-2">👨</div>
                <div className="text-lg font-semibold">Male</div>
                {birthData.gender === 'male' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBirthData({ ...birthData, gender: 'female' });
                  setErrors(prev => ({ ...prev, gender: '' }));
                }}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2 ${
                  birthData.gender === 'female'
                    ? 'bg-pink-500/20 border-pink-500 text-white shadow-lg'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                }`}
              >
                <div className="text-4xl mb-2">👩</div>
                <div className="text-lg font-semibold">Female</div>
                {birthData.gender === 'female' && (
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-2" />
                )}
              </button>
            </div>
            {errors.gender && (
              <p className="text-sm text-red-400 mt-2">{errors.gender}</p>
            )}
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
