/**
 * DateInput Component
 * Production-grade date/time input for all 6 precision types
 * 
 * Features:
 * - Comprehensive validation (leap years, days per month)
 * - Real-time error display
 * - Range validation (start <= end)
 * - Proper state management
 * - Clean separation of concerns
 */

'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  DatePrecision,
  DateParts,
  TimeParts,
  parseDateParts,
  parseTimeParts,
  validateDate,
  validateDateTime,
  validateMonthYear,
  validateDateRange,
  validateMonthRange,
  validateYearRange,
  getAvailableDays,
  buildDateString,
  buildTimeString,
  isDateComplete,
  compareDates,
  DATE_CONSTANTS
} from '@/lib/date-utils';

// Constants
const { MONTHS, HOURS, MINUTES } = DATE_CONSTANTS;

interface DateInputProps {
  precision: DatePrecision;
  eventDate: string;
  endDate?: string;
  eventTime?: string;
  onUpdate: (updates: {
    eventDate?: string;
    endDate?: string;
    eventTime?: string;
  }) => void;
  minYear?: number;
  maxYear?: number;
}

interface ValidationState {
  error: string | null;
  isValid: boolean;
}

/**
 * Year Select Component
 */
const YearSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
  hasError?: boolean;
}> = ({ value, onChange, placeholder = 'Year', minYear, maxYear, hasError }) => {
  const years = useMemo(() => {
    const max = maxYear ?? new Date().getFullYear();
    const min = minYear ?? 1900;
    return Array.from({ length: max - min + 1 }, (_, i) => (max - i).toString());
  }, [minYear, maxYear]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all flex-1 min-w-0
        ${hasError
          ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
          : 'border-[#E8E0D5] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10'
        }`}
    >
      <option value="">{placeholder}</option>
      {years.map((year) => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  );
};

/**
 * Month Select Component
 */
const MonthSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}> = ({ value, onChange, placeholder = 'Month', hasError }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all flex-1 min-w-0
        ${hasError
          ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
          : 'border-[#E8E0D5] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10'
        }`}
    >
      <option value="">{placeholder}</option>
      {MONTHS.map((month, index) => (
        <option key={month} value={(index + 1).toString()}>{month}</option>
      ))}
    </select>
  );
};

/**
 * Day Select Component
 * Dynamically shows correct number of days based on year/month
 */
const DaySelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  year: string;
  month: string;
  placeholder?: string;
  hasError?: boolean;
}> = ({ value, onChange, year, month, placeholder = 'Day', hasError }) => {
  const days = useMemo(() => {
    return getAvailableDays(year, month);
  }, [year, month]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all w-20
        ${hasError
          ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
          : 'border-[#E8E0D5] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10'
        }`}
    >
      <option value="">{placeholder}</option>
      {days.map((day) => (
        <option key={day} value={day}>{day}</option>
      ))}
    </select>
  );
};

/**
 * Time Select Component
 */
const TimeSelect: React.FC<{
  hour: string;
  minute: string;
  onChange: (hour: string, minute: string) => void;
  hasError?: boolean;
}> = ({ hour, minute, onChange, hasError }) => {
  return (
    <div className="flex items-center gap-2">
      <select
        value={hour}
        onChange={(e) => onChange(e.target.value, minute)}
        className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all w-20
          ${hasError
            ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
            : 'border-[#E8E0D5] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10'
          }`}
      >
        <option value="">HH</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-[#B8860B] font-bold">:</span>
      <select
        value={minute}
        onChange={(e) => onChange(hour, e.target.value)}
        className={`h-10 px-3 bg-white border rounded-lg text-sm outline-none transition-all w-20
          ${hasError
            ? 'border-[#C65D3B] focus:border-[#C65D3B] focus:ring-2 focus:ring-[#C65D3B]/20'
            : 'border-[#E8E0D5] focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10'
          }`}
      >
        <option value="">MM</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
};

/**
 * Error Display Component
 */
const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="flex items-center gap-2 text-[#C65D3B] text-xs mt-2 animate-in fade-in">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
};

/**
 * Range Arrow Component
 */
const RangeArrow: React.FC = () => (
  <div className="flex items-center justify-center py-1">
    <span className="text-[#B8860B] text-xl">↓</span>
  </div>
);

/**
 * Main DateInput Component
 */
