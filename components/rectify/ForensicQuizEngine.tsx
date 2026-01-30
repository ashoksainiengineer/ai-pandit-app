/**
 * ForensicQuizEngine - Interactive Quiz for Vedic Birth Time Rectification
 * Replaces traditional trait selection with quiz-based identification
 * Sacred Ivory Light Theme - God Tier Design
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, HelpCircle, Sparkles, 
  CheckCircle, RefreshCw, AlertCircle, Info,
  Target, Brain, Eye, Mic, Users, Activity
} from 'lucide-react';
import { 
  QuizAnswer, 
  QuizResults, 
  QuizQuestion,
  QuizProgress 
} from '@/lib/forensic-quiz/types';
import { 
  FORENSIC_QUIZ_QUESTIONS,
  QUIZ_METADATA 
} from '@/lib/forensic-quiz/questions';
import { 
  calculateQuizResults, 
  getQuizProgress, 
  verifyTraitConsistency,
  formatQuizResults
} from '@/lib/forensic-quiz/scoring';

interface ForensicQuizEngineProps {
  onComplete: (results: QuizResults) => void;
  onCancel?: () => void;
  initialResults?: QuizResults | null;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  prakriti: Activity,
  forehead: Brain,
  eyes: Eye,
  voice: Mic,
  speech: Mic,
  decision: Target,
  family: Users,
  marks: Activity
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  prakriti: 'bg-[#2D7A5C]',
  forehead: 'bg-[#B8860B]',
  eyes: 'bg-[#6B9AC4]',
  voice: 'bg-[#C65D3B]',
  speech: 'bg-[#8B5CF6]',
  decision: 'bg-[#D4A853]',
  family: 'bg-[#2D7A5C]',
  marks: 'bg-[#7C3AED]'
};

export default function ForensicQuizEngine({ 
  onComplete, 
  onCancel,
  initialResults 
}: ForensicQuizEngineProps) {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>(
    initialResults?.answers || []
  );
  const [showResults, setShowResults] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current question
  const currentQuestion = FORENSIC_QUIZ_QUESTIONS[currentQuestionIndex];
  
  // Calculate progress
  const progress = useMemo(() => {
    const prog = getQuizProgress(answers);
    return {
      ...prog,
      currentCategory: currentQuestion?.category || ''
    };
  }, [answers, currentQuestionIndex]);

  // Check if current question is answered
  const currentAnswer = useMemo(() => {
    return answers.find(a => a.questionId === currentQuestion?.id);
  }, [answers, currentQuestion]);

  // Calculate results when needed
  const results = useMemo(() => {
    if (answers.length === 0) return null;
    return calculateQuizResults(answers);
  }, [answers]);

  // Handle option selection
  const handleSelectOption = useCallback((optionId: string) => {
    if (!currentQuestion) return;

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
      const newAnswer: QuizAnswer = {
        questionId: currentQuestion.id,
        selectedOptions: currentQuestion.allowMultiple 
          ? [...(prev[existingIndex]?.selectedOptions || []), optionId]
          : [optionId],
        isNotSure: false,
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  }, [currentQuestion]);

  // Handle "Not Sure" selection
  const handleNotSure = useCallback(() => {
    if (!currentQuestion) return;

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
      const newAnswer: QuizAnswer = {
        questionId: currentQuestion.id,
        selectedOptions: [],
        isNotSure: true,
        timestamp: Date.now()
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });

    // Auto advance after selecting "not sure"
    setTimeout(() => {
      if (currentQuestionIndex < FORENSIC_QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 300);
  }, [currentQuestion, currentQuestionIndex]);

  // Navigate to next question
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < FORENSIC_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  }, [currentQuestionIndex]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Handle quiz completion
  const handleComplete = useCallback(() => {
    if (!results) return;
    setIsSubmitting(true);
    
    // Small delay for UX
    setTimeout(() => {
      onComplete(results);
      setIsSubmitting(false);
    }, 500);
  }, [results, onComplete]);

  // Handle retake
  const handleRetake = useCallback(() => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  }, []);

  // Get category progress
  const getCategoryProgress = useCallback((categoryId: string) => {
    const catQuestions = FORENSIC_QUIZ_QUESTIONS.filter(q => q.category === categoryId);
    const catAnswered = answers.filter(a => {
      const q = FORENSIC_QUIZ_QUESTIONS.find(q => q.id === a.questionId);
      return q?.category === categoryId;
    }).length;
    return { total: catQuestions.length, answered: catAnswered };
  }, [answers]);

  // Render intro screen
  if (answers.length === 0 && !showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl border border-[#B8860B]/30 p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4A853] mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold text-[#1A1612] mb-2">
              Vedic Forensic Assessment
            </h2>
            <p className="text-[#7A756F]">
              Discover your cosmic imprint through observable traits
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#F0E8DE]">
              <div className="w-10 h-10 rounded-lg bg-[#2D7A5C]/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#2D7A5C]" />
              </div>
              <div>
                <div className="font-semibold text-[#1A1612]">22 Questions</div>
                <div className="text-sm text-[#7A756F]">About 5-7 minutes</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {QUIZ_METADATA.categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] || Activity;
                return (
                  <div key={cat.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-[#F0E8DE]">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="text-sm text-[#4A453F]">{cat.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border-2 border-[#E8E0D5] text-[#7A756F] rounded-xl font-semibold hover:bg-[#F5EFE7] transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(0)}
              className="flex-1 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Start Assessment
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render results screen
  if (showResults && results) {
    const consistency = verifyTraitConsistency(results);
    const formatted = formatQuizResults(results);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-gradient-to-br from-[#FDF8F3] to-white rounded-2xl border border-[#B8860B]/30 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#2D7A5C] to-[#4ADE80] mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-bold text-[#1A1612] mb-2">
              Assessment Complete
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D7A5C]/10 rounded-full">
              <Target className="w-4 h-4 text-[#2D7A5C]" />
              <span className="text-sm font-semibold text-[#2D7A5C]">
                {results.overallConfidence}% Confidence
              </span>
            </div>
          </div>

          {/* Results Summary */}
          <div className="space-y-4 mb-6">
            {/* Prakriti */}
            <div className="p-4 bg-white rounded-xl border border-[#F0E8DE]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🍃</span>
                  <span className="font-semibold text-[#1A1612]">Body Constitution</span>
                </div>
                <span className="text-sm font-bold text-[#2D7A5C]">
                  {results.prakriti.primary.toUpperCase()}
                  {results.prakriti.secondary && `-${results.prakriti.secondary.toUpperCase()}`}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-[#F5EFE7] rounded">Vata: {results.prakriti.scores.vata}%</span>
                <span className="px-2 py-1 bg-[#F5EFE7] rounded">Pitta: {results.prakriti.scores.pitta}%</span>
                <span className="px-2 py-1 bg-[#F5EFE7] rounded">Kapha: {results.prakriti.scores.kapha}%</span>
              </div>
            </div>

            {/* Other Traits Grid */}
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                icon="☀️"
                label="Forehead"
                value={results.forehead.type}
                confidence={results.forehead.confidence}
                color="bg-[#B8860B]"
              />
              <ResultCard
                icon="👁️"
                label="Eyes"
                value={results.eyes.type}
                confidence={results.eyes.confidence}
                color="bg-[#6B9AC4]"
              />
              <ResultCard
                icon="🗣️"
                label="Voice"
                value={results.voice.type}
                confidence={results.voice.confidence}
                color="bg-[#C65D3B]"
              />
              <ResultCard
                icon="💬"
                label="Speech"
                value={results.speech.type}
                confidence={results.speech.confidence}
                color="bg-[#8B5CF6]"
              />
            </div>

            {/* Family Context */}
            <div className="p-4 bg-white rounded-xl border border-[#F0E8DE]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
                <span className="font-semibold text-[#1A1612]">Family Context</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[#7A756F]">Birth Order:</span>
                  <span className="ml-2 font-medium capitalize">{results.family.birthOrder.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[#7A756F]">Father Status:</span>
                  <span className="ml-2 font-medium capitalize">{results.family.fatherStatus.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Consistency Check */}
            {!consistency.isConsistent && (
              <div className="p-3 bg-[#C65D3B]/5 border border-[#C65D3B]/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#C65D3B] mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-[#C65D3B]">Trait Consistency: {consistency.alignment}%</div>
                    <div className="text-xs text-[#7A756F] mt-1">
                      {consistency.warnings.slice(0, 2).map((w, i) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Astro Mapping */}
            <div className="p-4 bg-gradient-to-r from-[#B8860B]/10 to-[#D4A853]/10 rounded-xl border border-[#B8860B]/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#B8860B]" />
                <span className="font-semibold text-[#1A1612]">Vedic Insight</span>
              </div>
              <p className="text-sm text-[#4A453F]">{formatted.astroMapping}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 py-3 border-2 border-[#E8E0D5] text-[#7A756F] rounded-xl font-semibold hover:bg-[#F5EFE7] transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-[#2D7A5C] to-[#4ADE80] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render question
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {QUIZ_METADATA.categories.find(c => c.id === currentQuestion.category)?.icon}
            </span>
            <span className="text-sm font-medium text-[#7A756F]">
              {QUIZ_METADATA.categories.find(c => c.id === currentQuestion.category)?.name}
            </span>
          </div>
          <span className="text-sm font-semibold text-[#B8860B]">
            {currentQuestionIndex + 1} of {FORENSIC_QUIZ_QUESTIONS.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-[#F0E8DE] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#B8860B] to-[#D4A853] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / FORENSIC_QUIZ_QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Category Progress */}
        <div className="mt-2 flex gap-2 flex-wrap">
          {QUIZ_METADATA.categories.map(cat => {
            const catProg = getCategoryProgress(cat.id);
            const isActive = currentQuestion.category === cat.id;
            const isComplete = catProg.answered === catProg.total;
            
            return (
              <button
                key={cat.id}
                onClick={() => {
                  // Jump to first question of this category
                  const firstCatQuestion = FORENSIC_QUIZ_QUESTIONS.findIndex(q => q.category === cat.id);
                  if (firstCatQuestion >= 0 && catProg.answered < catProg.total) {
                    setCurrentQuestionIndex(firstCatQuestion);
                  }
                }}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  isActive
                    ? 'bg-[#B8860B] text-white'
                    : isComplete
                      ? 'bg-[#2D7A5C]/20 text-[#2D7A5C]'
                      : 'bg-[#F5EFE7] text-[#7A756F]'
                }`}
              >
                {cat.icon} {catProg.answered}/{catProg.total}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border border-[#F0E8DE] shadow-lg overflow-hidden"
        >
          {/* Question Header */}
          <div className="p-6 border-b border-[#F0E8DE]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-[#1A1612] mb-2">
                  {currentQuestion.question}
                </h3>
                {currentQuestion.context && (
                  <p className="text-sm text-[#7A756F]">{currentQuestion.context}</p>
                )}
              </div>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 rounded-lg hover:bg-[#F5EFE7] text-[#7A756F] transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Help Panel */}
            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-4 bg-[#B8860B]/5 rounded-lg border border-[#B8860B]/20">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-[#B8860B] mt-0.5" />
                      <div className="text-sm text-[#4A453F]">
                        <strong className="text-[#B8860B]">Why this matters:</strong>
                        <p className="mt-1">
                          This question helps determine your {currentQuestion.category} traits, 
                          which correlate to specific planetary positions at birth. 
                          Accurate answers improve birth time rectification precision.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Options */}
          <div className="p-6 space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswer?.selectedOptions.includes(option.id);
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#B8860B] bg-[#B8860B]/5'
                      : 'border-[#F0E8DE] hover:border-[#D4A853]/50 hover:bg-[#F5EFE7]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-[#1A1612]">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-[#7A756F] mt-1">{option.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#B8860B] flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Not Sure Option */}
            {currentQuestion.hasNotSureOption && (
              <button
                onClick={handleNotSure}
                className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all ${
                  currentAnswer?.isNotSure
                    ? 'border-[#7A756F] bg-[#7A756F]/5'
                    : 'border-[#E8E0D5] hover:border-[#7A756F]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🤷</span>
                  <span className="text-[#7A756F] font-medium">Not sure / Skip this question</span>
                </div>
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="p-6 border-t border-[#F0E8DE] bg-[#FDF8F3]">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-[#7A756F] font-medium disabled:opacity-30 hover:text-[#4A453F] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!currentAnswer}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex === FORENSIC_QUIZ_QUESTIONS.length - 1 ? (
                  <>See Results <Sparkles className="w-4 h-4" /></>
                ) : (
                  <>Next <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Category Progress Indicator */}
      <div className="mt-4 flex justify-center gap-2">
        {QUIZ_METADATA.categories.map((cat, idx) => {
          const catProg = getCategoryProgress(cat.id);
          const isComplete = catProg.answered === catProg.total;
          const hasStarted = catProg.answered > 0;
          
          return (
            <div
              key={cat.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                isComplete 
                  ? 'bg-[#2D7A5C]' 
                  : hasStarted 
                    ? 'bg-[#B8860B]' 
                    : 'bg-[#E8E0D5]'
              }`}
              title={cat.name}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

// Helper component for result cards
function ResultCard({ 
  icon, 
  label, 
  value, 
  confidence, 
  color 
}: { 
  icon: string; 
  label: string; 
  value: string; 
  confidence: number;
  color: string;
}) {
  return (
    <div className="p-3 bg-white rounded-xl border border-[#F0E8DE]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-[#7A756F]">{label}</span>
      </div>
      <div className="font-medium text-sm text-[#1A1612] truncate">{value}</div>
      <div className="mt-2 flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-xs text-[#7A756F]">{confidence}%</span>
      </div>
    </div>
  );
}
