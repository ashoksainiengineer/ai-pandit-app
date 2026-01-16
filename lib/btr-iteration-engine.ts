
import { calculateCompleteChart } from './ephemeris';
import type { BirthData, ChartCalculation } from '@/types';

interface BtrIterationResult {
  timestamp: string;
  chart: ChartCalculation;
}

// This function will be the core of our new BTR iteration engine.
// It will accept a start and end time, and a callback function to stream progress.
export async function* runBtrScan(
  birthData: Omit<BirthData, 'tentativeTime'>,
  startTime: string,
  endTime: string,
): AsyncGenerator<BtrIterationResult, void, undefined> {

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  for (let d = startDate; d <= endDate; d.setMinutes(d.getMinutes() + 1)) {
    const tentativeTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const currentBirthData: BirthData = {
        ...birthData,
        tentativeTime,
    };

    // Calculate the astrological chart for the current minute.
    const chart = calculateCompleteChart(currentBirthData);

    // Yield the result for this minute.
    yield {
      timestamp: d.toISOString(),
      chart: chart,
    };
  }
}
