/**
 * Tatwa Shuddhi Module
 *
 * Ancient Vedic technique for birth time correction based on the 5 elements.
 * Each Tatwa governs specific time windows after sunrise, enabling precise
 * rectification for births near sunrise.
 *
 * Tatwa Cycles:
 * - Prithvi (Earth): First 26 minutes after sunrise
 * - Jala (Water): 26-52 minutes after sunrise
 * - Agni (Fire): 52-78 minutes after sunrise
 * - Vayu (Air): 78-104 minutes after sunrise
 * - Akasha (Ether): 104-130 minutes after sunrise
 *
 * Cycle repeats every 130 minutes throughout the day.
 */

import { TatwaType, TatwaResult, TatwaWindow, DoshaType, TATWA_ELEMENTS, TATWA_DOSHA_MAP } from '@ai-pandit/shared';

const TATWA_SEQUENCE: TatwaType[] = ['prithvi', 'jala', 'agni', 'vayu', 'akasha'];
export const TATWA_DURATION_MINUTES = 26;
export const FULL_CYCLE_MINUTES = TATWA_DURATION_MINUTES * 5; // 130 minutes

export interface TatwaCalculationOptions {
  sunriseTime: Date;
  birthTime: Date;
  knownTatwa?: TatwaType;
  knownPrakriti?: DoshaType;
  searchWindowHours?: number;
}

export interface TatwaCorrectionResult {
  currentTatwa: TatwaType;
  currentElement: string;
  minutesSinceSunrise: number;
  cycleNumber: number;
  isCorrect: boolean;
  correctionWindows: TatwaWindow[];
  recommendedCorrections: Array<{
    time: Date;
    tatwa: TatwaType;
    confidence: number;
    reason: string;
  }>;
}

/**
 * Calculate the Tatwa active at a given birth time
 */
export function calculateTatwaAtTime(sunriseTime: Date, birthTime: Date): TatwaResult {
  if (!sunriseTime || !birthTime || isNaN(sunriseTime.getTime()) || isNaN(birthTime.getTime())) {
    return createEmptyTatwaResult(sunriseTime, birthTime);
  }
  const minutesSinceSunrise = (birthTime.getTime() - sunriseTime.getTime()) / 60000;

  if (minutesSinceSunrise < 0) {
    return createBeforeSunriseResult(sunriseTime, birthTime);
  }

  const cycleNumber = Math.floor(minutesSinceSunrise / FULL_CYCLE_MINUTES);
  const positionInCycle = minutesSinceSunrise % FULL_CYCLE_MINUTES;
  const tatwaIndex = Math.floor(positionInCycle / TATWA_DURATION_MINUTES);
  const clampedIndex = Math.min(tatwaIndex, 4);

  const tatwa = TATWA_SEQUENCE[clampedIndex];
  const minutesIntoTatwa = positionInCycle % TATWA_DURATION_MINUTES;

  const cycleStartOffset = cycleNumber * FULL_CYCLE_MINUTES * 60000;
  const tatwaStartOffset = clampedIndex * TATWA_DURATION_MINUTES * 60000;

  const tatwaStartTime = new Date(sunriseTime.getTime() + cycleStartOffset + tatwaStartOffset);
  const tatwaEndTime = new Date(tatwaStartTime.getTime() + TATWA_DURATION_MINUTES * 60000);

  return {
    tatwa,
    element: TATWA_ELEMENTS[tatwa],
    startTime: tatwaStartTime,
    endTime: tatwaEndTime,
    cycleNumber,
    matchesKnownTatwa: true,
    correctionMinutes: 0,
    correctedWindows: []
  };
}

/**
 * Find correction windows when birth time doesn't match known Tatwa
 */
export function findTatwaCorrectionWindows(options: TatwaCalculationOptions): TatwaCorrectionResult {
  const { sunriseTime, birthTime, knownTatwa, knownPrakriti, searchWindowHours = 2 } = options;

  const currentTatwaResult = calculateTatwaAtTime(sunriseTime, birthTime);
  const currentTatwa = currentTatwaResult.tatwa;
  const minutesSinceSunrise = (birthTime.getTime() - sunriseTime.getTime()) / 60000;

  const isCorrect = !knownTatwa || currentTatwa === knownTatwa;

  const correctionWindows = isCorrect
    ? []
    : calculateCorrectionWindows(sunriseTime, birthTime, knownTatwa, knownPrakriti, searchWindowHours);

  const recommendedCorrections = rankCorrectionWindows(correctionWindows, knownPrakriti);

  return {
    currentTatwa,
    currentElement: TATWA_ELEMENTS[currentTatwa],
    minutesSinceSunrise,
    cycleNumber: currentTatwaResult.cycleNumber,
    isCorrect,
    correctionWindows,
    recommendedCorrections
  };
}

