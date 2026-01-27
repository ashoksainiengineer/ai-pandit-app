/**
 * 🔱 BTR GOD-TIER INTEGRATOR
 * ==========================
 *
 * Bridges the existing BTR system with new God-Tier components:
 * - KP Sub-Lord calculations
 * - Multi-method Consensus Validation
 * - Enhanced validation pipeline
 *
 * This module integrates seamlessly with the existing seconds-precision-btr.ts
 * without breaking backward compatibility.
 */
import { calculateKPSubLords, calculateKPCuspalSubLords } from './kp-sublords.js';
import { calculateConsensus } from './consensus-engine.js';
import { logger } from './logger.js';
// ═══════════════════════════════════════════════════════════════════════════════
// ENHANCEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Enhance a candidate with God-Tier KP and Consensus data.
 * This is the main integration point for existing BTR pipeline.
 */
export function enhanceCandidateWithGodTierData(candidate, events, forensicProfile, tentativeTime) {
    const startTime = Date.now();
    try {
        // Step 1: Calculate KP Sub-Lords for all planets
        const kpSubLords = calculateKPSubLordsForCandidate(candidate);
        // Step 2: Calculate KP Cuspal Sub-Lords for houses
        const cuspalSubLords = calculateCuspalSubLordsForCandidate(candidate);
        // Step 3: Prepare validation input
        const validationInput = {
            candidate: {
                time: candidate.time,
                ephemeris: candidate.ephemeris,
                dasha: candidate.dasha,
                vargas: candidate.vargas,
                kpData: {
                    planetSubLords: kpSubLords,
                    cuspalSubLords
                }
            },
            events,
            forensicProfile,
            tentativeTime
        };
        // Step 4: Calculate multi-method consensus
        const consensus = calculateConsensus(validationInput);
        // Step 5: Determine God-Tier status
        const isGodTier = consensus.confidenceLevel === 'GOD_TIER' ||
            consensus.confidenceLevel === 'VERY_HIGH';
        // Step 6: Determine recommended precision
        const recommendedPrecision = determineRecommendedPrecision(consensus);
        const duration = Date.now() - startTime;
        logger.debug(`God-Tier enhancement completed for ${candidate.time} in ${duration}ms`, {
            consensus: consensus.overallConsensus,
            level: consensus.confidenceLevel
        });
        return {
            ...candidate,
            kpData: {
                planetSubLords: kpSubLords,
                cuspalSubLords
            },
            godTier: {
                kpSubLords,
                cuspalSubLords,
                consensus,
                isGodTier,
                recommendedPrecision
            }
        };
    }
    catch (error) {
        logger.error(`God-Tier enhancement failed for ${candidate.time}`, error);
        // Return original candidate with error flag
        return {
            ...candidate,
            godTier: {
                kpSubLords: {},
                cuspalSubLords: {},
                consensus: createErrorConsensus(),
                isGodTier: false,
                recommendedPrecision: 'minutes'
            }
        };
    }
}
/**
 * Batch enhance multiple candidates with God-Tier data.
 * Optimized for performance with parallel processing.
 */
export function enhanceCandidatesBatch(candidates, events, forensicProfile, tentativeTime, options = {}) {
    const { parallel = true, maxConcurrency = 5 } = options;
    if (!parallel) {
        // Sequential processing
        return candidates.map(c => enhanceCandidateWithGodTierData(c, events, forensicProfile, tentativeTime));
    }
    // For true parallel, use Promise.all with chunks
    const chunks = chunkArray(candidates, maxConcurrency);
    const results = [];
    for (const chunk of chunks) {
        const chunkResults = chunk.map(c => enhanceCandidateWithGodTierData(c, events, forensicProfile, tentativeTime));
        results.push(...chunkResults);
    }
    return results;
}
/**
 * Rank candidates using God-Tier consensus scores.
 * Returns candidates sorted by consensus score (highest first).
 */
export function rankCandidatesByGodTierConsensus(candidates) {
    return [...candidates].sort((a, b) => {
        const scoreA = a.godTier?.consensus.overallConsensus || 0;
        const scoreB = b.godTier?.consensus.overallConsensus || 0;
        return scoreB - scoreA;
    });
}
/**
 * Filter candidates by minimum consensus threshold.
 * Removes candidates that don't meet the quality bar.
 */
export function filterByConsensusThreshold(candidates, minConsensus = 70) {
    return candidates.filter(c => (c.godTier?.consensus.overallConsensus || 0) >= minConsensus);
}
/**
 * Get the best candidate based on God-Tier analysis.
 */
export function selectBestCandidate(candidates) {
    if (candidates.length === 0)
        return null;
    const ranked = rankCandidatesByGodTierConsensus(candidates);
    return ranked[0];
}
/**
 * Generate God-Tier validation report for a candidate.
 */
