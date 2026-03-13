import 'dotenv/config';

import { calculateEphemeris, initEphemerisProvider, isHighPrecisionMode } from '../lib/ephemeris.js';
import type { GoldDatasetVerificationMethod } from '../lib/ephemeris/gold-dataset.js';
import { EPHEMERIS_GOLD_DATASET } from '../lib/ephemeris/gold-dataset.js';

interface CaseFailure {
  caseId: string;
  message: string;
}

const DEFAULT_LONGITUDE_TOLERANCE_DEG = 0.1;
const DEFAULT_STRICT_MIN_TRUSTED_CASES = 3;
const TRUSTED_SOURCE_PREFIX = 'prod-session:';
const ALLOWED_VERIFICATION_METHODS: GoldDatasetVerificationMethod[] = [
  'prod_session_replay_v1',
  'prod_incident_repro_v1',
  'expert_manual_audit_v1',
];

function toNodeSeparationDelta(rahuLongitude: number, ketuLongitude: number): number {
  const separation = Math.abs(rahuLongitude - ketuLongitude);
  const normalized = separation > 180 ? 360 - separation : separation;
  return Math.abs(normalized - 180);
}

function toAngularDelta(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

async function main(): Promise<void> {
  const enforceTrustedOnly = process.env.EPHEMERIS_GOLD_ENFORCE_TRUSTED === 'true';
  const strictMinTrustedCases = Number(
    process.env.EPHEMERIS_GOLD_MIN_TRUSTED_CASES ?? String(DEFAULT_STRICT_MIN_TRUSTED_CASES)
  );

  const initialized = await initEphemerisProvider();
  if (!initialized || !isHighPrecisionMode()) {
    throw new Error('Skyfield high-precision mode is required for gold dataset validation.');
  }

  const failures: CaseFailure[] = [];
  const trustedCases = EPHEMERIS_GOLD_DATASET.filter((testCase) => testCase.qualityTier === 'trusted');
  const provisionalCases = EPHEMERIS_GOLD_DATASET.filter((testCase) => testCase.qualityTier === 'provisional');

  if (enforceTrustedOnly && provisionalCases.length > 0) {
    failures.push({
      caseId: 'dataset',
      message: `strict mode requires trusted-only dataset; provisional cases present=${provisionalCases.length}`,
    });
  }

  if (enforceTrustedOnly && trustedCases.length < strictMinTrustedCases) {
    failures.push({
      caseId: 'dataset',
      message: `strict mode requires at least ${strictMinTrustedCases} trusted cases; actual=${trustedCases.length}`,
    });
  }

  for (const testCase of EPHEMERIS_GOLD_DATASET) {
    if (enforceTrustedOnly && testCase.qualityTier === 'trusted') {
      if (!testCase.verifiedBy || !testCase.verifiedAt || !testCase.verificationMethod) {
        failures.push({
          caseId: testCase.id,
          message: 'trusted case missing verification metadata (verifiedBy/verifiedAt/verificationMethod)',
        });
      }

      if (!testCase.source.startsWith(TRUSTED_SOURCE_PREFIX)) {
        failures.push({
          caseId: testCase.id,
          message: `trusted case source must start with "${TRUSTED_SOURCE_PREFIX}"`,
        });
      }

      if (
        testCase.verificationMethod
        && !ALLOWED_VERIFICATION_METHODS.includes(testCase.verificationMethod)
      ) {
        failures.push({
          caseId: testCase.id,
          message: `trusted case has invalid verificationMethod=${testCase.verificationMethod}`,
        });
      }

      if (testCase.verifiedAt && Number.isNaN(Date.parse(testCase.verifiedAt))) {
        failures.push({
          caseId: testCase.id,
          message: `trusted case verifiedAt must be ISO-8601 date-time, actual=${testCase.verifiedAt}`,
        });
      }

      if (
        typeof testCase.expected.sunLongitude !== 'number'
        || typeof testCase.expected.moonLongitude !== 'number'
        || typeof testCase.expected.ascendantLongitude !== 'number'
      ) {
        failures.push({
          caseId: testCase.id,
          message: 'trusted case missing numeric longitude anchors (sun/moon/ascendant)',
        });
      }
    }

    const eph = await calculateEphemeris(
      testCase.input.date,
      testCase.input.time,
      testCase.input.latitude,
      testCase.input.longitude,
      testCase.input.timezone
    );

    if (testCase.expected.sunSign && eph.planets.sun.sign !== testCase.expected.sunSign) {
      failures.push({
        caseId: testCase.id,
        message: `sunSign mismatch: expected=${testCase.expected.sunSign} actual=${eph.planets.sun.sign}`,
      });
    }

    if (testCase.expected.moonSign && eph.planets.moon.sign !== testCase.expected.moonSign) {
      failures.push({
        caseId: testCase.id,
        message: `moonSign mismatch: expected=${testCase.expected.moonSign} actual=${eph.planets.moon.sign}`,
      });
    }

    if (testCase.expected.ascendantSign && eph.ascendant.sign !== testCase.expected.ascendantSign) {
      failures.push({
        caseId: testCase.id,
        message: `ascendantSign mismatch: expected=${testCase.expected.ascendantSign} actual=${eph.ascendant.sign}`,
      });
    }

    if (typeof testCase.expected.maxRahuKetuOppositionDelta === 'number') {
      const delta = toNodeSeparationDelta(eph.planets.rahu.longitude, eph.planets.ketu.longitude);
      if (delta > testCase.expected.maxRahuKetuOppositionDelta) {
        failures.push({
          caseId: testCase.id,
          message: `rahu-ketu opposition delta exceeded: expected<=${testCase.expected.maxRahuKetuOppositionDelta} actual=${delta}`,
        });
      }
    }

    const longitudeToleranceDeg = testCase.expected.longitudeToleranceDeg ?? DEFAULT_LONGITUDE_TOLERANCE_DEG;

    if (typeof testCase.expected.sunLongitude === 'number') {
      const delta = toAngularDelta(eph.planets.sun.longitude, testCase.expected.sunLongitude);
      if (delta > longitudeToleranceDeg) {
        failures.push({
          caseId: testCase.id,
          message: `sun longitude delta exceeded: expected<=${longitudeToleranceDeg} actual=${delta}`,
        });
      }
    }

    if (typeof testCase.expected.moonLongitude === 'number') {
      const delta = toAngularDelta(eph.planets.moon.longitude, testCase.expected.moonLongitude);
      if (delta > longitudeToleranceDeg) {
        failures.push({
          caseId: testCase.id,
          message: `moon longitude delta exceeded: expected<=${longitudeToleranceDeg} actual=${delta}`,
        });
      }
    }

    if (typeof testCase.expected.ascendantLongitude === 'number') {
      const delta = toAngularDelta(eph.ascendant.longitude, testCase.expected.ascendantLongitude);
      if (delta > longitudeToleranceDeg) {
        failures.push({
          caseId: testCase.id,
          message: `ascendant longitude delta exceeded: expected<=${longitudeToleranceDeg} actual=${delta}`,
        });
      }
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    provider: 'skyfield',
    strictTrustedMode: enforceTrustedOnly,
    strictMinTrustedCases,
    totalCases: EPHEMERIS_GOLD_DATASET.length,
    trustedCases: trustedCases.length,
    provisionalCases: provisionalCases.length,
    failureCount: failures.length,
    failures,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Gold dataset validation failed');
  console.error(error);
  process.exit(1);
});
