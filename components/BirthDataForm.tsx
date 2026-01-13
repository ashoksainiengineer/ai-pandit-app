'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Info, ChevronDown } from 'lucide-react';
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
  const citiesDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle city search with debouncing
  const handleCitySearch = (value: string) => {
    setBirthData({ ...birthData, birthPlace: value });
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length >= 2) {
      setIsSearchingCities(true);
      
      // Debounce the search
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
  };
  
  // Handle city selection
  const handleCitySelect = (city: any) => {
    // Format the city display with full hierarchy
    const cityDisplay = [
      city.name,
      city.district,
      city.state,
      city.country
    ].filter(Boolean).join(', ');
    
    setBirthData({
      ...birthData,
      birthPlace: cityDisplay,
      latitude: city.latitude,
      longitude: city.longitude
    });
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };
  
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
  
  // Time uncertainty options with emojis
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Conversational Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">
            Let's start with basic details...
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Every piece of information helps us find your exact birth time with precision
          </p>
        </motion.div>
      </div>
      
      {/* Conversational Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto"
      >
        <div className="space-y-8">
          
          {/* Name - Conversational Style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block text-lg font-medium text-white mb-3">
              What's your name?
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={birthData.fullName || ''}
                onChange={(e) => setBirthData({ ...birthData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                aria-label="Full Name"
                required
              />
            </div>
            <p className="text-sm text-white/60 mt-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              This appears on your rectification report
            </p>
          </motion.div>
          
          {/* Date of Birth - Conversational Style */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="block text-lg font-medium text-white mb-3">
              When were you born?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={birthData.dateOfBirth ? new Date(birthData.dateOfBirth).getDate() : ''}
                  onChange={(e) => {
                    const day = parseInt(e.target.value);
                    const currentDate = birthData.dateOfBirth ? new Date(birthData.dateOfBirth) : new Date();
                    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    setBirthData({ ...birthData, dateOfBirth: newDate.toISOString().split('T')[0] });
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  aria-label="Day of birth"
                  required
                />
              </div>
              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Month</label>
                <select
                  value={birthData.dateOfBirth ? new Date(birthData.dateOfBirth).getMonth() : ''}
                  onChange={(e) => {
                    const month = parseInt(e.target.value);
                    const currentDate = birthData.dateOfBirth ? new Date(birthData.dateOfBirth) : new Date();
                    const newDate = new Date(currentDate.getFullYear(), month, currentDate.getDate());
                    setBirthData({ ...birthData, dateOfBirth: newDate.toISOString().split('T')[0] });
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  aria-label="Month of birth"
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
              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Year</label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={birthData.dateOfBirth ? new Date(birthData.dateOfBirth).getFullYear() : ''}
                  onChange={(e) => {
                    const year = parseInt(e.target.value);
                    const currentDate = birthData.dateOfBirth ? new Date(birthData.dateOfBirth) : new Date();
                    const newDate = new Date(year, currentDate.getMonth(), currentDate.getDate());
                    setBirthData({ ...birthData, dateOfBirth: newDate.toISOString().split('T')[0] });
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  aria-label="Year of birth"
                  required
                />
              </div>
            </div>
            <button className="text-sm text-amber-400 hover:text-amber-300 mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select from calendar instead
            </button>
          </motion.div>
          
          {/* Birth Time - The Critical One */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <label className="block text-lg font-medium text-white mb-3">
              What time were you born? (approximately)
            </label>
            
            {/* Time Input */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Hour</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={birthData.tentativeTime ? parseInt(birthData.tentativeTime.split(':')[0]) : ''}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value);
                    const currentTime = birthData.tentativeTime || '12:00';
                    const [, minutes] = currentTime.split(':');
                    setBirthData({ 
                      ...birthData, 
                      tentativeTime: `${String(hours).padStart(2, '0')}:${minutes}` 
                    });
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  aria-label="Birth hour"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={birthData.tentativeTime ? parseInt(birthData.tentativeTime.split(':')[1]) : ''}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value);
                    const currentTime = birthData.tentativeTime || '12:00';
                    const [hours] = currentTime.split(':');
                    setBirthData({ 
                      ...birthData, 
                      tentativeTime: `${hours}:${String(minutes).padStart(2, '0')}` 
                    });
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                  aria-label="Birth minutes"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Period</label>
                <select
                  value={birthData.tentativeTime && parseInt(birthData.tentativeTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                  onChange={(e) => {
                    const isPM = e.target.value === 'PM';
                    const currentTime = birthData.tentativeTime || '12:00';
                    const [hours, minutes] = currentTime.split(':');
                    let hour24 = parseInt(hours);
                    
                    if (isPM && hour24 < 12) hour24 += 12;
                    if (!isPM && hour24 === 12) hour24 = 0;
                    
                    setBirthData({ 
                      ...birthData, 
                      tentativeTime: `${String(hour24).padStart(2, '0')}:${minutes}` 
                    });
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                >
                  <option value="AM">🌅 Morning (AM)</option>
                  <option value="PM">🌆 Evening (PM)</option>
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
                    className={`p-3 rounded-xl text-center transition-all duration-300 border-2
                      ${birthData.timeUncertainty === option.value
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
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300 mb-2"
              >
                <Info className="w-4 h-4" />
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
          </motion.div>
          
          {/* Birth Place */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <label className="block text-lg font-medium text-white mb-3">
              Where were you born?
            </label>
            
            {/* Location Mode Tabs */}
            <div className="flex gap-2 mb-4">
              {['search', 'manual', 'map'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLocationMode(mode as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${locationMode === mode
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
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    value={birthData.birthPlace || ''}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onFocus={() => birthData.birthPlace && citySuggestions.length > 0 && setShowCitySuggestions(true)}
                    placeholder="Start typing city name..."
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                    aria-label="Birth place search"
                    required
                  />
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
                          className="w-full px-4 py-3 text-left hover:bg-amber-500/20 transition-colors border-b border-white/10 last:border-b-0"
                        >
                          <div className="font-medium text-white">{city.name}</div>
                          <div className="text-sm text-white/60 mt-1">
                            {[city.district, city.state, city.country].filter(Boolean).join(' • ')}
                          </div>
                          <div className="text-xs text-amber-400 mt-1">
                            Coordinates: {city.latitude.toFixed(4)}° N, {city.longitude.toFixed(4)}° E
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
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Birth Place Name</label>
                  <input
                    type="text"
                    value={birthData.birthPlace || ''}
                    onChange={(e) => setBirthData({ ...birthData, birthPlace: e.target.value })}
                    placeholder="Enter city/town name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                    aria-label="Birth place name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={birthData.latitude || ''}
                      onChange={(e) => setBirthData({ ...birthData, latitude: parseFloat(e.target.value) })}
                      placeholder="e.g., 28.7041"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                      aria-label="Latitude coordinate"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={birthData.longitude || ''}
                      onChange={(e) => setBirthData({ ...birthData, longitude: parseFloat(e.target.value) })}
                      placeholder="e.g., 77.1025"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                      aria-label="Longitude coordinate"
                      required
                    />
                  </div>
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
                  }}
                />
              </div>
            )}
          </motion.div>
          
          {/* Gender - Visual Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <label className="block text-lg font-medium text-white mb-3">
              What's your gender?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setBirthData({ ...birthData, gender: 'male' })}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2
                  ${birthData.gender === 'male'
                    ? 'bg-blue-500/20 border-blue-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                  }`}
              >
                <div className="text-4xl mb-2">👨</div>
                <div className="text-lg font-semibold">Male</div>
              </button>
              <button
                type="button"
                onClick={() => setBirthData({ ...birthData, gender: 'female' })}
                className={`p-6 rounded-xl text-center transition-all duration-300 border-2
                  ${birthData.gender === 'female'
                    ? 'bg-pink-500/20 border-pink-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40'
                  }`}
              >
                <div className="text-4xl mb-2">👩</div>
                <div className="text-lg font-semibold">Female</div>
              </button>
            </div>
            <p className="text-sm text-white/60 mt-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Used for Tattwa Shodhana verification - an ancient method that cross-checks gender from birth chart
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}