export function generateGodTierReport(candidate) {
    const consensus = candidate.godTier?.consensus;
    if (!consensus) {
        return {
            summary: 'God-Tier analysis not available',
            methodScores: {},
            redFlags: ['Analysis incomplete'],
            recommendations: ['Re-run analysis'],
            confidenceLevel: 'UNKNOWN',
            marginOfError: 'N/A'
        };
    }
    const redFlagsList = Object.entries(consensus.redFlags)
        .filter(([, value]) => value)
        .map(([key]) => key);
    return {
        summary: `Overall Consensus: ${consensus.overallConsensus.toFixed(1)}% - ${consensus.confidenceLevel}`,
        methodScores: {
            'Vimshottari Dasha': consensus.scores.vimshottari,
            'KP Sub-Lords': consensus.scores.kp,
            'Divisional Charts': consensus.scores.varga,
            'Transit Analysis': consensus.scores.transit,
            'Forensic Match': consensus.scores.forensic,
            'AI Reasoning': consensus.scores.ai
        },
        redFlags: redFlagsList,
        recommendations: consensus.recommendations,
        confidenceLevel: consensus.confidenceLevel,
        marginOfError: `±${consensus.marginOfError} seconds`
    };
}
// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function calculateKPSubLordsForCandidate(candidate) {
    const planets = candidate.ephemeris?.planets || {};
    const result = {};
    for (const [name, data] of Object.entries(planets)) {
        const longitude = data.longitude;
        if (longitude !== undefined) {
            const kp = calculateKPSubLords(longitude);
            result[name] = {
                starLord: kp.starLord,
                subLord: kp.subLord,
                subSubLord: kp.subSubLord,
                subSubSubLord: kp.subSubSubLord
            };
        }
    }
    return result;
}
function calculateCuspalSubLordsForCandidate(candidate) {
    const houses = candidate.ephemeris?.houses || [];
    const cuspLongitudes = houses.map((h) => h.cusp || 0);
    const cuspalData = calculateKPCuspalSubLords(cuspLongitudes);
    return Object.fromEntries(cuspalData.map(c => [c.house, c]));
}
function determineRecommendedPrecision(consensus) {
    if (consensus.marginOfError <= 5)
        return 'sub-seconds';
    if (consensus.marginOfError <= 60)
        return 'seconds';
    return 'minutes';
}
function createErrorConsensus() {
    return {
        scores: {
            vimshottari: 0, yogini: 0, chara: 0, kalachakra: 0, kp: 0,
            ashtakavarga: 0, varga: 0, transit: 0, forensic: 0, ai: 0
        },
        overallConsensus: 0,
        confidenceLevel: 'LOW',
        marginOfError: 3600,
        validationDetails: [],
        redFlags: {
            sandhiBirth: false, gandanta: false, dashaSandhi: false,
            conflictingMethods: false, weakSignificators: false,
            d60Instability: false, forensicMismatch: false
        },
        keyEvidence: [],
        recommendations: ['Error in God-Tier analysis'],
        validatedAt: new Date()
    };
}
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
// ═══════════════════════════════════════════════════════════════════════════════
// AI PROMPT ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Generate enhanced AI prompt with God-Tier KP and Consensus data.
 */
export function generateGodTierAIPrompt(candidate, basePrompt) {
    const godTier = candidate.godTier;
    if (!godTier) {
        return basePrompt;
    }
    const kpSection = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔱 GOD-TIER KP SUB-LORD DATA                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

PLANETARY SUB-LORDS (4-Level Hierarchy):
${Object.entries(godTier.kpSubLords).map(([planet, kp]) => `  ${planet.toUpperCase().padEnd(7)}: Star=${kp.starLord.padEnd(8)} | Sub=${kp.subLord.padEnd(8)} | Sub-Sub=${kp.subSubLord.padEnd(8)} | Sub-Sub-Sub=${kp.subSubSubLord}`).join('\n')}

CUSPAL SUB-LORDS (House Cusp Precision):
${Object.entries(godTier.cuspalSubLords).map(([house, cusp]) => `  House ${String(house).padStart(2)}: ${cusp.sign.padEnd(10)} | Star=${cusp.starLord.padEnd(8)} | Sub=${cusp.subLord.padEnd(8)} | Sub-Sub=${cusp.subSubLord}`).join('\n')}
`;
    const consensusSection = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔱 MULTI-METHOD CONSENSUS SCORES                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

OVERALL CONSENSUS: ${godTier.consensus.overallConsensus.toFixed(1)}%
CONFIDENCE LEVEL: ${godTier.consensus.confidenceLevel}
MARGIN OF ERROR: ±${godTier.consensus.marginOfError} seconds

METHOD SCORES:
  Vimshottari Dasha: ${String(godTier.consensus.scores.vimshottari).padStart(3)}% ${getScoreBar(godTier.consensus.scores.vimshottari)}
  KP Sub-Lords:      ${String(godTier.consensus.scores.kp).padStart(3)}% ${getScoreBar(godTier.consensus.scores.kp)}
  Divisional Charts: ${String(godTier.consensus.scores.varga).padStart(3)}% ${getScoreBar(godTier.consensus.scores.varga)}
  Transit Analysis:  ${String(godTier.consensus.scores.transit).padStart(3)}% ${getScoreBar(godTier.consensus.scores.transit)}
  Forensic Match:    ${String(godTier.consensus.scores.forensic).padStart(3)}% ${getScoreBar(godTier.consensus.scores.forensic)}
  AI Reasoning:      ${String(godTier.consensus.scores.ai).padStart(3)}% ${getScoreBar(godTier.consensus.scores.ai)}

${godTier.consensus.redFlags.conflictingMethods ? '⚠️ WARNING: Methods show significant disagreement' : '✅ All methods in agreement'}
`;
    return `${basePrompt}\n\n${kpSection}\n${consensusSection}`;
}
function getScoreBar(score) {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const GodTierIntegrator = {
    enhanceCandidate: enhanceCandidateWithGodTierData,
    enhanceBatch: enhanceCandidatesBatch,
    rankByConsensus: rankCandidatesByGodTierConsensus,
    filterByThreshold: filterByConsensusThreshold,
    selectBest: selectBestCandidate,
    generateReport: generateGodTierReport,
    generateAIPrompt: generateGodTierAIPrompt
};
//# sourceMappingURL=btr-god-tier-integrator.js.map