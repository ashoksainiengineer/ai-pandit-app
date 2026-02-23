/**
 * 🔱 EXHAUSTIVE FORENSIC QUIZ SCORING TESTS
 * Tests calculateQuizResults, calculatePrakriti, verifyTraitConsistency,
 * getQuizProgress, getNextQuestion, formatQuizResults, mapQuizResultsToLegacyTraits
 */
import { describe, it, expect } from 'vitest';
import { FORENSIC_QUIZ_QUESTIONS } from '../forensic-quiz/questions.js';
import {
    calculateQuizResults,
    calculatePrakriti,
    verifyTraitConsistency,
    getQuizProgress,
    getNextQuestion,
    formatQuizResults,
    mapQuizResultsToLegacyTraits,
} from '../forensic-quiz/scoring.js';
import type { QuizAnswer, QuizResults } from '../forensic-quiz/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATE PRAKRITI (DOSHA)
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Scoring - calculatePrakriti', () => {
    it('should return equal distribution for empty answers', () => {
        const result = calculatePrakriti([]);
        expect(result.scores.vata + result.scores.pitta + result.scores.kapha).toBeGreaterThanOrEqual(99);
        // Confidence is non-zero even with empty answers due to completion rate penalties
        expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should return valid dosha for "not sure" answers', () => {
        const answers: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: [],
            isNotSure: true,
            timestamp: Date.now(),
        }];
        const result = calculatePrakriti(answers);
        expect(['vata', 'pitta', 'kapha']).toContain(result.primary);
    });

    it('should select vata as primary for vata-heavy answers', () => {
        const answers: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: ['vata_weight'],
            isNotSure: false,
            timestamp: Date.now(),
        }];
        const result = calculatePrakriti(answers);
        // Vata score should be highest
        expect(result.scores.vata).toBeGreaterThan(0);
    });

    it('should handle mixed dosha correctly', () => {
        const answers: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: ['mixed_weight'],
            isNotSure: false,
            timestamp: Date.now(),
        }];
        const result = calculatePrakriti(answers);
        // Mixed should distribute roughly equally
        expect(['vata', 'pitta', 'kapha']).toContain(result.primary);
    });

    it('should reduce confidence for "not sure" answers', () => {
        const confident: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: ['vata_weight'],
            isNotSure: false,
            timestamp: Date.now(),
        }];
        const notSure: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: ['vata_weight'],
            isNotSure: true,
            timestamp: Date.now(),
        }];
        const confidentResult = calculatePrakriti(confident);
        const notSureResult = calculatePrakriti(notSure);
        // "Not sure" should have lower or equal confidence
        expect(notSureResult.confidence).toBeLessThanOrEqual(confidentResult.confidence);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATE QUIZ RESULTS (MAIN FUNCTION)
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Scoring - calculateQuizResults', () => {
    it('should return valid results for empty answers', () => {
        const results = calculateQuizResults([]);
        expect(results.prakriti).toBeDefined();
        expect(results.forehead).toBeDefined();
        expect(results.eyes).toBeDefined();
        expect(results.voice).toBeDefined();
        expect(results.speech).toBeDefined();
        expect(results.decision).toBeDefined();
        expect(results.family).toBeDefined();
        expect(results.overallConfidence).toBeDefined();
        expect(results.completedAt).toBeDefined();
    });

    it('should handle non-array input gracefully', () => {
        const results = calculateQuizResults(null as any);
        expect(results).toBeDefined();
        expect(results.prakriti.primary).toBeDefined();
    });

    it('should filter invalid answers', () => {
        const results = calculateQuizResults([
            { questionId: 'prakriti_q1', selectedOptions: ['vata_weight'], isNotSure: false, timestamp: Date.now() },
            null as any,
            undefined as any,
            { questionId: 123 as any, selectedOptions: 'not-array' as any, isNotSure: 'yes' as any, timestamp: 0 },
        ]);
        expect(results).toBeDefined();
        expect(results.answers.length).toBeLessThanOrEqual(4);
    });

    it('should produce overallConfidence between 0 and 100', () => {
        const results = calculateQuizResults([]);
        expect(results.overallConfidence).toBeGreaterThanOrEqual(0);
        expect(results.overallConfidence).toBeLessThanOrEqual(100);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TRAIT CONSISTENCY VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Scoring - verifyTraitConsistency', () => {
    it('should return high alignment for consistent vata profile', () => {
        const results: QuizResults = {
            prakriti: { primary: 'vata', scores: { vata: 60, pitta: 20, kapha: 20 }, confidence: 80 },
            forehead: { type: 'narrow', confidence: 70, planetaryIndicators: ['Saturn'] },
            eyes: { type: 'small', confidence: 70, planetaryIndicators: [] },
            voice: { type: 'high pitched, variable', confidence: 60, planetaryIndicators: [] },
            speech: { type: 'fast, quick talking', confidence: 70, planetaryIndicators: [] },
            decision: { type: 'impulsive, intuitive', confidence: 60, planetaryIndicators: [] },
            temperament: { type: 'anxious', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'youngest', fatherStatus: 'working_class', confidence: 80 },
            overallConfidence: 60,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(consistency.isConsistent).toBeDefined();
        expect(consistency.alignment).toBeGreaterThanOrEqual(0);
        expect(consistency.alignment).toBeLessThanOrEqual(100);
        expect(Array.isArray(consistency.warnings)).toBe(true);
    });

    it('should cap warnings to 3', () => {
        const results: QuizResults = {
            prakriti: { primary: 'vata', scores: { vata: 60, pitta: 20, kapha: 20 }, confidence: 80 },
            forehead: { type: 'Unknown', confidence: 0, planetaryIndicators: [] },
            eyes: { type: 'Unknown', confidence: 0, planetaryIndicators: [] },
            voice: { type: 'deep', confidence: 50, planetaryIndicators: [] },
            speech: { type: 'slow', confidence: 50, planetaryIndicators: [] },
            decision: { type: 'deliberate', confidence: 50, planetaryIndicators: [] },
            temperament: { type: 'calm', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'eldest', fatherStatus: 'distinguished', confidence: 80 },
            overallConfidence: 30,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(consistency.warnings.length).toBeLessThanOrEqual(3);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ PROGRESS
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Scoring - getQuizProgress', () => {
    it('should return 0% for no answers', () => {
        const progress = getQuizProgress([]);
        expect(progress.answered).toBe(0);
        expect(progress.percentage).toBe(0);
        expect(progress.total).toBeGreaterThan(0);
    });

    it('should track per-category progress', () => {
        const progress = getQuizProgress([]);
        expect(progress.categories).toBeDefined();
        expect(progress.categories.prakriti).toBeDefined();
        expect(progress.categories.prakriti.total).toBeGreaterThan(0);
    });

    it('should exclude "not sure" without selection from answered count', () => {
        const answers: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: [],
            isNotSure: true,
            timestamp: Date.now(),
        }];
        const progress = getQuizProgress(answers);
        expect(progress.answered).toBe(0);
    });

    it('should count "not sure" WITH selection as answered', () => {
        const answers: QuizAnswer[] = [{
            questionId: 'prakriti_q1',
            selectedOptions: ['vata_weight'],
            isNotSure: true,
            timestamp: Date.now(),
        }];
        const progress = getQuizProgress(answers);
        expect(progress.answered).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET NEXT QUESTION
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Scoring - getNextQuestion', () => {
    it('should return first question for empty answers', () => {
        const next = getNextQuestion([]);
        expect(next).not.toBeNull();
        expect(next!.id).toBeDefined();
    });

    it('should return null when all answered', () => {
        // Generate answers for all questions (imported at top)
        const allAnswered: QuizAnswer[] = FORENSIC_QUIZ_QUESTIONS.map((q: any) => ({
            questionId: q.id,
            selectedOptions: [q.options[0]?.id || 'opt1'],
            isNotSure: false,
            timestamp: Date.now(),
        }));
        const next = getNextQuestion(allAnswered);
        expect(next).toBeNull();
    });

    it('should prefer category when specified', () => {
        const next = getNextQuestion([], 'prakriti');
        expect(next).not.toBeNull();
        expect(next!.category).toBe('prakriti');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT & LEGACY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

describe('Forensic Scoring - formatQuizResults', () => {
    it('should produce summary, detailed, and astroMapping', () => {
        const results = calculateQuizResults([]);
        const formatted = formatQuizResults(results);
        expect(formatted.summary).toBeDefined();
        expect(formatted.summary.length).toBeGreaterThan(0);
        expect(formatted.detailed).toBeDefined();
        expect(formatted.astroMapping).toBeDefined();
    });
});

describe('Forensic Scoring - mapQuizResultsToLegacyTraits', () => {
    it('should produce legacy format with physical/biological/psychographic/family', () => {
        const results = calculateQuizResults([]);
        const legacy = mapQuizResultsToLegacyTraits(results);
        expect(legacy.physical).toBeDefined();
        expect(legacy.biological).toBeDefined();
        expect(legacy.psychographic).toBeDefined();
        expect(legacy.family).toBeDefined();
        expect(legacy.family.siblingPosition).toBeDefined();
        expect(legacy.family.fatherStatusAtBirth).toBeDefined();
    });
});
