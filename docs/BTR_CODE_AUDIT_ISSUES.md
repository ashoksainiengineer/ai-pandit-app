# BTR Non-AI Code Audit: Issue Register

**Audit date**: 2026-05-03
**Scope**: All deterministic calculation engines, ephemeris integration, pipeline infrastructure, tests
**Excluded**: AI prompt stages (Stage 2/4/6 LLM calls), AI client

---

## 🔴 Critical — Producing wrong results

### C1. `shadbala.ts`: Exaltation degree vs full-longitude type mismatch

**File**: `apps/api/src/lib/shadbala.ts`
**Line**: ~193

`EXALTATION_DEGREES` stores full 0–360° longitude values (Sun=10, Moon=33, Mars=298, Mercury=165, Jupiter=95, Venus=357, Saturn=200).
`pos.degree` is 0–30° within-sign degree.
The code subtracts them directly:

```ts
const distance = Math.abs(pos.degree - EXALTATION_DEGREES[planet]);
```

Only Sun (10° Aries) and Moon (3° Taurus) happen to work because their exaltation
degrees are < 30. Jupiter at 5° Cancer produces `|5 - 95| = 90` instead of the
correct `|95 - 95| = 0`. Every exaltation-bala calculation for Mars, Mercury,
Jupiter, Venus, and Saturn is corrupted.

**Fix**: Use `pos.longitude` instead of `pos.degree`.
**Impact**: All Shadbala scores downstream (consensus engine, AI prompt data, window-scanner scoring).

---

### C2. `advanced-btr-methods.ts`: Shadbala Kala Bala `isDayTime` hardcoded to `true`

**File**: `apps/api/src/lib/advanced-btr-methods.ts`
**Line**: 1194

```ts
const isDayTime = true; // Placeholder
```

Every birth — day or night — gets daytime Kala Bala. Saturn, Mars, and Moon
strengths are systematically wrong for night births. This is the Shadbala-lite
implementation used in data-package-builder.

**Fix**: Derive from Sun's house position. Day: houses 10–12, 1–3. Night: houses 4–9.
Or preferably avoid the `advanced-btr-methods.ts` Shadbala entirely and route
through `shadbala.ts` which has `calculateKalaBala()`.

**Impact**: AI receives wrong planetary strengths. Consensus scoring uses wrong Shadbala.

---

### C3. `data-package-builder.ts`: Planet at 0° treated as missing data

**File**: `apps/api/src/lib/btr/data-package-builder.ts`
**Line**: ~253

```ts
if (!planet.degree) throw new Error('missing degree');
```

A planet at exactly 0°00'00" of any sign has `degree = 0`, which is falsy.
The validation rejects a valid astrological position.

**Fix**: `if (planet.degree == null || isNaN(planet.degree))` — only reject missing/unset.
**Impact**: False validation errors on valid birth charts. Pipeline fails for legitimate inputs.

---

### C4. `ephemeris.ts`: 12:00 PM converts to 24:00 (next day)

**File**: `apps/api/src/lib/ephemeris.ts`
**Lines**: ~672–674

```ts
if (isAM && hour === 12) hour = 0;
// Missing: if (isPM && hour < 12) hour += 12;
// 12:00 PM stays hour=12, then hour+=12 → hour=24
```

When `isPM && hour === 12`, the code falls through to `hour += 12`, producing
`hour = 24`. `Date.UTC(year, month-1, day, 24, ...)` rolls into the next day.

**Fix**: Add explicit `if (isPM && hour === 12) { /* hour stays 12 */ }` before the `hour += 12`.
**Impact**: Timezone conversions for births at exactly 12:00–12:59 PM silently land on the wrong date.

---

### C5. `window-scanner.ts`: Four methods never scored → confidence ceiling = MEDIUM

**File**: `apps/api/src/lib/btr/window-scanner.ts`
**Function**: `scoreCandidate()`

`methodScores` object initializes 13 fields. Only 9 are populated:
vimshottari, kp, varga, boundary, tatwa, kalachakra, shadbala, nadi, transit.
These four are never scored: **yogini, chara, forensic, spouseD9**.

`determineConfidenceLevel()` checks `scores.every(s => s >= 80)` for GOD_TIER.
Since 4 scores remain 0, GOD_TIER, VERY_HIGH, and HIGH are mathematically
impossible. The scanner caps every result at MEDIUM.

**Fix**: Either score the remaining methods or exclude them from the confidence threshold check.
**Impact**: All confidence reports from the window scanner are capped at MEDIUM regardless of actual accuracy.

