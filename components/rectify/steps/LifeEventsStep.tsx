'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Tag,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Heart,
  Baby,
  Users,
  Stethoscope,
  Landmark,
  Plane,
  Target
} from 'lucide-react';
import { LifeEvent, EventCategory } from '../../../lib/types';
import { EVENT_TYPES } from '../../../lib/types';

interface LifeEventsStepProps {
  lifeEvents: LifeEvent[];
  setLifeEvents: (events: LifeEvent[]) => void;
  onContinue: () => void;
}

const CATEGORY_CONFIG: Record<EventCategory, { icon: React.ComponentType<any>; color: string; emoji: string }> = {
  education: { icon: GraduationCap, color: 'blue-400', emoji: '📚' },
  career: { icon: Briefcase, color: 'green-400', emoji: '💼' },
  marriage: { icon: Heart, color: 'pink-400', emoji: '💍' },
  children: { icon: Baby, color: 'purple-400', emoji: '👶' },
  family: { icon: Users, color: 'orange-400', emoji: '👨‍👩‍👧' },
  health: { icon: Stethoscope, color: 'red-400', emoji: '🏥' },
  financial: { icon: Landmark, color: 'yellow-400', emoji: '💰' },
  travel: { icon: Plane, color: 'cyan-400', emoji: '✈️' },
  spiritual: { icon: Target, color: 'indigo-400', emoji: '🕉️' },
  other: { icon: Target, color: 'gray-400', emoji: '📌' }
};

interface FormErrors {
  category?: string;
  eventType?: string;
  eventDate?: string;
  description?: string;
}

export default function LifeEventsStep({ lifeEvents, setLifeEvents, onContinue }: LifeEventsStepProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LifeEvent>>({
    category: 'education',
    eventType: '',
    eventDate: '',
    eventTime: '',
    dateAccuracy: 'exact',
    description: '',
    importance: 'medium'
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setFormData({
      category: 'education',
      eventType: '',
      eventDate: '',
      eventTime: '',
      dateAccuracy: 'exact',
      description: '',
      importance: 'medium'
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.description) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addEvent = () => {
    if (!validateForm()) return;

    const newEvent: LifeEvent = {
      id: Date.now().toString(),
      category: formData.category!,
      eventType: formData.eventType!,
      eventDate: formData.eventDate!,
      eventTime: formData.eventTime,
      dateAccuracy: formData.dateAccuracy!,
      description: formData.description!,
      importance: formData.importance!
    };

    setLifeEvents([...lifeEvents, newEvent]);
    setIsAdding(false);
    resetForm();
  };

  const updateEvent = () => {
    if (!validateForm() || !editingId) return;

    const updatedEvents = lifeEvents.map(event =>
      event.id === editingId
        ? { ...event, ...formData }
        : event
    );

    setLifeEvents(updatedEvents);
    setEditingId(null);
    resetForm();
  };

  const deleteEvent = (id: string) => {
    setLifeEvents(lifeEvents.filter(event => event.id !== id));
  };

  const startEdit = (event: LifeEvent) => {
    setFormData(event);
    setEditingId(event.id);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const handleCategoryChange = (category: EventCategory) => {
    setFormData({
      ...formData,
      category,
      eventType: EVENT_TYPES[category][0] // Set first event type as default
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Life Events</h2>
        <p className="text-gray-300">Add at least 3 significant life events to help with birth time rectification</p>
        <p className="text-sm text-blue-400 mt-2">Added: {lifeEvents.length} events</p>
      </motion.div>

      <AnimatePresence>
        {lifeEvents.map((event, index) => {
          const config = CATEGORY_CONFIG[event.category];
          const IconComponent = config.icon;

          return (
            <motion.div
              key={event.id}
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg bg-${config.color}/20`}>
                    <IconComponent className={`w-5 h-5 text-${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.emoji}</span>
                      <h3 className="font-medium text-white">{event.eventType}</h3>
                      <span className={`px-2 py-1 rounded text-xs bg-${config.color}/20 text-${config.color}`}>
                        {event.category}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.eventDate).toLocaleDateString()}
                      </span>
                      {event.eventTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.eventTime}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs bg-slate-600`}>
                        {event.importance}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => startEdit(event)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => deleteEvent(event.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-4"
          >
            <h3 className="text-lg font-medium text-white mb-4">
              {editingId ? 'Edit Event' : 'Add New Event'}
            </h3>

            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Tag className="w-4 h-4" />
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category as EventCategory)}
                      className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                        formData.category === category
                          ? `bg-${config.color}/20 border-${config.color} text-white`
                          : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm">{category}</span>
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Event Type */}
            {formData.category && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <Tag className="w-4 h-4" />
                  Event Type *
                </label>
                <select
                  value={formData.eventType || ''}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES[formData.category].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.eventType && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.eventType}
                  </p>
                )}
              </div>
            )}

            {/* Event Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="w-4 h-4" />
                Event Date *
              </label>
              <input
                type="date"
                value={formData.eventDate || ''}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
              {errors.eventDate && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.eventDate}
                </p>
              )}
            </div>

            {/* Event Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="w-4 h-4" />
                Event Time (Optional)
              </label>
              <input
                type="time"
                value={formData.eventTime || ''}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Date Accuracy */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Date Accuracy</label>
              <div className="flex gap-2">
                {(['exact', 'approximate', 'rough'] as const).map(accuracy => (
                  <button
                    key={accuracy}
                    onClick={() => setFormData({ ...formData, dateAccuracy: accuracy })}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      formData.dateAccuracy === accuracy
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {accuracy}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Description *</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened in this event"
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
              {errors.description && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Importance */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Importance</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(importance => (
                  <button
                    key={importance}
                    onClick={() => setFormData({ ...formData, importance })}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      formData.importance === importance
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {importance}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                onClick={editingId ? updateEvent : addEvent}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                {editingId ? 'Update Event' : 'Add Event'}
              </motion.button>
              <motion.button
                onClick={cancelEdit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <motion.div variants={itemVariants} className="text-center">
          <motion.button
            onClick={() => setIsAdding(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Life Event
          </motion.button>
        </motion.div>
      )}

      {/* Continue Button */}
      {lifeEvents.length >= 3 && (
        <motion.div variants={itemVariants} className="pt-6">
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue to Physical Traits
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
