import { EphemerisData } from './types.js';
export interface BoundaryWarning {
    type: 'nakshatra' | 'lagna' | 'house' | 'dasha';
    message: string;
    distanceSeconds: number;
    severity: 'low' | 'medium' | 'high';
}
export interface BoundarySafetyResult {
    isSafe: boolean;
    warnings: BoundaryWarning[];
    nakshatraDistance: number;
    lagnaDistance: number;
    houseDistance: number;
    overallRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
}
/**
 * Comprehensive boundary safety verification
 * At seconds-level precision, tiny differences matter
 */
export declare function verifyBoundarySafety(ephemeris: EphemerisData, julianDay: number): BoundarySafetyResult;
/**
 * Quick check if a time is near any boundary
 * Returns true if safe distance from all boundaries
 */
export declare function isTimeSafeFromBoundaries(ephemeris: EphemerisData, julianDay: number): boolean;
/**
 * Get suggested alternative times if current is near boundary
 */
export declare function getSuggestedAlternatives(currentTime: string, warnings: BoundaryWarning[]): string[];
/**
 * Format boundary result for display
 */
export declare function formatBoundarySafetyResult(result: BoundarySafetyResult): string;
export default verifyBoundarySafety;
//# sourceMappingURL=boundary-verifier.d.ts.map