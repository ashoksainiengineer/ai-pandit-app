/**
 * CustomEventModal Component
 * Modal for creating custom events and categories
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { EventCategory, EventImportance } from '@/lib/events/types';
import { validateCustomEvent, getImportanceLabel, getImportanceColor } from '@/lib/events/utils';

interface CustomEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: EventCategory[];
  preselectedCategoryId?: string;
  onCreateEvent: (event: {
    label: string;
    categoryId: string;
    importance: EventImportance;
    isNewCategory: boolean;
    newCategoryName?: string;
  }) => void;
}

const IMPORTANCE_OPTIONS: { value: EventImportance; label: string; description: string }[] = [
  {
    value: 'critical',
    label: '⚡ Critical',
    description: 'Life-transforming events (marriage, birth, near-death)',
  },
  {
    value: 'high',
    label: '⭐ High',
    description: 'Major milestones (job change, property purchase)',
  },
  {
    value: 'medium',
    label: '● Medium',
    description: 'Notable events (education, travel)',
  },
  {
    value: 'low',
    label: '○ Low',
    description: 'Minor occurrences',
  },
];

export default function CustomEventModal({
  isOpen,
  onClose,
  categories,
  preselectedCategoryId,
  onCreateEvent,
}: CustomEventModalProps) {
  const [eventName, setEventName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [importance, setImportance] = useState<EventImportance>('medium');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set preselected category when modal opens
  useEffect(() => {
    if (isOpen && preselectedCategoryId) {
      setSelectedCategory(preselectedCategoryId);
      setIsCreatingCategory(false);
    }
    // Reset when modal closes
    if (!isOpen) {
      setSelectedCategory('');
      setIsCreatingCategory(false);
    }
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setEventName('');
    setSelectedCategory('');
    setImportance('medium');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      // Validate event name
      const categoryId = isCreatingCategory ? 'custom' : selectedCategory;
      const validation = validateCustomEvent(eventName, categoryId);

      if (!validation.valid) {
        setError(validation.error || 'Invalid input');
        return;
      }

      // Validate new category if creating
      if (isCreatingCategory) {
        if (!newCategoryName.trim() || newCategoryName.length < 2) {
          setError('Category name must be at least 2 characters');
          return;
        }
      }

      setIsSubmitting(true);

      try {
        onCreateEvent({
          label: eventName.trim(),
          categoryId: isCreatingCategory ? 'custom' : selectedCategory,
          importance,
          isNewCategory: isCreatingCategory,
          newCategoryName: isCreatingCategory ? newCategoryName.trim() : undefined,
        });

        handleClose();
      } catch (err) {
        setError('Failed to create event. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      eventName,
      selectedCategory,
      importance,
      isCreatingCategory,
      newCategoryName,
      onCreateEvent,
      handleClose,
    ]
  );

  const emojiOptions = [
    '📌', '💫', '✨', '🌟', '⭐', '🔥', '❤️', '💙', '💚', '💛', '💜', '🧡',
    '🎉', '🎊', '🎁', '🎈', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️',
    '🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🌼', '🍀', '🌿', '🌱', '🌲', '🌳',
    '🦋', '🐛', '🐝', '🐞', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🐊', '🐉',
    '🔮', '💎', '💍', '👑', '🎩', '👒', '🎓', '👔', '👗', '👘', '👠', '👟',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Modal - Perfect Size */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header - Compact */}
            <div className="p-4 border-b border-[#E8E0D5] flex items-center justify-between bg-gradient-to-r from-[#FDF8F3] to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#B8860B]/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#B8860B]" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#1A1612] text-base">Create Custom Event</h2>
                  <p className="text-xs text-[#7A756F]">
                    Add custom life events
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full hover:bg-[#F5EFE7] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#7A756F]" />
              </button>
            </div>

            {/* Form - Compact spacing */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#C65D3B]/10 border border-[#C65D3B]/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-[#C65D3B] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#C65D3B]">{error}</p>
                </motion.div>
              )}

              {/* Event Name - Compact */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A1612]">
                  Event Name <span className="text-[#C65D3B]">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Started Learning Guitar"
                  className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1A1612] placeholder-[#A8A39D] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all"
                  autoFocus
                />
                <p className="text-xs text-[#7A756F]">
                  Clear description helps BTR accuracy
                </p>
              </div>

              {/* Category Selection - Compact */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1612]">
                    Category <span className="text-[#C65D3B]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                    className="text-xs text-[#B8860B] hover:underline flex items-center gap-1"
                  >
                    {isCreatingCategory ? (
                      '← Select Existing'
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Create New Category
                      </>
                    )}
                  </button>
                </div>

                {isCreatingCategory ? (
                  <div className="space-y-2 p-3 bg-[#F5EFE7] rounded-xl">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name (e.g., Hobbies)"
                      className="w-full h-9 px-3 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1A1612] placeholder-[#A8A39D] focus:border-[#B8860B] outline-none"
                    />
                    <div>
                      <label className="text-xs text-[#7A756F] mb-1.5 block">
                        Choose Icon
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewCategoryIcon(emoji)}
                            className={`w-8 h-8 text-lg rounded-md transition-all ${
                              newCategoryIcon === emoji
                                ? 'bg-[#B8860B] text-white'
                                : 'bg-white hover:bg-[#E8E0D5]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1A1612] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select a category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Importance Selection - Compact */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1612]">
                  Event Importance <span className="text-[#C65D3B]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {IMPORTANCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setImportance(option.value)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        importance === option.value
                          ? 'bg-[#B8860B]/10 border-[#B8860B]'
                          : 'bg-white border-[#E8E0D5] hover:border-[#D4A853]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            importance === option.value
                              ? 'border-[#B8860B] bg-[#B8860B]'
                              : 'border-[#A8A39D]'
                          }`}
                        >
                          {importance === option.value && (
                            <span className="text-white text-[10px]">✓</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`font-medium text-xs ${
                              importance === option.value
                                ? 'text-[#1A1612]'
                                : 'text-[#4A453F]'
                            }`}
                          >
                            {option.label}
                          </div>
                          <div
                            className={`text-[10px] leading-tight ${
                              importance === option.value
                                ? 'text-[#B8860B]'
                                : 'text-[#7A756F]'
                            }`}
                          >
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips - Compact */}
              <div className="p-3 bg-[#2D7A5C]/5 border border-[#2D7A5C]/20 rounded-lg">
                <p className="text-xs text-[#2D7A5C]">
                  <strong>💡</strong> Critical events provide highest BTR accuracy
                </p>
              </div>
            </form>

            {/* Footer - Compact */}
            <div className="p-4 border-t border-[#E8E0D5] bg-[#FDF8F3] flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-10 border-2 border-[#E8E0D5] text-[#4A453F] font-medium rounded-lg hover:border-[#B8860B]/30 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !eventName.trim() ||
                  (!isCreatingCategory && !selectedCategory) ||
                  (isCreatingCategory && !newCategoryName.trim())
                }
                className="flex-1 h-10 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Event</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
