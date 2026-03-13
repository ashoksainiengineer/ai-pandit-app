# Ephemeris Trusted Dataset Onboarding

Date: 12 March 2026

## Purpose

Promote `provisional` ephemeris gold cases to `trusted` with auditable provenance so `test:ephemeris:gold:strict` can act as a real release gate.

## Preconditions

1. Skyfield service running (`npm run dev:ephemeris`).
2. Candidate anchors generated (`npm -w @ai-pandit/api run ephemeris:gold:candidates`).
3. Production source session evidence available.

## Promotion Steps

1. Run checklist:
   - `npm -w @ai-pandit/api run ephemeris:gold:checklist`
2. For each pending case in `apps/api/src/lib/ephemeris/gold-dataset.ts`:
   - set `qualityTier` to `trusted`
   - set `source` with format `prod-session:<session-id-or-audit-id>`
   - set `verifiedBy` (engineer/reviewer id)
   - set `verifiedAt` (ISO-8601 timestamp)
   - set `verificationMethod` one of:
     - `prod_session_replay_v1`
     - `prod_incident_repro_v1`
     - `expert_manual_audit_v1`
   - set numeric anchors:
     - `expected.sunLongitude`
     - `expected.moonLongitude`
     - `expected.ascendantLongitude`
   - set `expected.longitudeToleranceDeg` as required.
3. Validate non-strict:
   - `npm -w @ai-pandit/api run test:ephemeris:gold`
4. Validate strict gate:
   - `npm -w @ai-pandit/api run test:ephemeris:gold:strict`
5. Run standard API verification:
   - `npm -w @ai-pandit/api run lint`
   - `npm -w @ai-pandit/api run test`

## Sign-off Rule

Release sign-off for phase-2 requires `test:ephemeris:gold:strict` green with zero provisional cases.