/**
 * Calculate all possible correction windows within search range
 */
function calculateCorrectionWindows(
  sunriseTime: Date,
  birthTime: Date,
  targetTatwa: TatwaType,
  knownPrakriti?: DoshaType,
  searchWindowHours: number = 2
): TatwaWindow[] {
  const windows: TatwaWindow[] = [];
  const searchWindowMs = searchWindowHours * 60 * 60 * 1000;
  const startTime = new Date(birthTime.getTime() - searchWindowMs);
  const endTime = new Date(birthTime.getTime() + searchWindowMs);

  const targetIndex = TATWA_SEQUENCE.indexOf(targetTatwa);
  if (targetIndex === -1) return windows;

  let currentTime = new Date(sunriseTime);

  while (currentTime.getTime() < endTime.getTime()) {
    const tatwaStart = new Date(currentTime.getTime() + targetIndex * TATWA_DURATION_MINUTES * 60000);
    const tatwaEnd = new Date(tatwaStart.getTime() + TATWA_DURATION_MINUTES * 60000);

    if (tatwaEnd.getTime() > startTime.getTime() && tatwaStart.getTime() < endTime.getTime()) {
      const distanceFromBirth = Math.abs(
        (tatwaStart.getTime() + tatwaEnd.getTime()) / 2 - birthTime.getTime()
      );

      let confidence = 100 - (distanceFromBirth / (searchWindowMs / 100));
      confidence = Math.max(0, Math.min(100, confidence));

      if (knownPrakriti) {
        const tatwaDoshas = TATWA_DOSHA_MAP[targetTatwa];
        if (tatwaDoshas.includes(knownPrakriti)) {
          confidence += 15;
        }
      }

      windows.push({
        startTime: tatwaStart,
        endTime: tatwaEnd,
        tatwa: targetTatwa,
        confidence: Math.min(100, confidence)
      });
    }

    currentTime = new Date(currentTime.getTime() + FULL_CYCLE_MINUTES * 60000);
  }

  return windows.sort((a, b) => {
    const distA = Math.abs(a.startTime.getTime() + a.endTime.getTime() - 2 * birthTime.getTime());
    const distB = Math.abs(b.startTime.getTime() + b.endTime.getTime() - 2 * birthTime.getTime());
    return distA - distB;
  });
}

/**
 * Rank correction windows by confidence and proximity
 */
function rankCorrectionWindows(
  windows: TatwaWindow[],
  knownPrakriti?: DoshaType
): Array<{ time: Date; tatwa: TatwaType; confidence: number; reason: string }> {
  return windows.slice(0, 3).map(window => {
    const midTime = new Date((window.startTime.getTime() + window.endTime.getTime()) / 2);
    let reason = `Within ${window.tatwa} (${TATWA_ELEMENTS[window.tatwa]}) Tatwa window`;

    if (knownPrakriti && TATWA_DOSHA_MAP[window.tatwa].includes(knownPrakriti)) {
      reason += ` - Matches ${knownPrakriti} prakriti`;
    }

    return {
      time: midTime,
      tatwa: window.tatwa,
      confidence: window.confidence,
      reason
    };
  });
}

/**
 * Infer Tatwa from Prakriti (Ayurvedic constitution)
 */
export function inferTatwaFromPrakriti(dominantDosha: DoshaType): TatwaType[] {
  const doshaTatwaMap: Record<DoshaType, TatwaType[]> = {
    vata: ['vayu', 'akasha'],
    pitta: ['agni', 'jala'],
    kapha: ['prithvi', 'jala', 'akasha']
  };

  return doshaTatwaMap[dominantDosha] || TATWA_SEQUENCE;
}

/**
 * Calculate Tatwa from birth time for verification
 */
export function calculateTatwaFromTime(birthTime: Date, sunriseTime: Date): {
  tatwa: TatwaType;
  minutesIntoTatwa: number;
  cycleNumber: number;
  totalMinutesSinceSunrise: number;
} {
  const minutesSinceSunrise = (birthTime.getTime() - sunriseTime.getTime()) / 60000;

  if (minutesSinceSunrise < 0) {
    return {
      tatwa: 'akasha',
      minutesIntoTatwa: 0,
      cycleNumber: -1,
      totalMinutesSinceSunrise: minutesSinceSunrise
    };
  }

  const cycleNumber = Math.floor(minutesSinceSunrise / FULL_CYCLE_MINUTES);
  const positionInCycle = minutesSinceSunrise % FULL_CYCLE_MINUTES;
  const tatwaIndex = Math.min(Math.floor(positionInCycle / TATWA_DURATION_MINUTES), 4);
  const minutesIntoTatwa = positionInCycle % TATWA_DURATION_MINUTES;

  return {
    tatwa: TATWA_SEQUENCE[tatwaIndex],
    minutesIntoTatwa,
    cycleNumber,
    totalMinutesSinceSunrise: minutesSinceSunrise
  };
}

