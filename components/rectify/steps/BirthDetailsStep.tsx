'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { BirthData } from '@/types';
import { searchCities } from '@/lib/cities';
import MapPicker from '@/components/MapPicker';
import { debounce } from '@/lib/debounce';

interface BirthDetailsStepProps {
  birthData: Partial<BirthData>;
  setBirthData: (data: Partial<BirthData>) => void;
}

interface City {
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export default function BirthDetailsStep({ birthData, setBirthData }: BirthDetailsStepProps) {
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [placeInputMode, setPlaceInputMode] = useState<'search' | 'manual' | 'map'>('search');
  const [manualPlace, setManualPlace] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => 2024 - i);
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Dropdown states
  const [dobParts, setDobParts] = useState({ day: '', month: '', year: '' });
  const [timeParts, setTimeParts] = useState({ hour: '', minute: '', period: 'AM' });

  // Initialize dropdowns from birthData on mount
  useEffect(() => {
    if (!birthData) return; // Add a guard clause
    if (birthData.dateOfBirth) {
      const [year, month, day] = birthData.dateOfBirth.split('-');
      const monthName = months[parseInt(month) - 1];
      setDobParts({ 
        day: day.padStart(2, '0'), 
        month: monthName, 
        year 
      });
    }

    if (birthData.tentativeTime) {
      // Convert 24-hour format back to 12-hour format for display
      const [hour24, minute] = birthData.tentativeTime.split(':');
      const hourNum = parseInt(hour24);
      let hour12 = hourNum;
      let period = 'AM';
      
      if (hourNum === 0) {
        hour12 = 12;
        period = 'AM';
      } else if (hourNum === 12) {
        hour12 = 12;
        period = 'PM';
      } else if (hourNum > 12) {
        hour12 = hourNum - 12;
        period = 'PM';
      }
      
      setTimeParts({
        hour: hour12.toString().padStart(2, '0'),
        minute: minute.padStart(2, '0'),
        period
      });
    }

    // Set birth place info if exists
    if (birthData.birthPlace && birthData.latitude && birthData.longitude) {
      setSelectedCity({
        name: birthData.birthPlace.split(',')[0],
        state: '',
        country: '',
        latitude: birthData.latitude,
        longitude: birthData.longitude
      });
    }
  }, [birthData]);

