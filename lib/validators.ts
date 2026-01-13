import type { BirthData, PhysicalDescription, LifeEvent } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates birth data for completeness and accuracy
 */
export function validateBirthData(data: Partial<BirthData>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.fullName?.trim()) {
    errors.push({ field: 'fullName', message: 'Name is required' });
  } else if (data.fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'Name must be at least 2 characters' });
  } else if (data.fullName.length > 100) {
    errors.push({ field: 'fullName', message: 'Name must be less than 100 characters' });
  }

  // Date validation
  if (!data.dateOfBirth) {
    errors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
  } else if (!isValidISODate(data.dateOfBirth)) {
    errors.push({ field: 'dateOfBirth', message: 'Invalid date format (YYYY-MM-DD)' });
  } else {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    if (birthDate > today) {
      errors.push({ field: 'dateOfBirth', message: 'Birth date cannot be in the future' });
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 150) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid age range' });
    }
  }

  // Time validation
  if (!data.tentativeTime) {
    errors.push({ field: 'tentativeTime', message: 'Birth time is required' });
  } else if (!isValidTimeFormat(data.tentativeTime)) {
    errors.push({ field: 'tentativeTime', message: 'Invalid time format (HH:MM)' });
  }

  // Place validation
  if (!data.birthPlace?.trim()) {
    errors.push({ field: 'birthPlace', message: 'Birth place is required' });
  }

  // Coordinates validation
  if (data.latitude === undefined || data.latitude === null) {
    errors.push({ field: 'latitude', message: 'Latitude is required' });
  } else if (Math.abs(data.latitude) > 90) {
    errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90' });
  }

  if (data.longitude === undefined || data.longitude === null) {
    errors.push({ field: 'longitude', message: 'Longitude is required' });
  } else if (Math.abs(data.longitude) > 180) {
    errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180' });
  }

  // Age validation
  if (data.currentAge !== undefined) {
    if (data.currentAge < 0) {
      errors.push({ field: 'currentAge', message: 'Age cannot be negative' });
    } else if (data.currentAge > 150) {
      errors.push({ field: 'currentAge', message: 'Age seems too high' });
    }
  }

  // Gender validation
  if (!data.gender) {
    errors.push({ field: 'gender', message: 'Gender is required' });
  } else if (!['male', 'female'].includes(data.gender)) {
    errors.push({ field: 'gender', message: 'Gender must be male or female' });
  }

  // Time uncertainty validation
  if (!data.timeUncertainty) {
    errors.push({ field: 'timeUncertainty', message: 'Time uncertainty is required' });
  } else if (!['exact', '5min', '15min', '30min', '1hour', '2hour', '4hour', 'unknown'].includes(data.timeUncertainty)) {
    errors.push({ field: 'timeUncertainty', message: 'Invalid time uncertainty value' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates life events for completeness and logical consistency
 */
export function validateLifeEvents(events: LifeEvent[], birthDate: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(events)) {
    errors.push({ field: 'lifeEvents', message: 'Events must be an array' });
    return { isValid: false, errors };
  }

  if (events.length < 3) {
    errors.push({
      field: 'lifeEvents',
      message: `At least 3 events required (found ${events.length})`
    });
  }

  events.forEach((event, index) => {
    if (!event.eventDate) {
      errors.push({
        field: `event_${index}_date`,
        message: 'Event date is required'
      });
    } else if (!isValidEventDate(event.eventDate, event.dateAccuracy)) {
      errors.push({
        field: `event_${index}_date`,
        message: `Invalid date format for ${event.dateAccuracy} accuracy`
      });
    } else {
      // Validate date based on accuracy type
      const validationResult = validateEventDateForBirth(event.eventDate, event.dateAccuracy, birthDate);
      if (!validationResult.isValid) {
        errors.push({
          field: `event_${index}_date`,
          message: validationResult.message
        });
      }
    }

    if (!event.eventType?.trim()) {
      errors.push({
        field: `event_${index}_type`,
        message: 'Event type is required'
      });
    }

    if (!event.description?.trim()) {
      errors.push({
        field: `event_${index}_desc`,
        message: 'Event description is required'
      });
    }

    if (!event.category) {
      errors.push({
        field: `event_${index}_category`,
        message: 'Event category is required'
      });
    }

    if (!event.importance) {
      errors.push({
        field: `event_${index}_importance`,
        message: 'Event importance is required'
      });
    } else if (!['critical', 'high', 'medium', 'low'].includes(event.importance)) {
      errors.push({
        field: `event_${index}_importance`,
        message: 'Invalid importance level'
      });
    }

    // Validate time if present
    if (event.eventTime && !isValidTimeFormat(event.eventTime)) {
      errors.push({
        field: `event_${index}_time`,
        message: 'Invalid time format (HH:MM)'
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates physical description data
 */
export function validatePhysicalDescription(data: Partial<PhysicalDescription>): ValidationResult {
  const errors: ValidationError[] = [];

  // Body structure validation
  if (data.bodyStructure && !['slim', 'average', 'heavy', 'athletic'].includes(data.bodyStructure)) {
    errors.push({ field: 'bodyStructure', message: 'Invalid body structure' });
  }

  // Height validation
  if (data.height && !['short', 'average', 'tall'].includes(data.height)) {
    errors.push({ field: 'height', message: 'Invalid height' });
  }

  // Face shape validation
  if (data.faceShape && !['round', 'oval', 'square', 'angular', 'heart'].includes(data.faceShape)) {
    errors.push({ field: 'faceShape', message: 'Invalid face shape' });
  }

  // Complexion validation
  if (data.complexion && !['fair', 'wheatish', 'dark'].includes(data.complexion)) {
    errors.push({ field: 'complexion', message: 'Invalid complexion' });
  }

  // Distinctive features length validation
  if (data.distinctiveFeatures && data.distinctiveFeatures.length > 500) {
    errors.push({ field: 'distinctiveFeatures', message: 'Description must be less than 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper functions
function isValidISODate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  
  return date.getFullYear() === y && 
         date.getMonth() === m - 1 && 
         date.getDate() === d;
}

function isValidTimeFormat(timeStr: string): boolean {
  // More flexible regex that allows both single and double digit hours
  // Accepts: 8:30, 08:30, 23:59, 0:00, 00:00
  const regex = /^(0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeStr);
}

/**
 * Comprehensive validation for the entire form submission
 */
export function validateFormSubmission(
  birthData: Partial<BirthData>,
  physicalDescription: Partial<PhysicalDescription>,
  lifeEvents: LifeEvent[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate birth data
  const birthValidation = validateBirthData(birthData);
  if (!birthValidation.isValid) {
    errors.push(...birthValidation.errors);
  }

  // Validate physical description (optional fields, so more lenient)
  const physicalValidation = validatePhysicalDescription(physicalDescription);
  if (!physicalValidation.isValid) {
    errors.push(...physicalValidation.errors);
  }

  // Validate life events (only if we have birth date)
  if (birthData.dateOfBirth) {
    const eventsValidation = validateLifeEvents(lifeEvents, birthData.dateOfBirth);
    if (!eventsValidation.isValid) {
      errors.push(...eventsValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates event date based on date accuracy type
 */
function isValidEventDate(dateStr: string, accuracy: string): boolean {
  switch (accuracy) {
    case 'exact':
      return isValidISODate(dateStr);
    case 'month':
      return /^\d{4}-\d{2}$/.test(dateStr) && isValidMonthYear(dateStr);
    case 'year':
      return /^\d{4}$/.test(dateStr) && isValidYear(dateStr);
    case 'approximate':
      return isValidApproximateDate(dateStr);
    case 'range':
      return isValidDateRange(dateStr);
    default:
      return false;
  }
}

/**
 * Validates month-year format (YYYY-MM)
 */
function isValidMonthYear(dateStr: string): boolean {
  const [year, month] = dateStr.split('-').map(Number);
  return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
}

/**
 * Validates year format (YYYY)
 */
function isValidYear(yearStr: string): boolean {
  const year = parseInt(yearStr);
  return year >= 1900 && year <= 2100;
}

/**
 * Validates approximate date format
 */
function isValidApproximateDate(dateStr: string): boolean {
  // Allow formats like "Around 2015", "Early 2020", "Mid 2018", "Late 2019"
  const approximatePatterns = [
    /^Around \d{4}$/i,
    /^Early \d{4}$/i,
    /^Mid \d{4}$/i,
    /^Late \d{4}$/i,
    /^\d{4}$/ // Also allow just year
  ];
  
  return approximatePatterns.some(pattern => pattern.test(dateStr));
}

/**
 * Validates date range format ("YYYY-MM-DD to YYYY-MM-DD")
 */
function isValidDateRange(rangeStr: string): boolean {
  const parts = rangeStr.split(' to ');
  if (parts.length !== 2) return false;
  
  const [start, end] = parts;
  return isValidISODate(start) && isValidISODate(end) && new Date(start) <= new Date(end);
}

/**
 * Validates event date against birth date
 */
function validateEventDateForBirth(eventDate: string, accuracy: string, birthDate: string): { isValid: boolean; message: string } {
  try {
    const birth = new Date(birthDate);
    let eventStart: Date;
    let eventEnd: Date;

    switch (accuracy) {
      case 'exact':
        eventStart = eventEnd = new Date(eventDate);
        break;
      case 'month':
        const [year, month] = eventDate.split('-').map(Number);
        eventStart = new Date(year, month - 1, 1);
        eventEnd = new Date(year, month, 0); // Last day of month
        break;
      case 'year':
        const yearNum = parseInt(eventDate);
        eventStart = new Date(yearNum, 0, 1);
        eventEnd = new Date(yearNum, 11, 31);
        break;
      case 'approximate':
        // Extract year from approximate date
        const yearMatch = eventDate.match(/\d{4}/);
        if (!yearMatch) {
          return { isValid: false, message: 'Could not extract year from approximate date' };
        }
        const approxYear = parseInt(yearMatch[0]);
        eventStart = new Date(approxYear, 0, 1);
        eventEnd = new Date(approxYear, 11, 31);
        break;
      case 'range':
        const [start, end] = eventDate.split(' to ');
        eventStart = new Date(start);
        eventEnd = new Date(end);
        break;
      default:
        return { isValid: false, message: 'Invalid date accuracy type' };
    }

    // Check if event could occur after birth
    if (eventEnd < birth) {
      return { isValid: false, message: 'Event cannot occur before birth' };
    }

    // Check if event is not in the future
    const today = new Date();
    if (eventStart > today) {
      return { isValid: false, message: 'Event cannot occur in the future' };
    }

    return { isValid: true, message: '' };
  } catch (error) {
    return { isValid: false, message: 'Invalid date format' };
  }
}