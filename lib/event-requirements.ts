// Event requirements for BTR analysis

export interface EventMethod {
  name: string;
  shortName: string;
  description: string;
}

export interface EventDetail {
  eventType: string;
  importance: 'critical' | 'high' | 'medium';
  accuracyBoost: number;
  methods: EventMethod[];
  explanation: string;
}

export interface CategoryRequirement {
  id: string;
  name: string;
  icon: string;
  description: string;
  minimumEvents: number;
  totalAccuracyContribution: number;
  events: EventDetail[];
}

export interface EventRequirement {
  category: string;
  minEvents: number;
  description: string;
}

// Full category requirements with Vedic methods
export const EVENT_REQUIREMENTS: CategoryRequirement[] = [
  {
    id: 'career',
    name: 'Career & Professional',
    icon: '💼',
    description: 'Job changes, promotions, business milestones',
    minimumEvents: 1,
    totalAccuracyContribution: 25,
    events: [
      {
        eventType: 'First Job',
        importance: 'critical',
        accuracyBoost: 15,
        methods: [
          { name: 'Dasamsa (D10) Analysis', shortName: 'D10', description: 'Career divisional chart' },
          { name: 'Saturn Transit', shortName: 'Saturn', description: 'Professional growth timing' },
          { name: '10th House Lord', shortName: '10th L', description: 'Career house analysis' }
        ],
        explanation: 'First employment marks the activation of the 10th house karma.'
      },
      {
        eventType: 'Promotion/Major Achievement',
        importance: 'high',
        accuracyBoost: 12,
        methods: [
          { name: 'Dasha-Bhukti', shortName: 'Dasha', description: 'Planetary periods' },
          { name: 'Jupiter Transit', shortName: 'Jupiter', description: 'Expansion periods' }
        ],
        explanation: 'Career advancement shows 10th/11th house activation.'
      }
    ]
  },
  {
    id: 'marriage',
    name: 'Marriage & Relationships',
    icon: '💑',
    description: 'Wedding, engagement, relationship milestones',
    minimumEvents: 1,
    totalAccuracyContribution: 30,
    events: [
      {
        eventType: 'Marriage',
        importance: 'critical',
        accuracyBoost: 20,
        methods: [
          { name: 'Navamsa (D9) Analysis', shortName: 'D9', description: 'Marriage divisional chart' },
          { name: '7th House Lord', shortName: '7th L', description: 'Marriage house analysis' },
          { name: 'Venus-Jupiter Periods', shortName: 'Venus', description: 'Relationship timing' }
        ],
        explanation: 'Marriage is one of the most powerful timing markers in Vedic astrology.'
      }
    ]
  },
  {
    id: 'family',
    name: 'Family Events',
    icon: '👨‍👩‍👧‍👦',
    description: 'Childbirth, family deaths, family milestones',
    minimumEvents: 0,
    totalAccuracyContribution: 15,
    events: [
      {
        eventType: 'Child Birth',
        importance: 'high',
        accuracyBoost: 15,
        methods: [
          { name: '5th House Analysis', shortName: '5th H', description: 'Children house' },
          { name: 'Saptamsa (D7)', shortName: 'D7', description: 'Children divisional chart' }
        ],
        explanation: 'Childbirth activates the 5th house and Jupiter periods.'
      }
    ]
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    description: 'Graduations, degrees, certifications',
    minimumEvents: 0,
    totalAccuracyContribution: 10,
    events: [
      {
        eventType: 'Graduation',
        importance: 'high',
        accuracyBoost: 10,
        methods: [
          { name: 'Mercury-Jupiter', shortName: 'Mercury', description: 'Learning planets' },
          { name: '4th House Education', shortName: '4th H', description: 'Education house' }
        ],
        explanation: 'Educational milestones correlate with Mercury and Jupiter.'
      }
    ]
  },
  {
    id: 'health',
    name: 'Health & Medical',
    icon: '🏥',
    description: 'Major illness, surgery, accidents',
    minimumEvents: 0,
    totalAccuracyContribution: 10,
    events: [
      {
        eventType: 'Major Illness/Surgery',
        importance: 'high',
        accuracyBoost: 12,
        methods: [
          { name: '6th/8th House', shortName: '6th/8th', description: 'Disease houses' },
          { name: 'Saturn-Rahu', shortName: 'Sat-Rahu', description: 'Challenging periods' }
        ],
        explanation: 'Health events strongly mark 6th and 8th house activations.'
      }
    ]
  },
  {
    id: 'travel',
    name: 'Travel & Relocation',
    icon: '✈️',
    description: 'Long distance moves, foreign travel',
    minimumEvents: 0,
    totalAccuracyContribution: 10,
    events: [
      {
        eventType: 'Foreign Travel/Relocation',
        importance: 'medium',
        accuracyBoost: 10,
        methods: [
          { name: '12th House', shortName: '12th H', description: 'Foreign lands' },
          { name: 'Rahu Transit', shortName: 'Rahu', description: 'Foreign influence' }
        ],
        explanation: 'Relocation involves 9th and 12th house activations.'
      }
    ]
  }
];

export const MINIMUM_TOTAL_EVENTS = 3;

export interface AccuracyResult {
  totalAccuracy: number;
  suggestions: string[];
}

export function calculateAccuracy(categoryEventCounts: Record<string, number>): AccuracyResult {
  let totalAccuracy = 40; // Base accuracy
  const suggestions: string[] = [];

  // Check each category
  for (const category of EVENT_REQUIREMENTS) {
    const count = categoryEventCounts[category.id] || 0;
    if (count >= category.minimumEvents) {
      totalAccuracy += category.totalAccuracyContribution * Math.min(count / Math.max(category.minimumEvents, 1), 1);
    } else if (category.minimumEvents > 0) {
      suggestions.push(`Add ${category.minimumEvents - count} ${category.name} event(s)`);
    }
  }

  // Bonus for total event count
  const totalEvents = Object.values(categoryEventCounts).reduce((a, b) => a + b, 0);
  if (totalEvents >= 5) totalAccuracy += 10;
  if (totalEvents >= 10) totalAccuracy += 10;

  // Cap at 99%
  totalAccuracy = Math.min(99, Math.round(totalAccuracy));

  return { totalAccuracy, suggestions };
}

export function getMinimumRequirements() {
  return {
    totalMinimumEvents: 3,
    targetAccuracy: 90,
    categories: EVENT_REQUIREMENTS.filter(c => c.minimumEvents > 0).map(c => ({
      id: c.id,
      name: c.name,
      minimumEvents: c.minimumEvents,
      icon: c.icon
    }))
  };
}

export function getEventCategoryLabel(category: string): string {
  const cat = EVENT_REQUIREMENTS.find(c => c.id === category);
  return cat?.name || category;
}

export function validateLifeEvents(events: any[]): { valid: boolean; error?: string } {
  if (!events || events.length < MINIMUM_TOTAL_EVENTS) {
    return { valid: false, error: `At least ${MINIMUM_TOTAL_EVENTS} life events are required` };
  }
  return { valid: true };
}

export default EVENT_REQUIREMENTS;
