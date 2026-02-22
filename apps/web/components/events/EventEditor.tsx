/**
 * EventEditor Component
 * Inline editing for events with category reassignment
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, Save, Trash2, AlertCircle } from 'lucide-react';
import { EventCategory, EventTemplate, EventImportance } from '@/lib/events/types';
import { validateCustomEvent, getImportanceLabel } from '@/lib/events/utils';

interface EventEditorProps {
  event: EventTemplate & { categoryId: string };
  categories: EventCategory[];
  onSave: (updates: {
    label?: string;
    categoryId?: string;
    importance?: EventImportance;
  }) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function EventEditor({
  event,
  categories,
  onSave,
  onDelete,
  onCancel,
}: EventEditorProps) {
  const [label, setLabel] = useState(event.label);
  const [categoryId, setCategoryId] = useState(event.categoryId);
  const [importance, setImportance] = useState<EventImportance>(event.importance);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentCategory = categories.find((c) => c.id === categoryId);

  const handleSave = useCallback(() => {
    setError(null);

    const validation = validateCustomEvent(label, categoryId);
    if (!validation.valid) {
      setError(validation.error || 'Invalid input');
      return;
    }

    const updates: {
      label?: string;
      categoryId?: string;
      importance?: EventImportance;
    } = {};

    if (label !== event.label) updates.label = label.trim();
    if (categoryId !== event.categoryId) updates.categoryId = categoryId;
    if (importance !== event.importance) updates.importance = importance;

    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    onSave(updates);
  }, [label, categoryId, importance, event, onSave, onCancel]);

  const handleDelete = useCallback(() => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    onDelete();
  }, [showDeleteConfirm, onDelete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#FDF8F3] border-2 border-[#B8860B]/30 rounded-xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-[#B8860B]" />
          <span className="font-medium text-[#1A1612]">Edit Event</span>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full hover:bg-[#F5EFE7] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-[#7A756F]" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-[#C65D3B]/10 border border-[#C65D3B]/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#C65D3B] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#C65D3B]">{error}</p>
        </div>
      )}

      {/* Event Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#7A756F]">Event Name</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] focus:border-[#B8860B] outline-none transition-colors"
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#7A756F]">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] focus:border-[#B8860B] outline-none cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Importance */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#7A756F]">Importance</label>
        <div className="flex flex-wrap gap-2">
          {(['critical', 'high', 'medium', 'low'] as EventImportance[]).map((imp) => (
            <button
              key={imp}
              onClick={() => setImportance(imp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                importance === imp
                  ? 'bg-[#B8860B] text-white'
                  : 'bg-white text-[#7A756F] border border-[#E8E0D5] hover:border-[#B8860B]/30'
              }`}
            >
              {getImportanceLabel(imp)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 h-10 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-medium rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>

        {!showDeleteConfirm ? (
          <button
            onClick={handleDelete}
            className="h-10 px-4 border-2 border-[#C65D3B]/30 text-[#C65D3B] rounded-lg hover:bg-[#C65D3B]/10 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="h-10 px-3 text-xs text-[#7A756F] hover:text-[#4A453F]"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="h-10 px-4 bg-[#C65D3B] text-white text-sm font-medium rounded-lg hover:bg-[#B54A2C] transition-all"
            >
              Confirm Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
