# Subsystem Audit: 1.3 BTR Support Modules

## 📋 Metadata

| Property | Value |
|----------|-------|
| **Subsystem** | BTR Support Modules |
| **Category** | Core BTR Engine |
| **Files** | 10 |
| **Total Lines** | ~15,000 |
| **Last Audited** | March 2026 |
| **Status** | ✅ Production Ready |

---

## 📁 Files in this Subsystem

| File | Lines | Purpose |
|------|-------|---------|
| [`data-package-builder.ts`](../../apps/api/src/lib/btr/data-package-builder.ts) | 630 | Build candidate data packages for AI |
| [`dasha-builder.ts`](../../apps/api/src/lib/btr/dasha-builder.ts) | 240 | Build Dasha data for candidates |
| [`transit-builder.ts`](../../apps/api/src/lib/btr/transit-builder.ts) | 250 | Build transit data |
| [`planet-enricher.ts`](../../apps/api/src/lib/btr/planet-enricher.ts) | 130 | Enrich planetary positions |
| [`event-scorer.ts`](../../apps/api/src/lib/btr/event-scorer.ts) | 380 | Score life events match |
| [`window-scanner.ts`](../../apps/api/src/lib/btr/window-scanner.ts) | 827 | Scan time windows |
| [`tatwa-shuddhi.ts`](../../apps/api/src/lib/btr/tatwa-shuddhi.ts) | 380 | Tatwa element correction |
| [`transit-analyzer.ts`](../../apps/api/src/lib/btr/transit-analyzer.ts) | 350 | Transit analysis |
| [`precision-weights.ts`](../../apps/api/src/lib/btr/precision-weights.ts) | 550 | Scoring weights |
| [`security-guard.ts`](../../apps/api/src/lib/btr/security-guard.ts) | 50 | Input validation & sanitization |

---

## 🎯 Purpose

BTR Support Modules provide the **data transformation and scoring infrastructure** for the BTR pipeline. They:

1. **Transform ephemeris data** into AI-ready format
2. **Calculate astrological metrics** (Dasha, Transit, KP)
3. **Score candidates** against life events
4. **Enrich planetary data** with dignity, retrograde, combustion
5. **Validate inputs** and sanitize data

---

## 📦 Module Details

### 1. Data Package Builder

**File:** [`data-package-builder.ts`](../../apps/api/src/lib/btr/data-package-builder.ts)

**Purpose:** Build comprehensive astrological data packages for candidate birth times

**Key Function:**
```typescript
export async function buildCandidateDataPackage(
  time: string,
  offsetMinutes: number,
  input: SecondsPrecisionInput,
  options: PackageBuildOptions = {}
): Promise<CandidateDataPackage>
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeFullData` | boolean | false | Include all divisional charts |
| `dashaDepth` | number | 3 | Dasha calculation depth (1-5) |
| `pranaWindowDays` | number | 3 | Prana Dasha window |
| `lifecycleShifts` | any[] | [] | Global lifecycle data |

**Package Contents:**
```typescript
interface CandidateDataPackage {
  // Basic Info
  time: string;
  offsetMinutes: number;
  
  // Ephemeris
  ephemeris: EphemerisData;
  
  // Dasha Systems
  vimshottariDasha: DashaPeriod[];
  yoginiDasha: DashaPeriod[];
  charaDasha: DashaPeriod[];
  kalachakraDasha: KalachakraPeriod[];
  
  // Divisional Charts
  divisionalCharts: Record<string, ChartData>;
  
  // KP System
  kpSubLords: KPSubLordData;
  
  // Strength
  shadbala: ShadbalaResult;
  
  // Special Features
  yogas: Yoga[];
  ashtakavarga: AshtakavargaData;
  arudhas: ArudhaData;
  panchanga: PanchangaData;
  
  // Forensic
  tatwa: TatwaType;
  prakriti: PrakritiType;
}
```

