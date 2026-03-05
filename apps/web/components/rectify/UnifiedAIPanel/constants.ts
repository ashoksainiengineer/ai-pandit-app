import { ScoreTier } from './types';

export const TIER_CONFIG: Record<
    ScoreTier,
    { label: string; color: string; bgColor: string; borderColor: string; pulseColor: string }
> = {
    top: {
        label: 'Top / Promoted: Candidates moving to the next verification layer.',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        pulseColor: 'bg-emerald-500',
    },
    promising: {
        label: 'Promising: Candidates currently under active scoring.',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        pulseColor: 'bg-amber-500',
    },
    exploring: {
        label: 'Exploring: Low-probability candidates still being scanned for anomalies.',
        color: 'text-stone-600',
        bgColor: 'bg-stone-50',
        borderColor: 'border-stone-200',
        pulseColor: 'bg-stone-400',
    },
    rejected: {
        label: 'Rejected / Eliminated: Candidates discarded due to logical inconsistencies.',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        pulseColor: 'bg-red-500',
    },
};

export const CARD_PREVIEW_CHARS = 300;
export const VIRTUAL_ROW_HEIGHT = 192;
