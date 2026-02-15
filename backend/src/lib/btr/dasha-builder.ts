/**
 * Dasha (Planetary Period) Builder Module
 *
 * Handles construction of Vimshottari Dasha sequences with configurable depth.
 * Supports 5 levels: Maha → Antar → Pratyantar → Sukshma → Prana
 */

import { calculateVimshottariDasha } from '../vedic-astrology-engine.js';
import { calculateYoginiDasha } from '../advanced-btr-methods.js';
import { calculateCharaDasha } from '../jaimini-astrology.js';
import { VimshottariDashaEntry } from './types.js';

const DAY_MS = 24 * 60 * 60 * 1000;

console.log('[DEBUG] 🛠️ ESM-Fixed dasha-builder.ts loaded. If you see this, require() is gone!');

interface DashaBuildOptions {
  moonLongitude: number;
  birthDate: Date;
  dashaDepth: number;
  pranaWindowDays: number;
  eventRanges: { start: number; end: number }[];
  now: number;
}

/**
 * Builds Vimshottari Dasha table with specified depth
 */
export function buildVimshottariDasha(
  options: DashaBuildOptions
): VimshottariDashaEntry[] {
  const { moonLongitude, birthDate, dashaDepth, pranaWindowDays, eventRanges, now } = options;

  const vimDashas = calculateVimshottariDasha(moonLongitude, birthDate, dashaDepth);
  const pruningWindowMs = pranaWindowDays * DAY_MS;

  // Use range starts for reference date calculation
  const validStartDates = eventRanges.map(r => r.start).filter(d => !isNaN(d));
  const referenceDate = validStartDates.length > 0 ? Math.min(...validStartDates) : now;
  const minDate = referenceDate - (365 * DAY_MS);

  // Used for pruning logic but not extensively used in calculation here
  // const maxDate = Math.max(...eventDates, now) + (365 * DAY_MS);

  const result: VimshottariDashaEntry[] = [];

  const CUTOFF_YEARS = 3;
  const cutoffDate = now + (CUTOFF_YEARS * 365 * DAY_MS);

  for (const maha of vimDashas) {
    // Optimization: Stop if Mahadasha starts after our cutoff
    if (maha.startDate.getTime() > cutoffDate) break;

    if (!maha.subPeriods || dashaDepth < 1) continue;

    for (const antar of maha.subPeriods) {
      if (antar.startDate.getTime() > cutoffDate) break;

      if (!antar.subPeriods || dashaDepth < 2) continue;

      for (const prat of antar.subPeriods) {
        if (prat.startDate.getTime() > cutoffDate) break;

        const entries = processPratyantarLevel(
          maha, antar, prat, dashaDepth, pruningWindowMs, eventRanges
        );
        result.push(...entries);
      }
    }
  }

  return result;
}

/**
 * Process Pratyantar level and deeper if configured
 */
function processPratyantarLevel(
  maha: any,
  antar: any,
  prat: any,
  dashaDepth: number,
  pruningWindowMs: number,
  eventRanges: { start: number; end: number }[]
): VimshottariDashaEntry[] {
  const result: VimshottariDashaEntry[] = [];

  if (dashaDepth === 3) {
    result.push(createDashaEntry(maha.lord, antar.lord, prat.lord, '-', '-',
      formatDateRange(prat.startDate, prat.endDate)));
    return result;
  }

  if (dashaDepth >= 4 && prat.subPeriods) {
    for (const suksh of prat.subPeriods) {
      const entries = processSukshmaLevel(
        maha, antar, prat, suksh, dashaDepth, pruningWindowMs, eventRanges
      );
      result.push(...entries);
    }
  }

  return result;
}

/**
 * Process Sukshma level and Prana if configured
 */
function processSukshmaLevel(
  maha: any,
  antar: any,
  prat: any,
  suksh: any,
  dashaDepth: number,
  pruningWindowMs: number,
  eventRanges: { start: number; end: number }[]
): VimshottariDashaEntry[] {
  const result: VimshottariDashaEntry[] = [];

  if (dashaDepth === 4) {
    result.push(createDashaEntry(maha.lord, antar.lord, prat.lord, suksh.lord, '-',
      formatDate(suksh.startDate)));
    return result;
  }

  if (dashaDepth >= 5 && suksh.subPeriods) {
    const sukshStart = suksh.startDate.getTime();
    const sukshEnd = suksh.endDate.getTime();

    // Check if sukshma overlaps with any event range (plus padding)
    const isNearEvent = eventRanges.some(range => {
      const paddedStart = range.start - pruningWindowMs;
      const paddedEnd = range.end + pruningWindowMs;
      // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
      return sukshStart <= paddedEnd && sukshEnd >= paddedStart;
    });

    if (isNearEvent) {
      for (const prana of suksh.subPeriods) {
        result.push(createDashaEntry(
          maha.lord, antar.lord, prat.lord, suksh.lord, prana.lord,
          formatTimeRange(prana.startDate, prana.endDate, prana.startDate)
        ));
      }
    } else {
      result.push(createDashaEntry(maha.lord, antar.lord, prat.lord, suksh.lord, '-',
        formatDate(suksh.startDate)));
    }
  }

  return result;
}

/**
 * Factory function for creating Dasha entries
 */
function createDashaEntry(
  maha: string,
  antar: string,
  pratyantar: string,
  sukshma: string,
  prana: string,
  startEnd: string
): VimshottariDashaEntry {
  return { maha, antar, pratyantar, sukshma, prana, startEnd };
}

/**
 * Format date range as string
 */
function formatDateRange(start: Date, end: Date): string {
  return `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
}

/**
 * Format single date as string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format time range with date
 */
function formatTimeRange(start: Date, end: Date, date: Date): string {
  const startTime = start.toISOString().split('T')[1].slice(0, 5);
  const endTime = end.toISOString().split('T')[1].slice(0, 5);
  const dateStr = date.toISOString().split('T')[0];
  return `${startTime} to ${endTime} (${dateStr})`;
}

/**
 * Build Yogini Dasha filtered by timeline
 */
export function buildYoginiDasha(
  moonLongitude: number,
  birthDate: Date,
  minDate: number,
  maxDate: number
): Array<{ lord: string; startEnd: string }> {
  // Use static import instead of require
  const dashas = calculateYoginiDasha(moonLongitude, birthDate);

  return dashas
    .filter(d => {
      const start = d.startDate.getTime();
      const end = d.endDate.getTime();
      return start <= maxDate && end >= minDate;
    })
    .map(d => ({
      lord: d.name,
      startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
    }));
}

/**
 * Build Chara Dasha filtered by timeline
 */
export function buildCharaDasha(
  ephemeris: any,
  birthDate: Date,
  minDate: number,
  maxDate: number
): Array<{ sign: string; startEnd: string }> {
  // Use static import instead of require
  const dashas = calculateCharaDasha(ephemeris, birthDate);

  return dashas
    .filter(d => {
      const start = d.startDate.getTime();
      const end = d.endDate.getTime();
      return start <= maxDate && end >= minDate;
    })
    .map(d => ({
      sign: d.sign,
      startEnd: `${d.startDate.toISOString().split('T')[0]} to ${d.endDate.toISOString().split('T')[0]}`
    }));
}