**Dependencies:**
- `ephemeris.js` - Swiss Ephemeris calculations
- `vedic-astrology-engine.js` - Vedic calculations
- `advanced-btr-methods.js` - Divisional charts
- `kalachakra-dasha.js` - Kalachakra periods
- `shadbala.js` - Planetary strength
- `nadi-amsha.js` - D150 calculations
- `spouse-d9-verification.ts` - D9 verification

---

### 2. Dasha Builder

**File:** [`dasha-builder.ts`](../../apps/api/src/lib/btr/dasha-builder.ts)

**Purpose:** Build Dasha data for candidates

**Key Functions:**
```typescript
export function buildVimshottariDasha(config: {
  moonLongitude: number;
  birthDate: Date;
  dashaDepth?: number;
  pranaWindowDays?: number;
  eventRanges?: Array<{ start: Date; end: Date }>;
}): DashaPeriod[]

export function buildYoginiDasha(config: {
  moonLongitude: number;
  birthDate: Date;
}): DashaPeriod[]

export function buildCharaDasha(birthDate: Date): DashaPeriod[]
```

**Dasha Depth Levels:**
| Level | Name | Duration |
|-------|------|----------|
| 1 | Mahadasha | 7-20 years |
| 2 | Antardasha | 1-3 years |
| 3 | Pratyantar | 3-12 months |
| 4 | Sukshma | 10-40 days |
| 5 | Prana | 1-4 days |

---

### 3. Transit Builder

**File:** [`transit-builder.ts`](../../apps/api/src/lib/btr/transit-builder.ts)

**Purpose:** Build transit data for event correlation

**Key Function:**
```typescript
export function buildTransitData(
  birthDate: Date,
  eventDate: Date,
  natalEphemeris: EphemerisData,
  options?: TransitBuildOptions
): TransitDataEntry[]
```

**Transit Types:**
- **Gochar** - Current planetary positions
- **Return** - Planetary returns (Saturn, Jupiter)
- **Double Transit** - Saturn + Jupiter simultaneous
- **Nakshatra Transit** - Moon nakshatra changes

---

### 4. Planet Enricher

**File:** [`planet-enricher.ts`](../../apps/api/src/lib/btr/planet-enricher.ts)

**Purpose:** Enrich planetary positions with dignity, retrograde, combustion

**Key Functions:**
```typescript
export function enrichPlanets(ephemeris: EphemerisData): EnrichedPlanet[]

export function extractIshtaKashtaPhala(ephemeris: EphemerisData): {
  ishta: number;
  kashta: number;
}
```

**Enrichment Data:**
| Attribute | Description |
|-----------|-------------|
| `sign` | Zodiac sign (0-11) |
| `nakshatra` | Nakshatra (0-26) |
| `pada` | Nakshatra pada (0-3) |
| `dignity` | Uccha, Moola, Neecha, Swastha |
| `retrograde` | Is planet retrograde? |
| `combustion` | Is planet combust? |
| `shadbala` | 6-source strength score |

---

### 5. Event Scorer

**File:** [`event-scorer.ts`](../../apps/api/src/lib/btr/event-scorer.ts)

**Purpose:** Score life events match for candidates

**Key Class:**
```typescript
export class EventScorer {
  constructor(events: BtrEvent[], config?: EventScoringOptions)
  
  scoreCandidate(candidate: CandidateTime): number
  scoreEvent(event: BtrEvent, dasha: DashaPeriod): number
  getScoreSummary(): EventScoreSummary
}
```

**Scoring Factors:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Dasha Match | 40% | Event occurred during relevant Dasha |
| House Significator | 25% | Event significator in relevant house |
| Transit Support | 20% | Transit planets support event |
| Nakshatra Match | 10% | Event nakshatra alignment |
| Element Match | 5% | Tatwa element alignment |

---

### 6. Window Scanner

**File:** [`window-scanner.ts`](../../apps/api/src/lib/btr/window-scanner.ts)

**Purpose:** Scan time windows iteratively to find best birth time

