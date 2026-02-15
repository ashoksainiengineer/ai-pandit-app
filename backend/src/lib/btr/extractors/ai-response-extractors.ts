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
    // Unified regex to handle various formats:
    // 1. Explicit: CANDIDATE: [10:30:00] ... SCORE: 85
    // 2. Implicit: [10:30:00] | SCORE: 85 ...
    // key parts: time (bracketed or not), score (near keyword), reason (context)
    const combinedPattern = new RegExp(
      `(?:CANDIDATE[:\\s]*)?\\[?${escapedTime}\\]?` + // Time match
      `[\\s\\S]{0,400}` + // Gap
      `SCORE[:\\s]*(\\d+)` + // Score match
      `[\\s\\S]{0,200}` + // Gap
      `(?:JUSTIFICATION|REASON|ANALYSIS|VERDICT)?[:\\s]*` + // Optional reason label
      `([^\\n]+)`, // Capture reason (one line generally)
      'i'
    );

    const match = aiContent.match(combinedPattern);

    // Fallback specific pattern for just score if complex match fails
    const simplePattern = new RegExp(
      `(?:CANDIDATE[:\\s]*)?\\[?${escapedTime}\\]?[\\s\\S]{0,150}SCORE[:\\s]*(\\d+)`,
      'i'
    );

    let score = 50;
    let reason = "Contextual alignment analysis";

    if (match) {
      score = parseInt(match[1], 10);
      if (match[2] && match[2].length > 5) {
        reason = match[2].trim();
        // Cleanup reason from common prefixes/suffixes
        reason = reason.replace(/\|/g, '').replace(/^[:-]\s*/, '').trim();
      }
    } else {
      const simpleMatch = aiContent.match(simplePattern);
      if (simpleMatch) {
        score = parseInt(simpleMatch[1], 10);
      }
    }

    // Heuristic: If reason is still default, try to extract nearby text
    if (reason === "Contextual alignment analysis" && score !== 50) {
      // Try to grab text right after score or verdict
      const nearbyTextMatch = aiContent.match(new RegExp(`SCORE[:\\s]*${score}[\\s\\S]{0,50}(?:REASON|VERDICT)?[:\\s]*([^\\n]+)`, 'i'));
      if (nearbyTextMatch && nearbyTextMatch[1]) {
        reason = nearbyTextMatch[1].replace(/\|/g, '').trim();
      }
    }

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
