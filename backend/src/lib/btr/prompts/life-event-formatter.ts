/**
 * Life Event Formatter for AI Prompts
 * 
 * Formats user life events into structured text for AI analysis.
 * This module handles the conversion of event data into human-readable
 * descriptions that the AI can use for birth time rectification.
 */

import { LifeEvent } from '../../../types/index.js';

/**
 * Formats a life event for inclusion in AI prompts
 * 
 * Converts structured event data into a descriptive text format
 * that includes the event type, date, precision level, and narrative
 * description for AI analysis.
 * 
 * @param event - The life event to format
 * @returns Formatted string for AI prompt
 * @example
 * formatLifeEventForAI({
 *   eventType: 'Marriage',
 *   eventDate: '2020-06-15',
 *   datePrecision: 'exact_date',
 *   importance: 'high'
 * }) 
 * // Returns: "[HIGH IMPORTANCE] Marriage\n  Date: 2020-06-15 (Exact Date)"
 */
export function formatLifeEventForAI(event: LifeEvent): string {
  const { eventType, category, eventDate, eventTime, endDate, datePrecision, description, importance } = event;
  let timeStr = eventDate;
  let nuance = '';

  switch (datePrecision) {
    case 'exact_date_time':
      if (eventTime) {
        timeStr = `${eventDate} at ${eventTime}`;
        nuance = '(Exact Time)';
      }
      break;
    case 'month_year':
      timeStr = eventDate.split('-').slice(0, 2).join('-');
      nuance = '(Month-Level)';
      break;
    case 'month_range':
      if (endDate) {
        const start = eventDate.split('-').slice(0, 2).join('-');
        const end = endDate.split('-').slice(0, 2).join('-');
        timeStr = `${start} to ${end}`;
      }
      nuance = '(Month Range)';
      break;
    case 'year_range':
      const yearStart = eventDate.split('-')[0];
      if (endDate) {
        const yearEnd = endDate.split('-')[0];
        timeStr = `${yearStart} to ${yearEnd}`;
      } else {
        timeStr = yearStart;
      }
      nuance = '(Year-Level)';
      break;
    case 'date_range':
      if (endDate) timeStr = `${eventDate} to ${endDate}`;
      nuance = '(Date Range)';
      break;
    case 'exact_date':
      nuance = '(Exact Date)';
      break;
  }

  let result = `• [${importance?.toUpperCase() || 'MEDIUM'} IMPORTANCE] ${eventType}\n  Date: ${timeStr} ${nuance}`;
  
  if (description) {
    result += `\n  SITUATIONAL NARRATIVE & EXPERIENCE: "${description}"`;
  }
  
  return result;
}