/**
 * Get all Tatwa windows for a day
 */
export function getDailyTatwaWindows(sunriseTime: Date, hoursToCalculate: number = 12): TatwaWindow[] {
  const windows: TatwaWindow[] = [];
  const endTime = new Date(sunriseTime.getTime() + hoursToCalculate * 60 * 60 * 1000);

  let currentCycleStart = new Date(sunriseTime);
  let cycleNumber = 0;

  while (currentCycleStart.getTime() < endTime.getTime()) {
    for (let i = 0; i < 5; i++) {
      const tatwaStart = new Date(currentCycleStart.getTime() + i * TATWA_DURATION_MINUTES * 60000);
      const tatwaEnd = new Date(tatwaStart.getTime() + TATWA_DURATION_MINUTES * 60000);

      if (tatwaStart.getTime() < endTime.getTime()) {
        windows.push({
          startTime: tatwaStart,
          endTime: tatwaEnd,
          tatwa: TATWA_SEQUENCE[i],
          confidence: 100
        });
      }
    }

    cycleNumber++;
    currentCycleStart = new Date(sunriseTime.getTime() + cycleNumber * FULL_CYCLE_MINUTES * 60000);
  }

  return windows;
}

/**
 * Validate if a time falls within expected Tatwa window
 */
export function validateTatwaTiming(
  birthTime: Date,
  sunriseTime: Date,
  expectedTatwa: TatwaType,
  toleranceMinutes: number = 5
): {
  isValid: boolean;
  actualTatwa: TatwaType;
  deviationMinutes: number;
  adjustmentNeeded: number;
} {
  const actual = calculateTatwaFromTime(birthTime, sunriseTime);

  if (actual.tatwa === expectedTatwa) {
    return {
      isValid: true,
      actualTatwa: actual.tatwa,
      deviationMinutes: 0,
      adjustmentNeeded: 0
    };
  }

  const correction = findTatwaCorrectionWindows({
    sunriseTime,
    birthTime,
    knownTatwa: expectedTatwa,
    searchWindowHours: 1
  });

  const nearestWindow = correction.correctionWindows[0];
  if (!nearestWindow) {
    return {
      isValid: false,
      actualTatwa: actual.tatwa,
      deviationMinutes: Math.abs(actual.totalMinutesSinceSunrise),
      adjustmentNeeded: 0
    };
  }

  const midWindow = (nearestWindow.startTime.getTime() + nearestWindow.endTime.getTime()) / 2;
  const adjustmentMs = midWindow - birthTime.getTime();
  const adjustmentMinutes = adjustmentMs / 60000;

  return {
    isValid: Math.abs(adjustmentMinutes) <= toleranceMinutes,
    actualTatwa: actual.tatwa,
    deviationMinutes: Math.abs(adjustmentMinutes),
    adjustmentNeeded: adjustmentMinutes
  };
}

function createBeforeSunriseResult(sunriseTime: Date, birthTime: Date): TatwaResult {
  const minutesBefore = (sunriseTime.getTime() - birthTime.getTime()) / 60000;

  return {
    tatwa: 'akasha',
    element: 'Ether',
    startTime: new Date(sunriseTime.getTime() - FULL_CYCLE_MINUTES * 60000),
    endTime: sunriseTime,
    cycleNumber: -1,
    matchesKnownTatwa: false,
    correctionMinutes: minutesBefore,
    correctedWindows: [{
      startTime: sunriseTime,
      endTime: new Date(sunriseTime.getTime() + TATWA_DURATION_MINUTES * 60000),
      tatwa: 'prithvi',
      confidence: 80
    }]
  };
}

function createEmptyTatwaResult(sunriseTime: Date, birthTime: Date): TatwaResult {
  return {
    tatwa: 'akasha',
    element: 'Unknown',
    startTime: sunriseTime || new Date(),
    endTime: birthTime || new Date(),
    cycleNumber: -1,
    matchesKnownTatwa: false,
    correctionMinutes: 0,
    correctedWindows: []
  };
}

export const TatwaShuddhi = {
  calculate: calculateTatwaAtTime,
  findCorrections: findTatwaCorrectionWindows,
  inferFromPrakriti: inferTatwaFromPrakriti,
  validate: validateTatwaTiming,
  getDailyWindows: getDailyTatwaWindows
};
