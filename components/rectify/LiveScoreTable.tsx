import { motion, AnimatePresence } from 'framer-motion';
import { CandidateScore } from '@/lib/use-stream-progress';

interface LiveScoreTableProps {
    scores: CandidateScore[];
    className?: string;
}

export function LiveScoreTable({ scores, className = '' }: LiveScoreTableProps) {
    // Sort by score descending (highest first)
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    // Take top 10
    const topScores = sortedScores.slice(0, 10);

    return (
        <div className={`mt-6 overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm ${className}`}>
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
                <h3 className="text-sm font-medium text-white/90">
                    Live Analysis Results
                </h3>
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                    {scores.length} Analyzed
                </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-black/80 text-xs font-medium uppercase text-white/50 backdrop-blur-md">
                        <tr>
                            <th className="px-4 py-2">Rank</th>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">Score</th>
                            <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {topScores.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-white/30 text-xs uppercase tracking-wider">
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
                                        className="hover:bg-white/5"
                                    >
                                        <td className="px-4 py-2.5 font-mono text-white/40">
                                            #{index + 1}
                                        </td>
                                        <td className="px-4 py-2.5 font-mono font-medium text-white/90">
                                            {candidate.time}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${candidate.score >= 80 ? 'bg-green-500' :
                                                            candidate.score >= 50 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                        style={{ width: `${candidate.score}%` }}
                                                    />
                                                </div>
                                                <span className={`font-mono font-bold ${candidate.score >= 80 ? 'text-green-400' :
                                                    candidate.score >= 50 ? 'text-yellow-400' :
                                                        'text-red-400'
                                                    }`}>
                                                    {candidate.score}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
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
