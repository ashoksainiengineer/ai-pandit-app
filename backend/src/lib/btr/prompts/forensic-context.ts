/**
 * Forensic Context Formatter
 * 
 * Generates forensic DNA context sections for AI prompts.
 * This module formats physical, psychographic, biological, and family
 * data into structured text for AI analysis.
 */

import { ForensicTraits } from '../../../types/index.js';

/**
 * Formats forensic physical DNA section
 * 
 * @param physical - Physical traits from forensic data
 * @returns Formatted physical DNA context string
 */
function formatPhysicalDNA(physical: ForensicTraits['physical']): string {
  return `┌── FORENSIC PHYSICAL DNA (Varga Markers) ──
│ Facial: ${physical.facialStructure.forehead} forehead, ${physical.facialStructure.eyeShape} eyes, ${physical.facialStructure.noseType} nose, ${physical.facialStructure.teethAlignment} teeth, ${physical.facialStructure.voicePitch} voice
│ Hair/Skin: ${physical.skinHair.hairType} hair, ${physical.skinHair.texture} skin, ${physical.skinHair.complexion} complexion
│ Special Marks: ${physical.skinHair.marks.join(', ') || 'None reported'}
│ Build: ${physical.build} (${physical.height.feet}'${physical.height.inches}")`;
}

/**
 * Formats psychographic DNA section
 * 
 * @param psychographic - Psychographic traits from forensic data
 * @returns Formatted psychographic DNA context string
 */
function formatPsychographicDNA(psychographic: ForensicTraits['psychographic']): string {
  return `┌── PSYCHOGRAPHIC DNA (Temperament) ──
│ Speech: ${psychographic.speechStyle} | Decisions: ${psychographic.decisionMaking}
│ Stress: ${psychographic.stressResponse} | Sleep: ${psychographic.sleepCycle}
│ Temperament: ${psychographic.temperament}`;
}

/**
 * Formats biological markers section
 * 
 * @param biological - Biological markers from forensic data
 * @returns Formatted biological markers context string
 */
function formatBiologicalMarkers(biological: ForensicTraits['biological']): string {
  return `┌── BIOLOGICAL MARKERS (Ayurvedic) ──
│ Prakriti: ${biological.prakriti.toUpperCase()}
│ Sensitivity: Heat=${biological.sensitivity.heat} | Cold=${biological.sensitivity.cold}
│ Health Issues: ${biological.recurringHealthIssues.join(', ') || 'None'}`;
}

/**
 * Formats family narrative matrix section
 * 
 * @param family - Family data from forensic traits
 * @returns Formatted family narrative context string
 */
function formatFamilyNarrative(family: ForensicTraits['family']): string {
  let result = `┌── FAMILY NARRATIVE MATRIX ──
│ Position: ${family.siblingPosition} (${family.brotherCount} brothers, ${family.sisterCount} sisters)
│ Birth Status: Father status was "${family.fatherStatusAtBirth}", Mother health was "${family.motherHealthAtBirth}"`;

  if (family.firstChildInfo) {
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
  const f = forensicTraits;
  
  return `🧬 MANDATORY FORENSIC CORRELATION MATRIX:
    - Biological: ${f.biological.prakriti.toUpperCase()} | Health: ${f.biological.recurringHealthIssues.join(', ')}
    - Psychographic: ${f.psychographic.temperament} | Decisions: ${f.psychographic.decisionMaking} | Speech: ${f.psychographic.speechStyle}
    - Varga Signs: Forehead: ${f.physical.facialStructure.forehead} | Eyes: ${f.physical.facialStructure.eyeShape} | Voice: ${f.physical.facialStructure.voicePitch}
    - Family Karma: ${f.family.siblingPosition} child | Father Status: ${f.family.fatherStatusAtBirth}`;
}
