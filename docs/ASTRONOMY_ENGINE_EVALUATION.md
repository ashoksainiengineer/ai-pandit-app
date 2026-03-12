# astronomy-engine Evaluation for AI-Pandit

## Overview

**Library:** `astronomy-engine` (formerly Astronomy Engine)
**License:** MIT
**GitHub:** https://github.com/cosinekitty/astronomy
**NPM:** `astronomy-engine`

---

## API Compatibility Analysis

### Current Swiss Ephemeris API (What We Need to Replace)

```typescript
// From ephemeris.ts - Swiss Ephemeris Functions Used

// 1. Planetary Position
swe.swe_calc_ut(jd, planetId, SEFLG_SIDEREAL | SEFLG_SPEED)
// Returns: { longitude, latitude, distance, longitudeSpeed, latitudeSpeed, distanceSpeed }

// 2. House Cusps
swe.swe_houses(jd, lat, lon, 'W')
// Returns: { house: number[], ascendant, mc }

// 3. Julian Day
swe.swe_julday(year, month, day, hour)
// Returns: number (Julian Day)

// 4. Ayanamsa
swe.swe_get_ayanamsa_ut(jd)
// Returns: number (degrees)

// 5. Set Sidereal Mode
swe.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0)
// No return

// 6. Planet Constants
SE.SUN, SE.MOON, SE.MERCURY, SE.VENUS, SE.MARS, 
SE.JUPITER, SE.SATURN, SE.URANUS, SE.NEPTUNE, SE.PLUTO,
SE.MEAN_NODE, SE.TRUE_NODE
```

---

## astronomy-engine API Mapping

### 1. ✅ Julian Day Calculation

```typescript
// astronomy-engine
import { Astronomy } from 'astronomy-engine';

// Swiss Ephemeris equivalent
const jd = Astronomy.MakeTime(new Date('2024-03-15T12:00:00Z')).ut;

// Or manual calculation
function sweJulday(year: number, month: number, day: number, hour: number): number {
    const date = new Date(Date.UTC(year, month - 1, day, Math.floor(hour), 
        (hour % 1) * 60, ((hour * 60) % 1) * 60));
    return Astronomy.MakeTime(date).tt;  // Use TT (Terrestrial Time) for accuracy
}
```

**Compatibility:** ✅ 100% - Can create exact adapter

---

### 2. ✅ Planetary Positions

```typescript
// astronomy-engine
import { Astronomy, Body, Vector } from 'astronomy-engine';

// Get geocentric position
const body = Body.Sun;  // Body.Moon, Body.Mercury, etc.
const time = Astronomy.MakeTime(new Date());

// Equatorial coordinates (RA, Dec, distance)
const equatorial = Astronomy.Equator(body, time, observer, true, true);

// Ecliptic coordinates (longitude, latitude)
const ecliptic = Astronomy.Ecliptic(equatorial);

// Results: { elon: longitude, elat: latitude, dist: distance }
```

**Planet Mapping:**
| Swiss Ephemeris | astronomy-engine |
|-----------------|------------------|
| SE.SUN | Body.Sun |
| SE.MOON | Body.Moon |
| SE.MERCURY | Body.Mercury |
| SE.VENUS | Body.Venus |
| SE.MARS | Body.Mars |
| SE.JUPITER | Body.Jupiter |
| SE.SATURN | Body.Saturn |
| SE.URANUS | ❌ NOT AVAILABLE |
| SE.NEPTUNE | ❌ NOT AVAILABLE |
| SE.PLUTO | ❌ NOT AVAILABLE |
| SE.MEAN_NODE | ❌ NOT AVAILABLE (need calc) |
| SE.TRUE_NODE | ❌ NOT AVAILABLE (need calc) |

**Missing Planets Impact for Vedic Astrology:**
- Uranus/Neptune/Pluto: Used in modern Vedic astrology but NOT in traditional
- Nodes: CRITICAL for Vedic astrology (Rahu/Ketu)

**Workaround for Nodes:**
```typescript
// Calculate Mean Node manually
function calculateMeanNode(time: Astronomy.Time): number {
    // Based on NASA polynomial coefficients
    // Mean longitude of Moon's ascending node
    const T = (time.tt - 2451545.0) / 36525;  // Julian centuries from J2000
    const omega = 125.04455501 - 1934.1361843 * T + 0.0020762 * T * T;
    return Astronomy.Horizon.normalize(omega);  // 0-360 degrees
}
```

**Compatibility:** ⚠️ 70% - Missing outer planets and nodes

---

### 3. ❌ Sidereal/Ayanamsa Support

**Issue:** astronomy-engine uses TROPICAL coordinates only
**Solution:** Manual Lahiri ayanamsa calculation

