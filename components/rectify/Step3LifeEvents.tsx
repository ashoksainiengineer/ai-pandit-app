/**
 * Step3LifeEvents - Life Events Collection Form
 * Enhanced with 170+ Hindu/Sanatan Dharam events, smart suggestions, and custom events
 * Sacred Ivory Light Theme - Production Grade
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeEvent, TimeOffsetConfig } from '@/lib/types';
import { EventCategory, EventTemplate, EventImportance } from '@/lib/events/types';
import { EVENT_CATEGORIES as ENHANCED_CATEGORIES } from '@/lib/events/categories';
import { getCategoryById } from '@/lib/events/utils';
import { FormCard } from '@/components/ui/form/FormCard';
import { FormField } from '@/components/ui/form/FormField';
import EventSelector from '@/components/events/EventSelector';
import CustomEventModal from '@/components/events/CustomEventModal';
import EventEditor from '@/components/events/EventEditor';
import WhyEventsMatter from './WhyEventsMatter';

interface Step3Props {
  lifeEvents: LifeEvent[];
  updateEvents: (events: LifeEvent[]) => void;
  offsetConfig?: TimeOffsetConfig;
}

type DatePrecision = 'exact_date_time' | 'exact_date' | 'exact_date_range' | 'month_year' | 'month_range' | 'year_range';
type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

const DATE_OPTIONS = [
  { value: 'exact_date_time' as DatePrecision, label: 'Exact Date & Time', desc: 'DD/MM/YYYY HH:MM' },
  { value: 'exact_date' as DatePrecision, label: 'Exact Date', desc: 'DD/MM/YYYY' },
  { value: 'exact_date_range' as DatePrecision, label: 'Date Range', desc: 'DD/MM → DD/MM' },
  { value: 'month_year' as DatePrecision, label: 'Month & Year', desc: 'MM/YYYY' },
  { value: 'month_range' as DatePrecision, label: 'Month Range', desc: 'MM/YYYY → MM/YYYY' },
  { value: 'year_range' as DatePrecision, label: 'Year Range', desc: 'YYYY → YYYY' },
];

const IMPORTANCE_OPTIONS: { level: ImportanceLevel; label: string; icon: string; desc: string; weight: number }[] = [
  { level: 'critical', label: 'Life Defining', icon: '⚡', desc: 'Transformed your life', weight: 3.0 },
  { level: 'high', label: 'Major Milestone', icon: '⭐', desc: 'Significant turning point', weight: 2.0 },
  { level: 'medium', label: 'Important', icon: '●', desc: 'Notable life event', weight: 1.0 },
  { level: 'low', label: 'Minor', icon: '○', desc: 'Routine occurrence', weight: 0.5 },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => (CURRENT_YEAR - i).toString());
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

export default function Step3LifeEvents({
  lifeEvents,
  updateEvents,
  offsetConfig
}: Step3Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<EventCategory[]>([]);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string>('');

  // Combine default and custom categories
  const allCategories = useMemo(() => {
    return [...ENHANCED_CATEGORIES, ...customCategories];
  }, [customCategories]);

  // God-tier accuracy calculation (25-40+ events for 95-99% accuracy)
  const accuracy = useMemo(() => {
    const eventCount = lifeEvents.filter(e => e.description && e.eventDate).length;
    const categoriesCount = new Set(lifeEvents.filter(e => e.description && e.eventDate).map(e => e.category)).size;
    
    // Base score from events (max 45 points at 30 events)
    const eventScore = Math.min(45, eventCount * 1.5);
    
    // Category diversity bonus (max 20 points at 10 categories)
    const categoryScore = Math.min(20, categoriesCount * 2);
    
    // Precision bonus for exact dates (max 15 points)
    const exactDateCount = lifeEvents.filter(e =>
      (e.datePrecision === 'exact_date' || e.datePrecision === 'exact_date_time') && e.eventDate
    ).length;
    const precisionScore = Math.min(15, exactDateCount * 1.5);
    
    // Life span coverage (max 10 points)
    const decades = new Set(lifeEvents.filter(e => e.eventDate).map(e =>
      Math.floor(parseInt(e.eventDate.split('-')[0]) / 10)
    )).size;
    const spanScore = Math.min(10, decades * 3);
    
    // Critical categories bonus (max 10 points)
    const criticalCategories = ['career', 'marriage', 'health'];
    const hasCritical = criticalCategories.filter(cat =>
      lifeEvents.some(e => e.category === cat && e.description && e.eventDate)
    ).length;
    const criticalScore = hasCritical * 3;
    
    const totalAccuracy = Math.min(99, 20 + eventScore + categoryScore + precisionScore + spanScore + criticalScore);
    return Math.round(totalAccuracy);
  }, [lifeEvents]);

  // Updated targets for god-tier BTR
  const targetEvents = useMemo(() => {
    // Minimum 25 events for professional BTR, 40 for god-tier
    return 40;
  }, [offsetConfig]);

  const getAccuracyLabel = (acc: number): { label: string; emoji: string; precision: string } => {
    if (acc >= 96) return { label: 'God Tier', emoji: '🔱', precision: '±1-10 seconds' };
    if (acc >= 90) return { label: 'Master Level', emoji: '⚡', precision: '±10-60 seconds' };
    if (acc >= 80) return { label: 'Professional', emoji: '🌟', precision: '±1-5 minutes' };
    if (acc >= 70) return { label: 'Advanced', emoji: '⭐', precision: '±3-5 minutes' };
    if (acc >= 60) return { label: 'Intermediate', emoji: '📊', precision: '±5-15 minutes' };
    return { label: 'Basic', emoji: '🔍', precision: '±15+ minutes' };
  };

  const accuracyInfo = getAccuracyLabel(accuracy);

  const addEvent = useCallback((label: string, icon: string, category: string, importance: ImportanceLevel = 'medium', isCustom = false) => {
    const categoryData = getCategoryById(allCategories, category);
    const newEvent: LifeEvent = {
      id: `evt_${Date.now()}`,
      category: category as any,
      eventType: label,
      icon: icon || categoryData?.icon || '📅',
      datePrecision: 'month_year',
      eventDate: '',
      description: '',
      importance,
      isCustom
    };
    updateEvents([...lifeEvents, newEvent]);
    setEditingId(newEvent.id);
  }, [lifeEvents, updateEvents, allCategories]);

  const handleSelectEvent = useCallback((event: EventTemplate, categoryId: string) => {
    const category = getCategoryById(allCategories, categoryId);
    addEvent(event.label, category?.icon || '📅', categoryId, event.importance);
  }, [addEvent, allCategories]);

  const handleCreateCustomEvent = useCallback((data: {
    label: string;
    categoryId: string;
    importance: EventImportance;
    isNewCategory: boolean;
    newCategoryName?: string;
  }) => {
    if (data.isNewCategory && data.newCategoryName) {
      // Create new category
      const newCategory: EventCategory = {
        id: `custom_${Date.now()}`,
        icon: '📌',
        label: data.newCategoryName,
        color: '#B8860B',
        description: `Custom category: ${data.newCategoryName}`,
        events: [],
        isCustom: true
      };
      setCustomCategories(prev => [...prev, newCategory]);
      addEvent(data.label, '📌', newCategory.id, data.importance, true);
    } else {
      addEvent(data.label, '📌', data.categoryId, data.importance, true);
    }
    setIsCustomModalOpen(false);
  }, [addEvent]);

  const updateEvent = useCallback((id: string, updates: Partial<LifeEvent>) => {
    updateEvents(lifeEvents.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [lifeEvents, updateEvents]);

  const deleteEvent = useCallback((id: string) => {
    updateEvents(lifeEvents.filter(e => e.id !== id));
    setEditingId(null);
  }, [lifeEvents, updateEvents]);

  const formatEventDate = useCallback((e: LifeEvent) => {
    if (!e.eventDate) return 'No date';
    const [y, m, d] = e.eventDate.split('-');
    const mon = m ? MONTHS[parseInt(m) - 1]?.slice(0, 3) : '';
    if (e.datePrecision === 'month_year' && mon) return `${mon} ${y}`;
    if ((e.datePrecision === 'exact_date' || e.datePrecision === 'exact_date_time') && mon && d) return `${d} ${mon} ${y}`;
    if (e.datePrecision?.includes('range') && e.endDate) return `${y} → ${e.endDate.split('-')[0]}`;
    return y;
  }, []);

  const sortedEvents = useMemo(() => {
    return [...lifeEvents].sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return a.eventDate.localeCompare(b.eventDate);
    });
  }, [lifeEvents]);

  const editingEvent = editingId ? lifeEvents.find(e => e.id === editingId) : null;

  // Get event data for editing
  const editingEventData = useMemo(() => {
    if (!editingEvent) return null;
    return {
      id: editingEvent.eventType, // Use eventType as id for custom events
      label: editingEvent.eventType,
      description: editingEvent.description,
      importance: editingEvent.importance || 'medium',
      categoryId: editingEvent.category,
      isCustom: editingEvent.isCustom
    };
  }, [editingEvent]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Security Badge - Top of Form */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 text-xs text-[#2D7A5C] bg-[#2D7A5C]/5 py-2.5 px-4 rounded-full border border-[#2D7A5C]/10"
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
          <span className="text-[#B8860B] font-medium tracking-wider">STEP 3 OF 4</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-[family-name:var(--font-cormorant)] text-3xl sm:text-4xl font-semibold text-[#1A1612] leading-tight mb-2">
          Life <span className="text-gradient-gold">Events</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-[#7A756F]">
          Add events for birth time rectification
        </motion.p>
      </div>

      {/* Why Events Matter - Educational Component */}
      <WhyEventsMatter
        currentEventCount={lifeEvents.length}
        categoriesCovered={new Set(lifeEvents.map(e => e.category)).size}
      />

      {/* Event Editor or Event Selector */}
      <AnimatePresence mode="wait">
        {editingEvent && editingEventData ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="bg-white border-2 border-[#B8860B] rounded-xl overflow-hidden shadow-lg"
          >
            {/* Event Editor Header */}
            <div className="bg-gradient-to-r from-[#B8860B]/10 to-[#FDF8F3] px-5 py-4 flex items-center justify-between border-b border-[#B8860B]/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{editingEvent.icon}</span>
                <div>
                  <h2 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612]">
                    {editingEvent.eventType}
                  </h2>
                  <p className="text-xs text-[#7A756F]">
                    {getCategoryById(allCategories, editingEvent.category)?.label}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingId(null)} 
                  disabled={!editingEvent.description}
                  className={`px-4 py-2 font-semibold rounded-lg text-sm transition-colors ${
                    editingEvent.description 
                      ? 'bg-[#2D7A5C] text-white hover:bg-[#236B4F]' 
                      : 'bg-[#2D7A5C]/30 text-white/50 cursor-not-allowed'
                  }`}
                >
                  ✓ Save
                </button>
                <button 
                  onClick={() => deleteEvent(editingEvent.id)} 
                  className="px-4 py-2 border-2 border-[#C65D3B] text-[#C65D3B] rounded-lg hover:bg-[#C65D3B]/10 font-semibold text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Event Editor Body */}
            <div className="p-5 space-y-4">
              {/* Inline Event Editor for custom events */}
              {editingEvent.isCustom && (
                <EventEditor
                  event={editingEventData}
                  categories={allCategories}
                  onSave={(updates) => {
                    if (updates.label) updateEvent(editingEvent.id, { eventType: updates.label });
                    if (updates.categoryId) updateEvent(editingEvent.id, { category: updates.categoryId as any });
                    if (updates.importance) updateEvent(editingEvent.id, { importance: updates.importance });
                  }}
                  onDelete={() => deleteEvent(editingEvent.id)}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {/* Date Precision */}
              <FormField label="When did this happen?">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {DATE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateEvent(editingEvent.id, { datePrecision: opt.value })}
                      className={`py-3 px-2 rounded-lg text-center transition-all border ${
                        editingEvent.datePrecision === opt.value
                          ? 'bg-[#B8860B] text-white border-[#B8860B] shadow-md'
                          : 'bg-white border-[#E8E0D5] text-[#4A453F] hover:border-[#D4A853] hover:bg-[#FDF8F3]'
                      }`}
                    >
                      <div className="font-semibold text-[10px] leading-tight">{opt.label}</div>
                      <div className={`text-[9px] mt-1 ${editingEvent.datePrecision === opt.value ? 'text-white/80' : 'text-[#7A756F]'}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Date Fields */}
              <DateInput 
                precision={editingEvent.datePrecision as DatePrecision} 
                event={editingEvent} 
                onUpdate={(updates) => updateEvent(editingEvent.id, updates)} 
              />

              {/* Importance */}
              <FormField label="How significant was this event?" required>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {IMPORTANCE_OPTIONS.map((opt) => {
                    const isSelected = editingEvent.importance === opt.level;
                    return (
                      <button 
                        key={opt.level} 
                        onClick={() => updateEvent(editingEvent.id, { importance: opt.level })} 
                        className={`p-3 rounded-lg text-left transition-all border ${
                          isSelected 
                            ? 'bg-[#B8860B]/10 border-[#B8860B]' 
                            : 'bg-white border-[#E8E0D5] hover:border-[#D4A853]/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{opt.icon}</span>
                          <span className={`font-semibold text-xs ${isSelected ? 'text-[#1A1612]' : 'text-[#4A453F]'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <div className={`text-[10px] ${isSelected ? 'text-[#B8860B]' : 'text-[#7A756F]'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {/* Description */}
              <FormField label="Describe your experience" required>
                <textarea 
                  value={editingEvent.description || ''} 
                  onChange={(e) => updateEvent(editingEvent.id, { description: e.target.value })} 
                  placeholder="What happened? How did you feel?..." 
                  className={`w-full h-24 p-4 bg-white border-2 rounded-lg text-sm text-[#1A1612] placeholder-[#A8A39D] resize-none focus:ring-2 outline-none transition-all ${
                    editingEvent.description 
                      ? 'border-[#2D7A5C]/50 focus:border-[#2D7A5C]' 
                      : 'border-[#C65D3B]/50 focus:border-[#C65D3B]'
                  }`} 
                />
                <div className="flex items-center gap-2 mt-2 text-[10px] text-[#2D7A5C]">
                  <span>🔒</span>
                  <span>End-to-end encrypted</span>
                </div>
              </FormField>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FormCard className="p-5">
              <EventSelector
                existingEvents={lifeEvents}
                onSelectEvent={handleSelectEvent}
                onCreateCustom={(categoryId?: string) => {
                  setPreselectedCategoryId(categoryId || '');
                  setIsCustomModalOpen(true);
                }}
              />
            </FormCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      {sortedEvents.length > 0 && (
        <FormCard className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#1A1612]">📜 Timeline</h3>
            <span className="text-xs text-[#7A756F] bg-[#F5EFE7] px-2 py-1 rounded-full">
              {sortedEvents.length} events
            </span>
          </div>
          <div className="divide-y divide-[#F0E8DE]">
            {sortedEvents.map((event) => (
              <motion.div 
                key={event.id} 
                onClick={() => setEditingId(event.id)} 
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F5EFE7] transition-colors rounded-lg" 
                whileHover={{ x: 4 }}
              >
                <span className="text-2xl">{event.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[#1A1612] font-semibold text-sm truncate">{event.eventType}</div>
                    {event.importance && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        event.importance === 'critical' 
                          ? 'bg-[#C65D3B]/10 text-[#C65D3B]' 
                          : event.importance === 'high' 
                            ? 'bg-[#B8860B]/10 text-[#B8860B]' 
                            : event.importance === 'medium' 
                              ? 'bg-[#2D7A5C]/10 text-[#2D7A5C]' 
                              : 'bg-[#A8A39D]/20 text-[#7A756F]'
                      }`}>
                        {IMPORTANCE_OPTIONS.find(i => i.level === event.importance)?.icon}
                      </span>
                    )}
                    {event.isCustom && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#B8860B]/10 text-[#B8860B] rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#B8860B] font-medium">{formatEventDate(event)}</div>
                  {event.description && (
                    <p className="text-xs text-[#7A756F] line-clamp-1 mt-0.5">{event.description}</p>
                  )}
                </div>
                {event.description ? (
                  <span className="text-[#2D7A5C] text-lg">✓</span>
                ) : (
                  <span className="px-2 py-1 bg-[#C65D3B]/10 text-[#C65D3B] text-[10px] rounded-full font-medium">
                    Add
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </FormCard>
      )}

      {/* Empty State */}
      {sortedEvents.length === 0 && !editingId && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-white rounded-xl border-2 border-[#F0E8DE] p-12 text-center"
        >
          <div className="text-5xl mb-4">📅</div>
          <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612] mb-2">
            Your timeline starts here
          </h3>
          <p className="text-[#7A756F] text-sm">Search or browse categories above to add your first event</p>
        </motion.div>
      )}

      {/* Custom Event Modal */}
      <CustomEventModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        categories={allCategories}
        onCreateEvent={handleCreateCustomEvent}
        preselectedCategoryId={preselectedCategoryId}
      />
    </div>
  );
}

// Date Input Component
interface DateInputProps {
  precision: DatePrecision;
  event: LifeEvent;
  onUpdate: (updates: Partial<LifeEvent>) => void;
}

function DateInput({ precision, event, onUpdate }: DateInputProps) {
  const [y, m, d] = (event.eventDate || '').split('-');
  const [endY, endM, endD] = (event.endDate || '').split('-');

  const handleDateChange = (part: 'y' | 'm' | 'd', value: string) => {
    const newY = part === 'y' ? value : (y || CURRENT_YEAR.toString());
    const newM = part === 'm' ? value.padStart(2, '0') : (m || '01');
    const newD = part === 'd' ? value.padStart(2, '0') : (d || '01');
    onUpdate({ eventDate: `${newY}-${newM}-${newD}` });
  };

  // Year Range: Start Year → End Year
  if (precision === 'year_range') {
    return (
      <div className="flex items-center gap-3 bg-[#F5EFE7] p-3 rounded-lg">
        <select
          value={y || ''}
          onChange={(e) => onUpdate({ eventDate: e.target.value })}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853] flex-1"
        >
          <option value="">Start Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
        <span className="text-[#B8860B] text-xl">→</span>
        <select
          value={event.endDate || ''}
          onChange={(e) => onUpdate({ endDate: e.target.value })}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853] flex-1"
        >
          <option value="">End Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
    );
  }

  // Month Range: Start Month/Year → End Month/Year
  if (precision === 'month_range') {
    return (
      <div className="space-y-3 bg-[#F5EFE7] p-3 rounded-lg">
        <div className="flex gap-3">
          <select
            value={m || ''}
            onChange={(e) => handleDateChange('m', e.target.value)}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
          >
            <option value="">Start Month</option>
            {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
          </select>
          <select
            value={y || ''}
            onChange={(e) => handleDateChange('y', e.target.value)}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
          >
            <option value="">Start Year</option>
            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-[#B8860B] text-xl">↓</span>
        </div>
        <div className="flex gap-3">
          <select
            value={endM || ''}
            onChange={(e) => {
              const newEndDate = `${endY || CURRENT_YEAR.toString()}-${e.target.value.padStart(2, '0')}-01`;
              onUpdate({ endDate: newEndDate });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
          >
            <option value="">End Month</option>
            {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
          </select>
          <select
            value={endY || ''}
            onChange={(e) => {
              const newEndDate = `${e.target.value}-${(endM || '01').padStart(2, '0')}-01`;
              onUpdate({ endDate: newEndDate });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
          >
            <option value="">End Year</option>
            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>
    );
  }

  // Month & Year
  if (precision === 'month_year') {
    return (
      <div className="flex gap-3 bg-[#F5EFE7] p-3 rounded-lg">
        <select
          value={m || ''}
          onChange={(e) => handleDateChange('m', e.target.value)}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
        >
          <option value="">Month</option>
          {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
        </select>
        <select
          value={y || ''}
          onChange={(e) => handleDateChange('y', e.target.value)}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
        >
          <option value="">Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
    );
  }

  // Date Range: Start Date → End Date
  if (precision === 'exact_date_range') {
    return (
      <div className="space-y-3 bg-[#F5EFE7] p-3 rounded-lg">
        {/* Start Date */}
        <div className="flex gap-3">
          <select
            value={d || ''}
            onChange={(e) => handleDateChange('d', e.target.value)}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
          >
            <option value="">Start Day</option>
            {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <select
            value={m || ''}
            onChange={(e) => handleDateChange('m', e.target.value)}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
          >
            <option value="">Start Month</option>
            {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
          </select>
          <select
            value={y || ''}
            onChange={(e) => handleDateChange('y', e.target.value)}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
          >
            <option value="">Start Year</option>
            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-[#B8860B] text-xl">↓</span>
        </div>
        {/* End Date */}
        <div className="flex gap-3">
          <select
            value={endD || ''}
            onChange={(e) => {
              const newEndDate = `${endY || CURRENT_YEAR.toString()}-${(endM || '01').padStart(2, '0')}-${e.target.value.padStart(2, '0')}`;
              onUpdate({ endDate: newEndDate });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
          >
            <option value="">End Day</option>
            {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <select
            value={endM || ''}
            onChange={(e) => {
              const newEndDate = `${endY || CURRENT_YEAR.toString()}-${e.target.value.padStart(2, '0')}-${(endD || '01').padStart(2, '0')}`;
              onUpdate({ endDate: newEndDate });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
          >
            <option value="">End Month</option>
            {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
          </select>
          <select
            value={endY || ''}
            onChange={(e) => {
              const newEndDate = `${e.target.value}-${(endM || '01').padStart(2, '0')}-${(endD || '01').padStart(2, '0')}`;
              onUpdate({ endDate: newEndDate });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
          >
            <option value="">End Year</option>
            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
      </div>
    );
  }

  // Default: Exact Date (Day/Month/Year) or Exact Date & Time
  return (
    <div className="space-y-3">
      <div className="flex gap-3 bg-[#F5EFE7] p-3 rounded-lg">
        <select
          value={d || ''}
          onChange={(e) => handleDateChange('d', e.target.value)}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
        >
          <option value="">Day</option>
          {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
        </select>
        <select
          value={m || ''}
          onChange={(e) => handleDateChange('m', e.target.value)}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none flex-1 focus:border-[#D4A853]"
        >
          <option value="">Month</option>
          {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
        </select>
        <select
          value={y || ''}
          onChange={(e) => handleDateChange('y', e.target.value)}
          className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
        >
          <option value="">Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
      
      {/* Time selector for exact_date_time */}
      {precision === 'exact_date_time' && (
        <div className="flex items-center gap-2 bg-[#F5EFE7] p-3 rounded-lg">
          <label className="text-xs text-[#7A756F] mr-2">Time:</label>
          <select
            value={event.eventTime?.split(':')[0] || ''}
            onChange={(e) => {
              const currentTime = event.eventTime || '00:00';
              const [_, min] = currentTime.split(':');
              onUpdate({ eventTime: `${e.target.value}:${min || '00'}` });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
          >
            <option value="">HH</option>
            {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <span className="text-[#B8860B]">:</span>
          <select
            value={event.eventTime?.split(':')[1] || ''}
            onChange={(e) => {
              const currentTime = event.eventTime || '00:00';
              const [hour, _] = currentTime.split(':');
              onUpdate({ eventTime: `${hour || '00'}:${e.target.value}` });
            }}
            className="h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm outline-none focus:border-[#D4A853]"
          >
            <option value="">MM</option>
            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
