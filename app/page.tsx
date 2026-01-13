'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Sun, Moon, Star, Sparkles, ArrowRight, ArrowLeft,
  User, Calendar, Clock, MapPin, Activity, Briefcase,
  Heart, Baby, Users, Stethoscope, Landmark, Plane, Compass,
  Check, Loader2, ChevronDown, Plus, Trash2, Info,
  Sigma, FunctionSquare, Binary, Calculator, Target, Award
} from 'lucide-react';
import type { 
  BirthData, 
  PhysicalDescription, 
  LifeEvent, 
  EventCategory,
  RectificationResult 
} from '@/types';
import { EVENT_TYPES } from '@/types';
import ResultsDisplay from '@/components/ResultsDisplay';
import LandingPage from '@/components/LandingPage';
import { searchCities } from '@/lib/cities';

// Import mathematical components
import FibonacciSpiral from '@/components/FibonacciSpiral';
import ZodiacWheel from '@/components/ZodiacWheel';

// Lazy load MapPicker to avoid SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => <div className="h-[377px] bg-slate-800 rounded-[21px] animate-pulse" />
});

// ==========================================
// MATHEMATICAL CELESTIAL BACKGROUND
// ==========================================
const CelestialBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Mathematical cosmic orbs with golden ratio positioning */}
      <motion.div
        className="absolute top-[144px] -left-[89px] w-[377px] h-[377px] bg-vedic-saffron/phi rounded-full filter blur-[150px]"
        animate={{ scale: [1, 1.618, 1], opacity: [0.382, 0.618, 0.382] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[144px] -right-[89px] w-[233px] h-[233px] bg-vedic-orange/phi rounded-full filter blur-[120px]"
        animate={{ scale: [1, 1.272, 1], opacity: [0.618, 0.786, 0.618] }}
        transition={{ duration: 6, delay: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-[144px] h-[144px] bg-vedic-purple/phi rounded-full filter blur-[100px]"
        animate={{ y: [0, -21, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Sacred geometry patterns with mathematical precision */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[610px] h-[610px]">
        <motion.div
          className="absolute inset-0 border border-vedic-saffron/phi rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[55px] border border-vedic-orange/phi rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[89px] border border-vedic-purple/phi rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      {/* Mathematical star field with golden ratio distribution */}
      {[...Array(89)].map((_, i) => {
        const size = Math.random() * 2 + 0.5;
        const delay = Math.random() * 4;
        const duration = Math.random() * 2 + 2;
        const goldenAngle = 137.5;
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * goldenAngle % 100)}%`,
              top: `${(i * 1.618 % 100)}%`,
              width: `${size}px`,
              height: `${size}px`,
            }}
            animate={{
              opacity: [0.382, 0.618, 0.382],
              scale: [1, 1.272, 1],
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      })}
      
      {/* Fibonacci spiral overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <FibonacciSpiral size={233} opacity={0.382} animated={true} />
      </div>
      
      {/* Mathematical grid overlay */}
      <div className="absolute inset-0 opacity-phi">
        {[...Array(13)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-vedic-saffron/phi"
            style={{
              left: `${(i * 7.7)}%`,
              top: 0,
              bottom: 0,
              borderLeftWidth: '1px'
            }}
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      
      {/* Mathematical gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-vedic-saffron/phi via-transparent to-vedic-purple/phi" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-vedic-orange/phi via-transparent to-transparent" />
    </div>
  );
};

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const steps = [
    { num: 1, label: 'Birth Details', icon: Calendar, math: 'φ = 1.618', desc: 'Astro Data Input' },
    { num: 2, label: 'Physical Verification', icon: User, math: 'Tattwa Shodhana', desc: 'Gender Correlation' },
    { num: 3, label: 'Life Events', icon: Activity, math: 'Data Triangulation', desc: 'Event Anchoring' },
    { num: 4, label: 'Mathematical Analysis', icon: Sparkles, math: 'Swiss Ephemeris', desc: 'Precision Calculation' }
  ];
  
  return (
    <div className="flex items-center justify-center gap-[21px] mb-[55px] bg-white/phi backdrop-blur-md border border-white/phi rounded-[21px] p-[21px] max-w-4xl mx-auto">
      {steps.slice(0, totalSteps).map((step, idx) => {
        const Icon = step.icon;
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        
        return (
          <div key={step.num} className="flex items-center">
            <motion.div
              animate={{
                scale: isActive ? 1.15 : 1,
                backgroundColor: isActive ? 'rgb(255, 159, 28)' : isCompleted ? 'rgb(34, 197, 94)' : 'rgba(255, 255, 255, 0.1)'
              }}
              className={`relative flex flex-col items-center justify-center w-[89px] h-[89px] rounded-[21px] transition-all duration-300
                ${isActive ? 'ring-4 ring-vedic-saffron/phi shadow-lg shadow-vedic-saffron/phi' : ''}`}
            >
              {isCompleted ? (
                <Check className="w-[34px] h-[34px] text-white" />
              ) : (
                <Icon className={`w-[34px] h-[34px] ${isActive ? 'text-white' : 'text-white/phi'}`} />
              )}
              <span className="text-[13px] font-mono text-white/60 mt-[8px]">
                {step.math}
              </span>
            </motion.div>
            <div className="text-center ml-[13px]">
              <span className={`text-[16px] font-semibold hidden sm:block ${isActive ? 'text-vedic-saffron' : 'text-white/phi'}`}>
                {step.label}
              </span>
              <div className="text-[13px] text-white/60 mt-[5px]">
                {step.desc}
              </div>
              <div className="text-[13px] font-mono text-white/40 mt-[3px]">
                Step {step.num}
              </div>
            </div>
            {idx < totalSteps - 1 && (
              <div className={`w-[34px] sm:w-[55px] h-[3px] mx-[21px] transition-colors ${isCompleted ? 'bg-gradient-to-r from-green-500 to-vedic-saffron' : 'bg-white/phi'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const categoryIcons: Record<EventCategory, any> = {
  education: Briefcase, career: Briefcase, marriage: Heart, children: Baby,
  family: Users, health: Stethoscope, financial: Landmark, travel: Plane,
  spiritual: Compass, other: Star
};

// ==========================================
// LIFE EVENT FORM COMPONENT
// ==========================================
const LifeEventForm = ({ events, setEvents }: { events: LifeEvent[]; setEvents: (events: LifeEvent[]) => void; }) => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('education');
  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({
    category: 'education', eventType: '', eventDate: '', dateAccuracy: 'exact', description: '', importance: 'medium'
  });
  
  const addEvent = () => {
    if (!newEvent.eventType || !newEvent.eventDate) return;
    const event: LifeEvent = {
      id: Date.now().toString(),
      category: newEvent.category as EventCategory,
      eventType: newEvent.eventType,
      eventDate: newEvent.eventDate,
      dateAccuracy: newEvent.dateAccuracy as any,
      description: newEvent.description || '',
      importance: newEvent.importance as any
    };
    setEvents([...events, event]);
    setNewEvent({ category: selectedCategory, eventType: '', eventDate: '', dateAccuracy: 'exact', description: '', importance: 'medium' });
  };
  
  const categories: { key: EventCategory; label: string }[] = [
    { key: 'education', label: 'Education' }, { key: 'career', label: 'Career' },
    { key: 'marriage', label: 'Marriage' }, { key: 'children', label: 'Children' },
    { key: 'family', label: 'Family' }, { key: 'health', label: 'Health' },
    { key: 'financial', label: 'Financial' }, { key: 'travel', label: 'Travel' },
    { key: 'spiritual', label: 'Spiritual' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(cat => {
          const Icon = categoryIcons[cat.key];
          const eventCount = events.filter(e => e.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => { setSelectedCategory(cat.key); setNewEvent(prev => ({ ...prev, category: cat.key, eventType: '' })); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${selectedCategory === cat.key ? 'bg-vedic-saffron text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
              {eventCount > 0 && <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{eventCount}</span>}
            </button>
          );
        })}
      </div>
      
      <div className="vedic-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-vedic-saffron flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Event
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="vedic-label">Event Type *</label>
            <select value={newEvent.eventType} onChange={(e) => setNewEvent(prev => ({ ...prev, eventType: e.target.value }))} className="vedic-select">
              <option value="">Select Event Type</option>
              {EVENT_TYPES[selectedCategory].map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label className="vedic-label">Event Date *</label>
            <input type="date" value={newEvent.eventDate} onChange={(e) => setNewEvent(prev => ({ ...prev, eventDate: e.target.value }))} className="vedic-input" />
          </div>
          <div>
            <label className="vedic-label">Date Accuracy</label>
            <select value={newEvent.dateAccuracy} onChange={(e) => setNewEvent(prev => ({ ...prev, dateAccuracy: e.target.value as any }))} className="vedic-select">
              <option value="exact">Exact Date</option>
              <option value="month">Month Only</option>
              <option value="year">Year Only</option>
              <option value="approximate">Approximate</option>
            </select>
          </div>
          <div>
            <label className="vedic-label">Importance</label>
            <select value={newEvent.importance} onChange={(e) => setNewEvent(prev => ({ ...prev, importance: e.target.value as any }))} className="vedic-select">
              <option value="critical">Critical (Most Reliable)</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="vedic-label">Additional Details (Optional)</label>
            <input type="text" value={newEvent.description} onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))} placeholder="Any additional details..." className="vedic-input" />
          </div>
        </div>
        
        <button onClick={addEvent} disabled={!newEvent.eventType || !newEvent.eventDate} className="vedic-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>
      
      {events.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white/90">Added Events ({events.length})</h3>
          <div className="grid gap-3">
            {events.map((event) => {
              const Icon = categoryIcons[event.category];
              const colors: Record<string, string> = {
                critical: 'border-red-500/50 bg-red-500/10', high: 'border-orange-500/50 bg-orange-500/10',
                medium: 'border-blue-500/50 bg-blue-500/10', low: 'border-gray-500/50 bg-gray-500/10'
              };
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 rounded-xl border ${colors[event.importance]}`}>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/10 rounded-lg"><Icon className="w-5 h-5 text-vedic-saffron" /></div>
                    <div>
                      <p className="font-medium text-white">{event.eventType}</p>
                      <p className="text-sm text-white/60">
                        {new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="mx-2">•</span>
                        <span className="capitalize">{event.importance}</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setEvents(events.filter(e => e.id !== event.id))} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="p-4 bg-vedic-saffron/10 border border-vedic-saffron/30 rounded-xl">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-vedic-saffron flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-vedic-saffron mb-1">Tips for Better Accuracy:</p>
            <ul className="list-disc list-inside space-y-1 text-white/70">
              <li>Marriage date is the most reliable event</li>
              <li>Add at least 5-7 significant events</li>
              <li>Exact dates provide better accuracy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function HomePage() {
  const [showLanding, setShowLanding] = useState(true);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RectificationResult | null>(null);
  
  const [birthData, setBirthData] = useState<Partial<BirthData>>({
    fullName: '', dateOfBirth: '', tentativeTime: '', timeUncertainty: 'exact',
    birthPlace: '', latitude: 0, longitude: 0, timezone: 'UTC+5:30', gender: 'male', currentAge: 0
  });
  
  const [physicalDesc, setPhysicalDesc] = useState<Partial<PhysicalDescription>>({
    bodyStructure: 'average', height: 'average', faceShape: 'oval', complexion: 'wheatish', distinctiveFeatures: ''
  });
  
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  
  // Location input mode state
  const [locationMode, setLocationMode] = useState<'search' | 'manual' | 'map'>('search');
  
  // City autocomplete state
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const citiesDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle city search with debouncing
  const handleCitySearch = (value: string) => {
    setBirthData(prev => ({ ...prev, birthPlace: value }));
    
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
    
    setBirthData(prev => ({
      ...prev,
      birthPlace: cityDisplay,
      latitude: city.latitude,
      longitude: city.longitude
    }));
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
  
  const handleSubmit = async () => {
    setIsProcessing(true);
    setStep(4);
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthData, physicalDescription: physicalDesc, lifeEvents })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.result);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-fib-7">
            <div className="text-center mb-[55px]">
              <motion.div
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-[21px]"
              >
                <div className="flex items-center justify-center gap-[13px] mb-[21px]">
                  <Sigma className="w-[34px] h-[34px] text-vedic-saffron" />
                  <h2 className="text-[55px] font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-vedic-saffron to-vedic-orange">
                    Mathematical Birth Data
                  </h2>
                  <Calculator className="w-[34px] h-[34px] text-vedic-orange" />
                </div>
                <div className="flex items-center justify-center gap-[21px] mb-[21px]">
                  <div className="h-px bg-gradient-to-r from-transparent to-vedic-saffron w-[89px]" />
                  <div className="px-[21px] py-[8px] bg-white/phi rounded-[13px] border border-vedic-saffron/phi">
                    <span className="text-[13px] font-mono text-vedic-saffron">φ = 1.618</span>
                  </div>
                  <div className="h-px bg-gradient-to-l from-transparent to-vedic-saffron w-[89px]" />
                </div>
              </motion.div>
              <p className="text-[24px] text-white/phi max-w-3xl mx-auto leading-relaxed font-medium">
                Precision begins with accurate data. Every minute matters in Vedic astrology.
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 21 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="vedic-card p-fib-8 max-w-4xl mx-auto"
            >
              <div className="space-y-fib-7">
                {/* Full Name - Golden Ratio Spacing */}
                <motion.div
                  initial={{ opacity: 0, x: -13 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label className="vedic-label text-h6 font-semibold text-white mb-fib-3 block">
                    Full Name <span className="text-vedic-saffron">*</span>
                  </label>
                  <input
                    type="text"
                    value={birthData.fullName}
                    onChange={(e) => setBirthData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name as it appears on official documents"
                    className="vedic-input w-full px-fib-4 py-fib-3 text-h6 focus:ring-2 focus:ring-vedic-saffron/50"
                  />
                </motion.div>
                
                {/* Date of Birth - Fibonacci: 8 */}
                <div>
                  <label className="vedic-label">Date of Birth *</label>
                  <div className="flex gap-2 items-end">
                    {/* Day */}
                    <div className="flex-1">
                      <label className="vedic-label text-xs">Day</label>
                      <div className="flex items-center border border-white/20 rounded-lg bg-white/5 overflow-hidden">
                        <button onClick={() => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m, d] = dateStr.split('-');
                          let day = parseInt(d) - 1;
                          if (day < 1) day = 31;
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${y}-${m}-${String(day).padStart(2, '0')}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">-</button>
                        <input type="number" min="1" max="31" value={(birthData.dateOfBirth || '01-01-2000').split('-')[2] || '01'} onChange={(e) => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m] = dateStr.split('-');
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${y}-${m}-${String(e.target.value).padStart(2, '0')}` }));
                        }} className="flex-1 bg-transparent text-white text-center py-1 outline-none" />
                        <button onClick={() => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m, d] = dateStr.split('-');
                          let day = parseInt(d) + 1;
                          if (day > 31) day = 1;
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${y}-${m}-${String(day).padStart(2, '0')}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">+</button>
                      </div>
                    </div>
                    {/* Month */}
                    <div className="flex-1">
                      <label className="vedic-label text-xs">Month</label>
                      <div className="flex items-center border border-white/20 rounded-lg bg-white/5 overflow-hidden">
                        <button onClick={() => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m] = dateStr.split('-');
                          let month = parseInt(m) - 1;
                          if (month < 1) month = 12;
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${y}-${String(month).padStart(2, '0')}-01` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">-</button>
                        <input type="number" min="1" max="12" value={(birthData.dateOfBirth || '01-01-2000').split('-')[1] || '01'} onChange={(e) => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, , d] = dateStr.split('-');
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${y}-${String(e.target.value).padStart(2, '0')}-${d}` }));
                        }} className="flex-1 bg-transparent text-white text-center py-1 outline-none" />
                        <button onClick={() => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m] = dateStr.split('-');
                          let month = parseInt(m) + 1;
                          if (month > 12) month = 1;
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${y}-${String(month).padStart(2, '0')}-01` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">+</button>
                      </div>
                    </div>
                    {/* Year */}
                    <div className="flex-1">
                      <label className="vedic-label text-xs">Year</label>
                      <div className="flex items-center border border-white/20 rounded-lg bg-white/5 overflow-hidden">
                        <button onClick={() => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m, d] = dateStr.split('-');
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${parseInt(y) - 1}-${m}-${d}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">-</button>
                        <input type="number" min="1900" max="2100" value={(birthData.dateOfBirth || '01-01-2000').split('-')[0] || '2000'} onChange={(e) => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [, m, d] = dateStr.split('-');
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${e.target.value}-${m}-${d}` }));
                        }} className="flex-1 bg-transparent text-white text-center py-1 outline-none" />
                        <button onClick={() => {
                          const dateStr = birthData.dateOfBirth || '01-01-2000';
                          const [y, m, d] = dateStr.split('-');
                          setBirthData(prev => ({ ...prev, dateOfBirth: `${parseInt(y) + 1}-${m}-${d}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">+</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tentative Birth Time - Fibonacci: 5 */}
                <div>
                  <label className="vedic-label">Tentative Birth Time *</label>
                  <div className="flex gap-2 items-end">
                    {/* Hours */}
                    <div className="flex-1">
                      <label className="vedic-label text-xs">Hrs</label>
                      <div className="flex items-center border border-white/20 rounded-lg bg-white/5 overflow-hidden">
                        <button onClick={() => {
                          const timeStr = birthData.tentativeTime || '12:00';
                          const [h, m] = timeStr.split(':');
                          let hour = parseInt(h) - 1;
                          if (hour < 0) hour = 23;
                          setBirthData(prev => ({ ...prev, tentativeTime: `${String(hour).padStart(2, '0')}:${m}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">-</button>
                        <input type="number" min="0" max="23" value={(birthData.tentativeTime || '12:00').split(':')[0] || '12'} onChange={(e) => {
                          const timeStr = birthData.tentativeTime || '12:00';
                          const [, m] = timeStr.split(':');
                          setBirthData(prev => ({ ...prev, tentativeTime: `${String(e.target.value).padStart(2, '0')}:${m}` }));
                        }} className="flex-1 bg-transparent text-white text-center py-1 outline-none" />
                        <button onClick={() => {
                          const timeStr = birthData.tentativeTime || '12:00';
                          const [h, m] = timeStr.split(':');
                          let hour = parseInt(h) + 1;
                          if (hour > 23) hour = 0;
                          setBirthData(prev => ({ ...prev, tentativeTime: `${String(hour).padStart(2, '0')}:${m}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">+</button>
                      </div>
                    </div>
                    {/* Minutes */}
                    <div className="flex-1">
                      <label className="vedic-label text-xs">Min</label>
                      <div className="flex items-center border border-white/20 rounded-lg bg-white/5 overflow-hidden">
                        <button onClick={() => {
                          const timeStr = birthData.tentativeTime || '12:00';
                          const [h, m] = timeStr.split(':');
                          let min = parseInt(m) - 1;
                          if (min < 0) min = 59;
                          setBirthData(prev => ({ ...prev, tentativeTime: `${h}:${String(min).padStart(2, '0')}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">-</button>
                        <input type="number" min="0" max="59" value={(birthData.tentativeTime || '12:00').split(':')[1] || '00'} onChange={(e) => {
                          const timeStr = birthData.tentativeTime || '12:00';
                          const [h] = timeStr.split(':');
                          setBirthData(prev => ({ ...prev, tentativeTime: `${h}:${String(e.target.value).padStart(2, '0')}` }));
                        }} className="flex-1 bg-transparent text-white text-center py-1 outline-none" />
                        <button onClick={() => {
                          const timeStr = birthData.tentativeTime || '12:00';
                          const [h, m] = timeStr.split(':');
                          let min = parseInt(m) + 1;
                          if (min > 59) min = 0;
                          setBirthData(prev => ({ ...prev, tentativeTime: `${h}:${String(min).padStart(2, '0')}` }));
                        }} className="px-2 py-1 hover:bg-vedic-saffron/20 transition">+</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time Uncertainty - Fibonacci: 8 */}
                <div>
                  <label className="vedic-label">Time Uncertainty</label>
                  <div className="space-y-2">
                    <select value={(birthData.timeUncertainty || 'exact').includes('min') || (birthData.timeUncertainty || 'exact').includes('hour') ? 'custom' : (birthData.timeUncertainty || 'exact')} onChange={(e) => setBirthData(prev => ({ ...prev, timeUncertainty: e.target.value as any }))} className="vedic-select block w-full cursor-pointer">
                      <option value="exact">✓ Exact Time (verified)</option>
                      <option value="5min">± 5 minutes (very accurate)</option>
                      <option value="15min">± 15 minutes (accurate)</option>
                      <option value="30min">± 30 minutes (fairly accurate)</option>
                      <option value="1hour">± 1 hour (approximate)</option>
                      <option value="2hour">± 2 hours (rough estimate)</option>
                      <option value="4hour">± 4 hours (uncertain)</option>
                      <option value="unknown">Unknown (no info)</option>
                      <option value="custom">📝 Enter custom time</option>
                    </select>
                    {((birthData.timeUncertainty || 'exact').includes('min') || (birthData.timeUncertainty || 'exact').includes('hour')) && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="vedic-label text-xs">Minutes</label>
                          <input type="number" min="0" placeholder="e.g., 30" className="vedic-input text-sm"
                            onChange={(e) => e.target.value && setBirthData(prev => ({ ...prev, timeUncertainty: `${e.target.value}min` as any }))} />
                        </div>
                        <div>
                          <label className="vedic-label text-xs">Or Hours</label>
                          <input type="number" min="0" placeholder="e.g., 2" className="vedic-input text-sm"
                            onChange={(e) => e.target.value && setBirthData(prev => ({ ...prev, timeUncertainty: `${e.target.value}hour` as any }))} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Gender - Fibonacci: 5 */}
                <div>
                  <label className="vedic-label">Gender *</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBirthData(prev => ({ ...prev, gender: 'male' }))}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        birthData.gender === 'male'
                          ? 'bg-gradient-to-r from-vedic-saffron to-vedic-orange text-white shadow-lg'
                          : 'bg-white/10 border border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      👨 Male
                    </button>
                    <button
                      onClick={() => setBirthData(prev => ({ ...prev, gender: 'female' }))}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        birthData.gender === 'female'
                          ? 'bg-gradient-to-r from-vedic-saffron to-vedic-orange text-white shadow-lg'
                          : 'bg-white/10 border border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      👩 Female
                    </button>
                  </div>
                </div>
                
                {/* Birth Place Location - Fibonacci: 13 */}
                <div className="pt-3">
                  <label className="vedic-label mb-3 block">Birth Place Location *</label>
                  
                  {/* Mode Tabs - Fibonacci spacing */}
                  <div className="flex gap-2 mb-3 border-b border-white/10 pb-2">
                    {['search', 'manual', 'map'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setLocationMode(mode as any)}
                        className={`px-3 py-1.5 text-xs font-semibold transition-all rounded-md ${
                          locationMode === mode
                            ? 'text-vedic-saffron bg-vedic-saffron/15 border-b-2 border-vedic-saffron'
                            : 'text-white/60 hover:text-white'
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
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={birthData.birthPlace}
                          onChange={(e) => handleCitySearch(e.target.value)}
                          onFocus={() => birthData.birthPlace && citySuggestions.length > 0 && setShowCitySuggestions(true)}
                          placeholder="Search city, town, or place worldwide..."
                          className="vedic-input pr-10"
                        />
                        {isSearchingCities ? (
                          <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-vedic-saffron animate-spin" />
                        ) : (
                          <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-vedic-saffron/60" />
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {showCitySuggestions && citySuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-slate-800 border border-vedic-saffron/30 rounded-lg overflow-hidden z-50 shadow-xl max-h-48 overflow-y-auto"
                          >
                            {citySuggestions.map((city, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleCitySelect(city)}
                                className="w-full px-3 py-2 text-left hover:bg-vedic-saffron/20 transition-colors border-b border-white/10 last:border-b-0 text-xs"
                              >
                                <div className="font-medium text-white">{city.name}</div>
                                <div className="text-xs text-white/60 mt-0.5">
                                  {[city.district, city.state, city.country].filter(Boolean).join(' • ')}
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
                    <div className="space-y-3">
                      <div>
                        <label className="vedic-label text-xs">Birth Place Name</label>
                        <input
                          type="text"
                          value={birthData.birthPlace}
                          onChange={(e) => setBirthData(prev => ({ ...prev, birthPlace: e.target.value }))}
                          placeholder="Enter city/town name"
                          className="vedic-input"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="vedic-label text-xs">Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={birthData.latitude || ''}
                            onChange={(e) => setBirthData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                            placeholder="e.g., 28.7041"
                            className="vedic-input"
                          />
                        </div>
                        <div>
                          <label className="vedic-label text-xs">Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={birthData.longitude || ''}
                            onChange={(e) => setBirthData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                            placeholder="e.g., 77.1025"
                            className="vedic-input"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-white/50 italic">Get coordinates from Google Maps or use Map mode</p>
                    </div>
                  )}

                  {/* Map Mode */}
                  {locationMode === 'map' && (
                    <div className="space-y-3">
                      <MapPicker
                        initialLat={birthData.latitude || 20}
                        initialLon={birthData.longitude || 77}
                        onCoordinateSelect={(lat, lon) => {
                          setBirthData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                        }}
                      />
                      <div>
                        <label className="vedic-label text-xs">Location Name (Optional)</label>
                        <input
                          type="text"
                          value={birthData.birthPlace}
                          onChange={(e) => setBirthData(prev => ({ ...prev, birthPlace: e.target.value }))}
                          placeholder="Enter city/town name for reference"
                          className="vedic-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Timezone - Fibonacci: 8 */}
                <div>
                  <label className="vedic-label">Timezone *</label>
                  <select value={birthData.timezone} onChange={(e) => setBirthData(prev => ({ ...prev, timezone: e.target.value }))} className="vedic-select block w-full cursor-pointer">
                    <optgroup label="Asia">
                      <option value="UTC+5:30">IST - India (UTC+5:30)</option>
                      <option value="UTC+8">CST - China (UTC+8)</option>
                      <option value="UTC+7">ICT - Thailand, Vietnam (UTC+7)</option>
                      <option value="UTC+6">BST - Bangladesh (UTC+6)</option>
                      <option value="UTC+8">SGT - Singapore (UTC+8)</option>
                      <option value="UTC+9">JST - Japan (UTC+9)</option>
                      <option value="UTC+8">AWST - Perth (UTC+8)</option>
                      <option value="UTC+5:45">NPT - Nepal (UTC+5:45)</option>
                      <option value="UTC+9">KST - South Korea (UTC+9)</option>
                      <option value="UTC+8">MYT - Malaysia (UTC+8)</option>
                      <option value="UTC+4">GST - UAE (UTC+4)</option>
                      <option value="UTC+3">AST - Iraq (UTC+3)</option>
                    </optgroup>
                    <optgroup label="Europe">
                      <option value="UTC+0">GMT - UK (UTC+0)</option>
                      <option value="UTC+1">CET - Central Europe (UTC+1)</option>
                      <option value="UTC+2">EET - Eastern Europe (UTC+2)</option>
                      <option value="UTC+3">MSK - Moscow (UTC+3)</option>
                      <option value="UTC+1">WET - Western Europe (UTC+1)</option>
                      <option value="UTC+2">IST - Ireland (UTC+2)</option>
                    </optgroup>
                    <optgroup label="Americas">
                      <option value="UTC-5">EST - Eastern US (UTC-5)</option>
                      <option value="UTC-6">CST - Central US (UTC-6)</option>
                      <option value="UTC-7">MST - Mountain US (UTC-7)</option>
                      <option value="UTC-8">PST - Pacific US (UTC-8)</option>
                      <option value="UTC-3:30">NST - Newfoundland (UTC-3:30)</option>
                      <option value="UTC-3">ART - Argentina (UTC-3)</option>
                      <option value="UTC-5">COT - Colombia (UTC-5)</option>
                      <option value="UTC-4">EDT - Eastern US Summer (UTC-4)</option>
                      <option value="UTC-9">AKST - Alaska (UTC-9)</option>
                    </optgroup>
                    <optgroup label="Africa">
                      <option value="UTC+1">WAT - West Africa (UTC+1)</option>
                      <option value="UTC+2">EAT - East Africa (UTC+2)</option>
                      <option value="UTC+0">GMT - Ghana (UTC+0)</option>
                      <option value="UTC+2">SAST - South Africa (UTC+2)</option>
                      <option value="UTC+1">CAT - Central Africa (UTC+1)</option>
                    </optgroup>
                    <optgroup label="Oceania">
                      <option value="UTC+10">AEST - Sydney (UTC+10)</option>
                      <option value="UTC+12">NZST - New Zealand (UTC+12)</option>
                      <option value="UTC+9:30">ACST - Adelaide (UTC+9:30)</option>
                      <option value="UTC+8">AWST - Western Australia (UTC+8)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
              
              {/* NEXT Button - Centered at Bottom */}
              <div className="pt-8 flex justify-center">
                <button
                  onClick={() => setStep(2)}
                  disabled={!birthData.fullName || !birthData.dateOfBirth || !birthData.tentativeTime || !birthData.birthPlace || (birthData.latitude === undefined || birthData.longitude === undefined)}
                  className="vedic-button px-8 py-3 flex items-center gap-2"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-vedic-saffron to-vedic-orange mb-2">
                Physical Description
              </h2>
              <p className="text-white/60">Physical features help verify the ascendant</p>
            </div>
            
            <div className="vedic-card p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="vedic-label">Body Structure</label>
                  <select value={physicalDesc.bodyStructure} onChange={(e) => setPhysicalDesc(prev => ({ ...prev, bodyStructure: e.target.value as any }))} className="vedic-select">
                    <option value="slim">Slim</option>
                    <option value="average">Average</option>
                    <option value="athletic">Athletic</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                
                <div>
                  <label className="vedic-label">Height</label>
                  <select value={physicalDesc.height} onChange={(e) => setPhysicalDesc(prev => ({ ...prev, height: e.target.value as any }))} className="vedic-select">
                    <option value="short">Short</option>
                    <option value="average">Average</option>
                    <option value="tall">Tall</option>
                  </select>
                </div>
                
                <div>
                  <label className="vedic-label">Face Shape</label>
                  <select value={physicalDesc.faceShape} onChange={(e) => setPhysicalDesc(prev => ({ ...prev, faceShape: e.target.value as any }))} className="vedic-select">
                    <option value="round">Round</option>
                    <option value="oval">Oval</option>
                    <option value="square">Square</option>
                    <option value="angular">Angular</option>
                    <option value="heart">Heart</option>
                  </select>
                </div>
                
                <div>
                  <label className="vedic-label">Complexion</label>
                  <select value={physicalDesc.complexion} onChange={(e) => setPhysicalDesc(prev => ({ ...prev, complexion: e.target.value as any }))} className="vedic-select">
                    <option value="fair">Fair</option>
                    <option value="wheatish">Wheatish</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="vedic-label">Distinctive Features (Optional)</label>
                  <input type="text" value={physicalDesc.distinctiveFeatures} onChange={(e) => setPhysicalDesc(prev => ({ ...prev, distinctiveFeatures: e.target.value }))}
                    placeholder="Any notable features like birthmarks, scars, etc." className="vedic-input" />
                </div>
              </div>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-vedic-saffron to-vedic-orange mb-2">
                Life Events
              </h2>
              <p className="text-white/60">Add significant life events with exact dates for accurate rectification</p>
            </div>
            
            <LifeEventForm events={lifeEvents} setEvents={setLifeEvents} />
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-vedic-saffron/20 rounded-full" />
                  <div className="absolute inset-0 w-24 h-24 border-4 border-vedic-saffron border-t-transparent rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-vedic-saffron animate-pulse" />
                </div>
                <h3 className="mt-8 text-xl font-semibold text-white">Analyzing Your Birth Chart...</h3>
                <p className="mt-2 text-white/60">This may take a few moments</p>
                <div className="mt-6 space-y-2 text-sm text-white/50">
                  <p>✓ Calculating planetary positions</p>
                  <p>✓ Generating divisional charts</p>
                  <p>✓ Analyzing Vimshottari Dasha</p>
                  <p>⟳ Correlating life events...</p>
                </div>
              </div>
            ) : result ? (
              <ResultsDisplay result={result} />
            ) : (
              <div className="text-center py-20">
                <p className="text-white/60">Something went wrong. Please try again.</p>
              </div>
            )}
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1:
        return birthData.fullName && birthData.dateOfBirth && birthData.tentativeTime && birthData.birthPlace;
      case 2:
        return true;
      case 3:
        return lifeEvents.length >= 3;
      default:
        return false;
    }
  };
  
  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <main className="min-h-screen relative">
      <CelestialBackground />
      
      {/* Mathematical Header */}
      <header className="relative z-10 py-[21px] border-b border-white/phi backdrop-blur-md bg-black/phi">
        <div className="max-w-7xl mx-auto px-[34px]">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-[21px]"
              initial={{ opacity: 0, x: -34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                <motion.div
                  className="w-[55px] h-[55px] bg-gradient-saffron rounded-[21px] flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sun className="w-[34px] h-[34px] text-white" />
                </motion.div>
                <Moon className="absolute -bottom-[5px] -right-[5px] w-[21px] h-[21px] text-white/phi" />
              </div>
              <div>
                <h1 className="text-[34px] font-display font-bold text-transparent bg-clip-text bg-gradient-saffron">
                  AI-Pandit
                </h1>
                <p className="text-[16px] text-white/phi font-mono">φ = 1.618 • Mathematical Astrology</p>
              </div>
            </motion.div>
            
            {/* Mathematical Authority Badge */}
            <motion.div
              className="flex items-center gap-[13px] px-[21px] py-[8px] bg-white/phi rounded-[21px] border border-vedic-saffron/phi"
              initial={{ opacity: 0, x: 34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <FunctionSquare className="w-[21px] h-[21px] text-vedic-saffron" />
              <div className="text-center">
                <div className="text-[13px] font-semibold text-white/80 tracking-wider">
                  SWISS EPHEMERIS
                </div>
                <div className="text-[11px] text-white/60 font-mono">
                  0.001" ACCURACY
                </div>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowLanding(true)}
              className="px-[21px] py-[13px] text-[16px] text-white/phi hover:text-white transition-colors border border-white/phi rounded-[13px]"
            >
              ← Back to Home
            </motion.button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-fib-4 py-fib-6">
        {step < 4 && <StepIndicator currentStep={step} totalSteps={4} />}
        
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
        
        {/* Navigation */}
        {step < 4 && (
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                className="vedic-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canProceed()}
                className="vedic-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Sparkles className="w-4 h-4" /> Analyze & Rectify
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 py-fib-5 mt-fib-7 border-t border-white/10 backdrop-blur-md bg-black/50">
        <div className="max-w-7xl mx-auto px-fib-4 text-center">
          <p className="text-h6 text-white/40">
            Powered by authentic Vedic astrology principles • Swiss Ephemeris • K.P. System • ML Engine • Vimshottari Dasha
          </p>
        </div>
      </footer>
    </main>
  );
}
