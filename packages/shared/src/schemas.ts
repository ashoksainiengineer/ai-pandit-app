import { z } from 'zod';

export const PlanetDataSchema = z.object({
    sign: z.string(),
    degree: z.union([z.number(), z.string()]),
    nakshatra: z.string().optional(),
    house: z.number().optional(),
}).passthrough();

export const VimshottariDashaEntrySchema = z.object({
    maha: z.string().min(1),
    antar: z.string().min(1),
    pratyantar: z.string().min(1),
    sukshma: z.string().min(1),
    prana: z.string().min(1),
    startEnd: z.string().min(1),
});

// ZERO-TRUST Transit Validation
export const TransitPlanetSchema = z.string().min(1).refine(val => val.includes('| H'), {
    message: 'Transit planet must include house position indicator (| H)'
});

export const TransitDataEntrySchema = z.object({
    dasha: z.string().min(1).refine(val => val !== 'Unknown', {
        message: 'Dasha sequence must not be Unknown'
    }),
    signatures: z.array(z.string()),
    planets: z.record(z.string(), TransitPlanetSchema),
    doubleTransit: z.any().optional(),
});

export const CandidateDataPackageSchema = z.object({
    time: z.string(),
    offsetMinutes: z.number(),
    ascendant: z.object({
        sign: z.string(),
        degree: z.string(),
        nakshatra: z.string().optional(),
    }),
    planets: z.record(z.string(), PlanetDataSchema),
    houseLords: z.record(z.union([z.string(), z.number()]), z.string()),
    vimshottariDasha: z.array(VimshottariDashaEntrySchema).min(1),
    transitData: z.record(z.string(), TransitDataEntrySchema).optional(),
}).passthrough(); // Passthrough allows other optional enrichments while enforcing core fields

export function validateCandidateDataForAI(pkg: any) {
    return CandidateDataPackageSchema.parse(pkg);
}
