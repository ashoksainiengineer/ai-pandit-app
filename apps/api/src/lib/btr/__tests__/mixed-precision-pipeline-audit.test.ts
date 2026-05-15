import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { executeSecondsPrecisionRectification } from '../../seconds-precision-btr.js';
import * as aiClient from '../../ai-client.js';
import { cleanup, initEphemerisProvider } from '../../ephemeris.js';
import type { SecondsPrecisionInput } from '@ai-pandit/shared';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

type CapturedPrompt = { stage: number; prompt: string };

type StageAuditBatch = {
  candidateCount: number;
  markerCounts: Record<string, number>;
  missingEventTypes: string[];
  missingWindows: string[];
  missingTimeTokens: string[];
};

type StageAuditReport = {
  promptCount: number;
  batches: StageAuditBatch[];
};

const VSL_MARKERS = ['#V|', '#K|', '#D|'];

function extractCandidateTimes(prompt: string): string[] {
  const matches = [...prompt.matchAll(/CANDIDATE:\s*(\d{2}:\d{2}:\d{2})/g)];
  return matches.map((m) => m[1]);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

describe('Mixed-Precision Pipeline Audit (Stage payload continuity)', () => {
  beforeAll(async () => {
    await initEphemerisProvider();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('preserves full mixed-precision life-event context and VSL payload across Stage 2/4/6 prompts', async () => {
    const capturedPrompts: CapturedPrompt[] = [];

    const callAISpy = vi.spyOn(aiClient as any, '_callAIWithStream').mockImplementation(
      (async (_sessionId: string, stage: number, _systemPrompt: string, userPrompt: string) => {
        capturedPrompts.push({ stage, prompt: userPrompt });

        if (stage === 2 || stage === 4) {
          const candidates = extractCandidateTimes(userPrompt);
          const ranked = [...candidates].sort((a, b) => a.localeCompare(b));
          const scored = ranked.map((time, index) => ({
            time,
            score: Math.max(40, 95 - index),
            reason: `mixed-audit-rank-${index + 1}`,
          }));
          const survivors = ranked.slice(0, Math.max(1, Math.min(3, ranked.length)));

          return {
            success: true,
            content: `<FINAL_SCORES>${JSON.stringify(scored)}</FINAL_SCORES>\nTOP_SURVIVORS: [${survivors.join(', ')}]`,
          } as any;
        }

        if (stage === 6) {
          const candidates = extractCandidateTimes(userPrompt);
          const winner = candidates[0] || '10:00:00';
          return {
            success: true,
            content: `<FINAL_VERDICT>{"time": "${winner}", "accuracy": 96, "confidence": "HIGH", "margin": 8}</FINAL_VERDICT>`,
          } as any;
        }

        return { success: false, error: `Unsupported stage ${stage}` } as any;
      }) as any
    );

    const input: SecondsPrecisionInput = {
      sessionId: 'mixed-precision-audit-session',
      dateOfBirth: '1990-01-01',
      tentativeTime: '10:00:00',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 5.5,
      offsetConfig: { preset: '30min', description: 'Mixed precision audit run' },
      lifeEvents: [
        {
          id: 'evt_exact_dt',
          eventType: 'Surgery Procedure',
          category: 'health',
          eventDate: '2012-07-15',
          eventTime: '14:30:00',
          datePrecision: 'exact_date_time',
          importance: 'critical',
          description: 'Hospital surgery with exact timestamp.',
        },
        {
          id: 'evt_exact',
          eventType: 'Marriage Ceremony',
          category: 'marriage',
          eventDate: '2015-06-15',
          datePrecision: 'exact_date',
          importance: 'critical',
          description: 'Formal marriage ceremony.',
        },
        {
          id: 'evt_month',
          eventType: 'Job Change Month',
          category: 'career',
          eventDate: '2018-09',
          datePrecision: 'month_year',
          importance: 'high',
          description: 'Job change during September 2018.',
        },
        {
          id: 'evt_month_range',
          eventType: 'Foreign Assignment Window',
          category: 'travel',
          eventDate: '2019-03',
          endDate: '2019-06',
          datePrecision: 'month_range',
          importance: 'high',
          description: 'Foreign posting across a quarter.',
        },
        {
          id: 'evt_date_range',
          eventType: 'Legal Case Duration',
          category: 'legal',
          eventDate: '2020-02-10',
          endDate: '2020-02-20',
          datePrecision: 'date_range',
          importance: 'medium',
          description: 'Court hearing cycle spread over several days.',
        },
        {
          id: 'evt_year_range',
          eventType: 'Education Phase',
          category: 'education',
          eventDate: '2001',
          endDate: '2003',
          datePrecision: 'year_range',
          importance: 'medium',
          description: 'Longer educational period with uncertain exact dates.',
        },
      ],
      abortSignal: new AbortController().signal,
    };

    const result = await executeSecondsPrecisionRectification(input);

    expect(result.stagesCompleted).toBe(6);
    expect(capturedPrompts.length).toBeGreaterThan(0);

    const expectedEventTypes = input.lifeEvents.map((event) => event.eventType);
    const expectedWindows = [
      'Event Window: 2012-07-15',
      'Event Window: 2015-06-15',
      'Event Window: 2018-09-01 -> 2018-09-30',
      'Event Window: 2019-03-01 -> 2019-06-30',
      'Event Window: 2020-02-10 -> 2020-02-20',
      'Event Window: 2001-01-01 -> 2003-12-31',
    ];
    const expectedTimeTokens = ['14:30:00'];

    const stageReports: Record<string, StageAuditReport> = {};

    for (const stage of [2, 4, 6] as const) {
      const stagePrompts = capturedPrompts.filter((entry) => entry.stage === stage);
      expect(stagePrompts.length).toBeGreaterThan(0);

      const batches: StageAuditBatch[] = stagePrompts.map(({ prompt }) => {
        const candidateCount = extractCandidateTimes(prompt).length;
        const markerCounts = Object.fromEntries(VSL_MARKERS.map((marker) => [marker, countOccurrences(prompt, marker)]));

        const missingEventTypes = expectedEventTypes.filter((eventType) => !prompt.includes(eventType));
        const missingWindows = expectedWindows.filter((windowText) => !prompt.includes(windowText));
        const missingTimeTokens = expectedTimeTokens.filter((token) => !prompt.includes(token));

        return { candidateCount, markerCounts, missingEventTypes, missingWindows, missingTimeTokens };
      });

      for (const batch of batches) {
        if (batch.candidateCount === 0) continue;
        expect(batch.missingEventTypes).toHaveLength(0);
        expect(batch.missingWindows).toHaveLength(0);
        expect(batch.missingTimeTokens).toHaveLength(0);
        for (const marker of VSL_MARKERS) {
          expect(batch.markerCounts[marker]).toBeGreaterThanOrEqual(1);
        }
      }

      stageReports[`stage${stage}`] = {
        promptCount: stagePrompts.length,
        batches,
      };
    }

    const repoRoot = resolve(process.cwd(), '..', '..');
    const reportDir = resolve(repoRoot, 'docs', 'audits');
    const jsonPath = resolve(reportDir, 'BTR_MIXED_PRECISION_STAGE_AUDIT_2026-03-09.json');
    const mdPath = resolve(reportDir, 'BTR_MIXED_PRECISION_STAGE_AUDIT_2026-03-09.md');
    mkdirSync(reportDir, { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(stageReports, null, 2), 'utf8');

    const stageSummary = Object.entries(stageReports)
      .map(([stageName, data]) => {
        const minCandidates = Math.min(...data.batches.map((b) => b.candidateCount));
        const maxCandidates = Math.max(...data.batches.map((b) => b.candidateCount));
        return `- ${stageName}: prompts=${data.promptCount}, batches=${data.batches.length}, candidates(min-max)=${minCandidates}-${maxCandidates}`;
      })
      .join('\n');

    const markdown = `# BTR Mixed Precision Stage Audit (2026-03-09)

${stageSummary}

## Validation Rules
- Every Stage 2/4/6 batch prompt must include all mixed-precision event types
- Every Stage 2/4/6 batch prompt must include all expected event windows
- Every Stage 2/4/6 batch prompt must preserve exact event-time tokens for exact-date-time inputs
- Every Stage 2/4/6 batch prompt must include VSL payload markers: ${VSL_MARKERS.join(', ')}

## Result
- PASS

See JSON details: \`${jsonPath}\`
`;
    writeFileSync(mdPath, markdown, 'utf8');

    callAISpy.mockRestore();
  }, 180000);
});
