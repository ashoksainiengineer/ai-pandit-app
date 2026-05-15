import { logger } from '../utils/logger.js';

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Legacy parallel executor — eagerly evaluates all tasks.
 * Prefer executeAIWithBackpressure for memory-heavy workloads.
 */
export async function executeAIInParallel<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number = 3,
  staggerMs: number = 500
) : Promise<T[]> {
  const results: T[] = new Array(tasks.length);
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

/**
 * Backpressure-aware lazy executor.
 *
 * Only materialises the next task when a concurrency slot frees up,
 * then immediately drops the heavy payload so GC can reclaim it.
 *
 * @param taskGenerator  Async generator that yields { index, payload }.
 *                       The generator is responsible for building the
 *                       heavy data JIT and should clear its own refs
 *                       after yielding.
 * @param processor      Function that consumes the payload and returns
 *                       the result. Called inside the concurrency slot.
 * @param concurrency    Max parallel workers (default 3).
 * @param staggerMs      Delay between slot starts (default 500).
 *
 * @returns Array of results in index order.
 *
 * @example
 * async function* gen() {
 *   for (let i = 0; i < batches.length; i++) {
 *     const payload = await buildHeavyData(batches[i]); // JIT
 *     yield { index: i, payload };
 *     payload.length = 0; // clear ref for GC
 *   }
 * }
 * const results = await executeAIWithBackpressure(
 *   gen(),
 *   async ({ index, payload }) => { … },
 *   3
 * );
 */
export async function executeAIWithBackpressure<T, P>(
  taskGenerator: AsyncGenerator<{ index: number; payload: P }>,
  processor: (ctx: { index: number; payload: P }) => Promise<T>,
  concurrency: number = 3,
  staggerMs: number = 500
): Promise<T[]> {
  const results = new Map<number, T>();
  let activeCount = 0;
  let done = false;

  return new Promise((resolve, reject) => {
    const tryNext = async () => {
      if (done && activeCount === 0) {
        // Build ordered result array from map. The map may have gaps
        // if a generator yield failed mid-way, so we bound by the
        // highest seen index rather than map size.
        const maxIndex = Math.max(...results.keys(), -1);
        const ordered: T[] = [];
        for (let i = 0; i <= maxIndex; i++) {
          ordered.push(results.get(i) as T);
        }
        resolve(ordered);
        return;
      }

      while (activeCount < concurrency && !done) {
        const slot = activeCount;
        activeCount++;

        const execute = async () => {
          try {
            const { value, done: genDone } = await taskGenerator.next();
            if (genDone || !value) {
              done = true;
              activeCount--;
              tryNext();
              return;
            }

            const { index, payload } = value;
            const result = await processor({ index, payload });
            results.set(index, result);

            if (Array.isArray(payload)) {
              (payload as unknown[]).length = 0;
            }
          } catch (err) {
            logger.error(`Backpressure task failed`, err);
            done = true;
            reject(err);
            return;
          } finally {
            activeCount--;
            if (global.gc && activeCount === 0) {
              global.gc();
            }
            tryNext();
          }
        };

        if (staggerMs > 0 && slot > 0) {
          setTimeout(execute, staggerMs * slot);
        } else {
          execute();
        }
      }
    };

    tryNext();
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
