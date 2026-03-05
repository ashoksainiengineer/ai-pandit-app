import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Info, CheckCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { QuizQuestion, QuizAnswer } from '@/lib/forensic-quiz/types';
import { FORENSIC_ONLY_QUESTIONS as FORENSIC_QUIZ_QUESTIONS } from '@/lib/forensic-quiz/questions';

interface QuestionCardProps {
    currentQuestion: QuizQuestion;
    currentAnswer?: QuizAnswer;
    currentQuestionIndex: number;
    showHelp: boolean;
    setShowHelp: (show: boolean) => void;
    customAnswer: string;
    handleSelectOption: (optionId: string) => void;
    handleCustomAnswerChange: (value: string) => void;
    handleClearCustomAnswer: () => void;
    handleNotSure: () => void;
    handlePrevious: () => void;
    handleNext: () => void;
}

export function QuestionCard({
    currentQuestion,
    currentAnswer,
    currentQuestionIndex,
    showHelp,
    setShowHelp,
    customAnswer,
    handleSelectOption,
    handleCustomAnswerChange,
    handleClearCustomAnswer,
    handleNotSure,
    handlePrevious,
    handleNext
}: QuestionCardProps) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl border border-[#F0E8DE] shadow-lg overflow-hidden"
            >
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
                            className={`p-2 rounded-lg transition-colors ${showHelp ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'hover:bg-[#F5EFE7] text-[#7A756F]'}`}
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>

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

                <div className="p-6 space-y-3">
                    {currentQuestion.options.map((option) => {
                        const isSelected = currentAnswer?.selectedOptions?.includes(option.id);

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleSelectOption(option.id)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-[#B8860B] bg-[#B8860B]/5'
                                    : 'border-[#F0E8DE] hover:border-[#78611D]/50 hover:bg-[#F5EFE7]/50'
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

                    {currentQuestion.allowCustomAnswer && (
                        <div className={`w-full p-4 rounded-xl border-2 transition-all ${customAnswer.trim()
                            ? 'border-[#B8860B] bg-[#B8860B]/5'
                            : 'border-[#E8E0D5] bg-white'
                            }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xl">✏️</span>
                                <span className="text-[#1A1612] font-medium">Add your own answer</span>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={customAnswer}
                                    onChange={(e) => handleCustomAnswerChange(e.target.value)}
                                    placeholder={currentQuestion.customAnswerPlaceholder || 'Describe in your own words...'}
                                    className="w-full p-3 rounded-lg border border-[#F0E8DE] bg-white text-[#1A1612] placeholder:text-[#7A756F]/50 resize-none focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] transition-all"
                                    rows={3}
                                />
                                {customAnswer.trim() && (
                                    <button
                                        onClick={handleClearCustomAnswer}
                                        className="absolute top-2 right-2 p-1 text-[#7A756F] hover:text-[#D64545] transition-colors"
                                        title="Clear custom answer"
                                    >
                                        <span className="text-lg">×</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {currentQuestion.hasNotSureOption && (
                        <button
                            onClick={handleNotSure}
                            className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all ${currentAnswer?.isNotSure
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
                            disabled={!currentAnswer?.selectedOptions?.length && !currentAnswer?.customAnswer && !currentAnswer?.isNotSure}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B8860B] to-[#78611D] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
    );
}
