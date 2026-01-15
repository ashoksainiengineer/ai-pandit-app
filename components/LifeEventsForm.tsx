'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Heart, Baby, Users, Stethoscope, Landmark, Plane, GraduationCap,
  Plus, Trash2, Info, Calendar, Target, Star, Clock, MapPin, CheckCircle, XCircle, ChevronDown, Edit2, Save, X
} from 'lucide-react';
import type { LifeEvent, EventCategory } from '@/types';
import { EVENT_TYPES } from '@/types';
import StandardizedDateInput from '@/components/rectify/StandardizedDateInput';

interface LifeEventsFormProps {
  lifeEvents: LifeEvent[];
  setLifeEvents: (events: LifeEvent[]) => void;
}

interface ValidationState {
  eventType: boolean;
  eventDate: boolean;
  eventTime: boolean;
  description: boolean;
}

interface TimeParts {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

export default function LifeEventsForm({ lifeEvents, setLifeEvents }: LifeEventsFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('education');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<keyof ValidationState, boolean>>({
    eventType: false,
    eventDate: false,
    eventTime: false,
    description: false
  });
  
  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({
    category: 'education',
    eventType: '',
    eventDate: '',
    dateAccuracy: 'exact',
    description: '',
    importance: 'medium',
    eventTime: ''
  });
  
  const [timeParts, setTimeParts] = useState<TimeParts>({ hour: '', minute: '', period: 'AM' });
  
  const hours = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')), 
    []
  );
  
  const minutes = useMemo(() => 
    Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')), 
    []
  );
  
