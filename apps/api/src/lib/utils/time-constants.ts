/**
 * Shared time constants for Vedic astrological calculations.
 *
 * DAYS_PER_YEAR: sidereal year in mean solar days (NASA-JPL DE440).
 * Classical Vimshottari uses a 360-day Savana year; this constant uses
 * the sidereal year for calendar-date-to-epoch conversion, which is the
 * convention in modern Vedic software.
 */
export const DAYS_PER_YEAR = 365.25;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Add years to a Date using sidereal year duration. */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + years * DAYS_PER_YEAR * MS_PER_DAY);
  return result;
}
