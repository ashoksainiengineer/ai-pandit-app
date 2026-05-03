// Server-side only
// lib/prompts/context-builder.ts
// Prompt assembly logic for birth time rectification analysis

/**
 * Build comprehensive prompt for candidate analysis
 */
export function buildCandidateAnalysisPrompt(
    candidateTime: string,
    dateOfBirth: string,
    planetaryPositions: string,
    housePositions: string,
    lifeEvents: Array<{
        category: string;
        eventType: string;
        eventDate: string;
        description: string;
        importance: string;
    }>,
    dashaInfo: string,
    physicalTraits?: {
        height?: string;
        build?: string;
        complexion?: string;
    }
): string {
    const eventsText = lifeEvents.map((event, i) =>
        `${i + 1}. ${event.eventType.toUpperCase()} (${event.category})
   Date: ${event.eventDate}
   Importance: ${event.importance}
   Description: ${event.description}`
    ).join('\n\n');

    const traitsText = physicalTraits
        ? `HEIGHT: ${physicalTraits.height || 'Not specified'}
BUILD: ${physicalTraits.build || 'Not specified'}
COMPLEXION: ${physicalTraits.complexion || 'Not specified'}`
        : 'No physical traits provided';

    return `BIRTH TIME RECTIFICATION ANALYSIS

══════════════════════════════════════════════════════════════════════════════
CANDIDATE BIRTH TIME: ${candidateTime}
DATE OF BIRTH: ${dateOfBirth}
══════════════════════════════════════════════════════════════════════════════

PLANETARY POSITIONS (Vedic/Sidereal):
${planetaryPositions}

══════════════════════════════════════════════════════════════════════════════

HOUSE CUSPS:
${housePositions}

══════════════════════════════════════════════════════════════════════════════

VIMSHOTTARI DASHA SEQUENCE:
${dashaInfo}

══════════════════════════════════════════════════════════════════════════════

LIFE EVENTS TO VERIFY (${lifeEvents.length} events):

${eventsText}

══════════════════════════════════════════════════════════════════════════════

PHYSICAL CHARACTERISTICS:
${traitsText}

══════════════════════════════════════════════════════════════════════════════

YOUR TASK:
1. Cross-verify dasha and transits for each event.
2. Check divisional charts (D1, D9, D10, D60).
3. Provide weighted score and confidence verdict.`;
}

/**
 * Build prompt for ranking multiple candidates
 */
export function buildRankingPrompt(
    candidates: Array<{
        time: string;
        score: number;
        analysis: string;
    }>
): string {
    const candidatesText = candidates.map((c, i) =>
        `CANDIDATE #${i + 1}: ${c.time}
Initial Score: ${c.score}/100
Analysis Summary: ${c.analysis.substring(0, 500)}...`
    ).join('\n\n---\n\n');

    return `FINAL RANKING OF CANDIDATE BIRTH TIMES

You have analyzed the following ${candidates.length} candidates:

${candidatesText}

══════════════════════════════════════════════════════════════════════════════

FINAL TASK:
1. Rank them from MOST LIKELY to LEAST LIKELY.
2. State confidence and missing data for 99.9% precision.

OUTPUT FORMAT:
RANK 1: [Time] - Score: [X]/100
RANK 2: [Time] - Score: [X]/100

TOP RECOMMENDATION: [Time]
CONFIDENCE: [HIGH/MEDIUM/LOW]
🚨 MISSING DATA: [List gaps]`;
}
