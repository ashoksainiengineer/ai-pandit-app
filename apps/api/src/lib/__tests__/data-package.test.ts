import { describe, it, expect } from 'vitest';
import { buildCandidateDataPackage } from '../btr/data-package-builder.js';
import { SecondsPrecisionInput } from '@ai-pandit/shared';

describe('Data Package Builder - Snapshot Testing', () => {
    // Golden Sample: Jan 1, 1980, 12:00:00 (Delhi)
    const mockInput: SecondsPrecisionInput = {
        sessionId: 'test-session',
        dateOfBirth: '1980-01-01',
        tentativeTime: '12:00:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone: 5.5,
        lifeEvents: [],
        offsetConfig: { description: 'test' },
        forensicTraits: {
            physical: {
                facialStructure: {
                    forehead: 'broad',
                    eyeShape: 'almond',
                    noseType: 'sharp',
                    teethAlignment: 'perfect',
                    voicePitch: 'deep'
                },
                skinHair: {
                    texture: 'dry',
                    hairType: 'straight',
                    complexion: 'fair',
                    marks: []
                },
                build: 'medium',
                height: { cm: 175, feet: 5, inches: 9 }
            },
            psychographic: {
                speechStyle: 'measured_soft',
                decisionMaking: 'deliberate',
                stressResponse: 'calm',
                sleepCycle: 'early_bird',
                temperament: 'patient'
            },
            biological: {
                prakriti: 'pitta',
                sensitivity: { heat: 'high', cold: 'medium' },
                recurringHealthIssues: []
            },
            family: {
                siblingPosition: 'eldest',
                brotherCount: 1,
                sisterCount: 0,
                fatherStatusAtBirth: 'stable',
                motherHealthAtBirth: 'normal'
            }
        }
    };

    it('should match the master data package snapshot', async () => {
        const dataPackage = await buildCandidateDataPackage(
            '12:00:00',
            0,
            mockInput,
            { dashaDepth: 2 }
        );

        // Snapshot testing ensures that any change in the generated JSON 
        // (Vargas, Dashas, Yogas) is caught during development.
        expect(dataPackage).toMatchSnapshot();
    });

    it('should generate all required engine components', async () => {
        const dataPackage = await buildCandidateDataPackage(
            '12:00:00',
            0,
            mockInput,
            { dashaDepth: 2 }
        );

        expect(dataPackage.vargaDegrees).toBeDefined();
        expect(dataPackage.vimshottariDasha).toBeDefined();
        expect(dataPackage.panchanga).toBeDefined();
        expect(dataPackage.planets).toBeDefined();
        expect(dataPackage.ascendant).toBeDefined();
    });
});