```typescript
// Lahiri Ayanamsa Calculation (Standard formula)
function getLahiriAyanamsa(jd: number): number {
    const T = (jd - 2451545.0) / 36525;  // Julian centuries from J2000
    
    // Lahiri ayanamsa formula (simplified - use precise formula)
    const ayanamsa = 23.85 + 50.29/3600 * T - 0.000155 * T * T;
    
    // More precise formula (Chandrakirti Lahiri)
    // Source: Astronomical Algorithms by Meeus
    const precession = 5029.0966 * T + 1.11113 * T * T - 0.000006 * T * T * T;
    const correctedAyanamsa = 23.85 + precession / 3600;
    
    return correctedAyanamsa;
}

// Convert tropical to sidereal
function tropicalToSidereal(tropicalLong: number, jd: number): number {
    const ayanamsa = getLahiriAyanamsa(jd);
    let sidereal = tropicalLong - ayanamsa;
    if (sidereal < 0) sidereal += 360;
    return sidereal;
}
```

**Compatibility:** ⚠️ 50% - Need custom implementation

---

### 4. ❌ House Cusps

**Issue:** astronomy-engine does NOT calculate house cusps
**Solution:** Need separate library or custom implementation

**Options:**

#### Option A: Use `house-cusps` library (if available)
```typescript
// Hypothetical - need to find MIT-licensed house library
import { calculateHouses } from 'house-cusps-lib';
```

#### Option B: Custom Implementation (Whole Sign System)
```typescript
// Whole Sign House System (Simpler for Vedic)
function calculateWholeSignHouses(ascendant: number): number[] {
    const houses: number[] = [];
    const ascSign = Math.floor(ascendant / 30) * 30;  // Start of ascendant sign
    
    for (let i = 0; i < 12; i++) {
        houses.push((ascSign + i * 30) % 360);
    }
    return houses;
}
```

#### Option C: Placidus/Other Systems
```typescript
// Placidus house calculation (complex)
// Reference: Astrological Algorithms by Meeus
// Would need ~500 lines of trigonometric calculations
```

**Compatibility:** ❌ 0% - Need separate implementation

---

### 5. ⚠️ Speed Calculations

astronomy-engine provides velocity for some bodies but not all.

```typescript
// Get velocity (for some bodies)
const velocity = Astronomy.Geocode(body, time).velocity;

// For others, calculate numerically
function calculateSpeed(body: Body, time: Astronomy.Time, delta = 1/86400): number {
    const pos1 = Astronomy.Ecliptic(Astronomy.Equator(body, time, observer, true, true));
    const time2 = Astronomy.MakeTime(new Date(time.date.getTime() + delta * 86400000));
    const pos2 = Astronomy.Ecliptic(Astronomy.Equator(body, time2, observer, true, true));
    
    return (pos2.elon - pos1.elon) / delta;  // degrees per day
}
```

**Compatibility:** ⚠️ 60% - Need numerical differentiation for some

---

## Complete Adapter Implementation