---

## 🟡 Major — Inaccurate or misleading results

### M1. `vedic-astrology-engine.ts`: Panchanga mock ephemeris has 7/9 planets at 0°

**File**: `apps/api/src/lib/vedic-astrology-engine.ts`
**Lines**: 499–513

```ts
const mockEph: EphemerisData = {
    planets: {
        sun: { ..., longitude: sunLong },   // real
        moon: { ..., longitude: moonLong }, // real
        mercury: { ..., longitude: 0 },     // fake
        // ... other 5 planets also longitude: 0
    },
};
```

Tithi is correct (Sun-Moon only). Yoga and Karana use the full planet set —
with 7 fake longitudes at 0° Aries.

**Fix**: Pass actual ephemeris data instead of constructing a mock.
**Impact**: Incorrect Yoga/Karana in every Panchanga computation. Feeds into AI prompt context.

---

### M2. `precision-weights.ts`: Rank-fusion implementation is not RRF

**File**: `apps/api/src/lib/btr/precision-weights.ts`
**Lines**: 355–397

True Reciprocal Rank Fusion requires ranking *multiple candidates* within each
method, then fusing ranks across methods. This code evaluates a single
candidate across methods, converting absolute scores to "virtual ranks"
(`101 - score`). The result is a score transformation, not rank fusion.

**Fix**: Either implement true RRF (rank candidates within each method before fusing)
or rename the function and document it as a weighted score normalization.
**Impact**: Methodologically incorrect scoring. May inflate or deflate candidate scores unpredictably.

---

### M3. `advanced-btr-methods.ts`: D150 fixed-sign start sign is wrong

**File**: `apps/api/src/lib/advanced-btr-methods.ts`
**Lines**: 455–457

```ts
d150SignIndex = (7 + (149 - nadiIndex)) % 12;
```

Comment: "Fixed signs reverse — start from Scorpio (7)". But `(7 + 149) % 12 = 0` (Aries),
not Scorpio. The first nadi for fixed signs starts from Aries instead of Scorpio.
All 150 nadi indices for fixed signs are shifted.

**Fix**: Verify the correct D150 fixed-sign starting sign and adjust the formula.
**Impact**: D150 sign assignments wrong for Taurus, Leo, Scorpio, Aquarius (4 of 12 signs).

---

### M4. `consensus-engine.ts`: Gandanta detection misses water-sign side

**File**: `apps/api/src/lib/consensus-engine.ts`  
**Lines**: 1020–1027

```ts
const gandantaCheck = (moonLong % 120) < 1;
```

Gandanta occurs at the junctions: Pisces-Aries (0°/360°), Cancer-Leo (120°),
Scorpio-Sagittarius (240°). The code detects 0–1° of Aries/Leo/Sagittarius
(fire beginnings) but misses 29–30° of Pisces/Cancer/Scorpio (water endings).

**Fix**: Also check `(moonLong % 120) > 119 || (moonLong % 120) < 1`.
**Impact**: Half the Gandanta cases are undetected. Red-flag logic incomplete.

---

### M5. `consensus-engine.ts`: Confidence threshold impossible with 12 methods

**File**: `apps/api/src/lib/consensus-engine.ts`
**Lines**: 774–790

`determineConfidenceLevel()` requires `scoreValues.every(s => s >= threshold)`
for STANDARD_PRECISION / VERY_HIGH / HIGH. With 12 methods and several that
routinely score 0 (prana, ai, etc. when data is missing), these thresholds
are practically unreachable.

**Fix**: Filter out methods without data (`score <= 0`) before applying thresholds,
matching the pattern in `calculateRankFusionScore`.
**Impact**: Consensus engine never reports HIGH or above.

---

### M6. `window-scanner.ts`: Double-scoring of candidates

**File**: `apps/api/src/lib/btr/window-scanner.ts`

`generateCandidates()` internally calls `scoreCandidate()` and sets
`candidate.score`. Then `scanBirthTimeWindow()` calls `Promise.all(candidates.map(c => scoreCandidate(c, context)))`
on the same candidates. Every candidate is scored twice.

**Fix**: Return pre-scored candidates from `generateCandidates` and skip re-scoring.
**Impact**: 2× CPU/DB work per candidate. Processing time doubled for large windows.

---

### M7. `data-package-builder.ts`: Arudha Lagna degree hardcoded to 0°

**File**: `apps/api/src/lib/btr/data-package-builder.ts`
**Lines**: 330–332

```ts
AL: { sign: al.sign, degree: "0° 00' 00\"", ... }
```

