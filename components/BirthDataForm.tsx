'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Info, ChevronDown, CheckCircle, AlertCircle, Loader2, Globe } from 'lucide-react';
import type { BirthData, TimeUncertainty } from '@/types';
import { searchCities } from '@/lib/cities';
import { timezones } from '@/lib/timezones'; // Import timezones
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
  
  const [dateInputs, setDateInputs] = useState({ day: '', month: '', year: '' });
  const [timeInputs, setTimeInputs] = useState({ hour: '', minute: '', period: 'AM' as 'AM' | 'PM' });
  
  const citiesDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!birthData.fullName || birthData.fullName.trim().length < 2) newErrors.fullName = 'Please enter your full name';
    if (!birthData.dateOfBirth) newErrors.dateOfBirth = 'Please enter a valid date';
    if (!birthData.tentativeTime) newErrors.tentativeTime = 'Please enter a valid time';
    if (!birthData.timeUncertainty) newErrors.timeUncertainty = 'Please select how sure you are about this time';
    if (!birthData.birthPlace || birthData.birthPlace.trim().length < 2) newErrors.birthPlace = 'Please enter your birth place';
    if (!birthData.gender) newErrors.gender = 'Please select your gender';
    if (!birthData.timezone) newErrors.timezone = 'Please select a timezone';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthData]);
  
  const handleCitySearch = useCallback((value: string) => {
    setBirthData({ ...birthData, birthPlace: value });
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
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
  
  const handleCitySelect = useCallback((city: any) => {
    const cityDisplay = [city.name, city.district, city.state, city.country].filter(Boolean).join(', ');
    setBirthData({
      ...birthData,
      birthPlace: cityDisplay,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone || birthData.timezone // Use city timezone if available
    });
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setErrors(prev => ({ ...prev, birthPlace: '' }));
  }, [birthData, setBirthData]);
  
  const handleDateChange = useCallback((field: 'day' | 'month' | 'year', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    const newDateInputs = { ...dateInputs, [field]: value };
    setDateInputs(newDateInputs);
    const { day, month, year } = newDateInputs;
    if (day && month && year) {
      const dayNum = parseInt(day), monthNum = parseInt(month), yearNum = parseInt(year);
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
    setBirthData({ ...birthData, dateOfBirth: '' });
  }, [dateInputs, birthData, setBirthData]);
  
  const handleTimeChange = useCallback((field: 'hour' | 'minute' | 'period', value: string) => {
    const newTimeInputs = { ...timeInputs, [field]: value };
    setTimeInputs(newTimeInputs);
    const { hour, minute, period } = newTimeInputs;
    if (hour && minute) {
      const hourNum = parseInt(hour), minuteNum = parseInt(minute);
      if (hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59) {
        const hour24 = period === 'AM' ? (hourNum === 12 ? 0 : hourNum) : (hourNum === 12 ? 12 : hourNum + 12);
        const timeStr = `${String(hour24).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`;
        setBirthData({ ...birthData, tentativeTime: timeStr });
        setErrors(prev => ({ ...prev, tentativeTime: '' }));
        return;
      }
    }
    setBirthData({ ...birthData, tentativeTime: '' });
  }, [timeInputs, birthData, setBirthData]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (citiesDropdownRef.current && !citiesDropdownRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const timeUncertaintyOptions: { value: TimeUncertainty, label: string, description: string }[] = [
    { value: 'exact', label: '🎯 Exact', description: 'Within 5 minutes' },
    { value: '15min', label: '⏰ Accurate', description: 'Within 15 minutes' },
    { value: '30min', label: '🕐 Fairly Sure', description: 'Within 30 minutes' },
    { value: '1hour', label: '🕒 Approx.', description: 'Within 1 hour' },
    { value: '2hour', label: '🕓 Uncertain', description: 'Within 2 hours' },
    { value: '4hour', label: '🕔 Very Uncertain', description: 'Within 4 hours' },
    { value: 'unknown', label: '🤷‍♀️ Unknown', description: 'Completely unsure' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Let&apos;s start with the basics...</h2>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">Your birth details are the foundation of the entire analysis.</p>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          
          {/* Name & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"/>
                <input
                  id="fullName"
                  type="text"
                  value={birthData.fullName || ''}
                  onChange={(e) => setBirthData({ ...birthData, fullName: e.target.value.replace(/[<>'"]/g, '') })}
                  onBlur={validateForm}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 ${errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`}
                  placeholder="e.g., Rahul Sharma"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBirthData({ ...birthData, gender: 'male' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all border-2 ${birthData.gender === 'male' ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}>
                  <span>👨</span> Male
                </button>
                <button
                  type="button"
                  onClick={() => setBirthData({ ...birthData, gender: 'female' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all border-2 ${birthData.gender === 'female' ? 'bg-pink-500/20 border-pink-500' : 'bg-white/5 border-white/20 hover:bg-white/10'}`}>
                  <span>👩</span> Female
                </button>
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Date of Birth</label>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" value={dateInputs.day} onChange={(e) => handleDateChange('day', e.target.value)} placeholder="DD" className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`} />
              <select value={dateInputs.month} onChange={(e) => handleDateChange('month', e.target.value)} className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`}>
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
              <input type="number" value={dateInputs.year} onChange={(e) => handleDateChange('year', e.target.value)} placeholder="YYYY" className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`} />
            </div>
          </div>

          {/* Birth Time & Uncertainty */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Approximate Time of Birth</label>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" min="1" max="12" value={timeInputs.hour} onChange={(e) => handleTimeChange('hour', e.target.value)} placeholder="HH" className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${errors.tentativeTime ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`} />
                  <input type="number" min="0" max="59" value={timeInputs.minute} onChange={(e) => handleTimeChange('minute', e.target.value)} placeholder="MM" className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${errors.tentativeTime ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`} />
                  <select value={timeInputs.period} onChange={(e) => handleTimeChange('period', e.target.value)} className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 ${errors.tentativeTime ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`}>
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">How sure are you? (Uncertainty)</label>
                 <select
                  value={birthData.timeUncertainty || ''}
                  onChange={(e) => setBirthData({ ...birthData, timeUncertainty: e.target.value as TimeUncertainty })}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${errors.timeUncertainty ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`}
                >
                  <option value="" disabled>Select uncertainty level</option>
                  {timeUncertaintyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label} - {opt.description}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Birth Place & Timezone */}
           <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label htmlFor="birthPlace" className="block text-sm font-medium text-white/80 mb-2">Birth Place</label>
                  <div className="relative" ref={citiesDropdownRef}>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"/>
                    <input
                      id="birthPlace"
                      type="text"
                      value={birthData.birthPlace || ''}
                      onChange={(e) => handleCitySearch(e.target.value.replace(/[<>'"]/g, ''))}
                      onFocus={() => birthData.birthPlace && citySuggestions.length > 0 && setShowCitySuggestions(true)}
                      placeholder="Start typing city name..."
                      className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 ${errors.birthPlace ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`}
                    />
                     {isSearchingCities && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />}
                    <AnimatePresence>
                      {showCitySuggestions && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-2 w-full bg-slate-800 border border-white/20 rounded-xl overflow-hidden z-50 shadow-xl">
                          {citySuggestions.map((city, idx) => (
                            <button key={idx} onClick={() => handleCitySelect(city)} className="w-full px-4 py-3 text-left hover:bg-amber-500/20 transition-colors border-b border-white/10 last:border-b-0">
                              <div className="font-medium text-white">{city.name}</div>
                              <div className="text-sm text-white/60">{[city.district, city.state, city.country].filter(Boolean).join(', ')}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              </div>
               <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
                <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"/>
                    <select
                        id="timezone"
                        value={birthData.timezone || ''}
                        onChange={(e) => setBirthData({ ...birthData, timezone: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${errors.timezone ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-amber-500'}`}
                    >
                        <option value="" disabled>Select timezone</option>
                        {timezones.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
