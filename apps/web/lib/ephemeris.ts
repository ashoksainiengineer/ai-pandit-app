// Frontend-compatible ephemeris utilities

export function isHighPrecisionMode(): boolean {
  // Frontend doesn't have access to Swiss Ephemeris files
  return false;
}

export function getEphemerisMode(): string {
  return 'algorithmic';
}
