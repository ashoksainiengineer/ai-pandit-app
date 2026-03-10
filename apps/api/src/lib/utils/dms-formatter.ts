/**
 * Converts a raw floating point decimal degree (e.g. 15.3778) 
 * into traditional Astrological Degree-Minute-Second format (e.g. 15° 22' 40")
 */
export function decimalToDMS(decimalDegree: number | undefined | null): string {
    if (decimalDegree === undefined || decimalDegree === null || isNaN(decimalDegree)) {
        return "Unknown";
    }

    // Ensure we are working with a positive modulo 30 degree for sign-relative positioning
    let d = Math.abs(decimalDegree % 30);

    let degrees = Math.floor(d);

    // Minutes
    const remainingAfterDegrees = (d - degrees) * 60;
    let minutes = Math.floor(remainingAfterDegrees);

    // Seconds
    const remainingAfterMinutes = (remainingAfterDegrees - minutes) * 60;
    // We round seconds to the nearest whole integer for clean prompt reading, 
    // as decimals on arc-seconds are practically irrelevant for BTR
    let seconds = Math.round(remainingAfterMinutes);

    // Handle overflow from rounding (e.g., 59.9999s -> 60s).
    if (seconds === 60) {
        seconds = 0;
        minutes += 1;
    }
    if (minutes === 60) {
        minutes = 0;
        degrees += 1;
    }

    // Keep value sign-relative and avoid producing 30° in a 0-29° sign span.
    if (degrees >= 30) {
        degrees = 29;
        minutes = 59;
        seconds = 59;
    }

    // Padding for uniform columns in AI Prompt logs
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');

    return `${degrees}° ${mStr}' ${sStr}"`;
}
