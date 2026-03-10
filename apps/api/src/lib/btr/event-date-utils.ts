import type { DatePrecision, LifeEvent } from '@ai-pandit/shared';

const YEAR_RE = /^\d{4}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const DEFAULT_MIDDAY_TIME = '12:00:00';

export interface EventDateWindow {
  startMs: number;
  endMs: number;
  midpointMs: number;
  startDate: string;
  endDate: string;
  representativeDate: string;
  representativeTime: string;
  isApproximate: boolean;
}

type EventDateLike = Pick<LifeEvent, 'eventDate' | 'endDate' | 'eventTime' | 'datePrecision'>;

interface ParsedDateLiteral {
  year: number;
  month?: number;
  day?: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function startOfUtcDayMs(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

function endOfUtcDayMs(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day, 23, 59, 59, 999);
}

function endOfUtcMonthMs(year: number, month: number): number {
  return Date.UTC(year, month, 0, 23, 59, 59, 999);
}

function endOfUtcYearMs(year: number): number {
  return Date.UTC(year, 11, 31, 23, 59, 59, 999);
}

function formatUtcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function formatUtcTime(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19);
}

function parseDateLiteral(raw: unknown): ParsedDateLiteral | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return {
      year: raw.getUTCFullYear(),
      month: raw.getUTCMonth() + 1,
      day: raw.getUTCDate(),
    };
  }

  if (typeof raw !== 'string') return null;
  const value = raw.trim();

  if (DAY_RE.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
  }

  if (MONTH_RE.test(value)) {
    const [year, month] = value.split('-').map(Number);
    return { year, month };
  }

  if (YEAR_RE.test(value)) {
    return { year: Number(value) };
  }

  return null;
}

function parseYear(raw: unknown): number | null {
  const parsed = parseDateLiteral(raw);
  return parsed?.year ?? null;
}

function parseYearMonth(raw: unknown): { year: number; month: number } | null {
  const parsed = parseDateLiteral(raw);
  if (!parsed?.month) return null;
  return { year: parsed.year, month: parsed.month };
}

function parseYearMonthDay(raw: unknown): { year: number; month: number; day: number } | null {
  const parsed = parseDateLiteral(raw);
  if (!parsed?.month || !parsed.day) return null;
  return { year: parsed.year, month: parsed.month, day: parsed.day };
}

function parseClockTime(raw: unknown): { hour: number; minute: number; second: number } | null {
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(TIME_RE);
  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    second: Number(match[3] ?? 0),
  };
}

function buildWindow(
  startMs: number,
  endMs: number,
  isApproximate: boolean,
): EventDateWindow {
  const safeStart = isFiniteNumber(startMs) ? startMs : Date.now();
  const safeEndRaw = isFiniteNumber(endMs) ? endMs : safeStart;
  const safeEnd = Math.max(safeStart, safeEndRaw);
  const midpointMs = Math.floor((safeStart + safeEnd) / 2);

  return {
    startMs: safeStart,
    endMs: safeEnd,
    midpointMs,
    startDate: formatUtcDate(safeStart),
    endDate: formatUtcDate(safeEnd),
    representativeDate: formatUtcDate(midpointMs),
    representativeTime: formatUtcTime(midpointMs),
    isApproximate,
  };
}

function normalizePrecision(precision: DatePrecision | undefined): DatePrecision {
  return precision ?? 'exact_date';
}

/**
 * Convert flexible life-event date formats into a deterministic UTC window.
 */
export function resolveEventDateWindow(event: EventDateLike): EventDateWindow {
  const precision = normalizePrecision(event.datePrecision);

  switch (precision) {
    case 'exact_date_time': {
      const day = parseYearMonthDay(event.eventDate);
      const time = parseClockTime(event.eventTime);

      if (day && time) {
        const exactMs = Date.UTC(day.year, day.month - 1, day.day, time.hour, time.minute, time.second, 0);
        return buildWindow(exactMs, exactMs, false);
      }

      if (day) {
        return buildWindow(
          startOfUtcDayMs(day.year, day.month, day.day),
          endOfUtcDayMs(day.year, day.month, day.day),
          true,
        );
      }
      break;
    }

    case 'exact_date': {
      const day = parseYearMonthDay(event.eventDate);
      if (day) {
        return buildWindow(
          startOfUtcDayMs(day.year, day.month, day.day),
          endOfUtcDayMs(day.year, day.month, day.day),
          false,
        );
      }
      break;
    }

    case 'date_range': {
      const start = parseYearMonthDay(event.eventDate);
      const end = parseYearMonthDay(event.endDate) ?? start;
      if (start && end) {
        return buildWindow(
          startOfUtcDayMs(start.year, start.month, start.day),
          endOfUtcDayMs(end.year, end.month, end.day),
          true,
        );
      }
      break;
    }

    case 'month_year': {
      const month = parseYearMonth(event.eventDate);
      if (month) {
        return buildWindow(
          startOfUtcDayMs(month.year, month.month, 1),
          endOfUtcMonthMs(month.year, month.month),
          true,
        );
      }
      break;
    }

    case 'month_range': {
      const start = parseYearMonth(event.eventDate);
      const end = parseYearMonth(event.endDate) ?? start;
      if (start && end) {
        return buildWindow(
          startOfUtcDayMs(start.year, start.month, 1),
          endOfUtcMonthMs(end.year, end.month),
          true,
        );
      }
      break;
    }

    case 'year_range': {
      const startYear = parseYear(event.eventDate);
      const endYear = parseYear(event.endDate) ?? startYear;
      if (startYear) {
        return buildWindow(
          Date.UTC(startYear, 0, 1, 0, 0, 0, 0),
          endOfUtcYearMs(endYear ?? startYear),
          true,
        );
      }
      break;
    }

    default:
      break;
  }

  const dayFallback = parseYearMonthDay(event.eventDate);
  if (dayFallback) {
    return buildWindow(
      startOfUtcDayMs(dayFallback.year, dayFallback.month, dayFallback.day),
      endOfUtcDayMs(dayFallback.year, dayFallback.month, dayFallback.day),
      true,
    );
  }

  const monthFallback = parseYearMonth(event.eventDate);
  if (monthFallback) {
    return buildWindow(
      startOfUtcDayMs(monthFallback.year, monthFallback.month, 1),
      endOfUtcMonthMs(monthFallback.year, monthFallback.month),
      true,
    );
  }

  const yearFallback = parseYear(event.eventDate);
  if (yearFallback) {
    return buildWindow(
      Date.UTC(yearFallback, 0, 1, 0, 0, 0, 0),
      endOfUtcYearMs(yearFallback),
      true,
    );
  }

  return buildWindow(Date.now(), Date.now(), true);
}

/**
 * Human-readable window summary used by prompts/logging.
 */
export function formatEventWindow(window: Pick<EventDateWindow, 'startDate' | 'endDate'>): string {
  return window.startDate === window.endDate
    ? window.startDate
    : `${window.startDate} -> ${window.endDate}`;
}

/**
 * Create representative date/time for ephemeris calculations.
 */
export function getRepresentativeEventDateTime(event: EventDateLike): {
  eventDate: string;
  eventTime: string;
  window: EventDateWindow;
} {
  const window = resolveEventDateWindow(event);

  return {
    eventDate: window.representativeDate,
    eventTime: window.representativeTime || DEFAULT_MIDDAY_TIME,
    window,
  };
}
