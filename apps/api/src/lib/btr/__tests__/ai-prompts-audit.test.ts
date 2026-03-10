import { describe, it, expect } from 'vitest';
import { getDeepAnalysisPrompt } from '../prompts/deep-analysis-prompt.js';
import { getFinalPrecisionPrompt } from '../prompts/final-precision-prompt.js';
import { CandidateDataPackage, LifeEvent } from '@ai-pandit/shared';

describe('🤖 AI PROMPT SERIALIZATION AUDIT', () => {

    const mockEvents: LifeEvent[] = [
        {
            id: 'e1',
            eventType: 'Marriage',
            category: 'marriage',
            eventDate: '2017-12-11',
            datePrecision: 'exact_date',
            importance: 'critical',
            description: 'Got Married',
        }
    ];

    const mockCandidate: CandidateDataPackage = {
        time: '10:28:00',
        offsetMinutes: 0,
        ascendant: { sign: 'Sagittarius', degree: '8.5' },
        planets: {
            jupiter: { sign: 'Libra', degree: 15, house: 11, avastha: 'Vriddha', d60Deity: 'Indra' },
            saturn: { sign: 'Sagittarius', degree: 20, house: 1, isRetro: true }
        },
        houseLords: { 1: 'Jupiter', 7: 'Mercury' },
        vimshottariDasha: [
            { maha: 'Rahu', antar: 'Saturn', pratyantar: 'Jupiter', sukshma: 'Venus', prana: 'Moon', startEnd: '2017-12-11' }
        ],
        d60Sign: 'Gemini',
        vargaDegrees: {
            D60: { Ascendant: 'Gemini 15°' },
            D150: { Ascendant: 'Virgo 2°' }
        },
        transitData: {
            '2017-12-11': {
                dasha: 'Rahu-Saturn-Jupiter',
                signatures: ['H7 Activated'],
                planets: { Jupiter: 'Libra 18° | H11' }
            }
        },
        nadiData: {
            ascendant: { nadiName: 'Kinnara', deity: 'Gandharva', phala: 'Wealthy', timeResolution: 48 },
            moon: { nadiName: 'Sura', deity: 'Deva', karmicSignificance: 'High' }
        }
    } as any;

    it('should successfully serialize high-precision astrological data into Stage 4 Deep Analysis text', () => {
        const promptText = getDeepAnalysisPrompt([mockCandidate], mockEvents, {} as any, null, 30);

        expect(promptText).toBeDefined();

        // Ensure complex nested objects are flattened into readable text for the LLM
        // VSL 4.0 uses compact format: signs abbreviated, dasha as VIM[...]
        expect(promptText).toContain('#L'); // Lagna segment present
        expect(promptText).toContain('#M'); // Matrix segment present
        expect(promptText).toContain('#D'); // Dasha segment present
        expect(promptText).toMatch(/VIM\[Ra\|Sa\|Ju\|Ve\|Mo\|/); // Compact dasha format
        expect(promptText).toContain('#N'); // Nadi segment present
        expect(promptText).toContain('Gandharva'); // D150 Nadi deity in #N segment
    });

    it('should successfully serialize all data into the Stage 6 Terminal Precision text', () => {
        const promptText = getFinalPrecisionPrompt([mockCandidate], mockEvents, {} as any, null, null);

        expect(promptText).toBeDefined();

        // Stage 6 must include VSL 4.0 formatted dasha (5 levels)
        expect(promptText).toMatch(/VIM\[Ra\|Sa\|Ju\|Ve\|Mo\|/);

        // Must include D60 in varga snapshot
        expect(promptText).toContain('D60');

        // Re-verify that the AI is instructed on Nadi Amsha
        expect(promptText).toContain('NADI AMSHA');
    });
});
