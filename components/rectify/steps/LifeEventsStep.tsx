'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';
import type { LifeEvent } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface LifeEventsStepProps {
  lifeEvents: LifeEvent[];
  setLifeEvents: (events: LifeEvent[]) => void;
}

const EVENT_CATEGORIES = [
  { id: 'education', emoji: '📚', label: 'Education' },
  { id: 'career', emoji: '💼', label: 'Career' },
  { id: 'marriage', emoji: '💍', label: 'Marriage' },
  { id: 'children', emoji: '👶', label: 'Children' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Family' },
  { id: 'health', emoji: '🏥', label: 'Health' },
  { id: 'financial', emoji: '💰', label: 'Financial' },
  { id: 'travel', emoji: '✈️', label: 'Travel' },
];

const EVENT_TYPES: Record<string, string[]> = {
  education: ['School Completion', 'College Admission', 'Degree Completion', 'Exam Success'],
  career: ['First Job', 'Job Change', 'Promotion', 'Business Start', 'Job Loss'],
  marriage: ['Marriage', 'Engagement', 'Divorce'],
  children: ['First Child Birth', 'Second Child Birth', 'Third Child Birth'],
  family: ['Father\'s Death', 'Mother\'s Death', 'Sibling\'s Death'],
  health: ['Major Illness', 'Surgery', 'Accident/Injury'],
  financial: ['Property Purchase', 'Investment', 'Financial Loss'],
  travel: ['Foreign Trip', 'Settlement Abroad', 'Relocation'],
};

export default function LifeEventsStep({ lifeEvents, setLifeEvents }: LifeEventsStepProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({});
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const handleAddEvent = () => {
    if (!newEvent.eventType || !newEvent.eventDate) {
      alert('Please fill all required fields');
      return;
    }

    const event: LifeEvent = {
      id: uuidv4(),
      category: selectedCategory as any,
      eventType: newEvent.eventType,
      eventDate: newEvent.eventDate,
      dateAccuracy: newEvent.dateAccuracy || 'exact',
      description: newEvent.description || '',
      importance: newEvent.importance || 'medium',
    };

    setLifeEvents([...lifeEvents, event]);
    setNewEvent({});
    setSelectedCategory(null);
    setIsAddingEvent(false);
  };

  const handleDeleteEvent = (id: string) => {
    setLifeEvents(lifeEvents.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Step Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="text-5xl mb-4">📌</div>
        <h2 className="text-3xl font-bold text-[#F7F9FC] mb-2">Life Events</h2>
        <p className="text-[#A8B3C5] text-lg">
          Add major events from your life. More events = more accurate rectification.
        </p>
      </motion.div>

      {/* Explanation Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-xl p-6"
      >
        <h3 className="font-semibold text-[#F5A623] mb-3 flex items-center gap-2">
          <span>🎯</span> HOW THIS WORKS
        </h3>
        <p className="text-sm text-[#A8B3C5] leading-relaxed mb-3">
          Every major event happens during a specific planetary period. By matching events with their expected timing patterns, we pinpoint your exact birth moment.
        </p>
        <div className="text-sm text-[#A8B3C5]">
          <div className="font-semibold text-[#F5A623] mb-2">⭐ BEST EVENTS TO ADD:</div>
          <ul className="space-y-1 text-xs">
            <li>✓ Marriage date (most reliable!)</li>
            <li>✓ First job or major promotion</li>
            <li>✓ Children's birth dates</li>
            <li>✓ Major illness or surgery</li>
            <li>✓ Parent's death (if applicable)</li>
          </ul>
        </div>
      </motion.div>

      {/* Event Counter */}
      {lifeEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#242B35] border border-[#2D3542] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#F7F9FC]">
              Events Added: {lifeEvents.length}/3 minimum
            </span>
            <span className="text-sm text-[#6B7A90]">
              {lifeEvents.length >= 3 ? '✓ Ready to submit' : `Add ${3 - lifeEvents.length} more`}
            </span>
          </div>
          <div className="w-full bg-[#1A1F26] h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#F5A623] to-[#E09000]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((lifeEvents.length / 5) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}

      {/* Category Selection */}
      {!isAddingEvent ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1F26] border border-[#2D3542] rounded-2xl p-8"
        >
          <h3 className="text-sm font-semibold text-[#F7F9FC] mb-4">Select Event Category</h3>
          <div className="grid grid-cols-4 gap-3">
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setIsAddingEvent(true);
                }}
                className="p-3 rounded-lg border-2 border-[#3D4654] bg-[#242B35] hover:border-[#F5A623] transition-all"
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-xs font-medium text-[#F7F9FC]">{cat.label}</div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Add Event Form */}
      <AnimatePresence>
        {isAddingEvent && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#1A1F26] border border-[#2D3542] rounded-2xl p-8 space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#F7F9FC]">
                Add {EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label} Event
              </h3>
              <button
                onClick={() => {
                  setIsAddingEvent(false);
                  setSelectedCategory(null);
                  setNewEvent({});
                }}
                className="text-[#6B7A90] hover:text-[#F7F9FC]"
              >
                ✕
              </button>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">What happened?</label>
              <select
                value={newEvent.eventType || ''}
                onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              >
                <option value="">Select event type</option>
                {EVENT_TYPES[selectedCategory || 'education']?.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">When did this happen?</label>
              <input
                type="date"
                value={newEvent.eventDate || ''}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                className="w-full h-12 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] focus:border-[#F5A623] focus:outline-none"
              />
            </div>

            {/* Date Accuracy */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">Date accuracy:</label>
              <div className="flex gap-2">
                {['exact', 'month', 'year', 'approximate'].map((acc) => (
                  <button
                    key={acc}
                    onClick={() => setNewEvent({ ...newEvent, dateAccuracy: acc as any })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      newEvent.dateAccuracy === acc
                        ? 'bg-[#F5A623] text-[#0F1419]'
                        : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
                    }`}
                  >
                    {acc === 'exact' && 'Exact'}
                    {acc === 'month' && 'Month'}
                    {acc === 'year' && 'Year'}
                    {acc === 'approximate' && 'Approx'}
                  </button>
                ))}
              </div>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">How significant was this?</label>
              <div className="flex gap-2">
                {(['critical', 'high', 'medium', 'low'] as const).map((imp) => (
                  <button
                    key={imp}
                    onClick={() => setNewEvent({ ...newEvent, importance: imp })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      newEvent.importance === imp
                        ? 'bg-[#F5A623] text-[#0F1419]'
                        : 'bg-[#242B35] text-[#A8B3C5] border border-[#3D4654]'
                    }`}
                  >
                    {'⭐'.repeat(imp === 'critical' ? 5 : imp === 'high' ? 4 : imp === 'medium' ? 3 : 2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-[#F7F9FC] mb-2">Description (optional):</label>
              <input
                type="text"
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add any relevant details..."
                className="w-full h-10 px-4 bg-[#242B35] border border-[#3D4654] rounded-lg text-[#F7F9FC] placeholder-[#6B7A90] focus:border-[#F5A623] focus:outline-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsAddingEvent(false);
                  setSelectedCategory(null);
                  setNewEvent({});
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#3D4654] text-[#A8B3C5] hover:border-[#A8B3C5] transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-2 rounded-lg bg-[#F5A623] text-[#0F1419] hover:bg-[#E09000] transition-colors font-medium text-sm"
              >
                ✓ Add Event
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List */}
      {lifeEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-semibold text-[#F7F9FC]">Your Events ({lifeEvents.length})</h3>
          {lifeEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#1A1F26] border border-[#2D3542] rounded-lg p-4 hover:border-[#3D4654] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{EVENT_CATEGORIES.find(c => c.id === event.category)?.emoji}</span>
                    <span className="font-semibold text-[#F7F9FC]">{event.eventType}</span>
                    <span className="text-sm text-[#6B7A90]">
                      {'⭐'.repeat(event.importance === 'critical' ? 5 : event.importance === 'high' ? 4 : event.importance === 'medium' ? 3 : 2)}
                    </span>
                  </div>
                  <div className="text-xs text-[#6B7A90] mb-1">
                    {new Date(event.eventDate).toLocaleDateString()} • {event.dateAccuracy}
                  </div>
                  {event.description && (
                    <div className="text-sm text-[#A8B3C5]">"{event.description}"</div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-[#6B7A90] hover:text-[#EF4444] transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {!isAddingEvent && (
            <button
              onClick={() => setIsAddingEvent(true)}
              className="w-full py-3 rounded-lg border-2 border-dashed border-[#3D4654] text-[#A8B3C5] hover:border-[#F5A623] hover:text-[#F7F9FC] transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" /> Add Another Event
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
