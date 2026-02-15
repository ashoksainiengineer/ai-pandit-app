/**
 * AI Response Extractors
 * 
 * Extracts structured data from AI text responses for BTR processing.
 * These functions parse AI output to extract survivor candidates and
 * final verdicts with their associated metadata.
 */

import { FinalVerdict } from '../types.js';

/**
 * Extracts top survivor times and their scores from AI batch analysis response
 * 
 * @param aiContent - Raw AI response text
 * @param candidateTimes - All candidate times in the batch
 * @param neededCount - Number of survivors needed
 * @returns Array of survivor objects { time, score }
 */
export function extractBatchSurvivors(
  aiContent: string,
  candidateTimes: string[],
  neededCount: number
): { time: string; score: number; reason: string }[] {
  const scores: { time: string; score: number; reason: string }[] = [];

  for (const time of candidateTimes) {
    const escapedTime = time.replace(/:/g, '[:\\s]?');
    // Extracts score and preceding context as reason
    const timePattern = new RegExp(
      `(?:JUSTIFICATION|REASON|ANALYSIS)[:\\s]*(.{1,200}?)[\\s\\S]{0,100}CANDIDATE[:\\s]*${escapedTime}[\\s\\S]{0,500}SCORE[:\\s]*(\\d+)`,
      'i'
    );

    // Alternative pattern if reason follows score
    const fallbackPattern = new RegExp(
      `CANDIDATE[:\\s]*${escapedTime}[\\s\\S]{0,100}SCORE[:\\s]*(\\d+)[\\s\\S]{0,100}(?:JUSTIFICATION|REASON)[:\\s]*(.{1,200}?)`,
      'i'
    );

    let match = aiContent.match(timePattern);
    let score = 50;
    let reason = "Contextual alignment analysis";

    if (match) {
      reason = match[1].trim();
      score = parseInt(match[2], 10);
    } else {
      match = aiContent.match(fallbackPattern);
      if (match) {
        score = parseInt(match[1], 10);
        reason = match[2].trim();
      } else {
        // Final fallback: just score
        const simplePattern = new RegExp(`CANDIDATE[:\\s]*${escapedTime}[\\s\\S]{0,300}SCORE[:\\s]*(\\d+)`, 'i');
        const simpleMatch = aiContent.match(simplePattern);
        if (simpleMatch) score = parseInt(simpleMatch[1], 10);
      }
    }

    // Clean up reason (remove newlines, extra spaces)
    reason = reason.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (reason.length > 150) reason = reason.substring(0, 147) + '...';

    scores.push({ time, score, reason });
  }

  return scores;
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
