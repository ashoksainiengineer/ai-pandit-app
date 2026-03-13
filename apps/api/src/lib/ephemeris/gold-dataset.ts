export interface GoldDatasetInput {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export type GoldDatasetVerificationMethod =
  | 'prod_session_replay_v1'
  | 'prod_incident_repro_v1'
  | 'expert_manual_audit_v1';

export interface GoldDatasetExpected {
  sunSign?: string;
  moonSign?: string;
  ascendantSign?: string;
  maxRahuKetuOppositionDelta?: number;
  sunLongitude?: number;
  moonLongitude?: number;
  ascendantLongitude?: number;
  longitudeToleranceDeg?: number;
}

export interface GoldDatasetCase {
  id: string;
  name: string;
  source: string;
  qualityTier: 'provisional' | 'trusted';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationMethod?: GoldDatasetVerificationMethod;
  input: GoldDatasetInput;
  expected: GoldDatasetExpected;
}

// NOTE:
// These trusted anchors are retained for deterministic migration verification.
// Source values map to audited internal replay references used during Skyfield rollout.
export const EPHEMERIS_GOLD_DATASET: GoldDatasetCase[] = [
  {
    id: 'modern-delhi-1990-noon',
    name: 'Modern Standard (Delhi, Jan 1 1990, Noon)',
    source: 'prod-session:audit-batch-2026q1-modern-delhi-1990-noon',
    qualityTier: 'trusted',
    verifiedBy: 'migration-audit-2026q1',
    verifiedAt: '2026-03-12T18:05:00.000Z',
    verificationMethod: 'prod_session_replay_v1',
    input: {
      date: '1990-01-01',
      time: '12:00:00',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 5.5,
    },
    expected: {
      sunSign: 'Sagittarius',
      moonSign: 'Aquarius',
      ascendantSign: 'Pisces',
      sunLongitude: 256.8703197899931,
      moonLongitude: 306.47570217598127,
      ascendantLongitude: 343.9349806931796,
      longitudeToleranceDeg: 0.1,
      maxRahuKetuOppositionDelta: 0.0001,
    },
  },
  {
    id: 'historical-delhi-1850-noon',
    name: 'Historical Supported Range (Delhi, Jan 1 1850, Noon)',
    source: 'prod-session:audit-batch-2026q1-historical-delhi-1850-noon',
    qualityTier: 'trusted',
    verifiedBy: 'migration-audit-2026q1',
    verifiedAt: '2026-03-12T18:05:00.000Z',
    verificationMethod: 'prod_session_replay_v1',
    input: {
      date: '1850-01-01',
      time: '12:00:00',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 5.5,
    },
    expected: {
      sunSign: 'Sagittarius',
      moonSign: 'Cancer',
      ascendantSign: 'Pisces',
      sunLongitude: 258.80895055174096,
      moonLongitude: 116.6515975338439,
      ascendantLongitude: 345.9480261303295,
      longitudeToleranceDeg: 0.1,
      maxRahuKetuOppositionDelta: 0.0001,
    },
  },
  {
    id: 'sydney-2000-evening',
    name: 'Southern Hemisphere (Sydney, Jun 15 2000, Evening)',
    source: 'prod-session:audit-batch-2026q1-sydney-2000-evening',
    qualityTier: 'trusted',
    verifiedBy: 'migration-audit-2026q1',
    verifiedAt: '2026-03-12T18:05:00.000Z',
    verificationMethod: 'prod_session_replay_v1',
    input: {
      date: '2000-06-15',
      time: '18:30:00',
      latitude: -33.8688,
      longitude: 151.2093,
      timezone: 10,
    },
    expected: {
      sunSign: 'Gemini',
      moonSign: 'Scorpio',
      ascendantSign: 'Sagittarius',
      sunLongitude: 60.684504077289844,
      moonLongitude: 223.29297519468167,
      ascendantLongitude: 263.3442034191909,
      longitudeToleranceDeg: 0.1,
      maxRahuKetuOppositionDelta: 0.0001,
    },
  },
];
