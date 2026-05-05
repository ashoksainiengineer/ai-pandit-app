/**
 * Forensic Trait Emojis - Gender-Aware Face Icon System
 * Uses human face emojis to help users identify with traits
 */

export type Gender = 'male' | 'female' | 'other';

interface EmojiSet {
  male: string;
  female: string;
  neutral: string;
  other?: string;
}

// Gender-aware face emojis for better user identification
export const FORENSIC_EMOJIS: Record<string, EmojiSet> = {
  // Forehead Types
  'broad': { male: '👨‍🦱', female: '👩‍🦱', neutral: '🧑‍🦱' },
  'narrow': { male: '👨', female: '👩', neutral: '🧑' },
  'average': { male: '👨‍🦰', female: '👩‍🦰', neutral: '🧑‍🦰' },
  'sloping': { male: '👴', female: '👵', neutral: '🧓' },
  
  // Eye Types
  'deep_set': { male: '🧔', female: '👩‍🦳', neutral: '🧑‍🦳' },
  'prominent': { male: '👨‍🦲', female: '👩‍🦲', neutral: '🧑‍🦲' },
  'almond': { male: '👲', female: '👳‍♀️', neutral: '🧕' },
  'round': { male: '👶', female: '👧', neutral: '🧒' },
  'small': { male: '🕵️‍♂️', female: '🕵️‍♀️', neutral: '🕵️' },
  
  // Voice Types
  'deep': { male: '🧔‍♂️', female: '👩‍🎤', neutral: '🎤' },
  'high': { male: '👦', female: '👧', neutral: '🧒' },
  'medium': { male: '👨‍💼', female: '👩‍💼', neutral: '🧑‍💼' },
  'soft': { male: '👨‍🎨', female: '👩‍🎨', neutral: '🧑‍🎨' },
  'raspy': { male: '👨‍🌾', female: '👩‍🌾', neutral: '🧑‍🌾' },
  
  // Prakriti (Body Constitution)
  'vata': { male: '🏃‍♂️', female: '💃', neutral: '🏃' },
  'pitta': { male: '💪', female: '🧘‍♀️', neutral: '🧘' },
  'kapha': { male: '🧍‍♂️', female: '🧍‍♀️', neutral: '🧍' },
  'vata-pitta': { male: '🏋️‍♂️', female: '🏋️‍♀️', neutral: '🏋️' },
  'pitta-kapha': { male: '🤽‍♂️', female: '🤽‍♀️', neutral: '🤽' },
  
  // Speech Styles
  'fast_loud': { male: '🗣️', female: '👩‍🏫', neutral: '📢' },
  'measured_soft': { male: '🧘‍♂️', female: '💆‍♀️', neutral: '🧘' },
  'argumentative': { male: '👨‍⚖️', female: '👩‍⚖️', neutral: '⚖️' },
  'concise': { male: '👨‍✈️', female: '👩‍✈️', neutral: '✈️' },
  'talkative': { male: '👨‍🎤', female: '👩‍🎤', neutral: '🎤' },
  
  // Decision Making
  'impulsive': { male: '⚡', female: '🔥', neutral: '💨' },
  'deliberate': { male: '🐢', female: '🦢', neutral: '🦉' },
  'indecisive': { male: '🤷‍♂️', female: '🤷‍♀️', neutral: '🤷' },
  'intuitive': { male: '🔮', female: '✨', neutral: '🌟' },
  
  // Sibling Order
  'eldest': { male: '👑', female: '👸', neutral: '🤴' },
  'middle': { male: '🤝', female: '💕', neutral: '🫂' },
  'youngest': { male: '👶', female: '🎀', neutral: '🍼' },
  'only_child': { male: '🌟', female: '💎', neutral: '⭐' },
  
  // Father Status
  'struggling': { male: '⛰️', female: '🏔️', neutral: '🧗' },
  'stable': { male: '⚖️', female: '⚖️', neutral: '⚖️' },
  'prosperous': { male: '💼', female: '👜', neutral: '💎' },
  'highly_distinguished': { male: '🏆', female: '👑', neutral: '🥇' },
};

/**
 * Get gender-appropriate emoji for a trait value
 */
export function getForensicEmoji(traitValue: string, gender: Gender): string {
  const emojiSet = FORENSIC_EMOJIS[traitValue];
  if (!emojiSet) return '👤'; // Fallback human emoji
  
  // Return gender-specific or neutral fallback
  return emojiSet[gender] || emojiSet.neutral;
}

/**
 * Get emoji for tab icons (always neutral for UI consistency)
 */
export function getTabIcon(gender: Gender): string {
  const icons: Record<Gender, string> = {
    male: '👨',
    female: '👩',
    other: '🧑'
  };
  return icons[gender] || '🧑';
}

/**
 * Get gender-appropriate placeholder text
 */
export function getPlaceholderText(baseText: string, gender: Gender): string {
  const placeholders: Record<string, Record<Gender, string>> = {
    'marks': {
      male: 'e.g., Scar on right arm, mole on forehead...',
      female: 'e.g., Beauty mark on cheek, birthmark on shoulder...',
      other: 'e.g., Birthmark, scar, or unique identifier...'
    }
  };
  
  return placeholders[baseText]?.[gender] || baseText;
}
