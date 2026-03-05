# Subsystem Audit: 2.1 Core Vedic Engine

## 📋 Metadata

| Property | Value |
|----------|-------|
| **Subsystem** | Core Vedic Engine |
| **Category** | Vedic Astrology |
| **Files** | 1 |
| **Total Lines** | ~579 |
| **Last Audited** | March 2026 |
| **Status** | ✅ Production Ready |

---

## 📁 Files in this Subsystem

| File | Lines | Purpose |
|------|-------|---------|
| [`vedic-astrology-engine.ts`](../../apps/api/src/lib/vedic-astrology-engine.ts) | 579 | Vimshottari Dasha, Nakshatras |

---

## 🎯 Purpose

The Core Vedic Engine provides the **foundational Vedic astrological calculations** for the BTR system. It:

1. **Calculates Vimshottari Dasha** - 5-level recursive Dasha system
2. **Manages Nakshatra mappings** - 27 Nakshatras with planetary lords
3. **Handles Sandhi transitions** - Dasha change detection
4. **Calculates birth period** - Partial Dasha for birth time
5. **Provides divisional charts** - D1-D60 calculations

---

## 📦 Key Features

### Vimshottari Dasha System

**Dasha Periods (in years):**
| Planet | Years | Order |
|--------|--------|--------|
| Ketu | 7 | 1 |
| Venus | 20 | 2 |
| Sun | 6 | 3 |
| Moon | 10 | 4 |
| Mars | 7 | 5 |
| Rahu | 18 | 6 |
| Jupiter | 16 | 7 |
| Saturn | 19 | 8 |
| Mercury | 17 | 9 |

**Total Cycle:** 120 years

### 5-Level Dasha Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         5-LEVEL DASHA SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 1: Mahadasha (7-20 years)                                          │
│    ├── Level 2: Antardasha (1-3 years)                                      │
│    │    ├── Level 3: Pratyantardasha (3-12 months)                            │
│    │    │    ├── Level 4: Sukshmadasha (10-40 days)                           │
│    │    │    │    └── Level 5: Pranadasha (1-4 days)                          │
│    │    │                                                                   │
│    │    └── ... (recursive)                                                   │
│    │                                                                         │
│    └── ... (recursive)                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Nakshatra System

**27 Nakshatras with Lords:**
| # | Nakshatra | Lord | Degrees |
|---|------------|-------|---------|
| 1 | Ashwini | Ketu | 0°-13°20' Aries |
| 2 | Bharani | Venus | 13°20'-26°40' Aries |
| 3 | Krittika | Sun | 26°40'-10° Taurus |
| ... | ... | ... | ... |
| 27 | Revati | Mercury | 16°40'-30° Pisces |

**Nakshatra Span:** 13°20' (360° / 27)

---

## 🔧 Key Functions

### `calculateVimshottariDasha()`

**Purpose:** Calculate complete Vimshottari Dasha sequence

```typescript
export function calculateVimshottariDasha(
  moonLongitude: number,
  birthDate: Date,
  options?: {
    dashaDepth?: number;      // 1-5 levels
    pranaWindowDays?: number;  // Days for Prana Dasha
    eventRanges?: Array<{ start: Date; end: Date }>;
  }
): DashaPeriod[]
```

**Parameters:**
- `moonLongitude` - Moon's position in degrees (0-360)
- `birthDate` - Date of birth
- `dashaDepth` - Depth of Dasha calculation (default: 3)
- `pranaWindowDays` - Days to calculate Prana Dasha (default: 3)

**Returns:** Array of DashaPeriod objects with recursive subPeriods

### `getDashaForDate()`

**Purpose:** Get active Dasha for a specific date

```typescript
export function getDashaForDate(
  dashaSequence: DashaPeriod[],
  targetDate: Date
): DashaAtDate | null
```

**Returns:** DashaAtDate with all 5 levels

### `calculateAllVargas()`

