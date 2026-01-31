/**
 * Forensic Quiz Question Bank
 * 22 Questions for Vedic Birth Time Rectification
 * Observable behaviors, not astrological jargon
 * 
 * Category Mapping:
 * - prakriti: Body Constitution (5 questions)
 * - forehead: Facial Structure - Forehead (2 questions)
 * - eyes: Facial Structure - Eyes (2 questions)
 * - voice: Voice Characteristics (2 questions)
 * - speech: Speech Patterns (2 questions)
 * - decision: Decision Making & Behavior (5 questions)
 * - marks: Physical Marks (2 questions)
 * - family: Family Context (2 questions)
 */

import { QuizQuestion } from './types';

export const FORENSIC_QUIZ_QUESTIONS: QuizQuestion[] = [
    // ============================================
    // CATEGORY 1: BODY CONSTITUTION (PRAKRITI) - 5 Questions
    // ============================================
    {
        id: 'prakriti_q1',
        category: 'prakriti',
        question: 'How does your body respond to food?',
        context: 'Think about your natural tendency, not during dieting',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your unique body type or dietary pattern...',
        confidenceImpact: 15,
        options: [
            {
                id: 'vata_weight',
                label: 'Slim build, hard to gain weight, lose easily',
                emoji: '🍃',
                description: 'Thin frame, visible veins, dry skin',
                planetarySignature: ['Saturn', 'Mercury', 'Vata'],
                doshaScore: { vata: 3, pitta: 0, kapha: 0 },
                weight: 3
            },
            {
                id: 'pitta_weight',
                label: 'Medium build, gain in belly first, moderate metabolism',
                emoji: '🔥',
                description: 'Athletic frame, warm body, sharp hunger',
                planetarySignature: ['Sun', 'Mars', 'Pitta'],
                doshaScore: { vata: 0, pitta: 3, kapha: 0 },
                weight: 3
            },
            {
                id: 'kapha_weight',
                label: 'Solid build, easy to gain weight all over, slow metabolism',
                emoji: '🌍',
                description: 'Heavier frame, smooth skin, steady energy',
                planetarySignature: ['Moon', 'Venus', 'Jupiter', 'Kapha'],
                doshaScore: { vata: 0, pitta: 0, kapha: 3 },
                weight: 3
            },
            {
                id: 'mixed_weight',
                label: 'Variable - sometimes lose, sometimes gain unpredictably',
                emoji: '🔄',
                description: 'Inconsistent weight patterns',
                planetarySignature: ['Moon', 'Rahu', 'Vata-Pitta'],
                doshaScore: { vata: 1, pitta: 1, kapha: 1 },
                weight: 1
            }
        ]
    },
    {
        id: 'prakriti_q2',
        category: 'prakriti',
        question: 'After eating a normal meal, you typically feel:',
        context: 'Your usual digestive experience',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your digestion experience in your own words...',
        confidenceImpact: 15,
        options: [
            {
                id: 'vata_digestion',
                label: 'Bloated, gassy, or irregular digestion',
                emoji: '💨',
                description: 'Unpredictable digestion, sensitive stomach',
                planetarySignature: ['Saturn', 'Rahu', 'Vata'],
                doshaScore: { vata: 3, pitta: 0, kapha: 0 },
                weight: 3
            },
            {
                id: 'pitta_digestion',
                label: 'Sharp hunger returns quickly, strong digestion, acidic if late',
                emoji: '🌶️',
                description: 'Can eat large quantities, hungry often',
                planetarySignature: ['Sun', 'Mars', 'Pitta'],
                doshaScore: { vata: 0, pitta: 3, kapha: 0 },
                weight: 3
            },
            {
                id: 'kapha_digestion',
                label: 'Slow, steady digestion, can skip meals comfortably',
                emoji: '🐢',
                description: 'Long-lasting fullness, steady appetite',
                planetarySignature: ['Moon', 'Venus', 'Kapha'],
                doshaScore: { vata: 0, pitta: 0, kapha: 3 },
                weight: 3
            },
            {
                id: 'balanced_digestion',
                label: 'Generally comfortable, no major issues',
                emoji: '⚖️',
                description: 'Normal digestion patterns',
                planetarySignature: ['Jupiter', 'Venus', 'Balanced'],
                doshaScore: { vata: 1, pitta: 1, kapha: 1 },
                weight: 1
            }
        ]
    },
    {
        id: 'prakriti_q3',
        category: 'prakriti',
        question: 'Your natural sleep pattern is:',
        context: 'Without alarms or obligations',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your sleep habits and patterns...',
        confidenceImpact: 10,
        options: [
            {
                id: 'vata_sleep',
                label: 'Light sleeper, 5-6 hours enough, active mind at night',
                emoji: '🦉',
                description: 'Toss and turn, wake easily, vivid dreams',
                planetarySignature: ['Mercury', 'Rahu', 'Vata'],
                doshaScore: { vata: 3, pitta: 0, kapha: 0 },
                weight: 3
            },
            {
                id: 'pitta_sleep',
                label: 'Moderate sleep, 6-7 hours, wake during night',
                emoji: '🌙',
                description: 'Intense dreams, may wake 2-4 AM',
                planetarySignature: ['Sun', 'Mars', 'Pitta'],
                doshaScore: { vata: 0, pitta: 3, kapha: 0 },
                weight: 3
            },
            {
                id: 'kapha_sleep',
                label: 'Heavy sleeper, 8+ hours needed, hard to wake',
                emoji: '😴',
                description: 'Deep sleep, wake groggy, love naps',
                planetarySignature: ['Moon', 'Venus', 'Kapha'],
                doshaScore: { vata: 0, pitta: 0, kapha: 3 },
                weight: 3
            },
            {
                id: 'variable_sleep',
                label: 'Varies greatly depending on circumstances',
                emoji: '🎲',
                description: 'No consistent pattern',
                planetarySignature: ['Moon', 'Rahu', 'Mixed'],
                doshaScore: { vata: 1.5, pitta: 1, kapha: 0.5 },
                weight: 1
            }
        ]
    },
    {
        id: 'prakriti_q4',
        category: 'prakriti',
        question: 'Which weather do you prefer?',
        context: 'Your natural comfort zone',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe how different climates affect you...',
        confidenceImpact: 10,
        options: [
            {
                id: 'vata_weather',
                label: 'Warm, humid, tropical climates',
                emoji: '🌴',
                description: 'Cold and dry air bothers you',
                planetarySignature: ['Sun', 'Jupiter', 'Vata'],
                doshaScore: { vata: 3, pitta: 0, kapha: 0 },
                weight: 2
            },
            {
                id: 'pitta_weather',
                label: 'Cool, mild, temperate climates',
                emoji: '🏔️',
                description: 'Heat makes you irritable',
                planetarySignature: ['Moon', 'Saturn', 'Pitta'],
                doshaScore: { vata: 0, pitta: 3, kapha: 0 },
                weight: 2
            },
            {
                id: 'kapha_weather',
                label: 'Warm and dry, adaptable to most climates',
                emoji: '🌤️',
                description: 'Comfortable in various conditions',
                planetarySignature: ['Sun', 'Mars', 'Kapha'],
                doshaScore: { vata: 0, pitta: 0, kapha: 3 },
                weight: 2
            },
            {
                id: 'cold_weather',
                label: 'Cold, snowy, winter climates',
                emoji: '❄️',
                description: 'Love cold weather',
                planetarySignature: ['Saturn', 'Ketu', 'Pitta'],
                doshaScore: { vata: 1, pitta: 2, kapha: 0 },
                weight: 1
            }
        ]
    },
    {
        id: 'prakriti_q5',
        category: 'prakriti',
        question: 'Your energy throughout the day:',
        context: 'Natural rhythm without caffeine',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your daily energy patterns...',
        confidenceImpact: 10,
        options: [
            {
                id: 'vata_energy',
                label: 'Variable - bursts of energy then crashes',
                emoji: '🎢',
                description: 'Erratic energy, creative spurts',
                planetarySignature: ['Mercury', 'Rahu', 'Vata'],
                doshaScore: { vata: 3, pitta: 0, kapha: 0 },
                weight: 3
            },
            {
                id: 'pitta_energy',
                label: 'High and steady, dip only after meals',
                emoji: '⚡',
                description: 'Strong stamina, competitive drive',
                planetarySignature: ['Sun', 'Mars', 'Pitta'],
                doshaScore: { vata: 0, pitta: 3, kapha: 0 },
                weight: 3
            },
            {
                id: 'kapha_energy',
                label: 'Slow start, steady pace, tire early evening',
                emoji: '🌅',
                description: 'Morning person, early to bed',
                planetarySignature: ['Moon', 'Venus', 'Kapha'],
                doshaScore: { vata: 0, pitta: 0, kapha: 3 },
                weight: 3
            },
            {
                id: 'night_energy',
                label: 'Low morning, peak at night',
                emoji: '🌃',
                description: 'Night owl, creative at night',
                planetarySignature: ['Moon', 'Rahu', 'Vata-Pitta'],
                doshaScore: { vata: 2, pitta: 1, kapha: 0 },
                weight: 1
            }
        ]
    },

    // ============================================
    // CATEGORY 2: FOREHEAD - 2 Questions
    // ============================================
    {
        id: 'forehead_q1',
        category: 'forehead',
        question: 'Look at your side profile (or take a photo). Your forehead:',
        context: 'Look straight ahead, observe hairline position',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your forehead shape and features...',
        confidenceImpact: 20,
        options: [
            {
                id: 'broad_high',
                label: 'High and broad, hairline well above eyebrows',
                emoji: '☀️',
                description: 'Generous forehead space, prominent',
                planetarySignature: ['Sun', 'Jupiter'],
                weight: 3
            },
            {
                id: 'narrow',
                label: 'Narrow, hairline close to eyebrows',
                emoji: '🪐',
                description: 'Less forehead space, compact',
                planetarySignature: ['Saturn'],
                weight: 3
            },
            {
                id: 'sloping',
                label: 'Slopes backward, receding or angled',
                emoji: '⚡',
                description: 'Hairline goes back, intellectual look',
                planetarySignature: ['Mercury', 'Mars'],
                weight: 3
            },
            {
                id: 'prominent',
                label: 'Protrudes forward, prominent brow ridge',
                emoji: '🔴',
                description: 'Forehead juts out, strong brow bones',
                planetarySignature: ['Mars'],
                weight: 3
            },
            {
                id: 'low_receding',
                label: 'Low, short, or significantly receding',
                emoji: '⬇️',
                description: 'Small forehead area',
                planetarySignature: ['Saturn', 'Ketu'],
                weight: 3
            }
        ]
    },
    {
        id: 'forehead_q2',
        category: 'forehead',
        question: 'Your overall face shape is best described as:',
        context: 'Pull hair back, look at full face outline',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your face shape and prominent features...',
        confidenceImpact: 10,
        options: [
            {
                id: 'oval',
                label: 'Oval or balanced, symmetrical',
                emoji: '⭕',
                description: 'Balanced proportions',
                planetarySignature: ['Venus', 'Jupiter'],
                weight: 1
            },
            {
                id: 'round',
                label: 'Round, full cheeks, soft features',
                emoji: '🟡',
                description: 'Youthful, moon-like',
                planetarySignature: ['Moon', 'Jupiter'],
                weight: 2
            },
            {
                id: 'square',
                label: 'Square, strong jaw, angular',
                emoji: '⬜',
                description: 'Strong bone structure',
                planetarySignature: ['Mars', 'Saturn'],
                weight: 2
            },
            {
                id: 'heart',
                label: 'Heart shaped, wider forehead, narrow chin',
                emoji: '💗',
                description: 'Artistic, creative face',
                planetarySignature: ['Venus', 'Mercury'],
                weight: 2
            },
            {
                id: 'long',
                label: 'Long or rectangular, elongated',
                emoji: '📏',
                description: 'Intellectual appearance',
                planetarySignature: ['Saturn', 'Mercury'],
                weight: 2
            }
        ]
    },

    // ============================================
    // CATEGORY 3: EYES - 2 Questions
    // ============================================
    {
        id: 'eyes_q1',
        category: 'eyes',
        question: 'Look straight ahead in a mirror. Your eyes appear:',
        context: 'Natural resting position, don\'t strain',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your eye shape, size, and appearance...',
        confidenceImpact: 20,
        options: [
            {
                id: 'deep_set',
                label: 'Deep set, hollow or shadow above eyelid',
                emoji: '🕳️',
                description: 'Eyes sit back in sockets, introspective look',
                planetarySignature: ['Saturn'],
                weight: 3
            },
            {
                id: 'prominent',
                label: 'Prominent, bulge slightly forward',
                emoji: '👁️',
                description: 'Eyes appear to project outward',
                planetarySignature: ['Mars', 'Moon'],
                weight: 3
            },
            {
                id: 'almond',
                label: 'Almond shaped, slight upward tilt at outer corner',
                emoji: '🌸',
                description: 'Classic beautiful eye shape',
                planetarySignature: ['Venus'],
                weight: 3
            },
            {
                id: 'round',
                label: 'Round, large, open appearance',
                emoji: '😊',
                description: 'Circular eye shape, childlike',
                planetarySignature: ['Jupiter', 'Moon'],
                weight: 3
            },
            {
                id: 'small_intense',
                label: 'Small, intense, piercing gaze',
                emoji: '🎯',
                description: 'Penetrating, analytical look',
                planetarySignature: ['Mercury', 'Ketu'],
                weight: 3
            },
            {
                id: 'large_luminous',
                label: 'Large, luminous, expressive',
                emoji: '✨',
                description: 'Big, beautiful, emotional eyes',
                planetarySignature: ['Moon', 'Venus'],
                weight: 3
            }
        ]
    },
    {
        id: 'eyes_q2',
        category: 'eyes',
        question: 'What is your natural eye color?',
        context: 'Without contacts or enhancement',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your eye color and any unique features...',
        confidenceImpact: 5,
        options: [
            {
                id: 'dark_brown_black',
                label: 'Very dark brown or black',
                emoji: '🟤',
                description: 'Deep, mysterious',
                planetarySignature: ['Saturn', 'Ketu'],
                weight: 1
            },
            {
                id: 'brown',
                label: 'Medium to light brown',
                emoji: '🤎',
                description: 'Warm, earthy',
                planetarySignature: ['Jupiter', 'Sun'],
                weight: 1
            },
            {
                id: 'hazel',
                label: 'Hazel or amber',
                emoji: '🟨',
                description: 'Mixed colors, golden',
                planetarySignature: ['Jupiter', 'Venus'],
                weight: 1
            },
            {
                id: 'green',
                label: 'Green',
                emoji: '💚',
                description: 'Rare, mercurial',
                planetarySignature: ['Mercury', 'Venus'],
                weight: 2
            },
            {
                id: 'blue',
                label: 'Blue or gray-blue',
                emoji: '💙',
                description: 'Clear, ethereal',
                planetarySignature: ['Jupiter', 'Venus'],
                weight: 2
            },
            {
                id: 'gray',
                label: 'Gray or blue-gray',
                emoji: '🩶',
                description: 'Cool, analytical',
                planetarySignature: ['Saturn', 'Mercury'],
                weight: 2
            }
        ]
    },

    // ============================================
    // CATEGORY 4: VOICE - 2 Questions
    // ============================================
    {
        id: 'voice_q1',
        category: 'voice',
        question: 'Your natural speaking voice is best described as:',
        context: 'Relax and speak normally, not trying to project',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe the quality and tone of your voice...',
        confidenceImpact: 15,
        options: [
            {
                id: 'deep',
                label: 'Deep, resonant, carries authority',
                emoji: '🎙️',
                description: 'People turn to listen when you speak',
                planetarySignature: ['Saturn', 'Jupiter'],
                weight: 3
            },
            {
                id: 'high_pitch',
                label: 'Higher pitched, energetic, youthful',
                emoji: '🎵',
                description: 'Voice has lift and animation',
                planetarySignature: ['Mercury', 'Mars'],
                weight: 3
            },
            {
                id: 'soft',
                label: 'Soft, gentle, melodic, soothing',
                emoji: '🎶',
                description: 'Quiet but pleasant voice',
                planetarySignature: ['Venus', 'Moon'],
                weight: 3
            },
            {
                id: 'raspy',
                label: 'Raspy, husky, distinctive texture',
                emoji: '🌫️',
                description: 'Unique, memorable voice quality',
                planetarySignature: ['Rahu', 'Mars'],
                weight: 3
            },
            {
                id: 'resonant',
                label: 'Resonant, commanding, authoritative',
                emoji: '🔔',
                description: 'Voice projects power and confidence',
                planetarySignature: ['Sun'],
                weight: 3
            },
            {
                id: 'nasal',
                label: 'Nasal, twang, or constricted',
                emoji: '👃',
                description: 'Distinctive regional or personal quality',
                planetarySignature: ['Rahu', 'Saturn'],
                weight: 2
            }
        ]
    },
    {
        id: 'voice_q2',
        category: 'voice',
        question: 'When you speak, your volume tends to be:',
        context: 'Natural tendency, not trying to be loud or quiet',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your natural speaking volume and style...',
        confidenceImpact: 10,
        options: [
            {
                id: 'loud',
                label: 'Naturally loud, carries across rooms',
                emoji: '📢',
                description: 'People ask you to speak softer',
                planetarySignature: ['Sun', 'Mars'],
                weight: 2
            },
            {
                id: 'moderate',
                label: 'Moderate, appropriate for situation',
                emoji: '🎚️',
                description: 'Adjusts naturally',
                planetarySignature: ['Mercury', 'Venus'],
                weight: 1
            },
            {
                id: 'soft',
                label: 'Soft, people often ask you to repeat',
                emoji: '🤫',
                description: 'Quiet speaker',
                planetarySignature: ['Moon', 'Venus'],
                weight: 2
            },
            {
                id: 'variable',
                label: 'Variable - loud when excited, quiet otherwise',
                emoji: '📊',
                description: 'Depends on mood/topic',
                planetarySignature: ['Moon', 'Rahu'],
                weight: 1
            }
        ]
    },

    // ============================================
    // CATEGORY 5: SPEECH - 2 Questions
    // ============================================
    {
        id: 'speech_q1',
        category: 'speech',
        question: 'In casual conversation, you tend to:',
        context: 'With friends or colleagues, not formal settings',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe how you typically communicate with others...',
        confidenceImpact: 15,
        options: [
            {
                id: 'fast_loud',
                label: 'Speak quickly, thoughts rush out, animated',
                emoji: '💨',
                description: 'Fast talker, energetic',
                planetarySignature: ['Mars', 'Mercury'],
                weight: 3
            },
            {
                id: 'measured',
                label: 'Speak slowly, choose words carefully, deliberate',
                emoji: '🐢',
                description: 'Thoughtful, wise speech',
                planetarySignature: ['Saturn', 'Jupiter'],
                weight: 3
            },
            {
                id: 'logical',
                label: 'Ask questions, analyze, seek details',
                emoji: '🔍',
                description: 'Logical, inquisitive',
                planetarySignature: ['Mercury'],
                weight: 3
            },
            {
                id: 'concise',
                label: 'Use minimal words, get to the point',
                emoji: '⚡',
                description: 'Brief, impactful statements',
                planetarySignature: ['Ketu', 'Saturn'],
                weight: 3
            },
            {
                id: 'talkative',
                label: 'Talk a lot, connect ideas, storytelling',
                emoji: '🗣️',
                description: 'Verbose, engaging communicator',
                planetarySignature: ['Rahu', 'Venus'],
                weight: 3
            }
        ]
    },
    {
        id: 'speech_q2',
        category: 'speech',
        question: 'In a group discussion, you typically:',
        context: 'Meeting or social gathering with 4+ people',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your behavior in group settings...',
        confidenceImpact: 10,
        options: [
            {
                id: 'dominate',
                label: 'Take charge, speak loudly, lead the conversation',
                emoji: '🦁',
                description: 'Natural leader in groups',
                planetarySignature: ['Sun', 'Mars'],
                weight: 3
            },
            {
                id: 'listen',
                label: 'Listen more, speak when asked or have strong opinion',
                emoji: '👂',
                description: 'Thoughtful observer',
                planetarySignature: ['Saturn', 'Ketu'],
                weight: 3
            },
            {
                id: 'question',
                label: 'Ask clarifying questions, play devil\'s advocate',
                emoji: '❓',
                description: 'Analytical, probing',
                planetarySignature: ['Mercury'],
                weight: 3
            },
            {
                id: 'connect',
                label: 'Connect ideas, summarize, diplomatic',
                emoji: '🤝',
                description: 'Bridge-builder, mediator',
                planetarySignature: ['Venus', 'Jupiter'],
                weight: 3
            },
            {
                id: 'observe',
                label: 'Observe quietly, occasional relevant input',
                emoji: '🧘',
                description: 'Wise, selective speaker',
                planetarySignature: ['Ketu', 'Saturn'],
                weight: 3
            }
        ]
    },

    // ============================================
    // CATEGORY 6: DECISION - 5 Questions
    // ============================================
    {
        id: 'decision_q1',
        category: 'decision',
        question: 'You need to buy a new phone. You will:',
        context: 'Typical decision-making style',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe how you typically make decisions...',
        confidenceImpact: 20,
        options: [
            {
                id: 'research',
                label: 'Research specs for 3+ days, compare models, read reviews',
                emoji: '🔬',
                description: 'Thorough, analytical approach',
                planetarySignature: ['Saturn', 'Mercury'],
                weight: 3
            },
            {
                id: 'ask_friends',
                label: 'Ask friends what they use, buy the same',
                emoji: '👥',
                description: 'Trust social proof',
                planetarySignature: ['Moon'],
                weight: 3
            },
            {
                id: 'impulse',
                label: 'Walk into store, buy what looks good immediately',
                emoji: '⚡',
                description: 'Spontaneous decision',
                planetarySignature: ['Mars'],
                weight: 3
            },
            {
                id: 'gut_feeling',
                label: 'Trust gut feeling, don\'t overthink, first instinct',
                emoji: '🔮',
                description: 'Intuitive choice',
                planetarySignature: ['Jupiter'],
                weight: 3
            },
            {
                id: 'avoid',
                label: 'Avoid buying, use old one as long as possible',
                emoji: '⏰',
                description: 'Delay, postpone decision',
                planetarySignature: ['Ketu', 'Saturn'],
                weight: 3
            },
            {
                id: 'budget',
                label: 'Check budget first, buy best in price range',
                emoji: '💰',
                description: 'Practical, value-focused',
                planetarySignature: ['Saturn', 'Venus'],
                weight: 2
            }
        ]
    },
    {
        id: 'decision_q2',
        category: 'decision',
        question: 'When under pressure or stress, you:',
        context: 'Your immediate, natural reaction',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe how you react to stress and pressure...',
        confidenceImpact: 20,
        options: [
            {
                id: 'take_charge',
                label: 'Take charge, act immediately, solve the problem',
                emoji: '🦸',
                description: 'Leader in crisis',
                planetarySignature: ['Mars', 'Sun'],
                weight: 3
            },
            {
                id: 'analyze',
                label: 'Step back, analyze options, plan response',
                emoji: '🧠',
                description: 'Thoughtful, strategic',
                planetarySignature: ['Saturn', 'Mercury'],
                weight: 3
            },
            {
                id: 'seek_advice',
                label: 'Seek advice from others, discuss options',
                emoji: '🗣️',
                description: 'Collaborative decision',
                planetarySignature: ['Moon'],
                weight: 3
            },
            {
                id: 'trust_gut',
                label: 'Trust intuition, go with flow, adapt',
                emoji: '🌊',
                description: 'Flexible, intuitive',
                planetarySignature: ['Jupiter'],
                weight: 3
            },
            {
                id: 'withdraw',
                label: 'Withdraw, process internally, emerge later',
                emoji: '🐚',
                description: 'Internal processing',
                planetarySignature: ['Ketu', 'Saturn'],
                weight: 3
            },
            {
                id: 'emotional',
                label: 'Feel overwhelmed, need emotional support',
                emoji: '💧',
                description: 'Emotional processing',
                planetarySignature: ['Moon', 'Venus'],
                weight: 2
            }
        ]
    },
    {
        id: 'decision_q3',
        category: 'decision',
        question: 'Your preferred work style is:',
        context: 'When you have control over your schedule',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe how you like to work and your productivity style...',
        confidenceImpact: 15,
        options: [
            {
                id: 'bursts',
                label: 'Intense bursts of work, then rest periods',
                emoji: '🌋',
                description: 'Sprint and recover',
                planetarySignature: ['Mars', 'Pitta'],
                weight: 3
            },
            {
                id: 'steady',
                label: 'Steady, consistent pace, regular hours',
                emoji: '🐢',
                description: 'Marathon not sprint',
                planetarySignature: ['Saturn'],
                weight: 3
            },
            {
                id: 'variable',
                label: 'Multiple projects, variable focus, creative switching',
                emoji: '🎨',
                description: 'Multitasking, diverse',
                planetarySignature: ['Mercury', 'Rahu', 'Vata'],
                weight: 3
            },
            {
                id: 'deep_focus',
                label: 'Deep focus, one thing at a time, no interruptions',
                emoji: '🎯',
                description: 'Monk mode',
                planetarySignature: ['Ketu', 'Saturn'],
                weight: 3
            },
            {
                id: 'collaborative',
                label: 'Collaborative, team-based, bouncing ideas',
                emoji: '🤝',
                description: 'Social worker',
                planetarySignature: ['Venus', 'Jupiter'],
                weight: 2
            }
        ]
    },
    {
        id: 'decision_q4',
        category: 'decision',
        question: 'When planning a vacation, you:',
        context: 'Your natural planning tendency',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your approach to planning and organizing...',
        confidenceImpact: 10,
        options: [
            {
                id: 'detailed_plan',
                label: 'Plan every detail months ahead, itinerary ready',
                emoji: '📅',
                description: 'Structured planner',
                planetarySignature: ['Saturn', 'Mercury'],
                weight: 3
            },
            {
                id: 'rough_plan',
                label: 'Book flights/hotel, figure out rest there',
                emoji: '📍',
                description: 'Flexible framework',
                planetarySignature: ['Jupiter', 'Venus'],
                weight: 3
            },
            {
                id: 'spontaneous',
                label: 'Decide last minute, go where feels right',
                emoji: '🎲',
                description: 'Spontaneous traveler',
                planetarySignature: ['Mars', 'Rahu'],
                weight: 3
            },
            {
                id: 'follow_crowd',
                label: 'Go where friends recommend, follow their plan',
                emoji: '👥',
                description: 'Social traveler',
                planetarySignature: ['Moon'],
                weight: 2
            }
        ]
    },
    {
        id: 'decision_q5',
        category: 'decision',
        question: 'When someone disagrees with you, you tend to:',
        context: 'Your natural reaction',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe how you handle disagreements and conflicts...',
        confidenceImpact: 10,
        options: [
            {
                id: 'debate',
                label: 'Debate, argue your point, prove you\'re right',
                emoji: '⚔️',
                description: 'Combative, assertive',
                planetarySignature: ['Mars', 'Sun'],
                weight: 3
            },
            {
                id: 'discuss',
                label: 'Discuss calmly, seek common ground',
                emoji: '🕊️',
                description: 'Diplomatic, balanced',
                planetarySignature: ['Venus', 'Mercury'],
                weight: 3
            },
            {
                id: 'listen',
                label: 'Listen to their view, consider if valid',
                emoji: '👂',
                description: 'Open-minded, wise',
                planetarySignature: ['Jupiter', 'Saturn'],
                weight: 3
            },
            {
                id: 'avoid_conflict',
                label: 'Avoid conflict, agree to disagree quickly',
                emoji: '😌',
                description: 'Harmony seeker',
                planetarySignature: ['Moon', 'Venus'],
                weight: 3
            },
            {
                id: 'analyze',
                label: 'Ask questions to understand their perspective',
                emoji: '🔍',
                description: 'Analytical, curious',
                planetarySignature: ['Mercury'],
                weight: 2
            }
        ]
    },

    // ============================================
    // CATEGORY 7: MARKS - 2 Questions
    // ============================================
    {
        id: 'marks_q1',
        category: 'marks',
        question: 'Do you have any significant moles or birthmarks?',
        context: 'Since childhood, not recent',
        allowMultiple: true,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe any distinctive marks on your body...',
        confidenceImpact: 10,
        options: [
            {
                id: 'face_marks',
                label: 'On face (forehead, cheeks, chin)',
                emoji: '😊',
                description: 'Planetary imprint on identity',
                planetarySignature: ['Sun', 'Moon', 'Rahu'],
                weight: 3
            },
            {
                id: 'neck_marks',
                label: 'On neck or throat',
                emoji: '🦢',
                description: 'Communication karma',
                planetarySignature: ['Mercury', 'Venus'],
                weight: 2
            },
            {
                id: 'hands_marks',
                label: 'On hands or fingers',
                emoji: '✋',
                description: 'Action/work karma',
                planetarySignature: ['Mars', 'Saturn'],
                weight: 2
            },
            {
                id: 'torso_marks',
                label: 'On chest, stomach, or back',
                emoji: '👤',
                description: 'Emotional/core karma',
                planetarySignature: ['Moon', 'Venus'],
                weight: 2
            },
            {
                id: 'none',
                label: 'No significant moles or birthmarks',
                emoji: '❌',
                description: 'Clean slate',
                planetarySignature: ['Jupiter', 'Ketu'],
                weight: 1
            }
        ]
    },
    {
        id: 'marks_q2',
        category: 'marks',
        question: 'Any scars or distinctive marks from childhood?',
        context: 'Accidents, surgeries, or birth marks',
        allowMultiple: true,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe any scars or childhood marks...',
        confidenceImpact: 5,
        options: [
            {
                id: 'head_scar',
                label: 'Head or face area',
                emoji: '🤕',
                description: 'Mental/karmic imprint',
                planetarySignature: ['Mars', 'Saturn', 'Rahu'],
                weight: 2
            },
            {
                id: 'arm_leg_scar',
                label: 'Arms or legs',
                emoji: '🦴',
                description: 'Action/movement karma',
                planetarySignature: ['Mars', 'Saturn'],
                weight: 1
            },
            {
                id: 'burn_mark',
                label: 'Burn marks',
                emoji: '🔥',
                description: 'Fire element karma',
                planetarySignature: ['Mars', 'Sun'],
                weight: 2
            },
            {
                id: 'surgery_mark',
                label: 'Surgery scars',
                emoji: '➕',
                description: 'Medical intervention karma',
                planetarySignature: ['Saturn', 'Rahu'],
                weight: 2
            },
            {
                id: 'none_scar',
                label: 'No significant scars',
                emoji: '✨',
                description: 'Protected childhood',
                planetarySignature: ['Jupiter', 'Venus'],
                weight: 1
            }
        ]
    },

    // ============================================
    // CATEGORY 8: FAMILY - 2 Questions
    // ============================================
    {
        id: 'family_q1',
        category: 'family',
        question: 'What is your birth order among siblings?',
        context: 'Full siblings from same parents',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your family position and sibling relationships...',
        confidenceImpact: 20,
        options: [
            {
                id: 'eldest',
                label: 'Eldest / First born',
                emoji: '👑',
                description: 'Natural leader, authority figure',
                planetarySignature: ['Sun', 'Mars'],
                weight: 3
            },
            {
                id: 'middle',
                label: 'Middle child',
                emoji: '🤝',
                description: 'Mediator, diplomat',
                planetarySignature: ['Mercury', 'Venus'],
                weight: 3
            },
            {
                id: 'youngest',
                label: 'Youngest / Last born',
                emoji: '👶',
                description: 'Nurtured, creative',
                planetarySignature: ['Moon', 'Jupiter'],
                weight: 3
            },
            {
                id: 'only_child',
                label: 'Only child',
                emoji: '🌟',
                description: 'Independent, self-reliant',
                planetarySignature: ['Sun', 'Ketu'],
                weight: 3
            }
        ]
    },
    {
        id: 'family_q2',
        category: 'family',
        question: 'What best describes your father\'s situation at your birth?',
        context: 'Ask older family member if unsure',
        allowMultiple: false,
        hasNotSureOption: true,
        allowCustomAnswer: true,
        customAnswerPlaceholder: 'Describe your father\'s occupation and situation when you were born...',
        confidenceImpact: 20,
        options: [
            {
                id: 'struggling',
                label: 'Struggling financially, difficult period',
                emoji: '⛈️',
                description: 'Financial hardship or crisis',
                planetarySignature: ['Saturn', 'Rahu'],
                weight: 3
            },
            {
                id: 'working_class',
                label: 'Working class / Service job / Daily wage',
                emoji: '🔧',
                description: 'Stable but modest income',
                planetarySignature: ['Saturn', '6th House'],
                weight: 3
            },
            {
                id: 'professional',
                label: 'Professional / Employed / Government job',
                emoji: '💼',
                description: 'Educated, salaried position',
                planetarySignature: ['Mercury', 'Jupiter', '10th House'],
                weight: 3
            },
            {
                id: 'business_owner',
                label: 'Business owner / Self-employed',
                emoji: '🏪',
                description: 'Entrepreneur, independent',
                planetarySignature: ['Sun', 'Mars', '7th House'],
                weight: 3
            },
            {
                id: 'prosperous',
                label: 'Prosperous / Well-established',
                emoji: '💰',
                description: 'Comfortable, wealthy',
                planetarySignature: ['Jupiter', 'Venus', '11th House'],
                weight: 3
            },
            {
                id: 'distinguished',
                label: 'Distinguished / Political / Social leader',
                emoji: '🎖️',
                description: 'Prominent social status',
                planetarySignature: ['Sun', 'Raja Yoga'],
                weight: 3
            }
        ]
    }
];