Arudha Lagna has a calculable degree derived from Lagna Lord's position.
Hardcoding 0° loses precision.

**Fix**: Compute AL degree from `(lagnaLordSignIndex + countToLord)` position.
**Impact**: Minor loss of precision in AI prompt data. Does not affect rectification accuracy significantly.

---

## 🟢 Moderate — Code quality / correctness gaps

### G1. `vedic-astrology-engine.ts`: `addYears` uses Julian year

**Line**: 391

`365.25 * 24 * 60 * 60 * 1000` is the Julian year. Sidereal year ≈ 365.25636 days.
Over a 120-year Vimshottari cycle, accumulates ~0.76 days of drift.
Negligible for sub-periods within a human lifespan.

---

### G2. Inconsistent event weights across 3 files

| File | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| `precision-weights.ts` | 5.0 | 3.0 | 2.0 | 1.0 |
| `consensus-engine.ts` | 3.0 | 2.5 | 1.5 | 1.0 |
| `event-scorer.ts` | separate system | | | |

The same event can receive different weights depending on which code path processes it.

---

### G3. `ground-truth.test.ts`: Entire suite permanently skipped in CI

`describe.skipIf(!runHighPrecisionEphemerisTests)` — unless
`RUN_HIGH_PRECISION_EPHEMERIS_TESTS=true` is set, 5 tests never execute:
ayanamsa validation, historical range, southern hemisphere, Rahu-Ketu
separation, and mathematical precision checks.

---

### G4. 7 stub functions return hardcoded/fake values

| Function | Returns | File |
|----------|---------|------|
| `calculateVimsopakaBala` | `{ total: 0 }` | vedic-astrology-engine.ts |
| `detectBhavaChalitDiscrepancy` | `[]` | vedic-astrology-engine.ts |
| `getDignity` | `'Neutral'` | vedic-astrology-engine.ts |
| `calculateFunctionalNature` | `'Neutral'` | vedic-astrology-engine.ts |
| `calculatePanchadhaSambandha` | `'Neutral'` | vedic-astrology-engine.ts |
| `calculateIshtaKashtaPhala` | `{ ishta: 20, kashta: 10 }` | vedic-astrology-engine.ts |
| `calculateShadbala` (lite) | `isDayTime: true` | advanced-btr-methods.ts |

These feed into AI prompts — the AI is reasoning on fake planetary strength data.

---

### G5. `ephemeris.ts`: Sunrise calculation fails above ~55° latitude

**Line**: 903 — `for (let h = 4; h <= 8; h++)` only sweeps 4am–8am UTC.
Polar regions can have sunrise outside this window.

---

### G6. `ephemeris.ts`: Cache eviction is FIFO, not LRU

**Line**: 170–182 — On `MAX_CACHE_SIZE`, only one entry is deleted from
the Map's insertion order. Burst loads can overflow the cache.

---

### G7. `consensus-engine.test.ts`: Stale comment vs assertion mismatch

**Line 113**: Comment says "10 validation details". Assertion expects `12`.
Confidence-level enum inconsistencies between `consensus-engine.test.ts` and
`btrStressRobustness.test.ts`.

---

## Fix Priority

| # | Issue | Effort | Impact |
|---|-------|--------|--------|
| C1 | Shadbala exaltation type mismatch | Small | High — all scores corrupted |
| C2 | isDayTime=true | Small | High — night births wrong |
| C4 | 12 PM → 24:00 | Trivial | Medium — rare timing |
| C3 | Planet 0° falsy | Trivial | Medium — edge-case crash |
| C5 | Confidence ceiling = MEDIUM | Medium | High — all reports wrong |
| M4 | Gandanta half-detection | Trivial | Medium — red flags incomplete |
| M1 | Panchanga mock ephemeris | Medium | Medium — Yoga/Karana wrong |
| M6 | Double-scoring | Medium | Medium — 2× processing |
| M5 | Confidence threshold impossible | Small | Medium — consensus scores |
| M3 | D150 fixed-sign start | Small | Medium — 4 signs wrong |
| M2 | RRF misapplication | Medium | Low — scoring methodology |
| M7 | AL degree hardcoded | Small | Low — minor precision loss |

---

## References

- [Desloppify](https://github.com/peteromallet/desloppify) — "From Vibe Coding to Vibe Engineering"
- [Karpathy's LLM Coding Principles](https://github.com/forrestchang/andrej-karpathy-skills):
  1. Think Before Coding
  2. Simplicity First
  3. Surgical Changes
  4. Goal-Driven Execution
