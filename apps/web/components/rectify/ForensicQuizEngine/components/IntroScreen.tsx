import { motion } from 'framer-motion';
import { Sparkles, Save, Activity, CheckCircle, ChevronRight } from 'lucide-react';
import { FORENSIC_ONLY_METADATA as QUIZ_METADATA } from '@/lib/forensic-quiz/questions';

interface IntroScreenProps {
    hasSavedProgress: boolean;
    lastSaved: Date | null;
    answered: number;
    getCategoryProgress: (categoryId: string) => { total: number; answered: number };
    setQuizStarted: (started: boolean) => void;
    handleStartFresh: () => void;
}

export function IntroScreen({
    hasSavedProgress,
    lastSaved,
    answered,
    getCategoryProgress,
    setQuizStarted,
    handleStartFresh
}: IntroScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-gradient-to-br from-[#ffffff] to-white rounded-2xl border border-[#000000]/30 p-8 shadow-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#000000] to-[#000000] mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className=" text-2xl font-medium text-[#000000] mb-2">
                        Vedic Forensic Assessment
                    </h2>
                    <p className="text-[#636363]">
                        Discover your cosmic imprint through observable traits
                    </p>
                    {hasSavedProgress && lastSaved && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#184131]/10 text-[#184131] rounded-full text-sm">
                            <Save className="w-4 h-4" />
                            <span>Progress saved from {lastSaved.toLocaleTimeString()}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[rgba(0,0,0,0.08)]">
                        <div className="w-10 h-10 rounded-lg bg-[#184131]/10 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-[#184131]" />
                        </div>
                        <div>
                            <div className="font-medium text-[#000000]">{QUIZ_METADATA.totalQuestions} Questions</div>
                            <div className="text-sm text-[#636363]">About {QUIZ_METADATA.estimatedTimeMinutes} minutes</div>
                        </div>
                        {hasSavedProgress && (
                            <div className="ml-auto text-sm text-[#000000] font-medium">
                                {answered}/{QUIZ_METADATA.totalQuestions} answered
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {QUIZ_METADATA.categories.map((cat: { id: string; name: string; icon: string }) => {
                            const catProg = getCategoryProgress(cat.id);
                            const isComplete = catProg.answered === catProg.total && catProg.total > 0;
                            return (
                                <div key={cat.id} className={`flex items-center gap-2 p-3 rounded-lg border ${isComplete ? 'bg-[#184131]/5 border-[#184131]/30' : 'bg-white border-[rgba(0,0,0,0.08)]'
                                    }`}>
                                    <span className="text-lg">{cat.icon}</span>
                                    <div className="text-sm text-[#636363]">{cat.name}</div>
                                    {isComplete && <CheckCircle className="w-4 h-4 text-[#184131] ml-auto" />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setQuizStarted(true)}
                        className="w-full py-3 bg-gradient-to-r from-[#000000] to-[#000000] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {hasSavedProgress ? 'Resume Assessment' : 'Start Assessment'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {hasSavedProgress && (
                    <button
                        onClick={handleStartFresh}
                        className="w-full mt-3 py-2 text-sm text-[#636363] hover:text-[#D64545] transition-colors"
                    >
                        Start Fresh (Clear saved progress)
                    </button>
                )}
            </div>
        </motion.div>
    );
}
