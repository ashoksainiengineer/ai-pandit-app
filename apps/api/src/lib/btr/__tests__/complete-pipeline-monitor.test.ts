import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { executeSecondsPrecisionRectification } from '../../seconds-precision-btr.js';
import * as aiClient from '../../ai-client.js';
import { cleanup, initEphemerisProvider } from '../../ephemeris.js';
import type { SecondsPrecisionInput } from '@ai-pandit/shared';

vi.mock('../../cancellation-manager.js', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    isSessionCancelled: vi.fn().mockResolvedValue(false),
    throwIfCancelled: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Complete BTR Pipeline Monitor', () => {
  beforeAll(async () => {
    await initEphemerisProvider();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('runs complete pipeline with progress monitoring every 5 seconds', async () => {
    const progressLog: Array<{ stage: number; time: string; message: string }> = [];
    
    const callAISpy = vi.spyOn(aiClient as any, '_callAIWithStream').mockImplementation(
      (async (_sessionId: string, stage: number, _systemPrompt: string, userPrompt: string) => {
        const timestamp = new Date().toISOString();
        progressLog.push({ stage, time: timestamp, message: `Stage ${stage} prompt sent (${userPrompt.length} chars)` });
        
        if (stage === 2 || stage === 4) {
          const candidates = extractCandidateTimes(userPrompt);
          const ranked = [...candidates].sort((a, b) => a.localeCompare(b));
          const scored = ranked.map((time, index) => ({
            time,
            score: Math.max(40, 95 - index),
            reason: `stage-${stage}-rank-${index + 1}`,
          }));
          const survivors = ranked.slice(0, Math.max(1, Math.min(3, ranked.length)));
          
          progressLog.push({ stage, time: new Date().toISOString(), message: `Stage ${stage} complete: ${survivors.length} survivors from ${candidates.length} candidates` });
          
          return {
            success: true,
            content: `<FINAL_SCORES>${JSON.stringify(scored)}</FINAL_SCORES>\nTOP_SURVIVORS: [${survivors.join(', ')}]`,
          } as any;
        }

        if (stage === 6) {
          const candidates = extractCandidateTimes(userPrompt);
          const winner = candidates[0] || '10:00:00';
          progressLog.push({ stage, time: new Date().toISOString(), message: `Stage 6 complete: winner=${winner}` });
          return {
            success: true,
            content: `<FINAL_VERDICT>{"time": "${winner}", "accuracy": 96, "confidence": "HIGH", "margin": 8}</FINAL_VERDICT>`,
          } as any;
        }

        return { success: false, error: `Unsupported stage ${stage}` } as any;
      }) as any
    );

    const input: SecondsPrecisionInput = {
      sessionId: 'pipeline-monitor-session',
      dateOfBirth: '1990-01-01',
      tentativeTime: '10:00:00',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 5.5,
      offsetConfig: { preset: '30min', description: 'Pipeline monitor test' },
      lifeEvents: [
        {
          id: 'evt1',
          eventType: 'Marriage Ceremony',
          category: 'marriage',
          eventDate: '2015-06-15',
          datePrecision: 'exact_date',
          importance: 'critical',
          description: 'Formal marriage ceremony.',
        },
        {
          id: 'evt2',
          eventType: 'Started first job',
          category: 'career',
          eventDate: '2015-03-20',
          datePrecision: 'exact_date',
          importance: 'high',
          description: 'Joined first company.',
        },
        {
          id: 'evt3',
          eventType: 'Graduated college',
          category: 'education',
          eventDate: '2010-06-15',
          datePrecision: 'exact_date',
          importance: 'high',
          description: 'Completed graduation.',
        },
      ],
      abortSignal: new AbortController().signal,
    };

    const startTime = Date.now();
    
    // Progress monitor
    const monitorInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`[MONITOR] Elapsed: ${elapsed}s | Progress events: ${progressLog.length}`);
      const last5 = progressLog.slice(-5);
      last5.forEach(p => {
        console.log(`  [Stage ${p.stage}] ${p.message}`);
      });
    }, 5000);

    const result = await executeSecondsPrecisionRectification(input);
    
    clearInterval(monitorInterval);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n=== FINAL RESULT ===');
    console.log('Rectified Time:', result.rectifiedTime);
    console.log('Accuracy:', result.accuracy);
    console.log('Confidence:', result.confidence);
    console.log('Stages Completed:', result.stagesCompleted);
    console.log('Processing Time:', result.processingTimeMs, 'ms');
    console.log('Total Progress Events:', progressLog.length);
    
    console.log('\n=== STAGE BREAKDOWN ===');
    const stageCounts = progressLog.reduce((acc, p) => {
      acc[p.stage] = (acc[p.stage] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    Object.entries(stageCounts).forEach(([stage, count]) => {
      console.log(`Stage ${stage}: ${count} events`);
    });

    expect(result.stagesCompleted).toBe(6);
    expect(result.rectifiedTime).toBeTruthy();
    expect(result.accuracy).toBeGreaterThan(0);
    
    callAISpy.mockRestore();
  }, 300000);
});

function extractCandidateTimes(prompt: string): string[] {
  const matches = [...prompt.matchAll(/CANDIDATE:\s*(\d{2}:\d{2}:\d{2})/g)];
  return matches.map((m) => m[1]);
}
