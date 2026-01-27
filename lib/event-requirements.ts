// Event requirements for BTR analysis

export interface EventRequirement {
  category: string;
  minEvents: number;
  description: string;
}

export interface CategoryRequirement {
  category: string;
  minEvents: number;
  description: string;
}

export const EVENT_REQUIREMENTS: EventRequirement[] = [
  { category: 'career', minEvents: 1, description: 'Career milestones' },
  { category: 'relationship', minEvents: 1, description: 'Marriage/relationship events' },
  { category: 'health', minEvents: 0, description: 'Health incidents' },
  { category: 'finance', minEvents: 0, description: 'Financial events' },
  { category: 'education', minEvents: 0, description: 'Educational milestones' },
  { category: 'relocation', minEvents: 0, description: 'Relocation/moving events' },
];

export const MINIMUM_TOTAL_EVENTS = 3;

export function getEventCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    career: 'Career & Professional',
    relationship: 'Relationships & Marriage',
    health: 'Health & Wellness',
    finance: 'Finance & Property',
    education: 'Education & Learning',
    relocation: 'Relocation & Travel',
    family: 'Family Events',
    other: 'Other Significant Events',
  };
  return labels[category] || category;
}

export function validateLifeEvents(events: any[]): { valid: boolean; error?: string } {
  if (!events || events.length < MINIMUM_TOTAL_EVENTS) {
    return { valid: false, error: `At least ${MINIMUM_TOTAL_EVENTS} life events are required` };
  }
  return { valid: true };
}

export function getMinimumRequirements(): CategoryRequirement[] {
  return EVENT_REQUIREMENTS;
}

export function calculateAccuracy(events: any[]): { score: number; max: number } {
  // Simplified accuracy calculation
  const score = Math.min(events.length * 10, 100);
  return { score, max: 100 };
}

export default EVENT_REQUIREMENTS;
