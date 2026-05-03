import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { FORENSIC_ONLY_METADATA as QUIZ_METADATA, FORENSIC_ONLY_QUESTIONS as FORENSIC_QUIZ_QUESTIONS } from '@/lib/forensic-quiz/questions';
import { SaveStatus } from '../types';

interface ProgressHeaderProps {
    currentQuestionIndex: number;
    currentCategory: string;
    saveStatus: SaveStatus;
    getCategoryProgress: (categoryId: string) => { total: number; answered: number };
    jumpToQuestion: (index: number) => void;
}

export function ProgressHeader({
    currentQuestionIndex,
    currentCategory,
    saveStatus,
    getCategoryProgress,
    jumpToQuestion
}: ProgressHeaderProps) {
    const currentCategoryData = QUIZ_METADATA.categories.find(c => c.id === currentCategory);

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">
                        {currentCategoryData?.icon}
                    </span>
                    <span className="text-sm font-medium text-[#7A756F]">
                        {currentCategoryData?.name}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Auto-save status */}
                    <div className="flex items-center gap-1.5 text-xs">
                        {saveStatus === 'saving' && (
                            <>
                                <div className="w-3 h-3 border-2 border-[#B8860B]/30 border-t-[#B8860B] rounded-full animate-spin" />
                                <span className="text-[#B8860B]">Saving...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <CheckCircle className="w-3 h-3 text-[#184131]" />
                                <span className="text-[#184131]">Saved</span>
                            </>
                        )}
                    </div>
                    <span className="text-sm font-semibold text-[#B8860B]">
                        {currentQuestionIndex + 1} of {FORENSIC_QUIZ_QUESTIONS.length}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-[#F0E8DE] rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#B8860B] to-[#78611D] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / FORENSIC_QUIZ_QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Category Progress */}
            <div className="mt-2 flex gap-2 flex-wrap">
                {QUIZ_METADATA.categories.map((cat: { id: string; name: string; icon: string }) => {
                    const catProg = getCategoryProgress(cat.id);
                    const isActive = currentCategory === cat.id;
                    const isComplete = catProg.answered === catProg.total && catProg.total > 0;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => {
                                const firstCatQuestion = FORENSIC_QUIZ_QUESTIONS.findIndex(q => q.category === cat.id);
                                if (firstCatQuestion >= 0 && catProg.answered < catProg.total) {
                                    jumpToQuestion(firstCatQuestion);
                                }
                            }}
                            disabled={catProg.answered === 0}
                            className={`text-[10px] px-2 py-1 rounded-full transition-colors disabled:opacity-50 ${isActive
                                ? 'bg-[#B8860B] text-white'
                                : isComplete
                                    ? 'bg-[#184131]/20 text-[#184131]'
                                    : 'bg-[#F5EFE7] text-[#7A756F]'
                                }`}
                        >
                            {cat.icon} {catProg.answered}/{catProg.total}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
