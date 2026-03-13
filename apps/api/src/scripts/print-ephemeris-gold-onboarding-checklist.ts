import { EPHEMERIS_GOLD_DATASET } from '../lib/ephemeris/gold-dataset.js';

function main(): void {
  const provisionalCases = EPHEMERIS_GOLD_DATASET.filter((testCase) => testCase.qualityTier === 'provisional');
  const trustedCases = EPHEMERIS_GOLD_DATASET.filter((testCase) => testCase.qualityTier === 'trusted');

  const checklist = {
    timestamp: new Date().toISOString(),
    totalCases: EPHEMERIS_GOLD_DATASET.length,
    trustedCases: trustedCases.length,
    provisionalCases: provisionalCases.length,
    trustedPromotionRequirements: [
      'qualityTier=trusted',
      'source starts with "prod-session:"',
      'verifiedBy is non-empty',
      'verifiedAt is ISO-8601 date-time',
      'verificationMethod in [prod_session_replay_v1, prod_incident_repro_v1, expert_manual_audit_v1]',
      'expected.sunLongitude is set',
      'expected.moonLongitude is set',
      'expected.ascendantLongitude is set',
    ],
    pendingCaseIds: provisionalCases.map((testCase) => ({
      id: testCase.id,
      name: testCase.name,
      source: testCase.source,
    })),
  };

  console.log(JSON.stringify(checklist, null, 2));
}

main();
