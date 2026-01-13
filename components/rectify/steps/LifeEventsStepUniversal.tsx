'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Calendar, Clock, Star, ChevronDown, ChevronUp, Edit3, Save, X, TrendingUp, Award, Target } from 'lucide-react';
import type { LifeEvent, EventCategory } from '@/types';
import { EVENT_TYPES } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import StandardizedDateInput from '../StandardizedDateInput';
import EnhancedDateTimeInput from '../EnhancedDateTimeInput';
import { calculateProgress, getProgressColor, getProgressMessage } from '@/lib/progressCalculator';

interface LifeEventsStepUniversalProps {
  lifeEvents: LifeEvent[];
  setLifeEvents: (events: LifeEvent[]) => void;
  birthYear?: number; // User's birth year for age-appropriate suggestions
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'; // User's marital status
  overallProgress?: number; // Overall progress percentage from parent
}

// Enhanced event categories with age-appropriate examples
const ENHANCED_EVENT_CATEGORIES = [
  { 
    id: 'education', 
    emoji: '📚', 
    label: 'Education',
    examples: {
      '5-12': ['Started school', 'Changed schools', 'Won competition'],
      '13-18': ['High school graduation', 'Exam success', 'College admission'],
      '19-25': ['University graduation', 'Study abroad', 'Degree completion'],
      '26-40': ['Professional certification', 'Master\'s degree', 'Training program'],
      '40+': ['Professional development', 'Skill certification', 'Online course']
    }
  },
  { 
    id: 'career', 
    emoji: '💼', 
    label: 'Career',
    examples: {
      '16-20': ['First part-time job', 'Internship', 'Started freelancing'],
      '21-30': ['First full-time job', 'Job promotion', 'Career change'],
      '31-45': ['Business started', 'Major promotion', 'Partnership'],
      '46-65': ['Senior position', 'Business expansion', 'Career transition'],
      '65+': ['Retirement', 'Consulting work', 'Mentorship started']
    }
  },
  { 
    id: 'marriage', 
    emoji: '💍', 
    label: 'Marriage & Relationships',
    examples: {
      '18-25': ['First serious relationship', 'Engagement', 'Marriage'],
      '26-35': ['Wedding ceremony', 'Anniversary', 'Relationship milestone'],
      '36-50': ['Renewal of vows', 'Silver anniversary', 'Relationship growth'],
      '50+': ['Golden anniversary', 'Companionship', 'Relationship wisdom']
    }
  },
  { 
    id: 'children', 
    emoji: '👶', 
    label: 'Children',
    examples: {
      '20-30': ['First child born', 'Second child born', 'Pregnancy'],
      '31-40': ['Child started school', 'Child\'s achievements', 'Parenting milestones'],
      '41-55': ['Child\'s graduation', 'Child\'s marriage', 'Becoming grandparent'],
      '55+': ['Grandchildren born', 'Great-grandchildren', 'Family legacy']
    }
  },
  { 
    id: 'family', 
    emoji: '👨‍👩‍👧', 
    label: 'Family',
    examples: {
      'any': ['Family reunion', 'Moved with family', 'Family celebration', 'Elder care']
    }
  },
  { 
    id: 'health', 
    emoji: '🏥', 
    label: 'Health',
    examples: {
      'any': ['Major illness', 'Surgery', 'Accident recovery', 'Health milestone']
    }
  },
  { 
    id: 'financial', 
    emoji: '💰', 
    label: 'Financial',
    examples: {
      '18-25': ['First paycheck', 'Opened bank account', 'Student loan'],
      '26-40': ['Property purchase', 'Major investment', 'Business loan'],
      '41-60': ['Retirement planning', 'Major asset purchase', 'Investment success'],
      '60+': ['Retirement funds', 'Estate planning', 'Financial legacy']
    }
  },
  { 
    id: 'travel', 
    emoji: '✈️', 
    label: 'Travel',
    examples: {
      'any': ['First foreign trip', 'Pilgrimage', 'Relocation', 'Memorable vacation']
    }
  },
  { 
    id: 'spiritual', 
    emoji: '🕉️', 
    label: 'Spiritual',
    examples: {
      'any': ['Spiritual initiation', 'Pilgrimage completed', 'Religious ceremony', 'Spiritual awakening']
    }
  },
  { 
    id: 'relationship', 
    emoji: '❤️', 
    label: 'Relationships',
    examples: {
      'any': ['Met life partner', 'Important friendship', 'Relationship healing', 'Love milestone']
    }
  }
];

