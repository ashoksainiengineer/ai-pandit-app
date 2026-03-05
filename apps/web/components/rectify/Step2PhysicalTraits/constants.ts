import { ScanFace, Activity, Fingerprint } from 'lucide-react';

export const TABS = [
    { id: 'face', label: 'Mukha (Face)', icon: ScanFace },
    { id: 'structure', label: 'Deha (Structure)', icon: Activity },
    { id: 'details', label: 'Lakshan (Details)', icon: Fingerprint },
];

export const EYE_SHAPES = [
    { value: 'almond', label: 'Almond', emoji: '👁️', signs: 'Venus/Mercury (Artist)', guide: 'Tapered ends, classic shape.' },
    { value: 'round', label: 'Round/Large', emoji: '👀', signs: 'Moon/Jupiter (Empath)', guide: 'Open, innocent, watery gaze.' },
    { value: 'deep_set', label: 'Deep Set', emoji: '🕶️', signs: 'Saturn/Scorpio (Observer)', guide: 'Brow bone prominent, eyes shadown.' },
    { value: 'hooded', label: 'Hooded', emoji: '😑', signs: 'Mars/Lion (Intense)', guide: 'Upper lid covers crease.' },
];

export const FOREHEAD_TYPES = [
    { value: 'high', label: 'High/Broad', emoji: '🧠', signs: 'Sun/Jupiter (Intellect)', guide: 'Sign of wisdom and leadership.' },
    { value: 'narrow', label: 'Narrow', emoji: '🤏', signs: 'Saturn/Mercury (Practical)', guide: 'Focused, grounded nature.' },
    { value: 'rounded', label: 'Rounded', emoji: '🌕', signs: 'Moon (Creative)', guide: 'Imaginative and emotional.' },
];

export const JAW_TYPES = [
    { value: 'strong', label: 'Strong/Square', emoji: '⬛', signs: 'Mars (Warrior)', guide: 'Willpower, determination.' },
    { value: 'pointed', label: 'Pointed', emoji: '🔻', signs: 'Mercury (Analyst)', guide: 'Quick wit, sharp speech.' },
    { value: 'round', label: 'Soft/Round', emoji: '⚪', signs: 'Venus (Harmony)', guide: 'Gentle nature, peace lover.' },
];

export const HEIGHT_OPTIONS = [
    { value: 'short', label: 'Short', emoji: '🧒', signs: 'Water/Earth Signs', guide: '< 5\'4" (M) | < 5\'1" (F)' },
    { value: 'medium', label: 'Average', emoji: '🧑', signs: 'Variable/Mixed', guide: 'Standard for region.' },
    { value: 'tall', label: 'Tall', emoji: '🧍', signs: 'Fire/Air Signs', guide: '> 5\'11" (M) | > 5\'7" (F)' },
];

export const FRAME_OPTIONS = [
    { value: 'vata', label: 'Vata (Slim)', emoji: '🦴', signs: 'Saturn/Mercury', guide: 'Thin frame, visible joints.' },
    { value: 'pitta', label: 'Pitta (Athletic)', emoji: '🔥', signs: 'Mars/Sun', guide: 'Medium build, muscular.' },
    { value: 'kapha', label: 'Kapha (Solid)', emoji: '🐘', signs: 'Jupiter/Moon', guide: 'Broad, heavy, endurance.' },
];

export const SHOULDER_OPTIONS = [
    { value: 'broad', label: 'Broad', emoji: '💪', signs: 'Mars (Action)', guide: 'Wider than hips.' },
    { value: 'sloping', label: 'Sloping', emoji: '📉', signs: 'Mercury (Fluid)', guide: 'Gentle slope from neck.' },
    { value: 'narrow', label: 'Narrow', emoji: '🥢', signs: 'Saturn (Restriction)', guide: 'Compact frame.' },
];

export const HAIR_OPTIONS = [
    { value: 'straight', label: 'Straight', emoji: '⬇️', signs: 'Saturn', guide: 'Falls flat/straight.' },
    { value: 'wavy', label: 'Wavy', emoji: '〰️', signs: 'Venus/Moon', guide: 'Soft curls/S-waves.' },
    { value: 'curly', label: 'Curly', emoji: '🌀', signs: 'Rahu/Mars', guide: 'Tight curls/coils.' },
    { value: 'thin', label: 'Fine/Thin', emoji: '🌿', signs: 'Sun (Heat)', guide: 'Silky or receding.' },
];
