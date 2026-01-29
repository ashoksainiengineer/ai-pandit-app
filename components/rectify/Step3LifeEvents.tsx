/**
 * Step3LifeEvents - Life Events Collection Form
 * User-friendly event management with timeline visualization
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeEvent, TimeOffsetConfig } from '@/lib/types';
import EVENT_CATEGORIES from '@/lib/event-categories';
import { FormCard } from '@/components/ui/form/FormCard';
import { FormField } from '@/components/ui/form/FormField';

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
  { level: 'critical', label: 'Life Defining', icon: '⚡', desc: 'Transformed your life completely', weight: 3.0 },
  { level: 'high', label: 'Major Milestone', icon: '⭐', desc: 'Significant turning point', weight: 2.0 },
  { level: 'medium', label: 'Important', icon: '●', desc: 'Notable life event', weight: 1.0 },
  { level: 'low', label: 'Minor', icon: '○', desc: 'Routine occurrence', weight: 0.5 },
];

const BTR_EVENTS = [
  { label: 'Marriage', icon: '💍', cat: 'marriage', boost: 10 },
  { label: 'First Child', icon: '👶', cat: 'children', boost: 10 },
  { label: 'Parent Death', icon: '🕯️', cat: 'family', boost: 9 },
  { label: 'First Job', icon: '💼', cat: 'career', boost: 8 },
  { label: 'Surgery/Accident', icon: '🏥', cat: 'health', boost: 8 },
  { label: 'Property Purchase', icon: '🏠', cat: 'financial', boost: 7 },
  { label: 'Foreign Move', icon: '✈️', cat: 'travel', boost: 7 },
  { label: 'Legal Victory', icon: '⚖️', cat: 'legal', boost: 7 },
  { label: 'Guru Diksha', icon: '🕉️', cat: 'spiritual', boost: 8 },
  { label: 'Sudden Windfall', icon: '🌊', cat: 'karmic_events', boost: 7 },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => (CURRENT_YEAR - i).toString());
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

export default function Step3LifeEvents({ lifeEvents, updateEvents, offsetConfig }: Step3Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Calculate accuracy score
  const accuracy = useMemo(() => {
    let score = 30;
    score += lifeEvents.filter(e => e.description && e.eventDate).length * 8;
    return Math.min(98, Math.round(score));
  }, [lifeEvents]);

  // Get target event count based on offset
  const targetEvents = useMemo(() => {
    if (offsetConfig?.preset === '30min') return 4;
    if (offsetConfig?.preset === '1hour') return 6;
    if (offsetConfig?.preset === '2hours') return 8;
    return 12;
  }, [offsetConfig]);

  // Add new event
  const addEvent = useCallback((label: string, icon: string, category: string, isCustom = false) => {
    const newEvent: LifeEvent = {
      id: `evt_${Date.now()}`,
      category: category as any,
      eventType: label,
      icon,
      datePrecision: 'month_year',
      eventDate: '',
      description: '',
      importance: 'medium',
      isCustom
    };
    updateEvents([...lifeEvents, newEvent]);
    setEditingId(newEvent.id);
    setSelectedCat(null);
  }, [lifeEvents, updateEvents]);

  // Update event
  const updateEvent = useCallback((id: string, updates: Partial<LifeEvent>) => {
    updateEvents(lifeEvents.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [lifeEvents, updateEvents]);

  // Delete event
  const deleteEvent = useCallback((id: string) => {
    updateEvents(lifeEvents.filter(e => e.id !== id));
    setEditingId(null);
  }, [lifeEvents, updateEvents]);

  // Format event date for display
  const formatEventDate = useCallback((e: LifeEvent) => {
    if (!e.eventDate) return 'No date';
    const [y, m, d] = e.eventDate.split('-');
    const mon = m ? MONTHS[parseInt(m) - 1]?.slice(0, 3) : '';

    if (e.datePrecision === 'month_year' && mon) return `${mon} ${y}`;
    if ((e.datePrecision === 'exact_date' || e.datePrecision === 'exact_date_time') && mon && d) {
      return `${d} ${mon} ${y}`;
    }
    if (e.datePrecision?.includes('range') && e.endDate) {
      return `${y} → ${e.endDate.split('-')[0]}`;
    }
    return y;
  }, []);

  // Sort events chronologically
  const sortedEvents = useMemo(() => {
    return [...lifeEvents].sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return a.eventDate.localeCompare(b.eventDate);
    });
  }, [lifeEvents]);

  // Check if event is added
  const isAdded = useCallback((label: string) => {
    return lifeEvents.some(e => e.eventType === label);
  }, [lifeEvents]);

  const editingEvent = editingId ? lifeEvents.find(e => e.id === editingId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-[#D4AF37] font-medium tracking-widest mb-2">STEP 3 OF 4</p>
          <h1 className="text-3xl font-bold text-[#F5F0EB]">Life Events</h1>
          <p className="text-[#C4B8AD] mt-2 text-sm">
            Add significant events to correlate with planetary transits
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right p-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5">
            <div className={`text-sm font-bold ${accuracy > 80 ? 'text-[#2D7A5C]' : accuracy > 50 ? 'text-[#D4AF37]' : 'text-[#EF4444]'}`}>
              {accuracy > 80 ? '🔒 Pinned' : accuracy > 50 ? '⚡ Calibrating' : '🔍 Searching'}
            </div>
            <div className="text-[10px] text-[#8C7F72] mt-1">
              {lifeEvents.length} of {targetEvents} Target
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[#D4AF37]">{accuracy}%</div>
            <div className="text-xs text-[#8C7F72]">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Event Editor */}
      <AnimatePresence mode="wait">
        {editingEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#1A1F2E] border-2 border-[#D4AF37] rounded-xl overflow-hidden"
          >
            {/* Editor Header */}
            <div className="bg-[#D4AF37]/10 px-6 py-4 flex items-center justify-between border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{editingEvent.icon}</span>
                <div>
                  {editingEvent.isCustom ? (
                    <input
                      type="text"
                      value={editingEvent.eventType}
                      onChange={(e) => updateEvent(editingEvent.id, { eventType: e.target.value })}
                      className="bg-transparent text-xl font-semibold text-[#F5F0EB] border-b border-[#D4AF37]/50 focus:border-[#D4AF37] outline-none w-full min-w-[200px]"
                      placeholder="Enter Event Name"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold text-[#F5F0EB]">{editingEvent.eventType}</h2>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(null)}
                  disabled={!editingEvent.description}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                    editingEvent.description
                      ? 'bg-[#2D7A5C] text-white hover:bg-[#3D9A73]'
                      : 'bg-[#2D7A5C]/30 text-white/50 cursor-not-allowed'
                  }`}
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => deleteEvent(editingEvent.id)}
                  className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg hover:bg-[#EF4444]/10"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="p-6 space-y-6">
              {/* Date Precision */}
              <FormField label="When did this happen?">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {DATE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateEvent(editingEvent.id, { datePrecision: opt.value })}
                      className={`py-3 px-2 rounded-lg text-center transition-all border-2 ${
                        editingEvent.datePrecision === opt.value
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5F0EB]'
                          : 'bg-[#0F1419] border-transparent text-[#C4B8AD] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="font-medium text-xs">{opt.label}</div>
                      <div className="text-[10px] mt-1 opacity-60">{opt.desc}</div>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {IMPORTANCE_OPTIONS.map((opt) => {
                    const isSelected = editingEvent.importance === opt.level;
                    return (
                      <button
                        key={opt.level}
                        onClick={() => updateEvent(editingEvent.id, { importance: opt.level })}
                        className={`p-4 rounded-xl text-left transition-all border-2 ${
                          isSelected
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37]'
                            : 'bg-[#0F1419] border-transparent hover:border-[#D4AF37]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{opt.icon}</span>
                          <span className={`font-semibold text-sm ${isSelected ? 'text-[#F5F0EB]' : 'text-[#C4B8AD]'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-[#D4AF37]' : 'text-[#8C7F72]'}`}>
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
                  placeholder="What happened? How did you feel? Any memorable circumstances..."
                  className={`w-full h-[100px] p-4 bg-[#0F1419] border rounded-lg text-[#F5F0EB] placeholder-[#5A6475] resize-none focus:ring-2 outline-none transition-all ${
                    editingEvent.description ? 'border-[#2D7A5C]/50' : 'border-[#EF4444]/50'
                  }`}
                />
                <div className="flex items-center gap-2 mt-2 text-xs text-[#2D7A5C]">
                  <span>🔒</span><span>End-to-end encrypted</span>
                </div>
              </FormField>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Events Section */}
      {!editingId && (
        <FormCard>
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EVENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedCat === cat.id
                    ? 'bg-[#D4AF37] text-[#0A0F1C] font-medium'
                    : 'bg-[#0F1419] text-[#C4B8AD] hover:bg-[#1A1F2E]'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Category Events */}
          <AnimatePresence>
            {selectedCat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-[#0F1419] rounded-lg"
              >
                <p className="text-xs text-[#8C7F72] mb-3">
                  {EVENT_CATEGORIES.find(c => c.id === selectedCat)?.icon} Events:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EVENT_CATEGORIES.find(c => c.id === selectedCat)?.events.map(evt => (
                    <button
                      key={evt.id}
                      onClick={() => addEvent(evt.label, EVENT_CATEGORIES.find(c => c.id === selectedCat)?.icon || '📅', selectedCat)}
                      className="px-3 py-2 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-sm text-[#C4B8AD] hover:border-[#D4AF37]/50 hover:text-[#F5F0EB] transition-all"
                    >
                      + {evt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => addEvent("Custom Event", EVENT_CATEGORIES.find(c => c.id === selectedCat)?.icon || '📅', selectedCat, true)}
                    className="px-3 py-2 bg-[#0F1419] border border-[#D4AF37] border-dashed rounded-lg text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 font-medium"
                  >
                    + Custom
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* High-Impact Events */}
          <div>
            <h4 className="text-xs font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
              <span>🎯</span> High-Impact Events
              <span className="text-[#8C7F72] font-normal">(recommended for accuracy)</span>
            </h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {BTR_EVENTS.map((evt, i) => {
                const added = isAdded(evt.label);
                return (
                  <button
                    key={i}
                    onClick={() => !added && addEvent(evt.label, evt.icon, evt.cat)}
                    disabled={added}
                    className={`p-3 rounded-lg text-center transition-all border ${
                      added
                        ? 'bg-[#2D7A5C]/10 border-[#2D7A5C]/30 cursor-default'
                        : 'bg-[#0F1419] border-transparent hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <div className="text-xl">{evt.icon}</div>
                    <div className="text-[10px] text-[#C4B8AD] mt-1 line-clamp-2 leading-tight h-[24px] flex items-center justify-center">
                      {evt.label}
                    </div>
                    {!added && <div className="text-[9px] text-[#D4AF37]">+{evt.boost}%</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </FormCard>
      )}

      {/* Timeline */}
      {sortedEvents.length > 0 && (
        <FormCard>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-[#F5F0EB]">📜 Your Journey Timeline</h3>
            <span className="text-xs text-[#8C7F72]">{sortedEvents.length} events</span>
          </div>
          <div className="divide-y divide-[#2A3442]">
            {sortedEvents.map((event) => (
              <motion.div
                key={event.id}
                onClick={() => setEditingId(event.id)}
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#0F1419] transition-colors rounded-lg"
                whileHover={{ x: 4 }}
              >
                <span className="text-2xl">{event.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[#F5F0EB] font-medium">{event.eventType}</div>
                    {event.importance && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.importance === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                        event.importance === 'high' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                        event.importance === 'medium' ? 'bg-[#2D7A5C]/20 text-[#2D7A5C]' :
                        'bg-[#5A6475]/20 text-[#5A6475]'
                      }`}>
                        {IMPORTANCE_OPTIONS.find(i => i.level === event.importance)?.icon}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#D4AF37]">{formatEventDate(event)}</div>
                  {event.description && (
                    <p className="text-sm text-[#C4B8AD] line-clamp-1 mt-1">{event.description}</p>
                  )}
                </div>
                {event.description ? (
                  <span className="text-[#2D7A5C]">✓</span>
                ) : (
                  <span className="px-2 py-1 bg-[#EF4444]/10 text-[#EF4444] text-xs rounded-full">Add details</span>
                )}
              </motion.div>
            ))}
          </div>
        </FormCard>
      )}

      {/* Empty State */}
      {sortedEvents.length === 0 && !editingId && (
        <div className="bg-[#1A1F2E] rounded-xl border border-[#2A3442] p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">Your timeline starts here</h3>
          <p className="text-[#8C7F72]">Select a category above to add your first event</p>
        </div>
      )}
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

  const handleDateChange = (part: 'y' | 'm' | 'd', value: string) => {
    const newY = part === 'y' ? value : (y || CURRENT_YEAR.toString());
    const newM = part === 'm' ? value.padStart(2, '0') : (m || '01');
    const newD = part === 'd' ? value.padStart(2, '0') : (d || '01');
    onUpdate({ eventDate: `${newY}-${newM}-${newD}` });
  };

  if (precision === 'year_range') {
    return (
      <div className="flex items-center gap-3 bg-[#0F1419] p-4 rounded-lg">
        <select
          value={y || ''}
          onChange={(e) => onUpdate({ eventDate: e.target.value })}
          className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
        >
          <option value="">Start Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
        <span className="text-[#D4AF37] text-xl">→</span>
        <select
          value={event.endDate || ''}
          onChange={(e) => onUpdate({ endDate: e.target.value })}
          className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
        >
          <option value="">End Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
    );
  }

  if (precision === 'month_year') {
    return (
      <div className="flex gap-3 bg-[#0F1419] p-4 rounded-lg">
        <select
          value={m || ''}
          onChange={(e) => handleDateChange('m', e.target.value)}
          className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none flex-1 focus:border-[#D4AF37]"
        >
          <option value="">Month</option>
          {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
        </select>
        <select
          value={y || ''}
          onChange={(e) => handleDateChange('y', e.target.value)}
          className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
        >
          <option value="">Year</option>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
    );
  }

  // Default: exact date
  return (
    <div className="flex gap-3 bg-[#0F1419] p-4 rounded-lg">
      <select
        value={d || ''}
        onChange={(e) => handleDateChange('d', e.target.value)}
        className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
      >
        <option value="">Day</option>
        {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
      </select>
      <select
        value={m || ''}
        onChange={(e) => handleDateChange('m', e.target.value)}
        className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none flex-1 focus:border-[#D4AF37]"
      >
        <option value="">Month</option>
        {MONTHS.map((mon, i) => <option key={mon} value={(i + 1).toString()}>{mon}</option>)}
      </select>
      <select
        value={y || ''}
        onChange={(e) => handleDateChange('y', e.target.value)}
        className="h-[48px] px-4 bg-[#1A1F2E] border border-[#2A3442] rounded-lg text-[#F5F0EB] outline-none focus:border-[#D4AF37]"
      >
        <option value="">Year</option>
        {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}
