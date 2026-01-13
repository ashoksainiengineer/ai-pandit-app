// ==========================================
// DATE UTILITY FUNCTIONS
// ==========================================
// Standardized date handling to fix YYYY-MM-DD vs DD-MM-YYYY inconsistencies

/**
 * Formats a Date object to ISO string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date | string): string {
  if (typeof date === 'string') {
    // If already in ISO format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // If it's a string date, parse it first
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parses an ISO date string (YYYY-MM-DD) to a Date object
 * Validates the format and throws error if invalid
 */
export function parseISODate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error('Date string is required');
  }

  // Strict ISO format validation: YYYY-MM-DD
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Validate ranges
  if (!isValidDate(year, month, day)) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  // Create date (month is 0-indexed in JavaScript)
  const date = new Date(year, month - 1, day);
  
  // Double-check the date wasn't invalid (like Feb 30)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  return date;
}

/**
 * Validates if a date is within reasonable astrological bounds
 */
export function isValidBirthDate(dateStr: string): boolean {
  try {
    const date = parseISODate(dateStr);
    const today = new Date();
    const minDate = new Date(1900, 0, 1);
    
    // Check if date is not in the future and not too far in the past
    if (date > today) return false;
    if (date < minDate) return false;
    
    // Check if person would be reasonable age (0-150 years)
    const age = today.getFullYear() - date.getFullYear();
    return age >= 0 && age <= 150;
  } catch {
    return false;
  }
}

/**
 * Validates if an event date is valid (not before birth, not in future)
 */
export function isValidEventDate(eventDate: string, birthDate: string): boolean {
  try {
    const event = parseISODate(eventDate);
    const birth = parseISODate(birthDate);
    const today = new Date();
    
    // Event can't be before birth
    if (event < birth) return false;
    
    // Event can't be in the future (allow 1 day buffer for timezone issues)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (event > tomorrow) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates the difference in days between two dates
 */
export function getDateDifferenceDays(date1: Date, date2: Date): number {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  const diffMs = Math.abs(time2 - time1);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Converts time string to 24-hour format
 */
export function convertTo24Hour(timeStr: string): string {
  // Handle both HH:MM and HH:MM AM/PM formats
  const timeParts = timeStr.trim().split(/[\s:]+/);
  
  if (timeParts.length === 2) {
    // HH:MM format (already 24-hour)
    const [hours, minutes] = timeParts;
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } else if (timeParts.length === 3) {
    // HH:MM AM/PM format
    const [hoursStr, minutes, period] = timeParts;
    let hours = parseInt(hoursStr);
    
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  throw new Error(`Invalid time format: ${timeStr}`);
}

/**
 * Validates time format (HH:MM in 24-hour format)
 */
export function isValidTimeFormat(timeStr: string): boolean {
  // More flexible regex that allows both single and double digit hours
  // Accepts: 8:30, 08:30, 23:59, 0:00, 00:00
  const regex = /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeStr);
}

/**
 * Helper function to validate date components
 */
function isValidDate(year: number, month: number, day: number): boolean {
  return (
    year >= 1900 && year <= 2100 &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31 &&
    // Additional validation for months with 30/31 days
    !(day === 31 && [4, 6, 9, 11].includes(month)) &&
    // February validation (including leap years)
    !(month === 2 && day > 29) &&
    !(month === 2 && day === 29 && !isLeapYear(year))
  );
}

/**
 * Checks if a year is a leap year
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}