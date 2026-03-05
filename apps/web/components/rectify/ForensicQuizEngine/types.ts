import { QuizAnswer, QuizResults, QuizQuestion, QuizProgress } from '@/lib/forensic-quiz/types';

export interface ForensicQuizEngineProps {
    onComplete: (results: QuizResults) => void;
    onCancel?: () => void;
    onAutoSave?: (answers: QuizAnswer[], currentIndex: number) => void;
    initialResults?: QuizResults | null;
    sessionId?: string;
}

export type CategoryColorConfig = { bg: string; text: string; border: string };
export type SaveStatus = 'idle' | 'saving' | 'saved';
