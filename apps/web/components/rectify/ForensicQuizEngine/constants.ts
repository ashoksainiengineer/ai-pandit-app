import { Target, Brain, Eye, Mic, Users, Activity } from 'lucide-react';

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
    prakriti: Activity,
    forehead: Brain,
    eyes: Eye,
    voice: Mic,
    speech: Mic,
    decision: Target,
    family: Users,
    marks: Activity
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    prakriti: { bg: 'bg-[#184131]', text: 'text-[#184131]', border: 'border-[#184131]' },
    forehead: { bg: 'bg-[#B8860B]', text: 'text-[#B8860B]', border: 'border-[#B8860B]' },
    eyes: { bg: 'bg-[#6B9AC4]', text: 'text-[#6B9AC4]', border: 'border-[#6B9AC4]' },
    voice: { bg: 'bg-[#C65D3B]', text: 'text-[#C65D3B]', border: 'border-[#C65D3B]' },
    speech: { bg: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]' },
    decision: { bg: 'bg-[#78611D]', text: 'text-[#78611D]', border: 'border-[#78611D]' },
    family: { bg: 'bg-[#184131]', text: 'text-[#184131]', border: 'border-[#184131]' },
    marks: { bg: 'bg-[#7C3AED]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]' }
};

export const getStorageKey = (sessionId?: string): string => {
    return sessionId ? `forensic_quiz_${sessionId}` : 'forensic_quiz_progress';
};
