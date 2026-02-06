/**
 * AI Response Extractors
 * 
 * Extracts structured data from AI text responses for BTR processing.
 * These functions parse AI output to extract survivor candidates and
 * final verdicts with their associated metadata.
 */

import { FinalVerdict } from '../types.js';

/**
 * Extracts top survivor times from AI batch analysis response
 * 
 * Parses the AI response looking for the TOP_SURVIVORS line or
 * extracts scores from individual candidate evaluations.
 * 
 * @param aiContent - Raw AI response text
 * @param candidateTimes - All candidate times in the batch
 * @param neededCount - Number of survivors needed
 * @returns Array of survivor time strings
 * @example
 * extractBatchSurvivors(
 *   "TOP_SURVIVORS: 12:30:00, 12:31:00, 12:32:00",
 *   ["12:30:00", "12:31:00", "12:32:00", "12:33:00"],
 *   3
 * ) // Returns: ["12:30:00", "12:31:00", "12:32:00"]
 */
export function extractBatchSurvivors(
  aiContent: string,
  candidateTimes: string[],
  neededCount: number
): string[] {
  // Try to extract from TOP_SURVIVORS line
  const survivorMatch = aiContent.match(/TOP_SURVIVORS?[:\s]*([^\n]+)/i);
  if (survivorMatch) {
    const times = survivorMatch[1].match(/\d{2}:\d{2}:\d{2}/g) || [];
    if (times.length >= neededCount) {
      return times.slice(0, neededCount);
    }
  }

  // Fallback: Extract scores and pick top N
  const scores: { time: string; score: number }[] = [];

  for (const time of candidateTimes) {
    const escapedTime = time.replace(/:/g, '[:\\s]?');
    // FIXED: Removed spaces inside regex quantifiers and capture groups
    const timePattern = new RegExp(
      `CANDIDATE[:\\s]*${escapedTime}[\\s\\S]{0,300}SCORE[:\\s]*(\\d+)`,
      'i'
    );
    const match = aiContent.match(timePattern);
    const score = match ? parseInt(match[1], 10) : 50;
    scores.push({ time, score });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, neededCount).map(s => s.time);
}

/**
 * Extracts final verdict from AI final stage response
 * 
 * Parses the AI response to extract the final birth time,
 * accuracy score, confidence level, and margin of error.
 * 
 * @param aiContent - Raw AI response text from final stage
 * @returns Final verdict object or null if parsing fails
 * @example
 * extractFinalVerdict("BEST TIME: 12:30:45\nACCURACY: 95\nCONFIDENCE: HIGH\nMARGIN: ±2 seconds")
 * // Returns: { time: "12:30:45", accuracy: 95, confidence: "HIGH", margin: 2 }
 */
export function extractFinalVerdict(aiContent: string): FinalVerdict | null {
  // Robust Regex: Handles various formats
  const timeMatch = aiContent.match(
    /(?:BEST[ _]TIME|RECTIFIED[ _]TIME)[:\s]*\[?(\d{2}:\d{2}:\d{2})\]?/i
  );
  const accuracyMatch = aiContent.match(
    /(?:ACCURACY|CONFIDENCE[ _]SCORE)[:\s]*(\d+)/i
  );
  const confidenceMatch = aiContent.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
  const marginMatch = aiContent.match(
    /(?:MARGIN|ERROR|PRECISION)[^:]*[:\s]*±?\s*(\d+)/i
  );

  if (timeMatch) {
    return {
      time: timeMatch[1],
      accuracy: accuracyMatch ? parseInt(accuracyMatch[1], 10) : 85,
      confidence: confidenceMatch ? confidenceMatch[1].toUpperCase() : 'MEDIUM',
      margin: marginMatch ? parseInt(marginMatch[1], 10) : 5
    };
  }

  // Deep Search Fallback: Look for time after "Verdict" keyword
  const verdictKeywordIndex = aiContent.toLowerCase().lastIndexOf('verdict');
  if (verdictKeywordIndex !== -1) {
    const afterVerdict = aiContent.substring(verdictKeywordIndex);
    const fallbackTimeMatch = afterVerdict.match(/(\d{2}:\d{2}:\d{2})/);
    if (fallbackTimeMatch) {
      return {
        time: fallbackTimeMatch[1],
        accuracy: 75,
        confidence: 'MEDIUM',
        margin: 10
      };
    }
  }

  return null;
}
