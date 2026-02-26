import { buildCandidateDataPackage } from './lib/btr/data-package-builder.js';
import fs from 'fs';

async function generate() {
    const input = {
        sessionId: 'live-dump-session',
        dateOfBirth: '1999-06-16',
        tentativeTime: '10:01:00',
        latitude: 26.6051,
        longitude: 75.9481,
        timezone: 5.5,
        lifeEvents: [],
        offsetConfig: { description: 'Live system dump' },
        forensicTraits: {
            physical: {
                facialStructure: { forehead: 'broad', eyeShape: 'almond', noseType: 'sharp', teethAlignment: 'perfect', voicePitch: 'normal' },
                skinHair: { texture: 'normal', hairType: 'straight', complexion: 'fair', marks: [] },
                build: 'medium',
                height: { cm: 170, feet: 5, inches: 7 }
            },
            psychographic: { speechStyle: 'measured_soft', decisionMaking: 'deliberate', stressResponse: 'calm', sleepCycle: 'early_bird', temperament: 'patient' },
            biological: { prakriti: 'pitta', sensitivity: { heat: 'high', cold: 'medium' }, recurringHealthIssues: [] },
            family: { siblingPosition: 'eldest', brotherCount: 0, sisterCount: 0, fatherStatusAtBirth: 'stable', motherHealthAtBirth: 'normal' }
        }
    };

    console.log('Building full data package for 16 June 1999 10:01 AM IST, Chaksu...');

    const dataPackage = await buildCandidateDataPackage(
        '10:01:00',
        0,
        input as any,
        {
            includeFullData: true,
            dashaDepth: 5 // Prana level
        }
    );

    const outputPath = './full_system_dump_chaksu.json';
    fs.writeFileSync(outputPath, JSON.stringify(dataPackage, null, 2));
    console.log(`Successfully generated full data dump to ${outputPath}`);
}

generate().catch(console.error);