  // Debounced city search function
  const debouncedCitySearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
        return;
      }

      try {
        const results = await searchCities(query);
        setCitySuggestions(results as City[]);
        setShowCitySuggestions(true);
      } catch (error) {
        console.error('City search error:', error);
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }, 300),
    []
  );

  const handleCitySearch = (query: string) => {
    debouncedCitySearch(query);
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setBirthData({
      ...birthData,
      birthPlace: `${city.name}, ${city.state}, ${city.country}`,
      latitude: city.latitude,
      longitude: city.longitude
    });
    setShowCitySuggestions(false);
  };

  const handleDateChange = (day: string, month: string, year: string) => {
    setDobParts({ day, month, year });
    if (day && month && year) {
      const monthIndex = months.findIndex(m => m === month) + 1;
      const dateStr = `${year}-${monthIndex.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
      setBirthData({ ...birthData, dateOfBirth: dateStr });
    }
  };

  const handleTimeChange = (hour: string, minute: string, period: string) => {
    setTimeParts({ hour, minute, period });
    if (hour && minute) {
      // Convert 12-hour format to 24-hour format for validation compatibility
      const hour24 = convertTo24HourFormat(hour, period);
      setBirthData({ ...birthData, tentativeTime: `${hour24}:${minute}` });
    }
  };

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24HourFormat = (hour12: string, period: string): string => {
    const hour = parseInt(hour12);
    let hour24 = hour;
    
    if (period === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }
    
    return hour24.toString().padStart(2, '0');
  };

  const handleMapCoordinateSelect = (lat: number, lon: number) => {
    setBirthData({
      ...birthData,
      latitude: lat,
      longitude: lon,
      birthPlace: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
    });
    setSelectedCity({
      name: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
      state: 'Map Location',
      country: '',
      latitude: lat,
      longitude: lon
    });
  };

  return (
    <div className="space-y-8">
      {/* Step Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 pt-8"
      >
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-3xl font-bold text-[#F7F9FC] mb-2">Birth Details</h2>
        <p className="text-[#A8B3C5] text-lg">
          Enter your birth information as accurately as possible.<br />
          Don't worry if the time is approximate - that's exactly what we'll rectify.
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1A1F26] border border-[#2D3542] rounded-2xl p-8 space-y-6"
      >
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">
            Full Name <span className="text-[#F5A623]">*</span>
          </label>
          <input
            type="text"
            value={birthData.fullName || ''}
            onChange={(e) => setBirthData({ ...birthData, fullName: e.target.value })}
            placeholder="As it appears on official documents"
            className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none transition-colors"
          />
          <p className="text-xs text-[#6B7A90] mt-1">Used for astrological calculations</p>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">
            Date of Birth <span className="text-[#F5A623]">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <select
                value={dobParts.day}
                onChange={(e) => handleDateChange(e.target.value, dobParts.month, dobParts.year)}
                className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              >
                <option value="">Day</option>
                {days.map(d => <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>)}
              </select>
            </div>
            <div>
              <select
                value={dobParts.month}
                onChange={(e) => handleDateChange(dobParts.day, e.target.value, dobParts.year)}
                className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              >
                <option value="">Month</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <select
                value={dobParts.year}
                onChange={(e) => handleDateChange(dobParts.day, dobParts.month, e.target.value)}
                className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              >
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">
            Tentative Birth Time <span className="text-[#F5A623]">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <select
                value={timeParts.hour}
                onChange={(e) => handleTimeChange(e.target.value, timeParts.minute, timeParts.period)}
                className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              >
                <option value="">Hour</option>
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <select
                value={timeParts.minute}
                onChange={(e) => handleTimeChange(timeParts.hour, e.target.value, timeParts.period)}
                className="w-full h-12 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              >
                <option value="">Minute</option>
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleTimeChange(timeParts.hour, timeParts.minute, 'AM')}
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  timeParts.period === 'AM'
                    ? 'bg-[#F5A623] text-[#0F1419]'
                    : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => handleTimeChange(timeParts.hour, timeParts.minute, 'PM')}
                className={`flex-1 h-12 rounded-lg font-medium transition-colors ${
                  timeParts.period === 'PM'
                    ? 'bg-[#F5A623] text-[#0F1419]'
                    : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
                }`}
              >
                PM
              </button>
            </div>
          </div>
          <p className="text-xs text-[#6B7A90] mt-1">💡 Most hospital records show approximate time</p>
        </div>

        {/* Time Uncertainty */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            How sure are you about this time?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { emoji: '😰', label: 'Not Sure', interval: '±2 hours', value: '2hour' },
              { emoji: '🤔', label: 'Roughly', interval: '±1 hour', value: '1hour' },
              { emoji: '😊', label: 'Somewhat', interval: '±30 min', value: '30min' },
              { emoji: '😄', label: 'Pretty Sure', interval: '±15 min', value: '15min' },
              { emoji: '✅', label: 'Exact', interval: '±5 min', value: '5min' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setBirthData({ ...birthData, timeUncertainty: option.value as any })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  birthData.timeUncertainty === option.value
                    ? 'border-[#F5A623] bg-[#F5A623]/10'
                    : 'border-[#3D4654] bg-[#242B35] hover:border-[#2D3542]'
                }`}
                title={option.interval}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className="text-xs font-medium text-[#F7F9FC]">{option.label}</div>
                <div className="text-[10px] text-[#6B7A90] mt-0.5">{option.interval}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B7A90] mt-2">ℹ️ This helps us determine the search range for rectification</p>
        </div>
        <p className="text-xs text-[#6B7A90] mt-2">ℹ️ This helps us determine the search range for rectification</p>

        {/* Birth Place */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            Birth Place <span className="text-[#F5A623]">*</span>
          </label>

          {/* Toggle between Search, Manual and Map */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => {
                setPlaceInputMode('search');
                setCitySuggestions([]);
                setShowCitySuggestions(false);
              }}
              className={`h-10 rounded-lg font-medium transition-colors text-sm ${
                placeInputMode === 'search'
                  ? 'bg-[#F5A623] text-[#0F1419]'
                  : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
              }`}
            >
              🔍 Search
            </button>
            <button
              onClick={() => {
                setPlaceInputMode('manual');
                setCitySuggestions([]);
                setShowCitySuggestions(false);
              }}
              className={`h-10 rounded-lg font-medium transition-colors text-sm ${
                placeInputMode === 'manual'
                  ? 'bg-[#F5A623] text-[#0F1419]'
                  : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
              }`}
            >
              ✏️ Manual
            </button>
            <button
              onClick={() => {
                setPlaceInputMode('map');
                setCitySuggestions([]);
                setShowCitySuggestions(false);
              }}
              className={`h-10 rounded-lg font-medium transition-colors text-sm ${
                placeInputMode === 'map'
                  ? 'bg-[#F5A623] text-[#0F1419]'
                  : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
              }`}
            >
              🗺️ Map
            </button>
          </div>

          {/* Search Mode - City Database */}
          {placeInputMode === 'search' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Start typing your city..."
                onChange={(e) => handleCitySearch(e.target.value)}
                className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none"
              />

              {/* City Suggestions */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1A1F26] border border-[#2D3542] rounded-lg overflow-hidden z-10 max-h-64 overflow-y-auto"
                >
                  {citySuggestions.map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCitySelect(city)}
                      className="w-full px-4 py-3 text-left hover:bg-[#242B35] transition-colors border-b border-[#2D3542] last:border-b-0"
                    >
                      <div className="text-sm font-medium text-[#F7F9FC]">{city.name}</div>
                      <div className="text-xs text-[#6B7A90]">{city.state}, {city.country}</div>
                    </button>
                  ))}
                </motion.div>
              )}

              {showCitySuggestions && citySuggestions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1A1F26] border border-[#2D3542] rounded-lg p-4 z-10"
                >
                  <p className="text-xs text-[#6B7A90]">No cities found. Try different spelling or use Manual/Map mode.</p>
                </motion.div>
              )}
            </div>
          )}

          {/* Manual Entry Mode - With Coordinates */}
          {placeInputMode === 'manual' && (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="City, State, Country (e.g., Mumbai, Maharashtra, India)"
                  value={manualPlace}
                  onChange={(e) => setManualPlace(e.target.value)}
                  className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none"
                />
              </div>

              {/* Coordinates Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B7A90] mb-1 block">Latitude</label>
                  <input
                    type="number"
                    placeholder="e.g., 19.0760"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    step="0.0001"
                    className="w-full h-10 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7A90] mb-1 block">Longitude</label>
                  <input
                    type="number"
                    placeholder="e.g., 72.8777"
                    value={manualLon}
                    onChange={(e) => setManualLon(e.target.value)}
                    step="0.0001"
                    className="w-full h-10 px-3 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (manualPlace.trim() && manualLat && manualLon) {
                    setBirthData({
                      ...birthData,
                      birthPlace: manualPlace,
                      latitude: parseFloat(manualLat),
                      longitude: parseFloat(manualLon)
                    });
                    setSelectedCity({
                      name: manualPlace,
                      state: 'Manual Entry',
                      country: '',
                      latitude: parseFloat(manualLat),
                      longitude: parseFloat(manualLon)
                    });
                  }
                }}
                className="w-full h-10 bg-[#F5A623] text-[#0F1419] rounded-lg font-medium hover:bg-[#E09512] transition-colors"
              >
                Confirm Location
              </button>
              <p className="text-xs text-[#6B7A90]">💡 Find coordinates at Google Maps or similar tools</p>
            </div>
          )}

          {/* Map Mode - Interactive Map */}
          {placeInputMode === 'map' && (
            <div className="space-y-3">
              <MapPicker 
                initialLat={birthData.latitude || 20}
                initialLon={birthData.longitude || 77}
                onCoordinateSelect={handleMapCoordinateSelect}
              />
              <p className="text-xs text-[#6B7A90]">Click on the map to select your birth place coordinates</p>
            </div>
          )}

          {/* Selected Place Display */}
          {selectedCity && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg"
            >
              <div className="text-sm text-[#F7F9FC] font-medium">✓ {birthData.birthPlace}</div>
              <div className="text-xs text-[#6B7A90] mt-1">
                📍 {selectedCity.latitude.toFixed(4)}°, {selectedCity.longitude.toFixed(4)}°
              </div>
            </motion.div>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            Gender <span className="text-[#F5A623]">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '👨', label: 'Male', value: 'male' },
              { emoji: '👩', label: 'Female', value: 'female' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setBirthData({ ...birthData, gender: option.value as any })}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  birthData.gender === option.value
                    ? 'border-[#F5A623] bg-[#F5A623]/10'
                    : 'border-[#3D4654] bg-[#242B35] hover:border-[#2D3542]'
                }`}
              >
                <div className="text-4xl mb-2">{option.emoji}</div>
                <div className="font-medium text-[#F7F9FC]">{option.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B7A90] mt-2">ℹ️ Used for Tattwa Shodhana verification (gender prediction)</p>
        </div>

        {/* Marital Status - MANDATORY */}
        <div>
          <label className="block text-sm font-semibold text-[#F7F9FC] mb-3">
            Marital Status <span className="text-[#F5A623]">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '💍', label: 'Married', value: 'married' },
              { emoji: '👤', label: 'Single', value: 'single' },
              { emoji: '💔', label: 'Divorced', value: 'divorced' },
              { emoji: '🕊️', label: 'Widowed', value: 'widowed' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setBirthData({ ...birthData, maritalStatus: option.value as any })}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  birthData.maritalStatus === option.value
                    ? 'border-[#F5A623] bg-[#F5A623]/10'
                    : 'border-[#3D4654] bg-[#242B35] hover:border-[#2D3542]'
                }`}
              >
                <div className="text-4xl mb-2">{option.emoji}</div>
                <div className="font-medium text-[#F7F9FC]">{option.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B7A90] mt-2">💡 This helps us suggest more relevant life events</p>
        </div>
      </motion.div>
    </div>
  );
}
