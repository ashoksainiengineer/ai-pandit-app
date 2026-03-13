/**
 * Utility functions for the BTR (Birth Time Rectification) system
 * All utilities are production-grade, type-safe, and well-tested
 */

// Array manipulation utilities
export {
  shuffleArray,
  randomSort,
  chunkArray,
  uniqueArray,
  groupBy,
} from './array-helpers.js';

// String and number formatting utilities
export {
  capitalizeFirstLetter,
  convertToDegreesMinutesSeconds,
  formatTimeHHMMSS,
  truncateWithEllipsis,
  formatDecimal,
  padZero,
} from './formatting.js';

export { decimalToDMS } from './dms-formatter.js';

// Ephemeris data formatting utilities
export {
  getMinifiedEphemeris,
  formatPlanetPosition,
  formatHouseLords,
  extractKeyDignities,
  hasSandhiWarnings,
  getPrimaryDashaLord,
  type MinifiedEphemeris,
} from './ephemeris-helpers.js';

// Re-export for backwards compatibility
export { randomSort as shuffleCandidates } from './array-helpers.js';

// Legacy exports for backward compatibility
export { getMinifiedEphemeris as _getMinifiedEphemeris } from './ephemeris-helpers.js';