// Age-appropriate event suggestions
const getAgeAppropriateExamples = (category: string, birthYear?: number): string[] => {
  if (!birthYear) return [];
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  
  const categoryData = ENHANCED_EVENT_CATEGORIES.find(cat => cat.id === category);
  if (!categoryData?.examples) return [];
  
  // Find appropriate age group
  const ageGroups = Object.keys(categoryData.examples);
  let selectedGroup = 'any';
  
  for (const group of ageGroups) {
    if (group === 'any') continue;
    const [min, max] = group.split('-').map(Number);
    if (age >= min && age <= max) {
      selectedGroup = group;
      break;
    }
  }
  
  // Type-safe access to examples
  const examples = categoryData.examples as any;
  return examples[selectedGroup] || examples['any'] || [];
};

// Smart event suggestions based on common life patterns
const getSmartSuggestions = (birthYear?: number, existingEvents: LifeEvent[] = [], maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'): Array<{
  category: EventCategory;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}> => {
  if (!birthYear) return [];
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const suggestions: Array<{category: EventCategory; suggestion: string; priority: 'high' | 'medium' | 'low'}> = [];
  
  // Age-based suggestions with marital status considerations
  if (age >= 18 && age <= 25) {
    suggestions.push(
      { category: 'education', suggestion: 'High school graduation', priority: 'high' },
      { category: 'education', suggestion: 'College/university admission', priority: 'high' },
      { category: 'career', suggestion: 'First job or internship', priority: 'high' }
    );
    
    // Marital status specific for young adults
    if (maritalStatus === 'single') {
      suggestions.push(
        { category: 'marriage', suggestion: 'First serious relationship', priority: 'medium' },
        { category: 'education', suggestion: 'Study abroad program', priority: 'medium' }
      );
    } else if (maritalStatus === 'married') {
      suggestions.push(
        { category: 'marriage', suggestion: 'Early marriage', priority: 'high' },
        { category: 'family', suggestion: 'Newlywed adjustments', priority: 'medium' }
      );
    }
  } else if (age >= 26 && age <= 35) {
    suggestions.push(
      { category: 'career', suggestion: 'First full-time job', priority: 'high' },
      { category: 'financial', suggestion: 'First major purchase', priority: 'medium' }
    );
    
    // Marital status specific for prime adult years
    if (maritalStatus === 'single') {
      suggestions.push(
        { category: 'career', suggestion: 'Career focus period', priority: 'high' },
        { category: 'travel', suggestion: 'Solo travel adventures', priority: 'medium' },
        { category: 'education', suggestion: 'Professional certification', priority: 'medium' }
      );
    } else if (maritalStatus === 'married') {
      suggestions.push(
        { category: 'marriage', suggestion: 'Wedding ceremony', priority: 'high' },
        { category: 'marriage', suggestion: 'Anniversary celebration', priority: 'medium' },
        { category: 'children', suggestion: 'Planning for children', priority: 'medium' }
      );
    } else if (maritalStatus === 'divorced') {
      suggestions.push(
        { category: 'marriage', suggestion: 'Divorce proceedings', priority: 'high' },
        { category: 'career', suggestion: 'Career restart after divorce', priority: 'high' },
        { category: 'marriage', suggestion: 'Dating after divorce', priority: 'medium' }
      );
    }
  } else if (age >= 36 && age <= 50) {
    suggestions.push(
      { category: 'career', suggestion: 'Job promotion or career change', priority: 'medium' },
      { category: 'financial', suggestion: 'Property purchase', priority: 'medium' }
    );
    
    // Marital status specific for middle age
    if (maritalStatus === 'married') {
      suggestions.push(
        { category: 'children', suggestion: 'Children born', priority: 'high' },
        { category: 'children', suggestion: 'Children\'s education milestones', priority: 'high' },
        { category: 'family', suggestion: 'Family vacation', priority: 'medium' }
      );
    } else if (maritalStatus === 'single') {
      suggestions.push(
        { category: 'career', suggestion: 'Mid-career achievements', priority: 'high' },
        { category: 'financial', suggestion: 'Investment planning', priority: 'medium' },
        { category: 'travel', suggestion: 'Adventure travel', priority: 'medium' }
      );
    } else if (maritalStatus === 'divorced' || maritalStatus === 'widowed') {
      suggestions.push(
        { category: 'marriage', suggestion: 'New relationship after loss', priority: 'medium' },
        { category: 'family', suggestion: 'Blended family adjustments', priority: 'medium' }
      );
    }
  } else if (age >= 51 && age <= 65) {
    suggestions.push(
      { category: 'career', suggestion: 'Career achievements', priority: 'medium' },
      { category: 'financial', suggestion: 'Retirement planning', priority: 'high' }
    );
    
    // Marital status specific for pre-retirement
    if (maritalStatus === 'married') {
      suggestions.push(
        { category: 'children', suggestion: 'Children\'s graduation', priority: 'high' },
        { category: 'children', suggestion: 'Children\'s marriage', priority: 'high' },
        { category: 'family', suggestion: 'Grandparenthood', priority: 'medium' }
      );
    } else if (maritalStatus === 'single') {
      suggestions.push(
        { category: 'career', suggestion: 'Senior position achievements', priority: 'medium' },
        { category: 'financial', suggestion: 'Estate planning', priority: 'medium' }
      );
    } else if (maritalStatus === 'widowed') {
      suggestions.push(
        { category: 'family', suggestion: 'Coping with loss', priority: 'high' },
        { category: 'spiritual', suggestion: 'Spiritual journey after loss', priority: 'medium' }
      );
    }
  } else if (age > 65) {
    suggestions.push(
      { category: 'career', suggestion: 'Retirement', priority: 'high' },
      { category: 'health', suggestion: 'Health milestones', priority: 'medium' }
    );
    
    // Marital status specific for senior years
    if (maritalStatus === 'married') {
      suggestions.push(
        { category: 'children', suggestion: 'Grandchildren born', priority: 'high' },
        { category: 'marriage', suggestion: 'Golden anniversary', priority: 'high' },
        { category: 'family', suggestion: 'Family legacy planning', priority: 'medium' }
      );
    } else if (maritalStatus === 'single') {
      suggestions.push(
        { category: 'spiritual', suggestion: 'Spiritual pursuits', priority: 'medium' },
        { category: 'travel', suggestion: 'Pilgrimage journeys', priority: 'medium' }
      );
    } else if (maritalStatus === 'widowed') {
      suggestions.push(
        { category: 'family', suggestion: 'Elder care and wisdom sharing', priority: 'medium' },
        { category: 'spiritual', suggestion: 'Life reflection and legacy', priority: 'medium' }
      );
    }
  }
  
  // Filter out suggestions that already exist
  const existingTypes = existingEvents.map(e => e.eventType);
  return suggestions.filter(s => !existingTypes.includes(s.suggestion));
};


