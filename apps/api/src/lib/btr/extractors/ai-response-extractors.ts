/**
 * AI Response Extractors
 * 
 * Extracts structured data from AI text responses for BTR processing.
 */

import { FinalVerdict } from '@ai-pandit/shared';

/**
 * Finds the nearest candidate time from a list for a given hallucinated time
 */
function findNearestCandidate(hallucinatedTime: string, candidates: string[], thresholdSeconds = 30): string | null {
  if (!hallucinatedTime || !candidates.length) return null;

  const parseToSeconds = (t: string) => {
    const clean = t.replace(/[\[\]]/g, '');
    const parts = clean.split(':').map(Number);
    if (parts.length < 2) return -1;
    const h = parts[0];
    const m = parts[1];
    const s = parts[2] || 0;
    return (h * 3600) + (m * 60) + s;
  };

  const targetSec = parseToSeconds(hallucinatedTime);
  if (targetSec === -1) return null;

  let bestMatch: string | null = null;
  let minDiff = Infinity;

  for (const cand of candidates) {
    const candSec = parseToSeconds(cand);
    const diff = Math.abs(targetSec - candSec);
    if (diff <= thresholdSeconds && diff < minDiff) {
      minDiff = diff;
      bestMatch = cand;
    }
  }

  return bestMatch;
}

/**
 * Extracts top survivor times and their scores from AI batch analysis response
 */
export function extractBatchSurvivors(
  aiContent: string,
  candidateTimes: string[],
  neededCount: number
): { time: string; score: number; reason: string }[] {
  const scores: { time: string; score: number; reason: string }[] = [];

  // ==========================================
  // PRIORITY 1: XML TAG EXTRACTION
  // ==========================================
  const xmlMatch = aiContent.match(/<FINAL_SCORES>([\s\S]*?)<\/FINAL_SCORES>/i);
  if (xmlMatch) {
    try {
      const jsonStr = xmlMatch[1].trim();
      const jsonStart = jsonStr.indexOf('[');
      const jsonEnd = jsonStr.lastIndexOf(']') + 1;

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const cleanJson = jsonStr.substring(jsonStart, jsonEnd);
        const parsedArray = JSON.parse(cleanJson) as { time: string; score: number; reason: string }[];

        for (const time of candidateTimes) {
          const matchedItem = parsedArray.find(p => {
            if (!p.time) return false;
            if (p.time === time || p.time.includes(time) || time.includes(p.time)) return true;
            return findNearestCandidate(p.time, [time], 10) !== null;
          });

          if (matchedItem) {
            scores.push({
              time,
              score: Number(matchedItem.score) || 50,
              reason: matchedItem.reason ? String(matchedItem.reason).trim() : "XML Context analysis"
            });
          }
        }

        if (scores.length > 0) return scores;
      }
    } catch (e) {
      console.error("🔴 [EXTRACTOR] XML Parse failed", e);
    }
  }

  // ==========================================
  // PRIORITY 2: ROBUST REGEX (Multi-Pattern)
  // ==========================================
  const foundPairs: Map<string, { score: number; reason: string }> = new Map();

  // Non-greedy gap [\s\S]{0,300}? to match the CLOSEST score to the time
  const timeScorePattern = /(?:CANDIDATE|TIME|BIRTH|RESULT|RECTIFIED)?[:\s]*\[?(\d{2}:\d{2}:?\d{0,2})\]?[\s\S]{0,300}?SCORE[:\s]*(\d+)/gi;

  let m;
  while ((m = timeScorePattern.exec(aiContent)) !== null) {
    const rawTime = m[1];
    const score = parseInt(m[2], 10);
    const nearest = findNearestCandidate(rawTime, candidateTimes, 60);
    if (nearest && !foundPairs.has(nearest)) {
      foundPairs.set(nearest, { score, reason: "Contextual AI scoring" });
    }
  }

  // Same for reverse pattern
  const scoreTimePattern = /SCORE[:\s]*(\d+)[\s\S]{0,150}?(?:for|at|time|candidate)[:\s]*\[?(\d{2}:\d{2}:?\d{0,2})\]?/gi;
  while ((m = scoreTimePattern.exec(aiContent)) !== null) {
    const score = parseInt(m[1], 10);
    const rawTime = m[2];
    const nearest = findNearestCandidate(rawTime, candidateTimes, 60);
    if (nearest && !foundPairs.has(nearest)) {
      foundPairs.set(nearest, { score, reason: "Reverse relation scoring" });
    }
  }

  // Final per-line analysis (highest precision for reason capture)
  const lines = aiContent.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('score')) {
      for (const candTime of candidateTimes) {
        const escaped = candTime.replace(/:/g, '[:\\s]?');
        if (new RegExp(`\\[?${escaped}\\]?`, 'i').test(line)) {
          const scoreMatch = line.match(/SCORE[:\s]*(\d+)/i);
          if (scoreMatch) {
            // Line match overrides generic regex match for reasons
            foundPairs.set(candTime, {
              score: parseInt(scoreMatch[1], 10),
              reason: line.trim().substring(0, 150)
            });
          }
        }
      }
    }
  }

  // Final mapping for all requested candidates
  for (const time of candidateTimes) {
    const match = foundPairs.get(time);
    if (match) {
      scores.push({ time, ...match });
    } else {
      scores.push({
        time,
        score: 50,
        reason: "Contextual alignment analysis"
      });
    }
  }

  return scores;
}

