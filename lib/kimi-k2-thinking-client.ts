// Server-side only

// lib/kimi-k2-thinking-client.ts (UPDATED)
// Enhanced for analyzing top candidates with Kimi K2

import { kimiClient, serverConfig } from '@/lib/server-config';
import { generateAstrologicalReport } from '@/lib/astrological-data-processor';
import { CandidateAnalysis } from '@/lib/types';
import { EphemerisData, LifeEvent } from '@/lib/types';
import { logger } from '@/lib/logger';

// ═════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════

export interface KimiAnalysisResult {
  time: string;
  offsetMinutes: number;
  offsetDescription: string;
  score: number; // 0-100 confidence
  confidence: 'High' | 'Medium' | 'Low'; // Confidence level
  analysis: string; // Detailed analysis from Kimi
  thinking: string; // Kimi's thinking process (truncated)
  eventMatches: {
    eventType: string;
    matches: boolean;
    reason: string;
  }[];
  recommendation: string; // Should this be the rectified time?
  dashaAnalysis: string; // Which dasha during events
  transitAnalysis: string; // Transit verification
}

export interface TopCandidatesAnalysis {
  candidates: KimiAnalysisResult[];
  topRecommendation: KimiAnalysisResult; // #1 choice
  alternativeOptions: KimiAnalysisResult[]; // Backup options
  processingTime: number;
}

// ═════════════════════════════════════════════════════════════════════════
// MAIN: Analyze Top Candidates with Kimi K2
// ═════════════════════════════════════════════════════════════════════════

