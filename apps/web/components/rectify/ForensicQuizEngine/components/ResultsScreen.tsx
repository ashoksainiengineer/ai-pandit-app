import { motion } from 'framer-motion';
import { CheckCircle, Target, AlertCircle, Sparkles, ChevronLeft, RefreshCw } from 'lucide-react';
import { QuizResults } from '@/lib/forensic-quiz/types';
import { verifyTraitConsistency, formatQuizResults } from '@/lib/forensic-quiz/scoring';

interface ResultsScreenProps {
    results: QuizResults;
    isSubmitting: boolean;
    handleComplete: () => void;
    setShowResults: (show: boolean) => void;
    setQuizStarted: (started: boolean) => void;
    handleRetake: () => void;
}

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
        <div className="p-3 bg-white rounded-xl border border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <span className="text-xs text-[#636363]">{label}</span>
            </div>
            <div className="font-medium text-sm text-[#000000] truncate">{value}</div>
            <div className="mt-2 flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-xs text-[#636363]">{confidence}%</span>
            </div>
        </div>
    );
}

export function ResultsScreen({
    results,
    isSubmitting,
    handleComplete,
    setShowResults,
    setQuizStarted,
    handleRetake
}: ResultsScreenProps) {
    const consistency = verifyTraitConsistency(results);
    const formatted = formatQuizResults(results);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-gradient-to-br from-[#ffffff] to-white rounded-2xl border border-[#000000]/30 p-8 shadow-lg">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#184131] to-[#4ADE80] mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className=" text-2xl font-medium text-[#000000] mb-2">
                        Assessment Complete
                    </h2>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#184131]/10 rounded-full">
                        <Target className="w-4 h-4 text-[#184131]" />
                        <span className="text-sm font-medium text-[#184131]">
                            {results.overallConfidence}% Confidence
                        </span>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="space-y-4 mb-6">
                    {/* Prakriti */}
                    <div className="p-4 bg-white rounded-xl border border-[rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🍃</span>
                                <span className="font-medium text-[#000000]">Body Constitution</span>
                            </div>
                            <span className="text-sm font-medium text-[#184131]">
                                {results.prakriti.primary.toUpperCase()}
                                {results.prakriti.secondary && `-${results.prakriti.secondary.toUpperCase()}`}
                            </span>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-[#FAFAFA] rounded">Vata: {results.prakriti.scores.vata}%</span>
                            <span className="px-2 py-1 bg-[#FAFAFA] rounded">Pitta: {results.prakriti.scores.pitta}%</span>
                            <span className="px-2 py-1 bg-[#FAFAFA] rounded">Kapha: {results.prakriti.scores.kapha}%</span>
                        </div>
                    </div>

                    {/* Other Traits Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <ResultCard
                            icon="☀️"
                            label="Forehead"
                            value={results.forehead.type}
                            confidence={results.forehead.confidence}
                            color="bg-[#000000]"
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
                    <div className="p-4 bg-white rounded-xl border border-[rgba(0,0,0,0.08)]">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">👨‍👩‍👧‍👦</span>
                            <span className="font-medium text-[#000000]">Family Context</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-[#636363]">Birth Order:</span>
                                <span className="ml-2 font-medium capitalize">{results.family.birthOrder.replace(/_/g, ' ')}</span>
                            </div>
                            <div>
                                <span className="text-[#636363]">Father Status:</span>
                                <span className="ml-2 font-medium capitalize">{results.family.fatherStatus.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Consistency Check */}
                    {!consistency.isConsistent && consistency.warnings.length > 0 && (
                        <div className="p-3 bg-[#C65D3B]/5 border border-[#C65D3B]/20 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-[#C65D3B] mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-[#C65D3B]">Trait Consistency: {consistency.alignment}%</div>
                                    <div className="text-xs text-[#636363] mt-1">
                                        {consistency.warnings.slice(0, 2).map((w, i) => (
                                            <div key={i}>• {w}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Astro Mapping */}
                    <div className="p-4 bg-gradient-to-r from-[#000000]/10 to-[#000000]/10 rounded-xl border border-[#000000]/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#000000]" />
                            <span className="font-medium text-[#000000]">Vedic Insight</span>
                        </div>
                        <p className="text-sm text-[#636363]">{formatted.astroMapping}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleComplete}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-[#184131] to-[#4ADE80] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowResults(false);
                                setQuizStarted(true);
                            }}
                            className="flex-1 py-3 border-2 border-[#000000] text-[#000000] rounded-xl font-medium hover:bg-[#000000]/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Review Answers
                        </button>
                        <button
                            onClick={handleRetake}
                            className="flex-1 py-3 border-2 border-[#E8E0D5] text-[#636363] rounded-xl font-medium hover:bg-[#FAFAFA] hover:text-[#D64545] transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Start Fresh
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
