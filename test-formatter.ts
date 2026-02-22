import { formatLifeEventForAI } from './backend/src/lib/btr/prompts/life-event-formatter.js';

const event = {
  id: 'evt_1',
  category: 'marriage',
  eventType: 'Got Married',
  datePrecision: 'month_year',
  eventDate: '2023-05',
  description: 'It was a very nice day in Delhi, my friend Raj was there. And some ID 123456.',
  importance: 'high'
};

console.log(formatLifeEventForAI(event as any));