// Total: 22 questions across 8 categories
// Estimated completion time: 5-7 minutes

export const QUIZ_METADATA = {
    totalQuestions: FORENSIC_QUIZ_QUESTIONS.length,
    estimatedTimeMinutes: 6,
    categories: [
        { id: 'prakriti', name: 'Body Constitution', icon: '🍃' },
        { id: 'forehead', name: 'Forehead & Face', icon: '☀️' },
        { id: 'eyes', name: 'Eyes', icon: '👁️' },
        { id: 'voice', name: 'Voice', icon: '🎙️' },
        { id: 'speech', name: 'Speech', icon: '🗣️' },
        { id: 'decision', name: 'Decision Making', icon: '🧠' },
        { id: 'marks', name: 'Physical Marks', icon: '🔴' },
        { id: 'family', name: 'Family Context', icon: '👨‍👩‍👧‍👦' }
    ]
};

// Helper: Get category by question ID
export function getCategoryByQuestionId(questionId: string): string | undefined {
    const question = FORENSIC_QUIZ_QUESTIONS.find(q => q.id === questionId);
    return question?.category;
}

// Helper: Get questions by category
export function getQuestionsByCategory(categoryId: string): QuizQuestion[] {
    return FORENSIC_QUIZ_QUESTIONS.filter(q => q.category === categoryId);
}

// Helper: Validate answer against question constraints
export function validateAnswer(
    questionId: string,
    selectedOptions: string[],
    customAnswer?: string
): { valid: boolean; error?: string } {
    const question = FORENSIC_QUIZ_QUESTIONS.find(q => q.id === questionId);
    if (!question) {
        return { valid: false, error: 'Question not found' };
    }

    // Check if all selected options are valid
    for (const optionId of selectedOptions) {
        if (!question.options.find(o => o.id === optionId)) {
            return { valid: false, error: `Invalid option: ${optionId}` };
        }
    }

    // Check if custom answer is allowed
    if (customAnswer && !question.allowCustomAnswer) {
        return { valid: false, error: 'Custom answer not allowed for this question' };
    }

    // Check if at least one selection is made
    if (selectedOptions.length === 0 && !customAnswer?.trim()) {
        return { valid: false, error: 'Please select an option or provide a custom answer' };
    }

    return { valid: true };
}
