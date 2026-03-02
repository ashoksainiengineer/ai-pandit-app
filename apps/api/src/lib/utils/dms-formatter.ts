/**
 * Converts a raw floating point decimal degree (e.g. 15.3778) 
 * into traditional Astrological Degree-Minute-Second format (e.g. 15° 22' 40")
 */
export function decimalToDMS(decimalDegree: number): string {
    // Ensure we are working with a positive modulo 30 degree for sign-relative positioning
    let d = Math.abs(decimalDegree % 30);

    const degrees = Math.floor(d);

    // Minutes
    const remainingAfterDegrees = (d - degrees) * 60;
    const minutes = Math.floor(remainingAfterDegrees);

    // Seconds
    const remainingAfterMinutes = (remainingAfterDegrees - minutes) * 60;
    // We round seconds to the nearest whole integer for clean prompt reading, 
    // as decimals on arc-seconds are practically irrelevant for BTR
    const seconds = Math.round(remainingAfterMinutes);

    // Padding for uniform columns in AI Prompt logs
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');

    return `${degrees}° ${mStr}' ${sStr}"`;
}
