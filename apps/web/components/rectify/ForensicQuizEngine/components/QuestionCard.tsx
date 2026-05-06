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
    recordQuizAnswer: (optionId: string) => void;
    updateCustomQuizResponse: (value: string) => void;
    clearCustomQuizResponse: () => void;
    markQuestionAsSkipped: () => void;
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
    recordQuizAnswer,
    updateCustomQuizResponse,
    clearCustomQuizResponse,
    markQuestionAsSkipped,
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
                className="bg-white rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-lg overflow-hidden"
            >
                <div className="p-6 border-b border-[rgba(0,0,0,0.08)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className=" text-xl font-medium text-[#000000] mb-2">
                                {currentQuestion.question}
                            </h3>
                            {currentQuestion.context && (
                                <p className="text-sm text-[#636363]">{currentQuestion.context}</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className={`p-2 rounded-lg transition-colors ${showHelp ? 'bg-[#000000]/10 text-[#000000]' : 'hover:bg-[#f8f8f8] text-[#636363]'}`}
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
                                <div className="mt-4 p-4 bg-[#000000]/5 rounded-lg border border-[#000000]/20">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-[#000000] mt-0.5" />
                                        <div className="text-sm text-[#636363]">
                                            <strong className="text-[#000000]">Why this matters:</strong>
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
                                onClick={() => recordQuizAnswer(option.id)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                    ? 'border-[#000000] bg-[#000000]/5'
                                    : 'border-[rgba(0,0,0,0.08)] hover:border-[#000000]/50 hover:bg-[#f8f8f8]/50'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{option.emoji}</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-[#000000]">{option.label}</div>
                                        {option.description && (
                                            <div className="text-sm text-[#636363] mt-1">{option.description}</div>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-[#000000] flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {currentQuestion.allowCustomAnswer && (
                        <div className={`w-full p-4 rounded-xl border-2 transition-all ${customAnswer.trim()
                            ? 'border-[#000000] bg-[#000000]/5'
                            : 'border-[#E8E0D5] bg-white'
                            }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xl">✏️</span>
                                <span className="text-[#000000] font-medium">Add your own answer</span>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={customAnswer}
                                    onChange={(e) => updateCustomQuizResponse(e.target.value)}
                                    placeholder={currentQuestion.customAnswerPlaceholder || 'Describe in your own words...'}
                                    className="w-full p-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white text-[#000000] placeholder:text-[#636363]/50 resize-none focus:outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000] transition-all"
                                    rows={3}
                                />
                                {customAnswer.trim() && (
                                    <button
                                        onClick={clearCustomQuizResponse}
                                        className="absolute top-2 right-2 p-1 text-[#636363] hover:text-[#D64545] transition-colors"
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
                            onClick={markQuestionAsSkipped}
                            className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all ${currentAnswer?.isNotSure
                                ? 'border-[#636363] bg-[#636363]/5'
                                : 'border-[#E8E0D5] hover:border-[#636363]/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🤷</span>
                                <span className="text-[#636363] font-medium">Not sure / Skip this question</span>
                            </div>
                        </button>
                    )}
                </div>

                <div className="p-6 border-t border-[rgba(0,0,0,0.08)] bg-[#ffffff]">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-[#636363] font-medium disabled:opacity-30 hover:text-[#636363] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!currentAnswer?.selectedOptions?.length && !currentAnswer?.customAnswer && !currentAnswer?.isNotSure}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#000000] to-[#000000] text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
