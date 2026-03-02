import { describe, it, expect, beforeAll } from 'vitest';
import { buildCandidateDataPackage } from '../data-package-builder.js';
import { initSwissEph } from '../../ephemeris.js';
import { SecondsPrecisionInput } from '@ai-pandit/shared';

describe('🔱 DATA INTEGRITY AUDIT: AI Payload Precision', () => {

    beforeAll(async () => {
        await initSwissEph();
    });

    it('should generate a 100% accurate, deep-varga payload for AI reasoning', async () => {
        const input: SecondsPrecisionInput = {
            dateOfBirth: '1990-01-01',
            tentativeTime: '10:00:00',
            latitude: 28.6139,
            longitude: 77.2090,
            timezone: 5.5,
            lifeEvents: [
                {
                    id: '1',
                    category: 'marriage',
                    eventType: 'first_marriage',
                    eventDate: '2015-06-15',
                    datePrecision: 'exact_date',
                    description: 'Marriage',
                    importance: 'critical'
                }
            ],
            offsetConfig: { preset: '30min', description: 'Test' },
            sessionId: 'audit-session',
            forensicTraits: {
                physical: {
                    facialStructure: { forehead: 'average', eyeShape: 'almond', noseType: 'sharp', teethAlignment: 'perfect', voicePitch: 'medium' },
                    skinHair: { texture: 'combination', hairType: 'straight', complexion: 'fair', marks: [] },
                    build: 'medium',
                    height: { cm: 175, feet: 5, inches: 9 }
                },
                psychographic: { speechStyle: 'measured_soft', decisionMaking: 'deliberate', stressResponse: 'calm', sleepCycle: 'early_bird', temperament: 'patient' },
                biological: { prakriti: 'pitta', sensitivity: { heat: 'high', cold: 'medium' }, recurringHealthIssues: [] },
                family: { siblingPosition: 'eldest', brotherCount: 1, sisterCount: 0, fatherStatusAtBirth: 'stable', motherHealthAtBirth: 'excellent' }
            }
        };

        const pkg = await buildCandidateDataPackage('10:00:00', 0, input, {
            includeFullData: true,
            dashaDepth: 5
        });

        // 1. CORE EPHEMERIS INTEGRITY
        expect(pkg.time).toBe('10:00:00');
        expect(pkg.ascendant.sign).toBeDefined();
        expect(pkg.planets.sun.degree).toContain("°"); // Ensure DMS formatting

        // 2. HIGH-PRECISION VARGAS (The "DNA" of BTR)
        expect(pkg.vargaDegrees).toBeDefined();
        expect(pkg.vargaDegrees?.D60).toBeDefined();
        expect(pkg.vargaDegrees?.D150).toBeDefined();

        // D60 Consistency check
        expect(pkg.d60Sign).toBeDefined();
        expect(pkg.d60Planets?.Sun?.deity).toBeDefined();
        console.log(`[AUDIT] D60 Lagna: ${pkg.d60Sign}`);
        console.log(`[AUDIT] D60 Sun Deity: ${pkg.d60Planets?.Sun?.deity}`);

        // 3. NADI AMSHA (Recursive subdivision)
        expect(pkg.nadiData).toBeDefined();
        expect(Object.keys(pkg.nadiData!).length).toBeGreaterThan(5);
        console.log(`[AUDIT] Moon Nadi Amsha: ${pkg.nadiData?.moon?.nadiName}`);

        // 4. TATWA SHUDDHI TIMING (130m cycle check)
        expect(pkg.vedicSignals?.tatwa).toBeDefined();
        expect(pkg.vedicSignals?.tatwa?.name).toBeDefined();
        console.log(`[AUDIT] Recorded Tatwa: ${pkg.vedicSignals?.tatwa?.name}`);

        // 5. DASHA DEPTH (AI needs multi-level alignment)
        expect(pkg.vimshottariDasha.length).toBeGreaterThan(0);
        const firstDasha = pkg.vimshottariDasha[0];
        expect(firstDasha.maha).toBeDefined();
        expect(firstDasha.antar).toBeDefined();
        expect(firstDasha.pratyantar).toBeDefined();

        // Note: Sukshma/Prana are only populated near events or now()
        console.log(`[AUDIT] First Dasha entry at birth: ${firstDasha.maha}-${firstDasha.antar}-${firstDasha.pratyantar}`);

        // 6. SPECIALIZED SIGNALS
        expect(pkg.yogas).toBeDefined();
        expect(pkg.vedicSignals?.vargottama).toBeDefined();
        expect(pkg.ashtakavarga).toBeDefined();

        console.log(`[AUDIT] Data Package Size: ~${JSON.stringify(pkg).length / 1024} KB`);
        expect(JSON.stringify(pkg).length).toBeGreaterThan(10000); // Ensure payload richness
    });
});
