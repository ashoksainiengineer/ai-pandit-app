import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQuizEngine } from '../hooks/useQuizEngine';

// Mock the questions to have a stable test environment
vi.mock('@/lib/forensic-quiz/questions', () => {
    const questions = [
        {
            id: 'q1',
            text: 'Question 1',
            category: 'Category 1',
            options: [
                { id: 'opt1', text: 'Option 1', score: 10 },
                { id: 'o2', text: 'Option 2', score: 5 },
            ],
            allowMultiple: false
        },
        {
            id: 'q2',
            text: 'Question 2',
            category: 'Category 2',
            options: [
                { id: 'opt2', text: 'Option 2', score: 10 },
                { id: 'o4', text: 'Option 4', score: 5 },
            ],
            allowMultiple: true
        }
    ];
    return {
        FORENSIC_QUIZ_QUESTIONS: questions,
        FORENSIC_ONLY_QUESTIONS: questions,
        FORENSIC_ONLY_METADATA: { categories: [] }
    };
});

describe('useQuizEngine', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useQuizEngine({
            onComplete: vi.fn(),
            sessionId: 'test-session'
        }));

        expect(result.current.currentQuestionIndex).toBe(0);
        expect(result.current.answers).toEqual([]);
        expect(result.current.quizStarted).toBe(false);
    });

    it('handles option selection and next question', () => {
        const { result } = renderHook(() => useQuizEngine({
            onComplete: vi.fn(),
            sessionId: 'test-session'
        }));

        act(() => {
            result.current.recordQuizAnswer('opt1');
        });

        expect(result.current.answers.length).toBe(1);
        expect(result.current.answers[0].selectedOptions).toContain('opt1');

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.currentQuestionIndex).toBe(1);
    });

    it('prevents next if no answer selected', () => {
        const { result } = renderHook(() => useQuizEngine({
            onComplete: vi.fn(),
            sessionId: 'test-session'
        }));

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.error).toBe('Please select an option or choose "Not sure"');
        expect(result.current.currentQuestionIndex).toBe(0); // Did not advance
    });

    it('allows multiple selections if allowMultiple is true', () => {
        const { result } = renderHook(() => useQuizEngine({
            onComplete: vi.fn(),
            sessionId: 'test-session'
        }));

        // Go to Q2 which allows multiple
        act(() => {
            result.current.recordQuizAnswer('opt1');
        });
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.currentQuestionIndex).toBe(1);

        act(() => {
            result.current.recordQuizAnswer('opt2');
        });

        act(() => {
            // Toggle it off
            result.current.recordQuizAnswer('opt2');
        });

        expect(result.current.answers[1].selectedOptions).toEqual([]);
    });
});
