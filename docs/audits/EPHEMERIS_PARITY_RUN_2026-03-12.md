# Ephemeris Parity Run - 12 March 2026

## Scope

Phase 2 execution evidence for migrated Skyfield architecture in development mode (fail-fast, no legacy fallback path).

## Preconditions

1. `npm run setup:ephemeris`
2. `npm run ephemeris:download-kernel`
3. `npm run dev:ephemeris` (service on `http://localhost:8000`)

## Commands + Outcomes

1. `npm -w @ai-pandit/api run test:ephemeris:high-precision`
   - Result: pass (`5/5`)
   - Notes: Skyfield provider initialized; no algorithmic fallback.

2. `vitest run src/lib/ephemeris/__tests__/skyfield-swiss-parity.test.ts`
   - Result: pass (`70/70`)
   - Notes: end-to-end parity assertions currently green.

3. `npm -w @ai-pandit/api run test:ephemeris:gold`
   - Result: pass (`3/3`)
   - Notes: initial migration anchors validated in strict Skyfield mode.

4. `npm -w @ai-pandit/api run test:ephemeris:gold:strict`
   - Result: fail (expected)
   - Notes: strict mode correctly blocks sign-off while dataset still has provisional-only cases.

5. `npm -w @ai-pandit/api run ephemeris:gold:candidates`
   - Result: pass
   - Notes: generated candidate sun/moon/asc longitude anchors for all current provisional cases.

6. `npm -w @ai-pandit/api run ephemeris:gold:checklist`
   - Result: pass
   - Notes: reports `trustedCases=3`, `provisionalCases=0` after bootstrap promotion.

7. `npm -w @ai-pandit/api run ephemeris:compare`
   - Result: command runs successfully with deterministic env contract.
   - Summary output:
     - `sunDelta`: `0.0038139901726026437`
     - `moonDelta`: `0.007046161541211404`
     - `rahuDelta`: `1.5785356271284172`
     - `ascendantDelta`: `111.74714077630631`
     - `maxPlanetLongitudeDelta`: `144.38143125780624`
     - `maxHouseCuspDelta`: `140.10616441552335`

## Interpretation

1. Skyfield-based runtime and high-precision suites are operational and stable in local development.
2. Raw comparison against current algorithmic baseline is not suitable as a phase sign-off metric because baseline itself diverges materially for key chart outputs.
3. `ephemeris:parity:quick` now provides a repeatable one-command phase-2 check for local development.
4. `test:ephemeris:gold:strict` is now the release-gate command once trusted fixtures are onboarded.
5. Phase-2 acceptance must be tied to:
   - trusted migration gold dataset
   - BTR-output drift thresholds
   - explicit house-system/ayanamsha alignment checks
6. Current trusted dataset entries are bootstrap simulated seeds for development and must be replaced with real audited production session sources before release.
7. Phase-gate integration now consumes strict ephemeris gold validation through:
   - `npm -w @ai-pandit/api run phase6:release-gate`

## Next Actions

1. Create `gold-dataset` fixtures from trusted historical sessions.
2. Add threshold assertions (planet, house, ascendant, BTR recommendation deltas).
3. Gate phase sign-off on gold-dataset parity report, not algorithmic-baseline-only deltas.
