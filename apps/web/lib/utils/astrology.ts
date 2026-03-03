/**
 * Astrology Utilities for Frontend
 * ================================
 * Offloads heavy formatting and calculations from the backend to the client.
 */

/**
 * Converts decimal degrees to Degrees, Minutes, Seconds (DMS) format.
 * Industry Standard: High-precision rounding and symbol formatting.
 * 
 * @param decimalDegrees - The raw degree value (e.g., 15.2345)
 * @returns Formatted string (e.g., 15° 14' 04")
 */
export function formatDMS(decimalDegrees: number | string): string {
    const totalSeconds = Math.round(Number(decimalDegrees) * 3600);
    const degrees = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${degrees}° ${minutes.toString().padStart(2, '0')}' ${seconds.toString().padStart(2, '0')}"`;
}

/**
 * Parses a combined string like "Aries 15.2345" into sign and DMS.
 */
export function formatSignDegree(value: string): string {
    if (!value) return '-';

    // Split "Aries 15.2345"
    const parts = value.split(' ');
    if (parts.length < 2) return value;

    const sign = parts[0];
    const degree = parts[1];

    return `${sign} ${formatDMS(degree)}`;
}