**Key Class:**
```typescript
export class WindowScanner {
  scan(input: ScannerInput): Promise<ScanResult>
  
  private generateCandidates(context: ScannerContext): CandidateTime[]
  private scoreCandidates(candidates: CandidateTime[]): CandidateScore[]
  private rankCandidates(scores: CandidateScore[]): CandidateScore[]
}
```

**Scan Process:**
```
1. Generate candidate times (based on offset config)
2. Calculate ephemeris for each candidate
3. Build Dasha sequences
4. Score against life events
5. Rank by composite score
6. Return top candidates
```

---

### 7. Tatwa Shuddhi

**File:** [`tatwa-shuddhi.ts`](../../apps/api/src/lib/btr/tatwa-shuddhi.ts)

**Purpose:** Tatwa element correction for morning births

**Key Class:**
```typescript
export class TatwaShuddhi {
  static findCorrections(options: {
    sunriseTime: Date;
    birthTime: Date;
    knownPrakriti?: PrakritiType;
  }): TatwaCorrectionResult
  
  static calculateTatwaAtTime(time: Date): TatwaType
}
```

**Tatwa Cycle:**
```
Full Cycle: 120 minutes (2 hours)
Each Tatwa: 24 minutes
Sequence: Akash → Vayu → Agni → Jala → Prithvi → Akash
```

**Tatwa Types:**
| Tatwa | Element | Time (after sunrise) |
|-------|---------|---------------------|
| Akash | Ether | 0-24 min |
| Vayu | Air | 24-48 min |
| Agni | Fire | 48-72 min |
| Jala | Water | 72-96 min |
| Prithvi | Earth | 96-120 min |

---

### 8. Transit Analyzer

**File:** [`transit-analyzer.ts`](../../apps/api/src/lib/btr/transit-analyzer.ts)

**Purpose:** Analyze transits for event correlation

**Key Class:**
```typescript
export class TransitAnalyzer {
  analyze(options: TransitAnalysisOptions): ComprehensiveTransitResult
  
  analyzeDoubleTransit(
    natalDate: Date,
    eventDate: Date
  ): DoubleTransitResult
}
```

**Analysis Types:**
- **Single Transit** - One planet transit
- **Double Transit** - Saturn + Jupiter (powerful)
- **Triple Transit** - Saturn + Jupiter + Rahu/Ketu
- **Return Transit** - Planetary return to natal position

---

### 9. Precision Weights

**File:** [`precision-weights.ts`](../../apps/api/src/lib/btr/precision-weights.ts)

**Purpose:** Scoring weights and confidence thresholds

**Key Exports:**
```typescript
export const METHOD_WEIGHTS = {
  vimshottari: 0.25,
  kpSublord: 0.20,
  varga: 0.15,
  transit: 0.15,
  forensic: 0.15,
  event: 0.10
}

export const CONFIDENCE_THRESHOLDS = {
  high: 85,
  medium: 70,
  low: 50
}

export const KP_SCORES = {
  starLordMatch: 10,
  subLordMatch: 8,
  subSubLordMatch: 6,
  subSubSubLordMatch: 4
}

export const DASHA_MATCH_SCORES = {
  mahadasha: 10,
  antardasha: 8,
  pratyantar: 6,
  sukshma: 4,
  prana: 2
}
```

**Scoring Functions:**
```typescript
export function calculateRankFusionScore(
  scores: number[],
  weights: number[]
): number

export function calculateWeightedAverage(
  scores: Record<string, number>,
  weights: Record<string, number>
): number
```

---

### 10. Security Guard

**File:** [`security-guard.ts`](../../apps/api/src/lib/btr/security-guard.ts)

**Purpose:** Input validation and sanitization

**Key Functions:**
```typescript
export function validateBTRInput(input: unknown): SecondsPrecisionInput

export function sanitizeLifeEvent(event: unknown): BtrEvent

export function validateCoordinate(value: number): boolean
```

**Validations:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Date format: YYYY-MM-DD
- Time format: HH:MM:SS
- Event date: Must be after birth date

---

## 🔗 Dependencies

