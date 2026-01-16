// lib/timezones.ts - Timezone definitions

export interface Timezone {
  value: string;
  label: string;
  offset: number;
}

export const timezones: Timezone[] = [
  { value: 'UTC', label: 'UTC (GMT+0:00)', offset: 0 },
  { value: 'IST', label: 'IST (GMT+5:30)', offset: 5.5 },
  { value: 'EST', label: 'EST (GMT-5:00)', offset: -5 },
  { value: 'PST', label: 'PST (GMT-8:00)', offset: -8 },
  { value: 'CET', label: 'CET (GMT+1:00)', offset: 1 },
  { value: 'JST', label: 'JST (GMT+9:00)', offset: 9 },
];