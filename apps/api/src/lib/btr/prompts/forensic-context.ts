/**
 * Forensic Context Formatter
 * 
 * Generates forensic DNA context sections for AI prompts.
 * This module formats physical, psychographic, biological, and family
 * data into structured text for AI analysis.
 */

import { ForensicTraits } from '@ai-pandit/shared';
import {
  type BodyFrame,
  type SkinTone,
  type NaturalSpeed,
  buildLagnaEliminationContext,
} from '@ai-pandit/shared';

/**
 * Formats forensic physical DNA section
 * 
 * @param physical - Physical traits from forensic data
 * @returns Formatted physical DNA context string
 */
function formatPhysicalDNA(physical: ForensicTraits['physical']): string {
  const facial = physical?.facialStructure;
  const skinHair = physical?.skinHair;
  const heightFeet = physical?.height?.feet ?? '?';
  const heightInches = physical?.height?.inches ?? '?';
  return `┌── FORENSIC PHYSICAL DNA (Varga Markers) ──
│ Facial: ${facial?.forehead ?? 'unknown'} forehead, ${facial?.eyeShape ?? 'unknown'} eyes, ${facial?.noseShape ?? facial?.noseType ?? 'unknown'} nose, ${facial?.jawLine ?? 'average'} jaw, ${facial?.teethAlignment ?? 'unknown'} teeth, ${facial?.voicePitch ?? 'unknown'} voice
│ Hair/Skin: ${skinHair?.hairType ?? 'unknown'} hair, ${skinHair?.texture ?? 'unknown'} skin, ${skinHair?.complexion ?? 'unknown'} complexion
│ Special Marks: ${skinHair?.marks?.join(', ') || 'None reported'}
│ Build: ${physical?.build ?? 'unknown'} (${heightFeet}'${heightInches}")`;
}

/**
 * Formats psychographic DNA section
 * 
 * @param psychographic - Psychographic traits from forensic data
 * @returns Formatted psychographic DNA context string
 */
function formatPsychographicDNA(psychographic: ForensicTraits['psychographic']): string {
  return `┌── PSYCHOGRAPHIC DNA (Temperament) ──
│ Speech: ${psychographic?.speechStyle ?? 'unknown'} | Decisions: ${psychographic?.decisionMaking ?? 'unknown'}
│ Stress: ${psychographic?.stressResponse ?? 'unknown'} | Sleep: ${psychographic?.sleepCycle ?? 'unknown'}
│ Temperament: ${psychographic?.temperament ?? 'unknown'}`;
}

/**
 * Formats biological markers section
 * 
 * @param biological - Biological markers from forensic data
 * @returns Formatted biological markers context string
 */
function formatBiologicalMarkers(biological: ForensicTraits['biological']): string {
  const heat = biological?.sensitivity?.heat ?? 'unknown';
  const cold = biological?.sensitivity?.cold ?? 'unknown';
  return `┌── BIOLOGICAL MARKERS (Ayurvedic) ──
│ Prakriti: ${biological?.prakriti?.toUpperCase() ?? 'Unknown'}
│ Sensitivity: Heat=${heat} | Cold=${cold}
│ Health Issues: ${biological?.recurringHealthIssues?.join(', ') || 'None'}`;
}

/**
 * Formats family narrative matrix section
 * 
 * @param family - Family data from forensic traits
 * @returns Formatted family narrative context string
 */
function formatFamilyNarrative(family: ForensicTraits['family']): string {
  let result = `┌── FAMILY NARRATIVE MATRIX ──
│ Position: ${family?.siblingPosition ?? 'unknown'} (${family?.brotherCount ?? 0} brothers, ${family?.sisterCount ?? 0} sisters)
│ Birth Status: Father status was "${family?.fatherStatusAtBirth ?? 'unknown'}", Mother health was "${family?.motherHealthAtBirth ?? 'unknown'}"`;

  if (family?.firstChildInfo) {
    result += `\n│ First Child: ${family.firstChildInfo.gender} born in ${family.firstChildInfo.yearOfBirth}`;
  }

  return result;
}

/**
 * Generates complete forensic context for AI prompts
 * 
 * Combines all forensic data sections into a single formatted
 * context string for AI analysis.
 * 
 * @param forensicTraits - Complete forensic traits data
 * @returns Complete forensic context string
 * @example
 * const context = buildForensicContext(forensicData);
 * // Returns formatted context with all forensic sections
 */
export function buildForensicContext(forensicTraits: ForensicTraits): string {
  if (!forensicTraits) {
    return 'No forensic traits provided';
  }
  const sections = [
    formatPhysicalDNA(forensicTraits.physical),
    formatPsychographicDNA(forensicTraits.psychographic),
    formatBiologicalMarkers(forensicTraits.biological),
    formatFamilyNarrative(forensicTraits.family)
  ];

  return sections.join('\n\n');
}

/**
 * Generates compact forensic DNA summary for final stage
 * 
 * @param forensicTraits - Complete forensic traits data
 * @returns Compact forensic DNA summary string
 */
export function buildForensicDNASummary(forensicTraits: ForensicTraits): string {
  if (!forensicTraits) {
    return '🧬 MANDATORY FORENSIC CORRELATION MATRIX: No forensic traits provided';
  }

  // Derive the 3-key Lagna elimination input from existing trait data
  const build = forensicTraits.physical?.build;
  const complexion = forensicTraits.physical?.skinHair?.complexion;
  const voicePitch = forensicTraits.physical?.facialStructure?.voicePitch;

  const bodyFrame: BodyFrame =
    build === 'slim' ? 'thin_bony' :
    build === 'athletic' ? 'athletic_muscular' :
    build === 'heavy' ? 'soft_rounded' :
    'athletic_muscular';

  const skinTone: SkinTone =
    complexion === 'fair' ? 'very_fair' :
    complexion === 'dark' ? 'dark_dusky' :
    'wheatish_golden';

  const naturalSpeed: NaturalSpeed =
    voicePitch === 'fast' || voicePitch === 'loud' ? 'fast_quick' :
    'slow_deliberate';

  return buildLagnaEliminationContext({ bodyFrame, skinTone, naturalSpeed });
}