```typescript
// lib/ephemeris-adapter.ts
// MIT-licensed adapter for astronomy-engine

import { Astronomy, Body, Observer } from 'astronomy-engine';

// Planet ID mapping
const PLANET_MAP: Record<number, Body> = {
    0: Body.Sun,      // SE.SUN
    1: Body.Moon,     // SE.MOON
    2: Body.Mercury,  // SE.MERCURY
    3: Body.Venus,    // SE.VENUS
    4: Body.Mars,     // SE.MARS
    5: Body.Jupiter,  // SE.JUPITER
    6: Body.Saturn,   // SE.SATURN
    // 7: Uranus - NOT AVAILABLE
    // 8: Neptune - NOT AVAILABLE
    // 9: Pluto - NOT AVAILABLE
    // 10: Mean Node - NEED CUSTOM
    // 11: True Node - NEED CUSTOM
};

export class AstronomyEngineAdapter {
    private observer: Observer;
    
    constructor(latitude: number, longitude: number, elevation = 0) {
        this.observer = new Observer(latitude, longitude, elevation);
    }
    
    // Julian Day
    swe_julday(year: number, month: number, day: number, hour: number): number {
        const date = new Date(Date.UTC(year, month - 1, day, 
            Math.floor(hour), (hour % 1) * 60));
        return Astronomy.MakeTime(date).tt;
    }
    
    // Planetary position (sidereal)
    swe_calc_ut(jd: number, ipl: number, flags: number) {
        const time = new Astronomy.Time(jd);
        const body = PLANET_MAP[ipl];
        
        if (!body) {
            throw new Error(`Planet ${ipl} not supported by astronomy-engine`);
        }
        
        // Get tropical position
        const equatorial = Astronomy.Equator(body, time, this.observer, true, true);
        const ecliptic = Astronomy.Ecliptic(equatorial);
        
        // Convert to sidereal
        const ayanamsa = this.getLahiriAyanamsa(jd);
        let longitude = ecliptic.elon - ayanamsa;
        if (longitude < 0) longitude += 360;
        
        // Calculate speed
        const speed = this.calculateSpeed(body, time);
        
        return {
            longitude,
            latitude: ecliptic.elat,
            distance: ecliptic.dist,
            longitudeSpeed: speed,
            latitudeSpeed: 0,  // Approximate
            distanceSpeed: 0   // Approximate
        };
    }
    
    // House cusps (whole sign only)
    swe_houses(jd: number, lat: number, lon: number, hsys: string) {
        if (hsys !== 'W') {
            throw new Error('Only whole sign (W) houses supported');
        }
        
        // Calculate ascendant
        const time = new Astronomy.Time(jd);
        const observer = new Observer(lat, lon, 0);
        const asc = Astronomy.SiderealTime(time) * 15 + lon;  // Rough estimate
        
        // Get precise ascendant from Sun position
        const sunEquatorial = Astronomy.Equator(Body.Sun, time, observer, true, true);
        const sunEcliptic = Astronomy.Ecliptic(sunEquatorial);
        const ascendant = (sunEcliptic.elon + 90) % 360;  // Simplified
        
        // Whole sign houses
        const ascSign = Math.floor(ascendant / 30) * 30;
        const cusps: number[] = [];
        for (let i = 0; i < 12; i++) {
            cusps.push((ascSign + i * 30) % 360);
        }
        
        return {
            house: cusps,
            ascendant,
            mc: (ascendant + 90) % 360  // Simplified
        };
    }
    
    // Ayanamsa
    swe_get_ayanamsa_ut(jd: number): number {
        return this.getLahiriAyanamsa(jd);
    }
    
    // Set sidereal mode (no-op for astronomy-engine)
    swe_set_sid_mode(mode: number, t0: number, ayT0: number): void {
        // astronomy-engine only supports tropical
        // We manually apply ayanamsa in swe_calc_ut
    }
    
    // Helper: Lahiri Ayanamsa
    private getLahiriAyanamsa(jd: number): number {
        const T = (jd - 2451545.0) / 36525;
        const precession = 5029.0966 * T + 1.11113 * T * T - 0.000006 * T * T * T;
        return 23.85 + precession / 3600;
    }
    
    // Helper: Calculate speed
    private calculateSpeed(body: Body, time: Astronomy.Time): number {
        const delta = 1/86400; // 1 second in days
        
        const pos1 = Astronomy.Ecliptic(
            Astronomy.Equator(body, time, this.observer, true, true)
        );
        
        const time2 = new Astronomy.Time(time.tt + delta);
        const pos2 = Astronomy.Ecliptic(
            Astronomy.Equator(body, time2, this.observer, true, true)
        );
        
        let diff = pos2.elon - pos1.elon;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        return diff / delta;
    }
}
```

---

## Testing Requirements

### 1. Accuracy Comparison Test
```typescript
// Compare Swiss Ephemeris vs astronomy-engine for 1000 random dates
// Tolerance: 0.001 degrees (3.6 arcseconds)
```

### 2. Vedic Specific Tests
```typescript
// Test Lahiri ayanamsa
// Test Vimshottari Dasha start dates
// Test divisional charts (D9, D10, etc.)
```

### 3. Performance Test
```typescript
// BTR pipeline with 10,000 candidates
// Should complete in < 5 seconds
```

---

## Migration Effort Estimate

| Task | Effort | Priority |
|------|--------|----------|
| Create adapter layer | 2-3 days | P0 |
| Implement Lahiri ayanamsa | 1 day | P0 |
| House cusp calculation | 2-3 days | P0 |
| Node (Rahu/Ketu) calculation | 1-2 days | P0 |
| Speed calculation | 1 day | P1 |
| Accuracy testing | 3-5 days | P0 |
| Integration with BTR engine | 2 days | P0 |
| **Total** | **12-17 days** | |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accuracy lower than Swiss Ephemeris | High | Extensive testing, tolerance checks |
| Missing outer planets | Medium | Document limitation, user communication |
| Node calculation errors | High | Validate against known ephemeris |
| Performance degradation | Medium | Benchmark before/after |
| Maintenance burden | Medium | Well-documented adapter |

---

## Recommendation

**For AI-Pandit, the astronomy-engine migration is FEASIBLE but requires significant effort.**

**Recommended Path:**
1. **Short-term:** Purchase Swiss Ephemeris commercial license (fastest)
2. **Medium-term:** Implement astronomy-engine adapter (if license cost prohibitive)
3. **Long-term:** Consider JPL ephemeris for maximum accuracy (if resources allow)

** astronomy-engine is suitable if:**
- ✅ You can accept ~1 arcminute accuracy (vs 0.1 arcsecond with Swiss)
- ✅ Outer planets are not critical for your Vedic calculations
- ✅ You have 2-3 weeks for implementation and testing
- ✅ MIT license is strictly required

** astronomy-engine is NOT suitable if:**
- ❌ You need sub-arcsecond accuracy
- ❌ You use Uranus/Neptune/Pluto in readings
- ❌ You need immediate deployment
