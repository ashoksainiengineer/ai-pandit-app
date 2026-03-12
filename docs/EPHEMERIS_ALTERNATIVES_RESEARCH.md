# Ephemeris Library Alternatives Research

## Current Swiss Ephemeris Usage Analysis

### Functions Used from `swisseph-wasm`:
1. `swe_calc_ut(jd, planetId, flags)` - Planetary positions
2. `swe_houses(jd, lat, lon, hsys)` - House cusps
3. `swe_julday(y, m, d, h)` - Julian Day calculation
4. `swe_get_ayanamsa_ut(jd)` - Ayanamsa calculation
5. `swe_set_sid_mode(mode, t0, ayT0)` - Set sidereal mode (Lahiri)
6. SE constants (SE.SUN, SE.MOON, etc.)
7. SEFLG flags (SEFLG_SIDEREAL, SEFLG_SPEED)

### Requirements for Vedic Astrology:
- **High precision** - Birth time rectification needs seconds-level accuracy
- **Sidereal calculations** - Lahiri ayanamsa support
- **Full planetary set** - Sun through Pluto + Nodes + Uranus/Neptune
- **House systems** - Whole sign (W) support
- **Speed calculations** - For dasha calculations
- **Date range** - 1900-2100+ support

---

## MIT-Licensed Alternatives

### Option 1: `astronomy-engine` (MIT License) ⭐ Best Option

**GitHub:** https://github.com/cosinekitty/astronomy
**License:** MIT
**Features:**
- ✅ High precision (sub-arcsecond accuracy)
- ✅ Geocentric positions
- ✅ Heliocentric positions
- ✅ All major planets + Moon
- ✅ Julian Day calculations
- ✅ Sidereal time (can derive ayanamsa)
- ✅ Written in C, JS/TS bindings available
- ✅ Active maintenance
- ✅ Good documentation

**Limitations:**
- ❌ No built-in ayanamsa calculations (need to implement)
- ❌ No house cusp calculations (need separate library)
- ❌ No Uranus/Neptune/Pluto support (up to Saturn only)
- ❌ No sidereal mode switching

**Migration Effort:** Medium
**Vedic Compatibility:** 70% - Need to add ayanamsa + houses

---

### Option 2: `ephios` (MIT License)

**GitHub:** https://github.com/quantum5/ephios
**License:** MIT
**Features:**
- ✅ VSOP87 ephemeris (high precision)
- ✅ All planets
- ✅ Julian Day calculations

**Limitations:**
- ❌ Limited TypeScript support
- ❌ No house calculations
- ❌ No sidereal support
- ❌ Less active development

**Migration Effort:** High
**Vedic Compatibility:** 60%

---

### Option 3: `meeus` (MIT License)

**GitHub:** Various implementations
**License:** MIT
**Features:**
- ✅ Based on "Astronomical Algorithms" by Meeus
- ✅ Good accuracy for most planets
- ✅ Simple implementation

**Limitations:**
- ❌ Lower accuracy than Swiss Ephemeris
- ❌ No outer planets (Uranus/Neptune/Pluto)
- ❌ Manual implementation required
- ❌ No house calculations

**Migration Effort:** High
**Vedic Compatibility:** 50%

---

### Option 4: `flat-ephemeris` (MIT License)

**Concept:** Pre-calculated ephemeris tables
**License:** MIT (if using JPL data)

**Features:**
- ✅ Very fast lookups
- ✅ No calculation overhead
- ✅ Deterministic results

**Limitations:**
- ❌ Large file size (~100MB for 200 years)
- ❌ Fixed date range
- ❌ Need interpolation for sub-day precision
- ❌ Storage requirements

**Migration Effort:** Medium
**Vedic Compatibility:** 80%

---

### Option 5: JPL Ephemeris (Public Domain)

**Source:** NASA JPL
**License:** Public Domain (US Government work)
**Features:**
- ✅ Most accurate available
- ✅ DE440/DE441 files
- ✅ Full planetary support

**Limitations:**
- ❌ Complex file format
- ❌ Large binary files (100MB+)
- ❌ Need custom parser
- ❌ No high-level API

**Migration Effort:** Very High
**Vedic Compatibility:** 90% (with custom implementation)

---

### Option 6: Custom VSOP87/ELP2000 Implementation (MIT License)

**Concept:** Implement planetary theories from scratch
**License:** Your choice (MIT recommended)

**Features:**
- ✅ Full control over accuracy
- ✅ No external dependencies
- ✅ Minimal bundle size
- ✅ Can optimize for Vedic astrology

**Limitations:**
- ❌ Very high implementation effort
- ❌ Months of development time
- ❌ Need extensive testing
- ❌ Mathematical complexity

**Migration Effort:** Very High
**Vedic Compatibility:** 100% (customizable)

---

## Recommendations

### For Quick Migration (Commercial Use):
**Option: `astronomy-engine` + Custom House Library**

```
Plan:
1. Use astronomy-engine for planetary positions
2. Implement Lahiri ayanamsa manually (formula available)
3. Use `house-cusps` library or custom implementation for houses
4. Create adapter layer matching swisseph-wasm API
```

**Pros:**
- MIT licensed
- Good accuracy
- Active maintenance

**Cons:**
- Missing outer planets (Uranus/Neptune/Pluto)
- No built-in sidereal support

---

### For Best Vedic Astrology Support:
**Option: JPL Ephemeris + Custom Parser**

```
Plan:
1. Download JPL DE440/DE441 files
2. Implement binary file parser
3. Add interpolation for high precision
4. Implement ayanamsa calculations
5. Add house system calculations
```

**Pros:**
- Most accurate
- Public domain
- All planets supported

**Cons:**
- High implementation effort
- Large file sizes
- Complex mathematics

---

### For Minimal Changes:
**Option: Purchase Swiss Ephemeris Commercial License**

```
Cost: ~€500-2000 (estimated)
Contact: https://www.astro.com/swisseph/
```

**Pros:**
- Zero code changes
- Immediate compliance
- Best accuracy

**Cons:**
- License cost
- Annual renewal possible

---

## Migration Complexity Matrix

| Alternative | License | Accuracy | Vedic Support | Effort | Bundle Size |
|-------------|---------|----------|---------------|--------|-------------|
| Swiss Ephemeris | GPL-3.0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | None | ~2MB |
| astronomy-engine | MIT | ⭐⭐⭐⭐ | ⭐⭐⭐ | Medium | ~200KB |
| JPL Ephemeris | Public Domain | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Very High | ~100MB |
| Custom VSOP87 | MIT | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Very High | ~500KB |
| flat-ephemeris | MIT | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | ~100MB |

---

## Next Steps

1. **Evaluate astronomy-engine** - Test accuracy against Swiss Ephemeris
2. **Prototype adapter layer** - Create API-compatible wrapper
3. **Test Vedic calculations** - Verify Lahiri ayanamsa and house cusps
4. **Performance testing** - Ensure seconds-precision BTR still works
5. **Decision** - Choose migration path or purchase commercial license