  // Visual category icons and colors
  const categoryVisuals = useMemo(() => ({
    education: { icon: GraduationCap, color: 'text-blue-400', bgColor: 'bg-blue-500/20', emoji: '📚' },
    career: { icon: Briefcase, color: 'text-green-400', bgColor: 'bg-green-500/20', emoji: '💼' },
    marriage: { icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20', emoji: '💍' },
    children: { icon: Baby, color: 'text-purple-400', bgColor: 'bg-purple-500/20', emoji: '👶' },
    family: { icon: Users, color: 'text-orange-400', bgColor: 'bg-orange-500/20', emoji: '👨‍👩‍👧' },
    health: { icon: Stethoscope, color: 'text-red-400', bgColor: 'bg-red-500/20', emoji: '🏥' },
    financial: { icon: Landmark, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', emoji: '💰' },
    travel: { icon: Plane, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', emoji: '✈️' },
    spiritual: { icon: Target, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20', emoji: '🕉️' },
    other: { icon: Target, color: 'text-gray-400', bgColor: 'bg-gray-500/20', emoji: '📌' }
  }), []);
  
  // Importance levels with visual indicators
  const importanceLevels = useMemo(() => [
    { value: 'critical', label: '🔴 Critical', description: 'Most reliable', color: 'border-red-500/50 bg-red-500/10' },
    { value: 'high', label: '🟠 High', description: 'Very reliable', color: 'border-orange-500/50 bg-orange-500/10' },
    { value: 'medium', label: '🟡 Medium', description: 'Moderately reliable', color: 'border-yellow-500/50 bg-yellow-500/10' },
    { value: 'low', label: '🟢 Low', description: 'Less reliable', color: 'border-green-500/50 bg-green-500/10' }
  ], []);
  
  // Date accuracy options
  const dateAccuracyOptions = useMemo(() => [
    { value: 'exact', label: '📅 Exact Date', description: 'Day, month, year known' },
    { value: 'month', label: '📆 Month/Year', description: 'Only month and year' },
    { value: 'year', label: '🗓️ Year Only', description: 'Only year known' },
    { value: 'approximate', label: '⏰ Approximate', description: 'Rough estimate' }
  ], []);
  
  // Validation logic
  const validateField = useCallback((field: keyof ValidationState, value: any): boolean => {
    switch (field) {
      case 'eventType':
        return typeof value === 'string' && value.trim().length > 0;
      case 'eventDate':
        return typeof value === 'string' && value.trim().length > 0 && !isNaN(new Date(value).getTime());
      case 'eventTime':
        return value === '' || /^\d{2}:\d{2}$/.test(value);
      case 'description':
        return typeof value === 'string' && value.trim().length > 0 && value.length <= 500; // Required, max 500 chars
      default:
        return false;
    }
  }, []);
  
  // Validation state
  const validation = useMemo(() => ({
    eventType: validateField('eventType', newEvent.eventType),
    eventDate: validateField('eventDate', newEvent.eventDate),
    eventTime: validateField('eventTime', newEvent.eventTime),
    description: validateField('description', newEvent.description)
  }), [newEvent, validateField]);
  
  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24HourFormat = useCallback((hour12: string, period: string): string => {
    const hour = parseInt(hour12);
    let hour24 = hour;
    
    if (period === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }
    
    return hour24.toString().padStart(2, '0');
  }, []);
  
  // Handle time parts change
  const handleTimePartsChange = useCallback((field: keyof TimeParts, value: string) => {
    const updatedTimeParts = { ...timeParts, [field]: value };
    setTimeParts(updatedTimeParts);
    
    if (updatedTimeParts.hour && updatedTimeParts.minute) {
      const hour24 = convertTo24HourFormat(updatedTimeParts.hour, updatedTimeParts.period);
      setNewEvent(prev => ({ ...prev, eventTime: `${hour24}:${updatedTimeParts.minute}` }));
    } else {
      setNewEvent(prev => ({ ...prev, eventTime: '' }));
    }
  }, [timeParts, convertTo24HourFormat]);
  
  // Add event handler
  const addEvent = useCallback(() => {
    if (!validation.eventType || !validation.eventDate || !validation.description) {
      setTouched({ eventType: true, eventDate: true, eventTime: true, description: true });
      return;
    }
    
    const event: LifeEvent = {
      id: Date.now().toString(),
      category: newEvent.category as EventCategory,
      eventType: newEvent.eventType!,
      eventDate: newEvent.eventDate!,
      dateAccuracy: newEvent.dateAccuracy as any,
      description: newEvent.description!,
      importance: newEvent.importance as any,
      eventTime: newEvent.eventTime || undefined
    };
    
    setLifeEvents([...lifeEvents, event]);
    
    // Reset form completely
    setNewEvent({
      category: selectedCategory,
      eventType: '',
      eventDate: '',
      dateAccuracy: 'exact',
      description: '',
      importance: 'medium',
      eventTime: ''
    });
    setTimeParts({ hour: '', minute: '', period: 'AM' });
    setTouched({ eventType: false, eventDate: false, eventTime: false, description: false });
  }, [newEvent, selectedCategory, lifeEvents, setLifeEvents, validation]);
  
  // Delete event handler with confirmation
  const deleteEvent = useCallback((eventId: string) => {
    setShowDeleteConfirm(eventId);
  }, []);
  
  // Confirm deletion
  const confirmDelete = useCallback((eventId: string) => {
    setLifeEvents(lifeEvents.filter(e => e.id !== eventId));
    setShowDeleteConfirm(null);
  }, [lifeEvents, setLifeEvents]);
  
  // Cancel deletion
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(null);
  }, []);
  
  // Edit event handlers
  const startEditEvent = useCallback((eventId: string) => {
    setEditingEventId(eventId);
    const event = lifeEvents.find(e => e.id === eventId);
    if (event) {
      setNewEvent({ ...event });
      if (event.eventTime) {
        const [hour24, minute] = event.eventTime.split(':');
        const hourNum = parseInt(hour24);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
        setTimeParts({
          hour: displayHour.toString().padStart(2, '0'),
          minute,
          period
        });
      }
    }
  }, [lifeEvents]);
  
  const saveEditEvent = useCallback(() => {
    if (!editingEventId || !newEvent.eventType || !newEvent.eventDate || !newEvent.description) {
      setTouched({ eventType: true, eventDate: true, eventTime: true, description: true });
      return;
    }
    
    setLifeEvents(lifeEvents.map(event =>
      event.id === editingEventId
        ? { ...event, ...newEvent as LifeEvent }
        : event
    ));
    
    setEditingEventId(null);
    setNewEvent({
      category: selectedCategory,
      eventType: '',
      eventDate: '',
      dateAccuracy: 'exact',
      description: '',
      importance: 'medium',
      eventTime: ''
    });
    setTimeParts({ hour: '', minute: '', period: 'AM' });
    setTouched({ eventType: false, eventDate: false, eventTime: false, description: false });
  }, [editingEventId, newEvent, lifeEvents, setLifeEvents, selectedCategory]);
  
  const cancelEditEvent = useCallback(() => {
    setEditingEventId(null);
    setNewEvent({
      category: selectedCategory,
      eventType: '',
      eventDate: '',
      dateAccuracy: 'exact',
      description: '',
      importance: 'medium',
      eventTime: ''
    });
    setTimeParts({ hour: '', minute: '', period: 'AM' });
    setTouched({ eventType: false, eventDate: false, eventTime: false, description: false });
  }, [selectedCategory]);
  
  // Calculate event quality score - memoized for performance
  const qualityScore = useMemo(() => {
    if (lifeEvents.length === 0) return { score: 0, level: 'poor', message: 'No events added yet' };
    
    const hasMarriage = lifeEvents.some(e => e.category === 'marriage');
    const hasCritical = lifeEvents.some(e => e.importance === 'critical');
    const exactDates = lifeEvents.filter(e => e.dateAccuracy === 'exact').length;
    const hasTimeInfo = lifeEvents.some(e => e.eventTime);
    
    let score = 0;
    if (lifeEvents.length >= 3) score += 30;
    if (lifeEvents.length >= 5) score += 20;
    if (lifeEvents.length >= 7) score += 10;
    if (hasMarriage) score += 25;
    if (hasCritical) score += 15;
    if (hasTimeInfo) score += 10;
    score += (exactDates / lifeEvents.length) * 30;
    
    if (score >= 80) return { score: Math.round(score), level: 'excellent', message: 'Excellent data quality!' };
    if (score >= 60) return { score: Math.round(score), level: 'good', message: 'Good data quality' };
    if (score >= 40) return { score: Math.round(score), level: 'fair', message: 'Fair data quality' };
    return { score: Math.round(score), level: 'poor', message: 'Need more reliable events' };
  }, [lifeEvents]);
  
  // Categories for selection
  const categories = useMemo(() => [
    { key: 'education' as EventCategory, label: 'Education', description: 'Academic achievements' },
    { key: 'career' as EventCategory, label: 'Career', description: 'Professional milestones' },
    { key: 'marriage' as EventCategory, label: 'Marriage', description: 'Relationship events' },
    { key: 'children' as EventCategory, label: 'Children', description: 'Family expansion' },
    { key: 'family' as EventCategory, label: 'Family', description: 'Family life events' },
    { key: 'health' as EventCategory, label: 'Health', description: 'Medical events' },
    { key: 'financial' as EventCategory, label: 'Financial', description: 'Money matters' },
    { key: 'travel' as EventCategory, label: 'Travel', description: 'Journeys abroad' },
    { key: 'spiritual' as EventCategory, label: 'Spiritual', description: 'Religious events' }
  ], []);
  
  // Input component with validation
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
    ...props 
  }: any) => {
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
            placeholder={placeholder}
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
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
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
            This is the most important part
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Life events help us pinpoint your exact birth time
          </p>
        </motion.div>
      </div>
      
      {/* How It Works Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-4xl mx-auto"
      >
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-3 text-amber-400 hover:text-amber-300 mb-4 w-full"
          type="button"
        >
          <Info className="w-5 h-5" />
          <span className="font-semibold">How This Works</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/80 space-y-4"
            >
              <p>Every major life event happens during a specific planetary period (Dasha). By working backwards from events with KNOWN dates, we can find the birth time that makes all events align perfectly.</p>
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-semibold text-amber-400 mb-2">⭐ BEST EVENTS TO ADD:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Marriage date (most reliable!)</li>
                  <li>First job / major promotion</li>
                  <li>Children's birth dates</li>
                  <li>Major health events or accidents</li>
                  <li>Parent&apos;s death (if applicable)</li>
                </ol>
              </div>
              <p className="text-sm text-white/60">Think of it like solving a puzzle: More pieces = Clearer picture, Exact dates = Better fit</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Event Quality Score */}
      {lifeEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Event Quality Score
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Data Quality</span>
              <span className={`font-semibold ${
                qualityScore.level === 'excellent' ? 'text-green-400' :
                qualityScore.level === 'good' ? 'text-yellow-400' :
                qualityScore.level === 'fair' ? 'text-orange-400' : 'text-red-400'
              }`}>
                {qualityScore.score}% - {qualityScore.level.charAt(0).toUpperCase() + qualityScore.level.slice(1)}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div 
                className={`h-full rounded-full ${
                  qualityScore.level === 'excellent' ? 'bg-green-500' :
                  qualityScore.level === 'good' ? 'bg-yellow-500' :
                  qualityScore.level === 'fair' ? 'bg-orange-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${qualityScore.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-sm text-white/60">{qualityScore.message}</p>
            
            {qualityScore.score < 80 && (
              <div className="bg-white/10 rounded-lg p-3 mt-3">
                <p className="text-sm text-white/80">
                  💡 <strong>Tip:</strong> Adding {qualityScore.score < 60 ? '3-4 more events' : '1-2 more events'} with exact dates will improve accuracy significantly.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Event Category Visual Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-4xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          What type of event would you like to add?
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          {categories.map(cat => {
            const visual = categoryVisuals[cat.key];
            const eventCount = lifeEvents.filter(e => e.category === cat.key).length;
            return (
              <motion.button
                key={cat.key}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setNewEvent(prev => ({
                    ...prev,
                    category: cat.key,
                    eventType: ''
                  }));
                  setTouched(prev => ({ ...prev, eventType: false }));
                }}
                className={`p-4 rounded-xl text-center transition-all duration-300 border-2
                  ${selectedCategory === cat.key
                    ? 'border-amber-500 bg-amber-500/20 shadow-lg'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                <div className="text-2xl mb-2">{visual.emoji}</div>
                <div className="text-sm font-medium text-white">{cat.label}</div>
                {eventCount > 0 && (
                  <div className="text-xs text-amber-400 mt-1">{eventCount} added</div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* Event Entry Form - Card Style */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                What happened?
              </label>
              <select
                value={newEvent.eventType || ''}
                onChange={(e) => {
                  setNewEvent(prev => ({ ...prev, eventType: e.target.value }));
                  setTouched(prev => ({ ...prev, eventType: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, eventType: true }))}
                className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                  touched.eventType && !validation.eventType 
                    ? 'border-red-500 focus:ring-red-500' 
                    : touched.eventType && validation.eventType
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-white/20 focus:ring-amber-500'
                }`}
                key={selectedCategory}
                required
              >
                <option value="">Select event type</option>
                {EVENT_TYPES[selectedCategory]?.map(type => (
                  <option key={type} value={type} className="bg-slate-800">{type}</option>
                ))}
              </select>
              {touched.eventType && !validation.eventType && (
                <p className="text-xs text-red-400 mt-1">Please select an event type</p>
              )}
            </div>
            
            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                When did this happen?
              </label>
              <StandardizedDateInput
                value={newEvent.eventDate || ''}
                onChange={(value) => {
                  setNewEvent(prev => ({ ...prev, eventDate: value }));
                  setTouched(prev => ({ ...prev, eventDate: true }));
                }}
                dateType={newEvent.dateAccuracy as 'exact' | 'month' | 'year' | 'approximate'}
                onDateTypeChange={(type) => setNewEvent(prev => ({ ...prev, dateAccuracy: type }))}
              />
              {touched.eventDate && !validation.eventDate && (
                <p className="text-xs text-red-400 mt-1">Please select a valid date</p>
              )}
            </div>
          </div>
          
          {/* Time Input for Exact Dates - Standardized Format */}
          {newEvent.dateAccuracy === 'exact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  What time did this happen? (Optional)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <select
                      value={timeParts.hour}
                      onChange={(e) => handleTimePartsChange('hour', e.target.value)}
                      className="w-full h-12 px-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Hour</option>
                      {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <select
                      value={timeParts.minute}
                      onChange={(e) => handleTimePartsChange('minute', e.target.value)}
                      className="w-full h-12 px-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Minute</option>
                      {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => handleTimePartsChange('period', 'AM')}
                      className={`flex-1 h-12 rounded-xl font-medium transition-colors ${
                        timeParts.period === 'AM'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTimePartsChange('period', 'PM')}
                      className={`flex-1 h-12 rounded-xl font-medium transition-colors ${
                        timeParts.period === 'PM'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>
              <div></div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Importance */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                How important was this event?
              </label>
              <div className="space-y-2">
                {importanceLevels.map((level) => (
                  <label key={level.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="importance"
                      value={level.value}
                      checked={newEvent.importance === level.value}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, importance: e.target.value as any }))}
                      className="text-amber-500"
                    />
                    <div>
                      <div className="text-sm text-white">{level.label}</div>
                      <div className="text-xs text-white/60">{level.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Description - Now Required */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Any additional details? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={newEvent.description || ''}
                onChange={(e) => {
                  setNewEvent(prev => ({ ...prev, description: e.target.value }));
                  setTouched(prev => ({ ...prev, description: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
                placeholder="E.g., 'Arranged marriage, venue was Delhi', 'Joined as Software Engineer'"
                className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                  touched.description && !validation.description
                    ? 'border-red-500 focus:ring-red-500'
                    : touched.description && validation.description
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-white/20 focus:ring-amber-500'
                }`}
                rows={3}
                maxLength={500}
                required
              />
              {touched.description && !validation.description && (
                <p className="text-xs text-red-400 mt-1">Please provide additional details about this event</p>
              )}
              <div className="text-xs text-white/60 mt-1 text-right">
                {(newEvent.description || '').length}/500
              </div>
            </div>
          </div>
          
          <motion.button
            onClick={addEvent}
            disabled={!validation.eventType || !validation.eventDate || !validation.description}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 text-white font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
          >
            <Plus className="w-5 h-5" />
            Add This Event
          </motion.button>
        </div>
      </motion.div>
      
      {/* Added Events Display */}
      <AnimatePresence>
        {lifeEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                Your Events ({lifeEvents.length})
              </h3>
              <div className="text-sm text-white/60">
                Minimum 3 events required
              </div>
            </div>
            
            {/* Timeline View */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Event Timeline
              </h4>
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-amber-500/30"></div>
                {lifeEvents
                  .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                  .map((event, index) => {
                    const visual = categoryVisuals[event.category];
                    const importance = importanceLevels.find(l => l.value === event.importance);
                    const isConfirming = showDeleteConfirm === event.id;
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="relative flex gap-4 mb-6"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10">
                          <div className={`w-16 h-16 rounded-full ${visual.bgColor} flex items-center justify-center border-2 border-white/20`}>
                            <div className="text-2xl">{visual.emoji}</div>
                          </div>
                        </div>
                        
                        {/* Event content */}
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-semibold text-white">{event.eventType}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${importance?.color}`}>
                                  {importance?.label.split(' ')[1]}
                                </span>
                                {editingEventId === event.id && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                                    Editing
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-white/70 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(event.eventDate).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </div>
                                {event.eventTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.eventTime}</span>
                                  </div>
                                )}
                                {event.dateAccuracy !== 'exact' && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="capitalize">{event.dateAccuracy}</span>
                                  </div>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-white/80 italic bg-white/5 rounded-lg p-2">
                                  &quot;{event.description}&quot;
                                </p>
                              )}
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex gap-2 ml-4">
                              {!isConfirming ? (
                                <>
                                  <motion.button
                                    onClick={() => startEditEvent(event.id)}
                                    className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors flex-shrink-0"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    aria-label={`Edit ${event.eventType}`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => deleteEvent(event.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    aria-label={`Delete ${event.eventType}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </>
                              ) : (
                                <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                  <p className="text-sm text-white/80">Delete this event?</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => confirmDelete(event.id)}
                                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                                      type="button"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={cancelDelete}
                                      className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-colors"
                                      type="button"
                                    >
                                      No
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Empty State */}
      {lifeEvents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl max-w-4xl mx-auto"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-white mb-2">No events yet</h3>
          <p className="text-white/70 mb-6">Add at least 3 life events to continue. Start with your most memorable moments.</p>
          <div className="text-sm text-white/60 space-y-1">
            <p>💡 Start with marriage, first job, or graduation</p>
            <p>💡 Exact dates provide better accuracy</p>
            <p>💡 Critical events carry more weight in calculations</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