// Individual event card with enhanced display
const EventCard = ({ event, onEdit, onDelete }: { 
  event: LifeEvent; 
  onEdit: (event: LifeEvent) => void; 
  onDelete: (id: string) => void; 
}) => {
  const category = ENHANCED_EVENT_CATEGORIES.find(cat => cat.id === event.category);
  const importanceStars = {
    'critical': 5,
    'high': 4,
    'medium': 3,
    'low': 2
  }[event.importance] || 3;
  
  const formatDate = (date: string, accuracy: string, time?: string) => {
    if (accuracy === 'range') {
      return date; // Already formatted as "YYYY-MM-DD to YYYY-MM-DD"
    }
    if (accuracy === 'month-range') {
      return date; // Already formatted as "YYYY-MM to YYYY-MM"
    }
    if (accuracy === 'year-range') {
      return date; // Already formatted as "YYYY to YYYY"
    }
    if (accuracy === 'year' || accuracy === 'year_only') return date;
    if (accuracy === 'approximate') return date;
    if (accuracy === 'month') {
      const [year, month] = date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    let formattedDate = new Date(date).toLocaleDateString();
    
    // Add time if available and accuracy is exact
    if (accuracy === 'exact' && time) {
      formattedDate += ` at ${time}`;
    }
    
    return formattedDate;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#241F1C] border border-[#3A3330] rounded-xl p-5 hover:border-[#8C7F72] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{category?.emoji}</span>
            <span className="font-semibold text-[#F5F0EB] text-lg">{event.eventType}</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: importanceStars }, (_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#E8A849] text-[#E8A849]" />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-[#C4B8AD] mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.eventDate, event.dateAccuracy, event.eventTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="capitalize">{event.dateAccuracy}</span>
              {event.eventTime && event.dateAccuracy === 'exact' && (
                <span className="text-[#E8A849]">• {event.eventTime}</span>
              )}
            </div>
          </div>
          
          {event.description && (
            <div className="text-[#C4B8AD] text-sm leading-relaxed mb-3">
              "{event.description}"
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(event)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#2E2724] hover:bg-[#3A3330] text-[#C4B8AD] hover:text-[#F5F0EB] rounded-lg transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#2E2724] hover:bg-[#3A3330] text-[#C4B8AD] hover:text-[#D64545] rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LifeEventsStepUniversal({ lifeEvents, setLifeEvents, birthYear, maritalStatus, overallProgress }: LifeEventsStepUniversalProps) {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({});
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'timeline' | 'suggestions'>('categories');
  const [expandedSuggestions, setExpandedSuggestions] = useState(true);
  const [includeTime, setIncludeTime] = useState(false);

  // Get smart suggestions based on age, marital status and existing events
  const smartSuggestions = useMemo(() =>
    getSmartSuggestions(birthYear, lifeEvents, maritalStatus),
    [birthYear, lifeEvents, maritalStatus]
  );

  // Get age-appropriate examples for selected category
  const ageAppropriateExamples = useMemo(() =>
    selectedCategory ? getAgeAppropriateExamples(selectedCategory, birthYear) : [],
    [selectedCategory, birthYear]
  );

  // Calculate detailed progress for this step
  const stepProgress = useMemo(() => {
    if (typeof overallProgress === 'undefined') return null;
    
    const birthData = {
      fullName: '',
      dateOfBirth: '',
      tentativeTime: '',
      timeUncertainty: '30min' as const,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC+5:30',
      gender: 'male' as const,
      maritalStatus: maritalStatus || 'single',
    };
    
    const physicalDesc = {
      bodyStructure: 'average' as const,
      height: 'average' as const,
      faceShape: 'oval' as const,
      complexion: 'wheatish' as const,
    };
    
    return calculateProgress(birthData, physicalDesc, lifeEvents);
  }, [overallProgress, lifeEvents, maritalStatus]);

  const handleAddEvent = () => {
    if (!newEvent.eventType || !newEvent.eventDate) {
      alert('Please fill in the event type and date');
      return;
    }

    const event: LifeEvent = {
      id: uuidv4(),
      category: selectedCategory as EventCategory,
      eventType: newEvent.eventType,
      eventDate: newEvent.eventDate,
      dateAccuracy: newEvent.dateAccuracy || 'exact',
      description: newEvent.description || '',
      importance: newEvent.importance || 'medium',
    };

    setLifeEvents([...lifeEvents, event]);
    resetForm();
  };

  const handleEditEvent = (event: LifeEvent) => {
    setEditingEvent(event);
    setNewEvent(event);
    setSelectedCategory(event.category);
    setIsAddingEvent(true);
    setIncludeTime(!!event.eventTime && event.dateAccuracy === 'exact');
  };

  const handleUpdateEvent = () => {
    if (!editingEvent || !newEvent.eventType || !newEvent.eventDate) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedEvent: LifeEvent = {
      ...editingEvent,
      eventType: newEvent.eventType,
      eventDate: newEvent.eventDate,
      dateAccuracy: newEvent.dateAccuracy || 'exact',
      description: newEvent.description || '',
      importance: newEvent.importance || 'medium',
    };

    setLifeEvents(lifeEvents.map(e => e.id === editingEvent.id ? updatedEvent : e));
    resetForm();
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setLifeEvents(lifeEvents.filter(e => e.id !== id));
    }
  };

  const resetForm = () => {
    setNewEvent({});
    setSelectedCategory(null);
    setIsAddingEvent(false);
    setEditingEvent(null);
    setIncludeTime(false);
  };

  const handleQuickAddSuggestion = (suggestion: {category: EventCategory; suggestion: string}) => {
    setSelectedCategory(suggestion.category);
    setNewEvent({
      eventType: suggestion.suggestion,
      eventDate: '',
      dateAccuracy: 'exact',
      description: '',
      importance: 'medium'
    });
    setIsAddingEvent(true);
  };

  // Timeline view - sort events chronologically
  const timelineEvents = useMemo(() => {
    return [...lifeEvents].sort((a, b) => {
      const dateA = new Date(a.eventDate);
      const dateB = new Date(b.eventDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [lifeEvents]);

  return (
    <div className="space-y-8">
      {/* Step Title - Universal Design */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 pt-8"
      >
        <div className="text-5xl mb-4">📌</div>
        <h2 className="text-3xl font-bold text-[#F5F0EB] mb-2">Your Life Story</h2>
        <p className="text-[#C4B8AD] text-lg max-w-2xl mx-auto">
          Share the moments that shaped your journey. Every event helps us understand your unique path better.
        </p>
      </motion.div>

      {/* Progress & Motivation */}
      {stepProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#E8A849]/10 to-[#6B9AC4]/10 border border-[#E8A849]/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#E8A849]" />
              <h3 className="text-lg font-semibold text-[#F5F0EB]">
                Life Events Progress
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getProgressColor(stepProgress.lifeEvents)}`}>
                {stepProgress.lifeEvents}%
              </span>
              <Award className="w-5 h-5 text-[#E8A849]" />
            </div>
          </div>
          
          <div className="w-full bg-[#2E2724] h-2 rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full transition-all duration-500 ${getProgressColor(stepProgress.lifeEvents)}`}
              initial={{ width: 0 }}
              animate={{ width: `${stepProgress.lifeEvents}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          
          <p className="text-[#C4B8AD] text-sm mb-3">
            {getProgressMessage(stepProgress.lifeEvents)}
          </p>
          
          {stepProgress.lifeEvents < 100 && (
            <div className="text-xs text-[#C4B8AD]">
              <p className="mb-2">💡 <strong>Next steps to improve accuracy:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                {stepProgress.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* View Mode Selector */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { id: 'categories', label: 'Categories', icon: '📁' },
          { id: 'timeline', label: 'Timeline', icon: '📅' },
          { id: 'suggestions', label: 'Suggestions', icon: '💡' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              viewMode === mode.id
                ? 'bg-[#E8A849] text-[#1A1614]'
                : 'bg-[#2E2724] text-[#C4B8AD] hover:bg-[#3A3330]'
            }`}
          >
            <span>{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Smart Suggestions View */}
      {viewMode === 'suggestions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#241F1C] border border-[#3A3330] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#F5F0EB]">💡 Smart Suggestions</h3>
              <button
                onClick={() => setExpandedSuggestions(!expandedSuggestions)}
                className="text-[#C4B8AD] hover:text-[#F5F0EB]"
              >
                {expandedSuggestions ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
            
            <AnimatePresence>
              {expandedSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {smartSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-[#2E2724] rounded-lg hover:bg-[#3A3330] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {ENHANCED_EVENT_CATEGORIES.find(cat => cat.id === suggestion.category)?.emoji}
                        </span>
                        <span className="text-[#F5F0EB]">{suggestion.suggestion}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          suggestion.priority === 'high' 
                            ? 'bg-[#E8A849]/20 text-[#E8A849]' 
                            : 'bg-[#6B9AC4]/20 text-[#6B9AC4]'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <button
                        onClick={() => handleQuickAddSuggestion(suggestion)}
                        className="px-3 py-1.5 bg-[#E8A849] text-[#1A1614] rounded-lg text-sm font-medium hover:bg-[#D4A84B] transition-colors"
                      >
                        Add
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && lifeEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-[#F5F0EB] mb-6">📅 Life Timeline</h3>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#3A3330]"></div>
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-6 mb-8">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-[#241F1C] border-2 border-[#3A3330] rounded-full flex items-center justify-center">
                    <span className="text-2xl">
                      {ENHANCED_EVENT_CATEGORIES.find(cat => cat.id === event.category)?.emoji}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <EventCard 
                    event={event} 
                    onEdit={handleEditEvent} 
                    onDelete={handleDeleteEvent} 
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Categories View (Default) */}
      {viewMode === 'categories' && (
        <div className="space-y-6">
          {/* Category Selection */}
          {!isAddingEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#241F1C] border border-[#3A3330] rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-[#F5F0EB] mb-6">Choose a life category to add events</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {ENHANCED_EVENT_CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory(cat.id as EventCategory);
                      setIsAddingEvent(true);
                    }}
                    className="p-4 rounded-xl border-2 border-[#3A3330] bg-[#2E2724] hover:border-[#E8A849] hover:bg-[#3D2E1F] transition-all group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.emoji}</div>
                    <div className="text-sm font-medium text-[#F5F0EB] text-center">{cat.label}</div>
                    <div className="text-xs text-[#8C7F72] mt-1">
                      {lifeEvents.filter(e => e.category === cat.id).length} events
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Add/Edit Event Form */}
          <AnimatePresence>
            {isAddingEvent && selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#241F1C] border border-[#3A3330] rounded-xl p-6 space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-[#F5F0EB]">
                    {editingEvent ? 'Edit Event' : `Add ${ENHANCED_EVENT_CATEGORIES.find(c => c.id === selectedCategory)?.label} Event`}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-[#8C7F72] hover:text-[#F5F0EB] p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Event Type with Examples */}
                <div>
                  <label className="block text-sm font-semibold text-[#F5F0EB] mb-3">What happened?</label>
                  <select
                    value={newEvent.eventType || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                    className="w-full h-12 px-4 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] focus:border-[#E8A849] focus:outline-none"
                    key={selectedCategory} // Force re-render when category changes
                  >
                    <option value="">Select event type</option>
                    {EVENT_TYPES[selectedCategory as EventCategory]?.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                  
                  {/* Age-appropriate examples */}
                  {ageAppropriateExamples.length > 0 && (
                    <div className="mt-3 p-3 bg-[#2E2724] rounded-lg">
                      <p className="text-xs text-[#C4B8AD] mb-2">💡 Common examples for your age group:</p>
                      <div className="flex flex-wrap gap-2">
                        {ageAppropriateExamples.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => setNewEvent({ ...newEvent, eventType: example })}
                            className="px-3 py-1.5 text-xs bg-[#3A3330] hover:bg-[#8C7F72] hover:text-[#1A1614] text-[#C4B8AD] rounded-lg transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Date & Time Input */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-[#F5F0EB]">
                      When did this happen?
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-[#C4B8AD]">
                        <input
                          type="checkbox"
                          checked={includeTime}
                          onChange={(e) => setIncludeTime(e.target.checked)}
                          className="rounded"
                        />
                        Include time
                      </label>
                    </div>
                  </div>
                  <EnhancedDateTimeInput
                    value={newEvent.eventDate || ''}
                    onChange={(value) => setNewEvent({ ...newEvent, eventDate: value })}
                    dateType={newEvent.dateAccuracy || 'exact'}
                    onDateTypeChange={(type) => setNewEvent({ ...newEvent, dateAccuracy: type })}
                    includeTime={includeTime}
                    onTimeChange={(time) => setNewEvent({ ...newEvent, eventTime: time })}
                    timeValue={newEvent.eventTime || ''}
                  />
                </div>

                {/* Importance with Visual Stars */}
                <div>
                  <label className="block text-sm font-semibold text-[#F5F0EB] mb-3">How significant was this event?</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'low', label: 'Minor', stars: 2 },
                      { value: 'medium', label: 'Moderate', stars: 3 },
                      { value: 'high', label: 'Important', stars: 4 },
                      { value: 'critical', label: 'Life-changing', stars: 5 }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setNewEvent({ ...newEvent, importance: option.value as any })}
                        className={`flex-1 p-3 rounded-lg text-center transition-all ${
                          newEvent.importance === option.value
                            ? 'bg-[#E8A849] text-[#1A1614] border-2 border-[#E8A849]'
                            : 'bg-[#2E2724] text-[#C4B8AD] border-2 border-[#3A3330] hover:border-[#8C7F72]'
                        }`}
                      >
                        <div className="flex justify-center gap-1 mb-1">
                          {Array.from({ length: option.stars }, (_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description with Guidance */}
                <div>
                  <label className="block text-sm font-semibold text-[#F5F0EB] mb-3">Tell us more (optional)</label>
                  <textarea
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Share any details that help remember this moment..."
                    className="w-full h-24 px-4 py-3 bg-[#2E2724] border border-[#3A3330] rounded-lg text-[#F5F0EB] placeholder-[#8C7F72] focus:border-[#E8A849] focus:outline-none resize-none"
                  />
                  <p className="text-xs text-[#8C7F72] mt-2">
                    💡 Tip: Include details like location, people involved, or how it made you feel
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 rounded-lg border border-[#3A3330] text-[#C4B8AD] hover:border-[#8C7F72] hover:text-[#F5F0EB] transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingEvent ? handleUpdateEvent : handleAddEvent}
                    className="flex-1 px-6 py-3 rounded-lg bg-[#E8A849] text-[#1A1614] hover:bg-[#D4A84B] transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {editingEvent ? (
                      <><Save className="w-4 h-4" /> Update Event</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Add Event</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Events List */}
      {lifeEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#F5F0EB]">Your Life Events</h3>
            <div className="text-sm text-[#C4B8AD]">
              {lifeEvents.length} event{lifeEvents.length !== 1 ? 's' : ''} added
            </div>
          </div>
          
          <div className="space-y-4">
            {lifeEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>

          {!isAddingEvent && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingEvent(true)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-[#3A3330] text-[#C4B8AD] hover:border-[#E8A849] hover:text-[#F5F0EB] transition-all flex items-center justify-center gap-3 font-medium bg-[#2E2724] hover:bg-[#3D2E1F]"
            >
              <Plus className="w-5 h-5" />
              Add Another Life Event
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {lifeEvents.length === 0 && !isAddingEvent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🌟</div>
          <h3 className="text-xl font-semibold text-[#F5F0EB] mb-2">Start Your Life Story</h3>
          <p className="text-[#C4B8AD] mb-6 max-w-md mx-auto">
            Every life is full of meaningful moments. Begin by adding your first significant event - 
            it could be your education, a job milestone, or any moment that mattered to you.
          </p>
          <button
            onClick={() => setIsAddingEvent(true)}
            className="px-8 py-3 rounded-xl bg-[#E8A849] text-[#1A1614] hover:bg-[#D4A84B] transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Your First Event
          </button>
        </motion.div>
      )}
    </div>
  );
}