/**
 * Extracts final verdict from AI final stage response
 */
export function extractFinalVerdict(aiContent: string): FinalVerdict | null {
  const xmlMatch = aiContent.match(/<FINAL_VERDICT>([\s\S]*?)<\/FINAL_VERDICT>/i);
  if (xmlMatch) {
    try {
      const jsonStr = xmlMatch[1].trim();
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(jsonStr.substring(jsonStart, jsonEnd));
        return {
          time: String(parsed.time).trim(),
          accuracy: Number(parsed.accuracy) || 85,
          confidence: parsed.confidence ? String(parsed.confidence).toUpperCase() : 'MEDIUM',
          margin: Number(parsed.margin) || 5
        };
      }
    } catch (e) { }
  }

  const timeMatch = aiContent.match(/(?:BEST[ _]TIME|RECTIFIED[ _]TIME|BIRTH[ _]TIME|FINAL[ _]TIME|DETERMINED|TIME IS|DETERMINED TO BE)[:\s]*\s*(?:to be\s*)?\[?(\d{2}:\d{2}:\d{2})\]?/i);
  const accuracyMatch = aiContent.match(/(?:ACCURACY|CONFIDENCE[ _]SCORE|SCORE|LEVEL|ACCURACY LEVEL)[:\s]*\s*(\d+)/i);
  const confidenceMatch = aiContent.match(/CONFIDENCE[:\s]*(HIGH|MEDIUM|LOW)/i);
  const marginMatch = aiContent.match(/(?:MARGIN|ERROR|PRECISION)[^:]*[:\s]*±?\s*(\d+)/i);

  if (timeMatch) {
    return {
      time: timeMatch[1],
      accuracy: accuracyMatch ? parseInt(accuracyMatch[1], 10) : 85,
      confidence: confidenceMatch ? confidenceMatch[1].toUpperCase() : 'MEDIUM',
      margin: marginMatch ? parseInt(marginMatch[1], 10) : 5
    };
  }

  const verdictIdx = aiContent.toLowerCase().lastIndexOf('verdict');
  const finalIdx = aiContent.toLowerCase().lastIndexOf('final');
  const startIdx = Math.max(verdictIdx, finalIdx);

  if (startIdx !== -1) {
    const after = aiContent.substring(startIdx);
    const tm = after.match(/(\d{2}:\d{2}:\d{2})/);
    if (tm) {
      return {
        time: tm[1],
        accuracy: accuracyMatch ? parseInt(accuracyMatch[1], 10) : 75,
        confidence: 'MEDIUM',
        margin: 10
      };
    }
  }

  return null;
}
