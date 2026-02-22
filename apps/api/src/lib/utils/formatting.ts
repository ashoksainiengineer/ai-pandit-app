/**
 * String and number formatting utilities
 * Production-grade implementations for consistent formatting
 */

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The capitalized string, or empty string if input is empty
 * @example
 * capitalizeFirstLetter('hello') // 'Hello'
 * capitalizeFirstLetter('') // ''
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a decimal degree value to DMS (Degrees, Minutes, Seconds) format
 * Used for displaying ephemeris positions in traditional format
 * @param decimal The decimal degree value (0-360)
 * @returns Formatted DMS string (e.g., "15° 30' 45\"")
 * @example
 * convertToDegreesMinutesSeconds(15.5125) // "15° 30' 45\""
 */
export function convertToDegreesMinutesSeconds(decimal: number): string {
  const degrees = Math.floor(decimal);
  const minutesDecimal = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60);
  return `${degrees}° ${minutes.toString().padStart(2, '0')}' ${seconds.toString().padStart(2, '0')}"`;
}

/**
 * Formats a time string to ensure HH:MM:SS format
 * Adds seconds if only HH:MM provided
 * @param time The time string to format (HH:MM or HH:MM:SS)
 * @returns Formatted time string (HH:MM:SS)
 * @example
 * formatTimeHHMMSS('12:30') // '12:30:00'
 * formatTimeHHMMSS('12:30:45') // '12:30:45'
 */
export function formatTimeHHMMSS(time: string): string {
  const parts = time.split(':');
  if (parts.length === 2) {
    return `${time}:00`;
  }
  return time;
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param str The string to truncate
 * @param maxLength Maximum length including ellipsis
 * @returns Truncated string
 * @example
 * truncateWithEllipsis('Hello World', 8) // 'Hello...'
 */
export function truncateWithEllipsis(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Formats a number with specified decimal places
 * Handles edge cases like NaN and Infinity
 * @param num The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 * @example
 * formatDecimal(3.14159, 2) // '3.14'
 * formatDecimal(NaN, 2) // '0.00'
 */
export function formatDecimal(num: number, decimals: number): string {
  if (!Number.isFinite(num)) {
    return (0).toFixed(decimals);
  }
  return num.toFixed(decimals);
}

/**
 * Pads a number with leading zeros
 * @param num The number to pad
 * @param length Target length
 * @returns Zero-padded string
 * @example
 * padZero(5, 2) // '05'
 * padZero(123, 5) // '00123'
 */
export function padZero(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}
