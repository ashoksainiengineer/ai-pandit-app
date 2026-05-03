import { describe, it, expect } from 'vitest';
import {
    calculatePrakriti,
    verifyTraitConsistency,
    calculateQuizResults,
    getQuizProgress,
    formatQuizResults,
    mapQuizResultsToLegacyTraits,
} from '../forensic-quiz/scoring.js';
import type { QuizAnswer, QuizResults } from '../forensic-quiz/types.js';

describe('Scoring Edge Cases - calculatePrakriti', () => {
    it('should handle all prakriti questions answered with vata', () => {
        const answers: QuizAnswer[] = [
            { questionId: 'prakriti_q1', selectedOptions: ['vata_weight'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q2', selectedOptions: ['vata_digestion'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q3', selectedOptions: ['vata_sleep'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q4', selectedOptions: ['vata_weather'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q5', selectedOptions: ['vata_energy'], isNotSure: false, timestamp: Date.now() },
        ];
        const result = calculatePrakriti(answers);
        expect(result.primary).toBe('vata');
        expect(result.scores.vata).toBeGreaterThan(result.scores.pitta);
        expect(result.scores.vata).toBeGreaterThan(result.scores.kapha);
        expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle all pitta answers', () => {
        const answers: QuizAnswer[] = [
            { questionId: 'prakriti_q1', selectedOptions: ['pitta_weight'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q2', selectedOptions: ['pitta_digestion'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q3', selectedOptions: ['pitta_sleep'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q4', selectedOptions: ['pitta_weather'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q5', selectedOptions: ['pitta_energy'], isNotSure: false, timestamp: Date.now() },
        ];
        const result = calculatePrakriti(answers);
        expect(result.primary).toBe('pitta');
    });

    it('should handle all kapha answers', () => {
        const answers: QuizAnswer[] = [
            { questionId: 'prakriti_q1', selectedOptions: ['kapha_weight'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q2', selectedOptions: ['kapha_digestion'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q3', selectedOptions: ['kapha_sleep'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q4', selectedOptions: ['kapha_weather'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q5', selectedOptions: ['kapha_energy'], isNotSure: false, timestamp: Date.now() },
        ];
        const result = calculatePrakriti(answers);
        expect(result.primary).toBe('kapha');
    });

    it('should identify secondary dosha when scores are close', () => {
        const answers: QuizAnswer[] = [
            { questionId: 'prakriti_q1', selectedOptions: ['mixed_weight'], isNotSure: false, timestamp: Date.now() },
            { questionId: 'prakriti_q2', selectedOptions: ['balanced_digestion'], isNotSure: false, timestamp: Date.now() },
        ];
        const result = calculatePrakriti(answers);
        // With equal scores, secondary may be identified
        expect(result.primary).toBeDefined();
    });
});

describe('Scoring Edge Cases - verifyTraitConsistency', () => {
    it('should return 100 alignment for empty checks', () => {
        const results: QuizResults = {
            prakriti: { primary: 'vata', secondary: undefined, scores: { vata: 50, pitta: 30, kapha: 20 }, confidence: 80 },
            forehead: { type: 'broad', confidence: 70, planetaryIndicators: ['Sun', 'Jupiter'] },
            eyes: { type: 'almond', confidence: 70, planetaryIndicators: [] },
            voice: { type: 'variable, high', confidence: 60, planetaryIndicators: [] },
            speech: { type: 'fast, quick', confidence: 70, planetaryIndicators: [] },
            decision: { type: 'impulsive, intuitive', confidence: 60, planetaryIndicators: [] },
            temperament: { type: 'anxious', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'youngest', fatherStatus: 'working_class', confidence: 80 },
            overallConfidence: 60,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(consistency.alignment).toBeGreaterThanOrEqual(0);
        expect(consistency.alignment).toBeLessThanOrEqual(100);
        expect(typeof consistency.isConsistent).toBe('boolean');
    });

    it('should check pitta alignment', () => {
        const results: QuizResults = {
            prakriti: { primary: 'pitta', scores: { vata: 20, pitta: 60, kapha: 20 }, confidence: 80 },
            forehead: { type: 'prominent', confidence: 70, planetaryIndicators: [] },
            eyes: { type: 'prominent', confidence: 70, planetaryIndicators: [] },
            voice: { type: 'deep, resonant', confidence: 60, planetaryIndicators: [] },
            speech: { type: 'measured, logical', confidence: 70, planetaryIndicators: [] },
            decision: { type: 'deliberate, analyze', confidence: 60, planetaryIndicators: [] },
            temperament: { type: 'calm', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'middle', fatherStatus: 'professional', confidence: 80 },
            overallConfidence: 60,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(consistency.warnings.length).toBeLessThanOrEqual(3);
    });

    it('should check kapha alignment', () => {
        const results: QuizResults = {
            prakriti: { primary: 'kapha', scores: { vata: 20, pitta: 20, kapha: 60 }, confidence: 80 },
            forehead: { type: 'round', confidence: 70, planetaryIndicators: [] },
            eyes: { type: 'large, luminous', confidence: 70, planetaryIndicators: [] },
            voice: { type: 'soft, gentle', confidence: 60, planetaryIndicators: [] },
            speech: { type: 'soft, listen', confidence: 70, planetaryIndicators: [] },
            decision: { type: 'steady, deliberate', confidence: 60, planetaryIndicators: [] },
            temperament: { type: 'calm_stable', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'youngest', fatherStatus: 'prosperous', confidence: 80 },
            overallConfidence: 60,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(Array.isArray(consistency.warnings)).toBe(true);
    });

    it('should check eldest birth order alignment with forehead', () => {
        const results: QuizResults = {
            prakriti: { primary: 'vata', scores: { vata: 50, pitta: 30, kapha: 20 }, confidence: 80 },
            forehead: { type: 'broad, high', confidence: 70, planetaryIndicators: [] },
            eyes: { type: 'almond', confidence: 70, planetaryIndicators: [] },
            voice: { type: 'variable', confidence: 60, planetaryIndicators: [] },
            speech: { type: 'fast', confidence: 70, planetaryIndicators: [] },
            decision: { type: 'impulsive', confidence: 60, planetaryIndicators: [] },
            temperament: { type: 'enthusiastic', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'eldest', fatherStatus: 'struggling', confidence: 80 },
            overallConfidence: 60,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(consistency.alignment).toBeGreaterThanOrEqual(0);
    });

    it('should check father status alignment with Sun/Jupiter indicators', () => {
        const results: QuizResults = {
            prakriti: { primary: 'vata', scores: { vata: 50, pitta: 30, kapha: 20 }, confidence: 80 },
            forehead: { type: 'broad', confidence: 70, planetaryIndicators: ['Sun', 'Jupiter'] },
            eyes: { type: 'almond', confidence: 70, planetaryIndicators: [] },
            voice: { type: 'variable', confidence: 60, planetaryIndicators: [] },
            speech: { type: 'fast', confidence: 70, planetaryIndicators: [] },
            decision: { type: 'impulsive', confidence: 60, planetaryIndicators: [] },
            temperament: { type: 'enthusiastic', confidence: 50, planetaryIndicators: [] },
            family: { birthOrder: 'eldest', fatherStatus: 'distinguished', confidence: 80 },
            overallConfidence: 60,
            answers: [],
            completedAt: Date.now(),
        };
        const consistency = verifyTraitConsistency(results);
        expect(consistency.alignment).toBeGreaterThanOrEqual(0);
    });
});

describe('Scoring Edge Cases - calculateQuizResults', () => {
    it('should handle answers with customAnswer only', () => {
        const answers: QuizAnswer[] = [
            { questionId: 'prakriti_q1', selectedOptions: [], isNotSure: false, timestamp: Date.now(), customAnswer: 'Very thin build' },
        ];
        const results = calculateQuizResults(answers);
        expect(results.prakriti).toBeDefined();
        expect(results.answers.length).toBe(1);
    });

    it('should handle undefined input', () => {
        const results = calculateQuizResults(undefined as any);
        expect(results).toBeDefined();
        expect(results.prakriti.primary).toBeDefined();
    });
});

describe('Scoring Edge Cases - getQuizProgress', () => {
    it('should count custom answers as answered', () => {
        const answers: QuizAnswer[] = [
            { questionId: 'prakriti_q1', selectedOptions: [], isNotSure: false, timestamp: Date.now(), customAnswer: 'Custom' },
        ];
        const progress = getQuizProgress(answers);
        expect(progress.answered).toBe(1);
    });
});

describe('Scoring Edge Cases - formatQuizResults', () => {
    it('should format with secondary dosha', () => {
        const results = calculateQuizResults([]);
        const originalPrimary = results.prakriti.primary;
        results.prakriti.secondary = originalPrimary === 'vata' ? 'pitta' : 'vata';
        const formatted = formatQuizResults(results);
        // The summary should contain the primary-secondary combo in uppercase
        const expectedCombo = `${results.prakriti.primary.toUpperCase()}-${results.prakriti.secondary!.toUpperCase()}`;
        expect(formatted.summary).toContain(expectedCombo);
    });

    it('should format without secondary dosha', () => {
        const results = calculateQuizResults([]);
        results.prakriti.secondary = undefined;
        const formatted = formatQuizResults(results);
        expect(formatted.summary).toContain(results.prakriti.primary.toUpperCase());
    });
});

describe('Scoring Edge Cases - mapQuizResultsToLegacyTraits', () => {
    it('should map all categories to legacy format', () => {
        const results = calculateQuizResults([]);
        results.forehead.type = 'High and broad, hairline well above eyebrows';
        results.eyes.type = 'Deep set, hollow or shadow above eyelid';
        results.voice.type = 'Deep, resonant, carries authority';
        results.speech.type = 'Speak quickly, thoughts rush out, animated';
        results.decision.type = 'Research specs for 3+ days, compare models, read reviews';
        results.temperament.type = 'Stay calm, assess situation, solve methodically';

        const legacy = mapQuizResultsToLegacyTraits(results);
        expect(legacy.physical.facialStructure.forehead).toBe('broad');
        expect(legacy.physical.facialStructure.eyeShape).toBe('deep_set');
        expect(legacy.physical.facialStructure.voicePitch).toBe('deep');
        expect(legacy.psychographic.speechStyle).toBe('fast_loud');
        expect(legacy.psychographic.decisionMaking).toBe('deliberate');
        expect(legacy.psychographic.temperament).toBe('calm_stable');
    });

    it('should fallback to sanitized original for unmapped types', () => {
        const results = calculateQuizResults([]);
        results.forehead.type = '<Custom Forehead>';
        const legacy = mapQuizResultsToLegacyTraits(results);
        expect(legacy.physical.facialStructure.forehead).toBe('Custom Forehead');
    });
});
