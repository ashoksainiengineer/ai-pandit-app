import { logger } from '../utils/logger.js';

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeAIInParallel<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number = 3,
  staggerMs: number = 500
) : Promise<T[]> {
  const results: T[] = new Array(tasks.length);
    // BUG-FIX: Removed unused errors array (dead code)
    let activeCount = 0;
    let nextIndex = 0;

    return new Promise((resolve) => {
        const runNext = () => {
            if (nextIndex >= tasks.length && activeCount === 0) {
                resolve(results);
                return;
            }

            while (activeCount < concurrency && nextIndex < tasks.length) {
                const index = nextIndex++;
                const task = tasks[index];
                activeCount++;

                const execute = async () => {
                    try {
                        results[index] = await task();
                    } catch (error) {
                        logger.error(`Parallel task ${index} failed`, error);
                        results[index] = undefined as unknown as T;
                    } finally {
                        activeCount--;
                        runNext();
                    }
                };

                if (staggerMs > 0 && activeCount > 1) {
                    setTimeout(execute, staggerMs * (activeCount - 1));
                } else {
                    execute();
                }
            }
        };

        runNext();
    });
}

export function parseAIAnalysisResponse(content: string): {
    score: number;
    confidence: 'High' | 'Medium' | 'Low';
    verdict: string;
    dashaAnalysis: string;
    transitAnalysis: string;
    eventMatches: Array<{ event: string; matches: boolean; reason: string }>;
} {
    const scoreMatch = content.match(/(?:FINAL SCORE|CONFIDENCE SCORE|SCORE)[:\s]*(\d+)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

    const confMatch = content.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
    const confidence = (confMatch ? confMatch[1].toUpperCase() :
        score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW') as 'High' | 'Medium' | 'Low';

    const verdictMatch = content.match(/(?:VERDICT|RECOMMENDATION|FINAL)[:\s]*([^\n]+)/i);
    const verdict = verdictMatch ? verdictMatch[1].trim() : 'Inconclusive';

    const dashaMatch = content.match(/DASHA(?:\s+VERIFICATION)?[:\s]*([\s\S]*?)(?=\n\n|\nTRANSIT|\nHOUSE|$)/i);
    const dashaAnalysis = dashaMatch ? dashaMatch[1].trim().substring(0, 1000) : '';

    const transitMatch = content.match(/TRANSIT(?:\s+VERIFICATION)?[:\s]*([\s\S]*?)(?=\n\n|\nHOUSE|\nCONFIDENCE|$)/i);
    const transitAnalysis = transitMatch ? transitMatch[1].trim().substring(0, 1000) : '';

    const eventMatches: Array<{ event: string; matches: boolean; reason: string }> = [];
    const eventRegex = /(\d+)\.\s*([^:]+)[:\s]*(✓|✗|Yes|No|Match|No Match)[:\s]*([^\n]*)/gi;
    let match: RegExpExecArray | null;
    while ((match = eventRegex.exec(content)) !== null) {
        eventMatches.push({
            event: match[2].trim(),
            matches: /✓|Yes|Match/i.test(match[3]),
            reason: match[4].trim(),
        });
    }

    return {
        score,
        confidence,
        verdict,
        dashaAnalysis,
        transitAnalysis,
        eventMatches,
    };
}
