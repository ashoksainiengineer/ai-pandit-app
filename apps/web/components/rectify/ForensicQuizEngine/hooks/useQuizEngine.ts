import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { QuizAnswer, QuizResults } from '@/lib/forensic-quiz/types';
import { FORENSIC_ONLY_QUESTIONS as FORENSIC_QUIZ_QUESTIONS } from '@/lib/forensic-quiz/questions';
import { calculateQuizResults, getQuizProgress } from '@/lib/forensic-quiz/scoring';
import { ForensicQuizEngineProps, SaveStatus } from '../types';
import { getStorageKey } from '../constants';
import { useDebounce } from './useDebounce';

export function useQuizEngine({
    onComplete,
    onAutoSave,
    initialResults,
    sessionId
}: Omit<ForensicQuizEngineProps, 'onCancel'>) {
    const loadSavedProgress = useCallback(() => {
        if (typeof window === 'undefined') return null;
        try {
            const saved = localStorage.getItem(getStorageKey(sessionId));
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.answers && Array.isArray(parsed.answers)) {
                    return {
                        answers: parsed.answers,
                        currentQuestionIndex: Math.max(0, Math.min(
                            parsed.currentQuestionIndex || 0,
                            FORENSIC_QUIZ_QUESTIONS.length - 1
                        )),
                        timestamp: parsed.timestamp || Date.now()
                    };
                }
            }
        } catch (e) {
            console.error('Error loading quiz progress:', e);
        }
        return null;
    }, [sessionId]);

    const getInitialState = () => {
        if (initialResults?.answers && initialResults.answers.length > 0) {
            return {
                answers: initialResults.answers,
                currentIndex: 0,
                fromStorage: false
            };
        }

        const saved = loadSavedProgress();
        if (saved && saved.answers.length > 0) {
            return {
                answers: saved.answers,
                currentIndex: saved.currentQuestionIndex,
                fromStorage: true
            };
        }

        return {
            answers: [],
            currentIndex: 0,
            fromStorage: false
        };
    };

    const initialState = getInitialState();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialState.currentIndex);
    const [answers, setAnswers] = useState<QuizAnswer[]>(initialState.answers);
    const [showResults, setShowResults] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizStarted, setQuizStarted] = useState(initialState.fromStorage || initialState.answers.length > 0);
    const [customAnswer, setCustomAnswer] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(initialState.fromStorage ? new Date() : null);
    const [error, setError] = useState<string | null>(null);

    const currentQuestion = useMemo(() => {
        if (currentQuestionIndex < 0 || currentQuestionIndex >= FORENSIC_QUIZ_QUESTIONS.length) {
            return null;
        }
        return FORENSIC_QUIZ_QUESTIONS[currentQuestionIndex];
    }, [currentQuestionIndex]);

    const progress = useMemo(() => {
        const prog = getQuizProgress(answers);
        return {
            ...prog,
            currentCategory: currentQuestion?.category || ''
        };
    }, [answers, currentQuestion]);

    const currentAnswer = useMemo(() => {
        if (!currentQuestion) return undefined;
        return answers.find(a => a.questionId === currentQuestion.id);
    }, [answers, currentQuestion]);

    const results = useMemo(() => {
        if (answers.length === 0) return null;
        try {
            return calculateQuizResults(answers);
        } catch (e) {
            console.error('Error calculating results:', e);
            return null;
        }
    }, [answers]);

    const debouncedSave = useDebounce(() => {
        if (!quizStarted || answers.length === 0) return;

        setSaveStatus('saving');
        try {
            const data = {
                answers,
                currentQuestionIndex,
                timestamp: Date.now()
            };
            localStorage.setItem(getStorageKey(sessionId), JSON.stringify(data));
            setSaveStatus('saved');
            setLastSaved(new Date());
            onAutoSave?.(answers, currentQuestionIndex);

            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error('Error saving quiz progress:', e);
            setSaveStatus('idle');
        }
    }, 1000);

    useEffect(() => {
        debouncedSave();
    }, [answers, currentQuestionIndex, debouncedSave]);

    const prevQuestionIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (currentQuestion?.id && currentQuestion.id !== prevQuestionIdRef.current) {
            const answerForCurrentQuestion = answers.find(a => a.questionId === currentQuestion.id);
            setCustomAnswer(answerForCurrentQuestion?.customAnswer || '');
            prevQuestionIdRef.current = currentQuestion.id;
        }
    }, [currentQuestion?.id, answers]);

    const handleSelectOption = useCallback((optionId: string) => {
        if (!currentQuestion) return;

        setError(null);
        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
            const existingAnswer = prev[existingIndex];

            let newSelectedOptions: string[];

            if (currentQuestion.allowMultiple) {
                const currentOptions = existingAnswer?.selectedOptions || [];
                if (currentOptions.includes(optionId)) {
                    newSelectedOptions = currentOptions.filter(id => id !== optionId);
                } else {
                    newSelectedOptions = [...currentOptions, optionId];
                }
            } else {
                newSelectedOptions = [optionId];
            }

            const newAnswer: QuizAnswer = {
                questionId: currentQuestion.id,
                selectedOptions: newSelectedOptions,
                isNotSure: false,
                customAnswer: existingAnswer?.customAnswer,
                timestamp: Date.now()
            };

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newAnswer;
                return updated;
            }
            return [...prev, newAnswer];
        });
    }, [currentQuestion]);

    const handleCustomAnswerChange = useCallback((value: string) => {
        if (!currentQuestion) return;

        setCustomAnswer(value);
        setError(null);

        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
            const existingAnswer = prev[existingIndex];

            const newAnswer: QuizAnswer = {
                questionId: currentQuestion.id,
                selectedOptions: existingAnswer?.selectedOptions || [],
                isNotSure: existingAnswer?.isNotSure || false,
                customAnswer: value.trim() || undefined,
                timestamp: Date.now()
            };

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newAnswer;
                return updated;
            }
            return [...prev, newAnswer];
        });
    }, [currentQuestion]);

    const handleClearCustomAnswer = useCallback(() => {
        setCustomAnswer('');
        if (!currentQuestion) return;

        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    customAnswer: undefined,
                    timestamp: Date.now()
                };
                return updated;
            }
            return prev;
        });
    }, [currentQuestion]);

    const handleNotSure = useCallback(() => {
        if (!currentQuestion) return;

        setError(null);
        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
            const newAnswer: QuizAnswer = {
                questionId: currentQuestion.id,
                selectedOptions: [],
                isNotSure: true,
                customAnswer: undefined,
                timestamp: Date.now()
            };

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newAnswer;
                return updated;
            }
            return [...prev, newAnswer];
        });

        setTimeout(() => {
            if (currentQuestionIndex < FORENSIC_QUIZ_QUESTIONS.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setCustomAnswer('');
            }
        }, 300);
    }, [currentQuestion, currentQuestionIndex]);

    const handleNext = useCallback(() => {
        if (!currentQuestion) return;

        const currentAns = answers.find(a => a.questionId === currentQuestion.id);
        const hasAnswer = currentAns && (
            currentAns.selectedOptions.length > 0 ||
            currentAns.customAnswer?.trim() ||
            currentAns.isNotSure
        );

        if (!hasAnswer) {
            setError('Please select an option or choose "Not sure"');
            return;
        }

        setError(null);
        setCustomAnswer('');

        if (currentQuestionIndex < FORENSIC_QUIZ_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setShowResults(true);
        }
    }, [currentQuestion, currentQuestionIndex, answers]);

    const handlePrevious = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setError(null);
        }
    }, [currentQuestionIndex]);

    const handleComplete = useCallback(() => {
        if (!results) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(getStorageKey(sessionId));
            }
            onComplete(results);
        } catch (e) {
            console.error('Error completing quiz:', e);
            setError('Failed to complete quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [results, onComplete, sessionId]);

    const handleRetake = useCallback(() => {
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setShowResults(false);
        setCustomAnswer('');
        setError(null);

        if (typeof window !== 'undefined') {
            localStorage.removeItem(getStorageKey(sessionId));
        }
    }, [sessionId]);

    const handleStartFresh = useCallback(() => {
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setLastSaved(null);

        if (typeof window !== 'undefined') {
            localStorage.removeItem(getStorageKey(sessionId));
        }
    }, [sessionId]);

    const getCategoryProgress = useCallback((categoryId: string) => {
        const catQuestions = FORENSIC_QUIZ_QUESTIONS.filter(q => q.category === categoryId);
        const catAnswered = answers.filter(a => {
            const q = FORENSIC_QUIZ_QUESTIONS.find(q => q.id === a.questionId);
            return q?.category === categoryId && (a.selectedOptions.length > 0 || a.customAnswer);
        }).length;
        return { total: catQuestions.length, answered: catAnswered };
    }, [answers]);

    const jumpToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < FORENSIC_QUIZ_QUESTIONS.length) {
            setCurrentQuestionIndex(index);
            setCustomAnswer('');
            setError(null);
        }
    }, []);

    return {
        // State
        currentQuestionIndex,
        answers,
        showResults,
        showHelp,
        isSubmitting,
        quizStarted,
        customAnswer,
        saveStatus,
        lastSaved,
        error,

        // Derived State
        currentQuestion,
        progress,
        currentAnswer,
        results,
        initialState,

        // Actions
        setCurrentQuestionIndex,
        setShowHelp,
        setQuizStarted,
        handleSelectOption,
        handleCustomAnswerChange,
        handleClearCustomAnswer,
        handleNotSure,
        handleNext,
        handlePrevious,
        handleComplete,
        handleRetake,
        handleStartFresh,
        getCategoryProgress,
        jumpToQuestion
    };
}