export async function analyzeTopCandidatesWithKimi(
  topCandidates: CandidateAnalysis[],
  lifeEvents: LifeEvent[]
): Promise<TopCandidatesAnalysis> {
  const startTime = Date.now();

  try {
    logger.info('Starting Kimi K2 analysis of top candidates', {
      candidateCount: topCandidates.length,
    });

    const kimiResults: KimiAnalysisResult[] = [];

    // ─────────────────────────────────────────────────────────────────────
    // Analyze each top candidate with Kimi K2
    // ─────────────────────────────────────────────────────────────────────

    for (const candidate of topCandidates) {
      try {
        logger.info('Analyzing candidate with Kimi K2', {
          time: candidate.time,
          quickScore: candidate.quickScore,
        });

        // Generate astrological report
        const astrologicalReport = await generateAstrologicalReport(
          candidate.ephemerisData,
          lifeEvents
        );

        // Build Kimi prompt
        const kimiPrompt = buildKimiPromptForCandidate(
          candidate,
          astrologicalReport,
          lifeEvents
        );

        // Call Kimi K2
        const kimiResponse = await callKimiK2(kimiPrompt);

        // Parse response
        const result = parseKimiResponse(kimiResponse, candidate);

        kimiResults.push(result);

        logger.info('Kimi K2 analysis complete', {
          time: candidate.time,
          score: result.score,
          confidence: result.confidence,
        });
      } catch (error) {
        logger.error(`Kimi K2 analysis failed for ${candidate.time}`, error);
        // Continue with next candidate
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sort by score and select top recommendation
    // ─────────────────────────────────────────────────────────────────────

    kimiResults.sort((a, b) => b.score - a.score);

    const topRecommendation = kimiResults[0];
    const alternativeOptions = kimiResults.slice(1);

    const processingTime = Date.now() - startTime;

    logger.info('Top candidates analysis complete', {
      topTime: topRecommendation.time,
      topScore: topRecommendation.score,
      processingTime,
    });

    return {
      candidates: kimiResults,
      topRecommendation,
      alternativeOptions,
      processingTime,
    };
  } catch (error) {
    logger.error('Top candidates Kimi analysis failed', error);
    throw error;
  }
}

// ═════════════════════════════════════════════════════════════════════════
// BUILD: Kimi Prompt for Candidate Time
// ═════════════════════════════════════════════════════════════════════════

function buildKimiPromptForCandidate(
  candidate: CandidateAnalysis,
  astrologicalReport: any,
  lifeEvents: LifeEvent[]
): string {
  return `
CANDIDATE BIRTH TIME VERIFICATION: ${candidate.time} (${candidate.offsetDescription})

Quick Analysis Score: ${candidate.quickScore}/100
Events Matching: ${candidate.eventMatches}/${lifeEvents.length}

═════════════════════════════════════════════════════════════════════════════

${astrologicalReport.natalChart}

═════════════════════════════════════════════════════════════════════════════

${astrologicalReport.planetaryAnalysis}

═════════════════════════════════════════════════════════════════════════════

${astrologicalReport.houseAnalysis}

═════════════════════════════════════════════════════════════════════════════

${astrologicalReport.dashaAnalysis}

═════════════════════════════════════════════════════════════════════════════

${astrologicalReport.transitAnalysis}

═════════════════════════════════════════════════════════════════════════════

${astrologicalReport.eventCorrelations}

═════════════════════════════════════════════════════════════════════════════

ANALYSIS TASK FOR KIMI K2:

For this birth time candidate (${candidate.time}):

1. VERIFY EVENT CORRELATIONS:
   - Analyze each of the ${lifeEvents.length} life events provided
   - Check which dasha was active on each event date
   - Verify transit positions on event dates
   - Confirm house placements support event types
   - Rate confidence for each event (0-100)

2. CALCULATE OVERALL BIRTH TIME ACCURACY:
   - Average event match confidence
   - Weight by event importance
   - Consider event date certainty
   - Final accuracy score (0-100)

3. DETERMINE CONFIDENCE LEVEL:
   - High: 80-100 (very likely correct)
   - Medium: 50-79 (possible correct)
   - Low: 0-49 (probably incorrect)

4. PROVIDE RECOMMENDATION:
   - Is this birth time likely correct?
   - What are the strongest indicators?
   - What are the concerns/contradictions?
   - How confident are you?

Use extended thinking to:
- Verify dasha calculations for each event date
- Check planetary aspects and transits
- Confirm house placements
- Cross-verify divisional charts
- Double-check event timing correlations

Output format:
ACCURACY SCORE: [0-100]
CONFIDENCE: [High/Medium/Low]
EVENT ANALYSIS: [For each event]
RECOMMENDATION: [Yes/No/Maybe - is this the correct time?]
KEY STRENGTHS: [Why this time works]
KEY CONCERNS: [What doesn't match]
`;
}

// ═════════════════════════════════════════════════════════════════════════
// CALL: Kimi K2 with Thinking Mode
// ═════════════════════════════════════════════════════════════════════════

async function callKimiK2(prompt: string): Promise<any> {
  return await kimiClient.messages.create({
    model: serverConfig.kimi.model,
    max_tokens: serverConfig.kimi.maxTokens,
    temperature: serverConfig.kimi.temperature,
    thinking: {
      type: 'enabled',
      budget_tokens: serverConfig.kimi.thinkingBudget,
    },
    system: buildAstrologicalSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT: Vedic Astrology Expert
// ═════════════════════════════════════════════════════════════════════════

function buildAstrologicalSystemPrompt(): string {
  return `You are a Vedic astrology expert analyzing specific birth time candidates.

EXPERTISE:
- Vimshottari Dasha (120-year cycle)
- Transits and aspects
- House placements (Vedic)
- Nakshatras (27 lunar mansions)
- Event timing verification
- Birth time rectification

TASK:
Determine if a given birth time matches the provided life events.

METHOD:
1. For each event:
   - What dasha was active?
   - What planets were transiting?
   - Did house placements support the event?
   - Match confidence (0-100)

2. Calculate overall accuracy
3. Determine confidence level
4. Provide clear recommendation

BE PRECISE:
- Show calculations
- Verify dates
- Check math
- Confirm alignments
- Use extended thinking extensively

OUTPUT:
Clear scores and recommendations.`;
}

// ═════════════════════════════════════════════════════════════════════════
// PARSE: Kimi K2 Response
// ═════════════════════════════════════════════════════════════════════════

function parseKimiResponse(
  response: any,
  candidate: CandidateAnalysis
): KimiAnalysisResult {
  const thinking = response.content.find((block: any) => block.type === 'thinking')?.thinking || '';
  const analysis = response.content.find((block: any) => block.type === 'text')?.text || '';

  // Extract score
  const scoreMatch = analysis.match(/ACCURACY SCORE:\s*(\d+)/i) ||
    analysis.match(/accuracy[:\s]+(\d+)/i) ||
    analysis.match(/(\d+)\s*\/\s*100/);
  const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

  // Extract confidence level
  const confidenceMatch = analysis.match(/CONFIDENCE:\s*(High|Medium|Low)/i);
  const confidence = (
    confidenceMatch ? confidenceMatch[1] : score > 70 ? 'High' : score > 50 ? 'Medium' : 'Low'
  ) as 'High' | 'Medium' | 'Low';

  // Extract recommendation
  const recommendationMatch = analysis.match(/RECOMMENDATION:\s*([^\n]+)/i);
  const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'Inconclusive';

  // Extract key sections
  const strengthsMatch = analysis.match(/KEY STRENGTHS:\s*([^\n]+(?:\n[^\n]+)*)/i);
  const concernsMatch = analysis.match(/KEY CONCERNS:\s*([^\n]+(?:\n[^\n]+)*)/i);

  return {
    time: candidate.time,
    offsetMinutes: candidate.offsetMinutes,
    offsetDescription: candidate.offsetDescription,
    score,
    confidence,
    analysis,
    thinking: thinking.substring(0, 3000),
    eventMatches: [], // Would be parsed from analysis
    recommendation,
    dashaAnalysis: extractSection(analysis, 'DASHA|VIMSHOTTARI'),
    transitAnalysis: extractSection(analysis, 'TRANSIT'),
  };
}

// ═════════════════════════════════════════════════════════════════════════
// HELPER: Extract Section from Response
// ═════════════════════════════════════════════════════════════════════════

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[^:]*:([^]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

export default analyzeTopCandidatesWithKimi;