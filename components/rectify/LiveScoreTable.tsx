import { motion, AnimatePresence } from 'framer-motion';
import { CandidateScore } from '@/lib/use-stream-progress';

interface LiveScoreTableProps {
    scores: CandidateScore[];
    className?: string;
}

export function LiveScoreTable({ scores, className = '' }: LiveScoreTableProps) {
    // Sort by score descending (highest first)
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    // Live Tournament Feed: Show all active candidates in scrollable view
    const topScores = sortedScores;

    return (
        <div className={`mt-6 overflow-hidden rounded-xl border border-[#F0E8DE] bg-[#FFFCF8] backdrop-blur-sm ${className}`}>
            <div className="flex items-center justify-between border-b border-[#F0E8DE] bg-[#FDF8F3] px-4 py-3">
                <h3 className="text-[10px] font-black text-emerald-600 tracking-[0.2em] uppercase">
                    VEDIC ASTROLOGICAL DATA TABLE
                </h3>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {scores.length} Analyzed
                </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#FAF5EF] text-xs font-medium uppercase text-[#7A756F] backdrop-blur-md">
                        <tr>
                            <th className="px-4 py-2">Rank</th>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">Score</th>
                            <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E8DE]">
                        {topScores.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-[#7A756F] text-xs uppercase tracking-wider">
                                    Waiting for first batch to complete...
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence initial={false}>
                                {topScores.map((candidate, index) => (
                                    <motion.tr
                                        key={candidate.time}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="hover:bg-[#F5EFE7]"
                                    >
                                        <td className="px-4 py-2.5 font-mono text-[#7A756F]">
                                            #{index + 1}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-medium text-[#1A1612]">
                                            {candidate.time}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E8E0D5]">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${candidate.score >= 80 ? 'bg-green-600' :
                                                            candidate.score >= 50 ? 'bg-yellow-600' :
                                                                'bg-red-600'
                                                            }`}
                                                        style={{ width: `${candidate.score}%` }}
                                                    />
                                                </div>
                                                <span className={`font-mono font-bold ${candidate.score >= 80 ? 'text-green-700' :
                                                    candidate.score >= 50 ? 'text-yellow-700' :
                                                        'text-red-700'
                                                    }`}>
                                                    {candidate.score}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                Complete
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
