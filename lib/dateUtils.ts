/**
 * Date validation and formatting utilities
 * Prevents "Invalid time value" errors by ensuring valid Date objects
 */

export interface ValidatedDateResult {
  isValid: boolean;
  date: Date | null;
  error?: string;
}

/**
 * Validates and creates a Date object from date and time strings
 * Prevents common date parsing errors
 */
export function createValidDate(dateString: string, timeString: string, timeZone: string = 'UTC'): ValidatedDateResult {
  try {
    // Input validation
    if (!dateString || !timeString) {
      return {
        isValid: false,
        date: null,
        error: 'Both date and time are required'
      };
    }

    // Ensure dateString is in YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return {
        isValid: false,
        date: null,
        error: `Invalid date format: ${dateString}. Expected YYYY-MM-DD`
      };
    }

    // Ensure timeString is in HH:MM:SS or HH:MM format
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(timeString)) {
      return {
        isValid: false,
        date: null,
        error: `Invalid time format: ${timeString}. Expected HH:MM or HH:MM:SS`
      };
    }

    // Combine date and time
    const timeWithSeconds = timeString.length === 5 ? `${timeString}:00` : timeString;
    const dateTimeString = `${dateString}T${timeWithSeconds}`;

    // Create date object
    // Using UTC parsing and then adjusting for the timeZone is more reliable across environments
    const date = new Date(dateTimeString + 'Z');

    // Validate the resulting date
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        date: null,
        error: `Invalid date/time combination: ${dateTimeString}`
      };
    }

    // Check for reasonable date range (between 1900 and 2100)
    const year = date.getUTCFullYear();
    if (year < 1900 || year > 2100) {
      return {
        isValid: false,
        date: null,
        error: `Date year ${year} is outside reasonable range (1900-2100)`
      };
    }

    return {
      isValid: true,
      date
    };

  } catch (error) {
    return {
      isValid: false,
      date: null,
      error: `Exception creating date: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Safely creates a Date object with error handling
 */
export function safeCreateDate(dateInput: string | Date): ValidatedDateResult {
  try {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return {
        isValid: false,
        date: null,
        error: 'Invalid input type for date creation'
      };
    }

    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        date: null,
        error: `Invalid date: ${dateInput}`
      };
    }

    return {
      isValid: true,
      date
    };

  } catch (error) {
    return {
      isValid: false,
      date: null,
      error: `Exception creating date: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates ISO date string format (YYYY-MM-DD)
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates time string format (HH:MM or HH:MM:SS)
 */
export function isValidTimeString(timeString: string): boolean {
  if (!timeString || typeof timeString !== 'string') return false;
  
  const regex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!regex.test(timeString)) return false;
  
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  
  if (hours < 0 || hours > 23) return false;
  if (minutes < 0 || minutes > 59) return false;
  if (seconds !== undefined && (seconds < 0 || seconds > 59)) return false;
  
  return true;
}

/**
 * Combines date and time strings into ISO string with validation
 */
export function combineDateTimeToISO(dateString: string, timeString: string): string | null {
  const result = createValidDate(dateString, timeString);
  return result.isValid && result.date ? result.date.toISOString() : null;
}

/**
 * Gets current date in ISO format (YYYY-MM-DD)
 */
export function getCurrentISODate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculates age from birth date to reference date
 */
export function calculateAge(birthDateString: string, referenceDate: Date = new Date()): number {
  const result = safeCreateDate(birthDateString);
  if (!result.isValid || !result.date) return 0;
  
  const birthDate = result.date;
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formats a Date object to time string (HH:MM:SS)
 */
export function formatTimeToString(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

/**
 * Adds minutes to a date safely
 */
export function addMinutesToDate(date: Date, minutes: number): ValidatedDateResult {
  try {
    const newDate = new Date(date.getTime() + minutes * 60000);
    
    if (isNaN(newDate.getTime())) {
      return {
        isValid: false,
        date: null,
        error: `Invalid result when adding ${minutes} minutes`
      };
    }
    
    return {
      isValid: true,
      date: newDate
    };
  } catch (error) {
    return {
      isValid: false,
      date: null,
      error: `Exception adding minutes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
