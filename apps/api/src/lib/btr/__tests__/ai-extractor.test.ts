import { describe, it, expect } from 'vitest';
import { extractBatchSurvivors, extractFinalVerdict } from '../extractors/ai-response-extractors.js';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE L: EXTRACTION INTEGRITY — ai-extractor.test.ts
// ═══════════════════════════════════════════════════════════════════════════

describe('🧠 Phase L: AI Transformation & Resilience — Extraction Integrity', () => {

    describe('extractBatchSurvivors', () => {
        const candidateTimes = ['12:00:00', '12:01:00', '12:02:00'];

        it('should prioritize XML <FINAL_SCORES> tags over raw text', () => {
            const aiContent = `
                Some conversational fluff...
                CANDIDATE: [12:00:00] SCORE: 10
                <FINAL_SCORES>
                [
                    {"time": "12:00:00", "score": 95, "reason": "XML standard"},
                    {"time": "12:01:00", "score": 85, "reason": "XML high"}
                ]
                </FINAL_SCORES>
            `;
            const results = extractBatchSurvivors(aiContent, candidateTimes, 2);
            expect(results.find((r: any) => r.time === '12:00:00')?.score).toBe(95);
        });

        it('should fallback to Regex if XML is malformed or missing', () => {
            const aiContent = `
                CANDIDATE: [12:00:00] -- This time is good. SCORE: 88. REASON: Strong dasha alignment.
                [12:01:00] | SCORE: 42 | REASON: Poor varga strength.
            `;
            const results = extractBatchSurvivors(aiContent, candidateTimes, 2);
            expect(results.find((r: any) => r.time === '12:00:00')?.score).toBe(88);
            expect(results.find((r: any) => r.time === '12:00:00')?.reason).toContain('Strong dasha');
        });

        it('should handle hallucinated times by matching to nearest valid candidate', () => {
            const aiContent = `SCORE: 90 for the time 12:00:02`; // Off by 2 seconds
            const results = extractBatchSurvivors(aiContent, candidateTimes, 1);
            expect(results.find((r: any) => r.time === '12:00:00')?.score).toBe(90);
        });
    });

    describe('extractFinalVerdict', () => {
        it('should extract structured verdict from XML tags', () => {
            const aiContent = `
                <FINAL_VERDICT>
                {
                    "time": "12:05:30",
                    "accuracy": 98,
                    "confidence": "HIGH",
                    "margin": 2
                }
                </FINAL_VERDICT>
            `;
            const verdict = extractFinalVerdict(aiContent);
            expect(verdict?.time).toBe('12:05:30');
            expect(verdict?.accuracy).toBe(98);
        });

        it('should fallback to keyword-based regex for non-standard output', () => {
            const aiContent = `
                The final rectified birth time is determined to be 10:20:30.
                Accuracy level: 92%.
                Confidence: high.
                Error margin: ±5 seconds.
            `;
            const verdict = extractFinalVerdict(aiContent);
            expect(verdict?.time).toBe('10:20:30');
            expect(verdict?.accuracy).toBe(92);
        });
    });
});