export default function DateInput({
  precision,
  eventDate,
  endDate,
  eventTime,
  onUpdate,
  minYear = 1900,
  maxYear = new Date().getFullYear()
}: DateInputProps) {
  // Helper to normalize month/day values (remove leading zeros to match dropdown option values)
  const normalizeParts = (parts: DateParts): DateParts => ({
    year: parts.year,
    month: parts.month ? parseInt(parts.month, 10).toString() : '',
    day: parts.day ? parseInt(parts.day, 10).toString() : ''
  });

  // LOCAL state for immediate dropdown updates (prevents lag from parent re-renders)
  const [localStartParts, setLocalStartParts] = useState<DateParts>({ year: '', month: '', day: '' });
  const [localEndParts, setLocalEndParts] = useState<DateParts>({ year: '', month: '', day: '' });
  const [localTimeParts, setLocalTimeParts] = useState<TimeParts>({ hour: '', minute: '' });

  // Sync local state with props when they change
  // BUT: Only sync if props have equal or more complete data than local state
  // This prevents losing user input when buildDateString returns empty for partial dates
  useEffect(() => {
    const propsParts = normalizeParts(parseDateParts(eventDate));

    setLocalStartParts(prev => {
      const propsCount = (propsParts.year ? 1 : 0) + (propsParts.month ? 1 : 0) + (propsParts.day ? 1 : 0);
      const localCount = (prev.year ? 1 : 0) + (prev.month ? 1 : 0) + (prev.day ? 1 : 0);

      // Only sync if props have at least as much data as local state
      return propsCount >= localCount ? propsParts : prev;
    });
  }, [eventDate]);

  useEffect(() => {
    const propsParts = normalizeParts(parseDateParts(endDate));

    setLocalEndParts(prev => {
      const propsCount = (propsParts.year ? 1 : 0) + (propsParts.month ? 1 : 0) + (propsParts.day ? 1 : 0);
      const localCount = (prev.year ? 1 : 0) + (prev.month ? 1 : 0) + (prev.day ? 1 : 0);

      return propsCount >= localCount ? propsParts : prev;
    });
  }, [endDate]);

  useEffect(() => {
    const propsParts = parseTimeParts(eventTime);

    setLocalTimeParts(prev => {
      const propsCount = (propsParts.hour ? 1 : 0) + (propsParts.minute ? 1 : 0);
      const localCount = (prev.hour ? 1 : 0) + (prev.minute ? 1 : 0);

      return propsCount >= localCount ? propsParts : prev;
    });
  }, [eventTime]);

  // Derived parts for validation (from props)
  const startParts = useMemo(() => parseDateParts(eventDate), [eventDate]);
  const endParts = useMemo(() => parseDateParts(endDate), [endDate]);
  const timeParts = useMemo(() => parseTimeParts(eventTime), [eventTime]);

  // Validation state
  const [validation, setValidation] = useState<ValidationState>({
    error: null,
    isValid: true
  });

  /**
   * Perform comprehensive validation based on precision
   */
  const performValidation = useCallback(() => {
    let result: { valid: boolean; error?: string } = { valid: true };

    switch (precision) {
      case 'exact_date_time':
        if (eventDate && eventTime) {
          result = validateDateTime(eventDate, eventTime);
        }
        break;

      case 'exact_date':
        if (eventDate) {
          result = validateDate(eventDate);
        }
        break;

      case 'month_year':
        if (startParts.year && startParts.month) {
          result = validateMonthYear(startParts.year, startParts.month);
        }
        break;

      case 'date_range':
        if (eventDate && endDate) {
          result = validateDateRange(eventDate, endDate);
        }
        break;

      case 'month_range':
        if (startParts.year && startParts.month && endParts.year && endParts.month) {
          result = validateMonthRange(
            startParts.year,
            startParts.month,
            endParts.year,
            endParts.month
          );
        }
        break;

      case 'year_range':
        if (startParts.year && endParts.year) {
          result = validateYearRange(startParts.year, endParts.year);
        }
        break;
    }

    setValidation({
      error: result.error || null,
      isValid: result.valid
    });
  }, [precision, eventDate, endDate, eventTime]);
  // Note: startParts and endParts are derived from eventDate/endDate, so don't include them

  // Validate on changes - only update internal validation state, NEVER call onUpdate from here
  useEffect(() => {
    performValidation();
  }, [performValidation]);

  /**
   * Update start date parts
   */
  const updateStartDate = useCallback((updates: Partial<DateParts>) => {
    // Update local state immediately for UI responsiveness
    setLocalStartParts(prev => ({ ...prev, ...updates }));

    // Parse current date to get fresh parts
    const currentParts = parseDateParts(eventDate || '');
    const newParts = { ...currentParts, ...updates };
    const newDate = buildDateString(newParts);
    onUpdate({ eventDate: newDate || undefined });
  }, [eventDate, onUpdate]);

  /**
   * Update end date parts
   */
  const updateEndDate = useCallback((updates: Partial<DateParts>) => {
    // Update local state immediately for UI responsiveness
    setLocalEndParts(prev => ({ ...prev, ...updates }));

    // Parse current date to get fresh parts
    const currentParts = parseDateParts(endDate || '');
    const newParts = { ...currentParts, ...updates };
    const newDate = buildDateString(newParts);
    onUpdate({ endDate: newDate || undefined });
  }, [endDate, onUpdate]);

  /**
   * Update time
   */
  const updateTime = useCallback((hour: string, minute: string) => {
    // Update local state immediately for UI responsiveness
    setLocalTimeParts({ hour, minute });

    const newTime = buildTimeString(hour, minute);
    onUpdate({ eventTime: newTime || undefined });
  }, [onUpdate]);

  // ============ RENDERERS FOR EACH PRECISION ============

  /**
   * Year Range: Start Year → End Year
   */
  const renderYearRange = () => (
    <div className="bg-[#F5EFE7] p-4 rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Start Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <span className="text-[#B8860B] text-xl font-bold">→</span>
        <YearSelect
          value={localEndParts.year}
          onChange={(year) => updateEndDate({ year })}
          placeholder="End Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('End')}
        />
      </div>
      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Month Range: Start Month/Year → End Month/Year
   */
  const renderMonthRange = () => (
    <div className="bg-[#F5EFE7] p-4 rounded-lg space-y-2">
      {/* Start Date */}
      <div className="flex gap-3">
        <MonthSelect
          value={localStartParts.month}
          onChange={(month) => updateStartDate({ month })}
          placeholder="Start Month"
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Start Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('Start')}
        />
      </div>

      <RangeArrow />

      {/* End Date */}
      <div className="flex gap-3">
        <MonthSelect
          value={localEndParts.month}
          onChange={(month) => updateEndDate({ month })}
          placeholder="End Month"
          hasError={!!validation.error && validation.error.includes('End')}
        />
        <YearSelect
          value={localEndParts.year}
          onChange={(year) => updateEndDate({ year })}
          placeholder="End Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('End')}
        />
      </div>

      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Month & Year
   */
  const renderMonthYear = () => (
    <div className="bg-[#F5EFE7] p-4 rounded-lg space-y-3">
      <div className="flex gap-3">
        <MonthSelect
          value={localStartParts.month}
          onChange={(month) => updateStartDate({ month })}
          placeholder="Month"
          hasError={!!validation.error}
        />
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error}
        />
      </div>
      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Date Range: Start Date → End Date
   */
  const renderDateRange = () => (
    <div className="bg-[#F5EFE7] p-4 rounded-lg space-y-2">
      {/* Start Date */}
      <div className="flex gap-3">
        <DaySelect
          value={localStartParts.day}
          onChange={(day) => updateStartDate({ day })}
          year={localStartParts.year}
          month={localStartParts.month}
          placeholder="Start Day"
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <MonthSelect
          value={localStartParts.month}
          onChange={(month) => updateStartDate({ month })}
          placeholder="Start Month"
          hasError={!!validation.error && validation.error.includes('Start')}
        />
        <YearSelect
          value={localStartParts.year}
          onChange={(year) => updateStartDate({ year })}
          placeholder="Start Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('Start')}
        />
      </div>

      <RangeArrow />

      {/* End Date */}
      <div className="flex gap-3">
        <DaySelect
          value={localEndParts.day}
          onChange={(day) => updateEndDate({ day })}
          year={endParts.year || startParts.year}
          month={endParts.month || startParts.month}
          placeholder="End Day"
          hasError={!!validation.error && validation.error.includes('End')}
        />
        <MonthSelect
          value={localEndParts.month}
          onChange={(month) => updateEndDate({ month })}
          placeholder="End Month"
          hasError={!!validation.error && validation.error.includes('End')}
        />
        <YearSelect
          value={localEndParts.year}
          onChange={(year) => updateEndDate({ year })}
          placeholder="End Year"
          minYear={minYear}
          maxYear={maxYear}
          hasError={!!validation.error && validation.error.includes('End')}
        />
      </div>

      <ErrorDisplay error={validation.error} />
    </div>
  );

  /**
   * Exact Date or Exact Date & Time
   */
  const renderExactDate = () => (
    <div className="space-y-3">
      <div className="bg-[#F5EFE7] p-4 rounded-lg">
        <div className="flex gap-3">
          <DaySelect
            value={localStartParts.day}
            onChange={(day) => updateStartDate({ day })}
            year={localStartParts.year}
            month={localStartParts.month}
            placeholder="Day"
            hasError={!!validation.error && !validation.error.includes('Time')}
          />
          <MonthSelect
            value={localStartParts.month}
            onChange={(month) => updateStartDate({ month })}
            placeholder="Month"
            hasError={!!validation.error && !validation.error.includes('Time')}
          />
          <YearSelect
            value={localStartParts.year}
            onChange={(year) => updateStartDate({ year })}
            placeholder="Year"
            minYear={minYear}
            maxYear={maxYear}
            hasError={!!validation.error && !validation.error.includes('Time')}
          />
        </div>

        {precision === 'exact_date' && <ErrorDisplay error={validation.error} />}
      </div>

      {/* Time selector for exact_date_time */}
      {precision === 'exact_date_time' && (
        <div className="bg-[#F5EFE7] p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[#7A756F] font-medium">Time:</label>
            <TimeSelect
              hour={timeParts.hour}
              minute={timeParts.minute}
              onChange={updateTime}
              hasError={!!validation.error && validation.error.includes('Time')}
            />
          </div>
          <ErrorDisplay error={validation.error} />
        </div>
      )}
    </div>
  );

  // ============ MAIN RENDER ============

  switch (precision) {
    case 'year_range':
      return renderYearRange();
    case 'month_range':
      return renderMonthRange();
    case 'month_year':
      return renderMonthYear();
    case 'date_range':
      return renderDateRange();
    case 'exact_date':
    case 'exact_date_time':
      return renderExactDate();
    default:
      return null;
  }
}

// Export types for consumers
export type { DateInputProps };
