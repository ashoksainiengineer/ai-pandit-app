import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField } from '@/components/ui/form/FormField';
import DateInput from '@/components/events/DateInput';
import { EventCategory, IMPORTANCE_OPTIONS } from '@/lib/events/types';
import { getCategoryById } from '@/lib/events/utils';
import { isPrecisionSatisfied } from '@/lib/date-utils';
import { LifeEvent } from '@/lib/types';
import { DatePrecision } from '../types';
import { DATE_OPTIONS } from '../constants';

interface EventEditorProps {
    editingEvent: LifeEvent;
    editingEventData: Record<string, unknown>;
    allCategories: EventCategory[];
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateEvent: (id: string, updates: Partial<LifeEvent>) => void;
    setEditingId: (id: string | null) => void;
    deleteEvent: (id: string) => void;
    updateEventDatePrecision: (id: string, precision: DatePrecision) => void;
}

export function EventEditor({
    editingEvent,
    editingEventData,
    allCategories,
    errors,
    setErrors,
    updateEvent,
    setEditingId,
    deleteEvent,
    updateEventDatePrecision
}: EventEditorProps) {
    if (!editingEvent || !editingEventData) return null;

    return (
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
                    {(() => {
                        const hasEventType = !!editingEvent.eventType?.trim();
                        const isDateSatisfied = isPrecisionSatisfied(
                            editingEvent.datePrecision as any,
                            editingEvent.eventDate,
                            editingEvent.endDate,
                            editingEvent.eventTime
                        );
                        const hasSignificance = !!editingEvent.importance;
                        const hasDescription = !!editingEvent.description?.trim() && editingEvent.description.trim().length >= 10;
                        const isFormComplete = hasEventType && isDateSatisfied && hasSignificance && hasDescription;

                        return (
                            <button
                                onClick={() => setEditingId(null)}
                                disabled={!isFormComplete}
                                className={`px-4 py-2 font-semibold rounded-lg text-sm transition-colors ${isFormComplete
                                    ? 'bg-[#184131] text-white hover:bg-[#236B4F]'
                                    : 'bg-[#184131]/30 text-white/50 cursor-not-allowed'
                                    }`}
                                title={!isFormComplete ? 'Please fill all required fields' : 'Save event'}
                            >
                                ✓ Save
                            </button>
                        );
                    })()}
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
                {editingEvent.isCustom && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Event Name" required>
                            <input
                                type="text"
                                value={editingEvent.eventType}
                                onChange={(e) => updateEvent(editingEvent.id, { eventType: e.target.value })}
                                className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all"
                                placeholder="e.g. Graduation"
                            />
                        </FormField>

                        <FormField label="Category">
                            <select
                                value={editingEvent.category}
                                onChange={(e) => updateEvent(editingEvent.id, { category: e.target.value as any })}
                                className="w-full h-11 px-4 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none cursor-pointer appearance-none"
                            >
                                {allCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                )}

                <FormField label="When did this happen?">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {DATE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateEventDatePrecision(editingEvent.id, opt.value)}
                                className={`py-3 px-2 rounded-lg text-center transition-all border ${editingEvent.datePrecision === opt.value
                                    ? 'bg-[#B8860B] text-white border-[#B8860B] shadow-md'
                                    : 'bg-white border-[#E8E0D5] text-[#4A453F] hover:border-[#78611D] hover:bg-[#FDF8F3]'
                                    }`}
                            >
                                <div className="font-semibold text-[10px] leading-tight">{opt.label}</div>
                                <div className={`text-[9px] mt-1 ${editingEvent.datePrecision === opt.value ? 'text-white/80' : 'text-[#7A756F]'}`}>{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </FormField>

                <DateInput
                    precision={editingEvent.datePrecision as import('@/lib/date-utils').DatePrecision}
                    eventDate={editingEvent.eventDate}
                    endDate={editingEvent.endDate}
                    eventTime={editingEvent.eventTime}
                    onUpdate={(updates) => updateEvent(editingEvent.id, updates)}
                />

                <FormField label="How significant was this event?" required>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {IMPORTANCE_OPTIONS.map((opt) => {
                            const isSelected = editingEvent.importance === opt.level;
                            return (
                                <button
                                    key={opt.level}
                                    onClick={() => updateEvent(editingEvent.id, { importance: opt.level as any })}
                                    className={`p-3 rounded-lg text-left transition-all border ${isSelected
                                        ? 'bg-[#B8860B]/10 border-[#B8860B]'
                                        : 'bg-white border-[#E8E0D5] hover:border-[#78611D]/50'
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

                <FormField
                    label="Describe your experience"
                    required
                    error={errors.description}
                >
                    <textarea
                        value={editingEvent.description || ''}
                        onChange={(e) => {
                            updateEvent(editingEvent.id, { description: e.target.value });
                            if (errors.description) {
                                setErrors(prev => ({ ...prev, description: '' }));
                            }
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                        }}
                        placeholder="What happened? How did you feel?..."
                        className={`w-full h-24 p-4 bg-white border-2 rounded-lg text-sm text-[#1A1612] placeholder-[#A8A39D] resize-none focus:ring-2 outline-none transition-all ${editingEvent.description && editingEvent.description.length >= 10
                            ? 'border-[#184131]/50 focus:border-[#184131]'
                            : 'border-[#C65D3B]/50 focus:border-[#C65D3B]'
                            }`}
                    />
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-[10px] text-[#184131]">
                            <span>🔒</span>
                            <span>End-to-end encrypted</span>
                        </div>
                        <div className={`text-[10px] ${(editingEvent.description?.length || 0) < 10 ? 'text-[#C65D3B]' : 'text-[#7A756F]'}`}>
                            {editingEvent.description?.length || 0} / 1000 chars (min 10)
                        </div>
                    </div>
                </FormField>
            </div>
        </motion.div>
    );
}
