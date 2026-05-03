/**
 * String and number formatting utilities
 * Production-grade implementations for consistent formatting
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}
export function convertToDegreesMinutesSeconds(decimal: number): string {
  const degrees = Math.floor(decimal);
  const minutesDecimal = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60);
  return `${degrees}° ${minutes.toString().padStart(2, '0')}' ${seconds.toString().padStart(2, '0')}"`;
}
export function formatTimeHHMMSS(time: string): string {
  const parts = time.split(':');
  if (parts.length === 2) {
    return `${time}:00`;
  }
  return time;
}
export function truncateWithEllipsis(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}
export function formatDecimal(num: number, decimals: number): string {
  if (!Number.isFinite(num)) {
    return (0).toFixed(decimals);
  }
  return num.toFixed(decimals);
}
export function padZero(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}