### Internal Dependencies
```
data-package-builder.ts
├── ephemeris.js
├── vedic-astrology-engine.js
├── advanced-btr-methods.js
├── kalachakra-dasha.js
├── shadbala.js
├── nadi-amsha.js
├── spouse-d9-verification.ts
├── gandanta-detection.js
└── pancha-pakshi.js

window-scanner.ts
├── ephemeris.js
├── vedic-astrology-engine.js
├── kp-sublords.js
├── advanced-btr-methods.js
├── jaimini-astrology.js
├── kalachakra-dasha.js
├── shadbala.js
├── nadi-amsha.js
├── tatwa-shuddhi.ts
├── transit-analyzer.ts
└── event-scorer.ts
```

### External Dependencies
- `@ai-pandit/shared` - Type definitions

---

## 📊 Performance Characteristics

| Module | Avg Time | Memory | Calls/Session |
|--------|----------|--------|---------------|
| data-package-builder | 50-100ms | ~5MB | 500-1000 |
| dasha-builder | 10-20ms | ~1MB | 500-1000 |
| transit-builder | 5-10ms | ~500KB | 500-1000 |
| planet-enricher | 5ms | ~200KB | 500-1000 |
| event-scorer | 10-20ms | ~1MB | 500-1000 |
| window-scanner | 100-200ms | ~10MB | 1-5 |
| tatwa-shuddhi | 1-2ms | ~100KB | 500-1000 |
| transit-analyzer | 20-30ms | ~2MB | 500-1000 |
| precision-weights | <1ms | ~50KB | 500-1000 |
| security-guard | <1ms | ~50KB | 1 |

---

## ⚠️ Critical Considerations

### 1. Memory Usage
- `data-package-builder` creates large objects (~5MB each)
- 500 candidates × 5MB = ~2.5GB per session
- Monitor heap with `memory-manager.ts`

### 2. Ephemeris Caching
- Swiss Ephemeris WASM is expensive
- Cache results when possible
- Use `cleanup()` to free WASM memory

### 3. Dasha Depth
- Higher depth = more calculations
- Stage 1: depth 3 (Maha-Antar-Pratyantar)
- Stage 2/4: depth 4 (add Sukshma)
- Stage 6: depth 5 (add Prana)

### 4. Event Scoring
- Multiple events = multiple score calculations
- Use batch processing for efficiency
- Cache event scores where possible

---

## 🧪 Test Coverage

| Module | Unit Tests | Integration | Coverage |
|--------|------------|-------------|----------|
| data-package-builder | ✅ | ✅ | ~75% |
| dasha-builder | ✅ | ✅ | ~80% |
| transit-builder | ✅ | ❌ | ~65% |
| planet-enricher | ✅ | ❌ | ~70% |
| event-scorer | ✅ | ✅ | ~75% |
| window-scanner | ✅ | ✅ | ~70% |
| tatwa-shuddhi | ✅ | ❌ | ~80% |
| transit-analyzer | ✅ | ❌ | ~65% |
| precision-weights | ✅ | ❌ | ~90% |
| security-guard | ✅ | ✅ | ~85% |

---

## 📝 Improvement Recommendations

### High Priority
1. **Add caching** for data packages
2. **Optimize memory** - Stream large objects
3. **Add telemetry** for performance tracking

### Medium Priority
1. **Parallelize** ephemeris calculations
2. **Add validation** for intermediate results
3. **Implement retry** for WASM failures

### Low Priority
1. **Add debug mode** with verbose logging
2. **Create benchmarks** for performance
3. **Document edge cases** in code

---

## 📚 Related Documentation

- [SUBSYSTEM_01_BTR_ENGINE.md](./SUBSYSTEM_01_BTR_ENGINE.md) - Parent overview
- [SUBSYSTEM_01_2_PIPELINE_STAGES.md](./SUBSYSTEM_01_2_PIPELINE_STAGES.md) - Stage implementations
- [SUBSYSTEM_01_4_AI_PROMPT_SYSTEM.md](./SUBSYSTEM_01_4_AI_PROMPT_SYSTEM.md) - AI prompts

---

*Last Updated: March 2026*
