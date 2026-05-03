import { describe, it, expect } from 'vitest';
import {
    FORENSIC_QUIZ_QUESTIONS,
    QUIZ_METADATA,
    EXCLUDED_FORENSIC_CATEGORIES,
    FORENSIC_ONLY_QUESTIONS,
    FORENSIC_ONLY_METADATA,
    getCategoryByQuestionId,
    getQuestionsByCategory,
    validateAnswer,
} from '../forensic-quiz/questions.js';

describe('Forensic Quiz Questions - Exports', () => {
    it('should export FORENSIC_QUIZ_QUESTIONS as a non-empty array', () => {
        expect(Array.isArray(FORENSIC_QUIZ_QUESTIONS)).toBe(true);
        expect(FORENSIC_QUIZ_QUESTIONS.length).toBeGreaterThan(0);
    });

    it('should have correct total question count matching metadata', () => {
        expect(FORENSIC_QUIZ_QUESTIONS.length).toBe(QUIZ_METADATA.totalQuestions);
    });

    it('should export QUIZ_METADATA with correct structure', () => {
        expect(QUIZ_METADATA).toBeDefined();
        expect(QUIZ_METADATA.totalQuestions).toBe(FORENSIC_QUIZ_QUESTIONS.length);
        expect(typeof QUIZ_METADATA.estimatedTimeMinutes).toBe('number');
        expect(Array.isArray(QUIZ_METADATA.categories)).toBe(true);
        expect(QUIZ_METADATA.categories.length).toBeGreaterThan(0);
    });

    it('should export EXCLUDED_FORENSIC_CATEGORIES array', () => {
        expect(Array.isArray(EXCLUDED_FORENSIC_CATEGORIES)).toBe(true);
        expect(EXCLUDED_FORENSIC_CATEGORIES).toContain('forehead');
        expect(EXCLUDED_FORENSIC_CATEGORIES).toContain('eyes');
        expect(EXCLUDED_FORENSIC_CATEGORIES).toContain('voice');
        expect(EXCLUDED_FORENSIC_CATEGORIES).toContain('marks');
    });

    it('should export FORENSIC_ONLY_QUESTIONS with fewer items', () => {
        expect(Array.isArray(FORENSIC_ONLY_QUESTIONS)).toBe(true);
        expect(FORENSIC_ONLY_QUESTIONS.length).toBeLessThan(FORENSIC_QUIZ_QUESTIONS.length);
    });

    it('should export FORENSIC_ONLY_METADATA with correct structure', () => {
        expect(FORENSIC_ONLY_METADATA).toBeDefined();
        expect(typeof FORENSIC_ONLY_METADATA.totalQuestions).toBe('number');
        expect(Array.isArray(FORENSIC_ONLY_METADATA.categories)).toBe(true);
    });
});

describe('Forensic Quiz Questions - getCategoryByQuestionId', () => {
    it('should return category for known question IDs', () => {
        expect(getCategoryByQuestionId('prakriti_q1')).toBe('prakriti');
        expect(getCategoryByQuestionId('forehead_q1')).toBe('forehead');
        expect(getCategoryByQuestionId('eyes_q1')).toBe('eyes');
        expect(getCategoryByQuestionId('family_q2')).toBe('family');
    });

    it('should return undefined for unknown question ID', () => {
        expect(getCategoryByQuestionId('nonexistent_q99')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
        expect(getCategoryByQuestionId('')).toBeUndefined();
    });
});

describe('Forensic Quiz Questions - getQuestionsByCategory', () => {
    it('should return questions for each category', () => {
        const prakritiQuestions = getQuestionsByCategory('prakriti');
        expect(prakritiQuestions.length).toBeGreaterThan(0);
        expect(prakritiQuestions.every(q => q.category === 'prakriti')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
        const unknown = getQuestionsByCategory('nonexistent_category');
        expect(unknown).toEqual([]);
    });

    it('should return all family questions', () => {
        const familyQuestions = getQuestionsByCategory('family');
        expect(familyQuestions.length).toBe(2);
    });
});

describe('Forensic Quiz Questions - validateAnswer', () => {
    it('should validate a correct single-option answer', () => {
        const result = validateAnswer('prakriti_q1', ['vata_weight']);
        expect(result.valid).toBe(true);
    });

    it('should return error for unknown question', () => {
        const result = validateAnswer('unknown_q', ['option1']);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Question not found');
    });

    it('should return error for invalid option', () => {
        const result = validateAnswer('prakriti_q1', ['invalid_option_id']);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid option');
    });

    it('should validate custom answer when allowed', () => {
        const result = validateAnswer('prakriti_q1', [], 'My custom answer');
        expect(result.valid).toBe(true);
    });

    it('should return error when no selection and no custom answer', () => {
        const result = validateAnswer('prakriti_q1', []);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('select an option');
    });
});

describe('Forensic Quiz Questions - Question Structure', () => {
    it('every question should have required fields', () => {
        for (const q of FORENSIC_QUIZ_QUESTIONS) {
            expect(q.id).toBeDefined();
            expect(q.category).toBeDefined();
            expect(q.question).toBeDefined();
            expect(Array.isArray(q.options)).toBe(true);
            expect(q.options.length).toBeGreaterThan(0);
            expect(typeof q.allowMultiple).toBe('boolean');
        }
    });

    it('every option should have id and label', () => {
        for (const q of FORENSIC_QUIZ_QUESTIONS) {
            for (const opt of q.options) {
                expect(opt.id).toBeDefined();
                expect(opt.label).toBeDefined();
            }
        }
    });

    it('should have prakriti questions with doshaScore', () => {
        const prakritiQuestions = getQuestionsByCategory('prakriti');
        expect(prakritiQuestions.length).toBeGreaterThan(0);
        for (const q of prakritiQuestions) {
            for (const opt of q.options) {
                expect(opt.doshaScore).toBeDefined();
            }
        }
    });
});