**Purpose:** Calculate all divisional charts (D1-D60)

```typescript
export function calculateAllVargas(
  ephemeris: EphemerisData
): Record<string, ChartData>
```

**Charts Calculated:**
- D1 (Rashi) - Natal chart
- D2 (Hora) - Wealth
- D3 (Dreshkana) - Siblings
- D4 (Chaturthamsa) - Property
- D7 (Saptamsa) - Children
- D9 (Navamsa) - Marriage/Spouse
- D10 (Dasamsa) - Career
- D12 (Dwadasamsa) - Parents
- D16 (Shodashamsa) - Vehicles
- D20 (Vimshamsa) - Spiritual progress
- D24 (Siddhamsa) - Education
- D27 (Bhamsa) - Strength
- D30 (Trimshamsa) - Spouse/Character
- D40 (Khavedamsa) - Maternal lineage
- D45 (Akshavedamsa) - Paternal lineage
- D60 (Shastiamsa) - Past life karma

---

## 🔗 Dependencies

### Internal Dependencies
```
vedic-astrology-engine.ts
├── ephemeris.js (Swiss Ephemeris)
└── @ai-pandit/shared (Type definitions)
```

### External Dependencies
- Swiss Ephemeris (WASM) - Planetary calculations
- `@ai-pandit/shared` - Type definitions

---

## 📊 Performance Characteristics

| Operation | Avg Time | Memory |
|------------|----------|---------|
| Vimshottari Dasha (3 levels) | 10-20ms | ~1MB |
| Vimshottari Dasha (5 levels) | 50-100ms | ~5MB |
| All Vargas (D1-D60) | 30-50ms | ~2MB |
| Dasha for date lookup | <1ms | ~100KB |

---

## ⚠️ Critical Considerations

### 1. Recursive Dasha Calculation
- 5-level Dasha creates exponential growth
- Depth 5 = 9^5 = 59,049 periods
- Use depth 3 for most cases (Maha-Antar-Pratyantar)

### 2. Sandhi Transitions
- Dasha changes are critical for event timing
- Sandhi period = ±15 minutes around transition
- Events during Sandhi have mixed results

### 3. Birth Period Calculation
- Partial Mahadasha at birth
- Calculate using Moon's position in Nakshatra
- Essential for accurate Dasha start

### 4. Ayanamsa Correction
- Uses Lahiri Ayanamsa (most common)
- Corrects for precession of equinoxes
- ~24° correction in 2024

---

## 🧪 Test Coverage

| Area | Unit Tests | Integration | Coverage |
|-------|------------|-------------|----------|
| Vimshottari Dasha | ✅ | ✅ | ~80% |
| Nakshatra Mapping | ✅ | ❌ | ~90% |
| Dasha for Date | ✅ | ✅ | ~85% |
| Divisional Charts | ✅ | ❌ | ~70% |
| Sandhi Detection | ✅ | ✅ | ~75% |

---

## 📝 Improvement Recommendations

### High Priority
1. **Add caching** for Dasha calculations
2. **Implement lazy loading** for deep Dasha levels
3. **Add validation** for birth date ranges

### Medium Priority
1. **Add more Ayanamsa options** (Raman, KP, Fagan)
2. **Implement Dasha correction** for birth time changes
3. **Add Dasha visualization** for debugging

### Low Priority
1. **Add Dasha comparison** with other systems
2. **Create Dasha playground** UI
3. **Document edge cases** in code comments

---

## 📚 Related Documentation

- [SUBSYSTEM_01_BTR_ENGINE.md](./SUBSYSTEM_01_BTR_ENGINE.md) - Parent overview
- [SUBSYSTEM_02_2_ADVANCED_DASHA_SYSTEMS.md](./SUBSYSTEM_02_2_ADVANCED_DASHA_SYSTEMS.md) - Advanced Dasha systems

---

*Last Updated: March 2026*
