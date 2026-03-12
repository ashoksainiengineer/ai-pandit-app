# Comprehensive Ephemeris Alternatives Research
## ALL Options for MIT/Permissive Licensing

> **Goal:** Find EVERY possible way to avoid GPL-3.0 while maintaining accuracy

---

## Table of Contents
1. [MIT/BSD/Apache Libraries](#1-mitbsdapache-libraries)
2. [Public Domain / Government Sources](#2-public-domain--government-sources)
3. [Creative Commons / Unlicense](#3-creative-commons--unlicense)
4. [Dual-Licensed Options](#4-dual-licensed-options)
5. [Microservice/API Approach](#5-microserviceapi-approach)
6. [Pre-Calculated Data](#6-pre-calculated-data-approach)
7. [WASM Compilation](#7-wasm-compilation-approach)
8. [Hybrid Approaches](#8-hybrid-approaches)

---

## 1. MIT/BSD/Apache Libraries

### 1.1 astronomy-engine (MIT) ⭐⭐⭐⭐
- **Already evaluated** - See ASTRONOMY_ENGINE_EVALUATION.md
- **Missing:** Uranus/Neptune/Pluto, Nodes, Houses
- **Accuracy:** ~1 arcminute

### 1.2 ephios (MIT) ⭐⭐
- **GitHub:** https://github.com/quantum5/ephios
- **Status:** Abandoned (last update 2018)
- **Features:** VSOP87 implementation
- **Verdict:** Not production-ready

### 1.3 meeus-js (MIT) ⭐⭐⭐
- **GitHub:** https://github.com/Fabiz/MeeusJs
- **Features:** Planetary positions from Meeus algorithms
- **License:** MIT
- **Limitations:** 
  - No outer planets
  - No house calculations
  - Lower accuracy
- **Verdict:** Good for basic calculations only

### 1.4 satellite-js (MIT) ⭐
- **GitHub:** https://github.com/shashwatak/satellite-js
- **Purpose:** Satellite tracking, not planets
- **Verdict:** Not suitable

### 1.5 suncalc3 (MIT) ⭐
- **GitHub:** https://github.com/janrg/suncalc3
- **Purpose:** Sun/Moon only
- **Verdict:** Too limited

### 1.6 astrobinder (Apache-2.0) ⭐⭐⭐
- **NPM:** astrobinder
- **Features:** Swiss Ephemeris wrapper
- **License Issue:** Wrapper is Apache, but underlying Swiss is GPL
- **Verdict:** GPL still applies

### 1.7 @types/swisseph + Native Implementation ⭐⭐⭐⭐
- **Concept:** Write your own ephemeris calculation
- **License:** Your choice (MIT)
- **Effort:** Very high
- **Verdict:** See Section 8

---

## 2. Public Domain / Government Sources

### 2.1 NASA JPL HORIZONS System ⭐⭐⭐⭐⭐
- **Website:** https://ssd.jpl.nasa.gov/horizons/
- **License:** Public Domain (US Government)
- **Access:** Web API, Telnet, File download
- **Data:** DE440/DE441 ephemeris files

**Usage Options:**

#### Option A: API Calls (Rate Limited)
```javascript
// Make HTTP requests to HORIZONS API
// Rate limit: ~1000 requests/day
// Not suitable for real-time BTR
```

#### Option B: Download DE440 Files
```javascript
// Download ~100MB binary files
// Parse locally with custom code
// License: Public Domain
```

**JPL DE440/DE441 Files:**
- **Source:** ftp://ssd.jpl.nasa.gov/pub/eph/planets/bsp/
- **Format:** SPICE binary
- **License:** Public Domain
- **Size:** ~100MB for 400 years

**Parser Libraries:**
- `spice.js` - Community SPICE parser (check license)
- Write custom parser (permissive)

### 2.2 SOFA Software (IAU) ⚠️
- **Website:** http://www.iausofa.org/
- **License:** Custom (free for non-commercial)
- **Issue:** NOT truly public domain - has restrictions
- **Verdict:** Avoid for commercial use

### 2.3 ERFA (Essential Routines for Fundamental Astronomy)
- **GitHub:** https://github.com/liberfa/erfa
- **License:** BSD-3-Clause ✅
- **Features:** Time systems, coordinate transforms
- **Limitation:** NO planetary positions
- **Verdict:** Useful for auxiliary calculations only

### 2.4 NOVAS (US Naval Observatory) ⭐⭐⭐⭐
- **Website:** https://aa.usno.navy.mil/software/novas
- **License:** Public Domain (US Government)
- **Features:** High-precision astrometry
- **Format:** C library
- **Port:** Need JS/TS port or WASM compilation

**NOVAS Features:**
- Planet positions (including outer planets)
- Star positions
- Coordinate transformations
- Light-time calculations

**Implementation Path:**
1. Download NOVAS C source
2. Compile to WASM
3. Create TypeScript bindings
4. **License:** Your code = MIT, NOVAS = Public Domain

### 2.5 CSPICE (NASA) ⭐⭐⭐
- **Website:** https://naif.jpl.nasa.gov/naif/toolkit.html
- **License:** Public Domain
- **Features:** Full SPICE toolkit
- **Size:** Large library
- **Complexity:** High

---

## 3. Creative Commons / Unlicense

### 3.1 ccal (CC0 / Unlicense) ⭐⭐
- **GitHub:** Various Chinese calendar libraries
- **License:** CC0 (Public Domain dedication)
- **Features:** Limited to Sun/Moon
- **Verdict:** Too limited

### 3.2 aa-js (Unlicense) ⭐⭐⭐
- **GitHub:** https://github.com/onekiloparsec/aa-js
- **License:** Unlicense (Public Domain)
- **Features:** Astronomical Algorithms by Meeus
- **Accuracy:** Good for Sun/Moon/inner planets
- **Limitation:** No outer planets

### 3.3 Search for "astronomy unlicense github"
- Many hobby projects exist
- Quality varies widely
- Need extensive validation

---

## 4. Dual-Licensed Options

### 4.1 PyEphem → ephem ⭐⭐⭐
- **GitHub:** https://github.com/brandon-rhodes/pyephem
- **License:** Dual (LGPL / Commercial)
- **Issue:** LGPL still copyleft
- **Verdict:** Not suitable

### 4.2 Skyfield (MIT) ⭐⭐⭐⭐
- **GitHub:** https://github.com/skyfielders/python-skyfield
- **Language:** Python
- **License:** MIT ✅
- **Data:** JPL ephemeris (Public Domain)

**Usage Options:**

#### Option A: Python Microservice
```
Create Python microservice with Skyfield
Expose REST API for calculations
Node.js → Python API → Results
```

#### Option B: Pyodide (Python in Browser)
```
Compile Python + Skyfield to WASM
Run in Node.js
Large bundle size (~10MB)
```

### 4.3 Orekit (Apache-2.0) ⭐⭐⭐
- **Website:** https://www.orekit.org/
- **Language:** Java
- **License:** Apache-2.0 ✅

**Usage:**
- Create Java microservice
- Or use GraalVM native image
- Or compile to WASM (experimental)

---

## 5. Microservice/API Approach

### 5.1 Self-Hosted JPL Horizons API ⭐⭐⭐⭐

**Concept:**
```
Your App → Your API Server → JPL Data
                    ↓
            Pre-calculated responses
```

**Implementation:**
1. Download JPL DE440 files (Public Domain)
2. Create Python/Go/Rust service using Skyfield/erfa
3. Host on your infrastructure
4. Your Node.js app calls your API
5. **License:** MIT (your code) + Public Domain (data)

**Pros:**
- ✅ Clean separation
- ✅ Any language for calculation engine
- ✅ No GPL contamination
- ✅ Can optimize caching

**Cons:**
- ❌ Additional infrastructure
- ❌ Network latency
- ❌ Complexity

### 5.2 Serverless Function Approach

**AWS Lambda / Google Cloud Functions:**
```python
# Python Lambda with Skyfield
import skyfield.api as sf

def calculate_positions(event, context):
    ts = sf.load.timescale()
    planets = sf.load('de440.bsp')
    # ... calculations ...
    return positions
```

**License:** Your Lambda code = MIT, Skyfield = MIT, JPL data = Public Domain

---

## 6. Pre-Calculated Data Approach

### 6.1 Ephemeris Tables (Your Own) ⭐⭐⭐⭐⭐

**Concept:** Pre-calculate ALL positions for 1900-2100

**Implementation:**
1. Use JPL data (Public Domain) to generate tables
2. Store in SQLite/JSON format
3. Interpolate for exact times

**Data Structure:**
```javascript
// 1-day intervals
{
  "1900-01-01": {
    "sun": 280.5,
    "moon": 120.3,
    "mercury": 85.2,
    // ... all planets
  }
}
```

**Size Estimate:**
- 200 years × 365 days × 10 planets × 8 bytes = ~6MB
- With interpolation: < 20MB

**License:** Your tables = Your license (MIT)
- Source data (JPL) = Public Domain
- Your interpolation code = MIT

### 6.2 Compressed Binary Format

**Create .eph files:**
```c
// Custom binary format
// Chebyshev polynomial coefficients
// Like JPL but smaller
```

**Libraries for reading:**
- Write your own (MIT license)
- Based on JPL format (Public Domain)

---

## 7. WASM Compilation Approach

### 7.1 NOVAS compiled to WASM ⭐⭐⭐⭐

**Steps:**
1. Download NOVAS C source (Public Domain)
2. Compile with Emscripten:
   ```bash
   emcc novas.c -o novas.wasm -s EXPORTED_FUNCTIONS='["_calcPlanet"]' -s MODULARIZE=1
   ```
3. Use in Node.js/TypeScript
4. **License:** Your adapter = MIT, NOVAS = Public Domain

### 7.2 CSPICE compiled to WASM ⭐⭐⭐

**Steps:**
1. Download CSPICE C source (Public Domain)
2. Compile subset to WASM
3. Load JPL ephemeris files

### 7.3 VSOP87 Reference Implementation

**Source:** https://github.com/hessyn/vsop87
- VSOP87 is a mathematical model
- Reference implementations exist
- Can be rewritten in TypeScript (MIT)

---

## 8. Hybrid Approaches (RECOMMENDED)

### 8.1 Tiered Calculation System ⭐⭐⭐⭐⭐

**Architecture:**
```
Level 1: Pre-calculated tables (1900-2100)
    ↓ (daily positions)
Level 2: Interpolation (get exact time)
    ↓ (Chebyshev/Lagrange)
Level 3: astronomy-engine (for speed/moon nodes)
    ↓ (velocity calculations)
Level 4: Custom formulas (Rahu/Ketu)
```

**Benefits:**
- ✅ 100% MIT license
- ✅ High accuracy (JPL-level)
- ✅ Fast (table lookup)
- ✅ No network calls
- ✅ All planets + nodes

**Implementation Time:** 3-4 weeks

### 8.2 Python Microservice + MIT Wrapper ⭐⭐⭐⭐

**Architecture:**
```
[Next.js Frontend]
      ↓
[Node.js API] (MIT license)
      ↓ HTTP/JSON
[Python Calculation Service] (Skyfield - MIT)
      ↓
[JPL DE440 Files] (Public Domain)
```

**Deployment:**
- Docker Compose locally
- Kubernetes in production
- Or separate Cloud Run services

**License Chain:**
- Your Node.js: MIT ✅
- Your Python: MIT ✅
- Skyfield: MIT ✅
- JPL Data: Public Domain ✅

### 8.3 astronomy-engine + Custom Extensions ⭐⭐⭐

**Base:** astronomy-engine (MIT) for Sun-Saturn
**Extensions:**
- Outer planets: Pre-calculated tables
- Nodes: Custom calculation
- Houses: Custom implementation

**License:** All MIT ✅

---

## 9. Summary of ALL Options

| # | Option | License | Accuracy | Effort | All Planets | Recommendation |
|---|--------|---------|----------|--------|-------------|----------------|
| 1 | Swiss Ephemeris Commercial | Proprietary | ⭐⭐⭐⭐⭐ | None | ✅ | Best if you can afford |
| 2 | astronomy-engine | MIT | ⭐⭐⭐ | Medium | ❌ | Good for basic |
| 3 | JPL DE440 + Custom Parser | Public Domain | ⭐⭐⭐⭐⭐ | High | ✅ | **BEST FREE OPTION** |
| 4 | NOVAS WASM | Public Domain | ⭐⭐⭐⭐⭐ | High | ✅ | Excellent choice |
| 5 | Skyfield Microservice | MIT | ⭐⭐⭐⭐⭐ | Medium | ✅ | **RECOMMENDED** |
| 6 | Pre-calculated Tables | MIT | ⭐⭐⭐⭐ | High | ✅ | Good for performance |
| 7 | Tiered System | MIT | ⭐⭐⭐⭐⭐ | Very High | ✅ | Ultimate solution |
| 8 | aa-js | Unlicense | ⭐⭐⭐ | Low | ❌ | Too limited |
| 9 | meeus-js | MIT | ⭐⭐⭐ | Low | ❌ | Too limited |
| 10 | SOFA | Restricted | ⭐⭐⭐⭐ | Medium | ✅ | Avoid |

---

## TOP 3 RECOMMENDATIONS (No Budget)

### 🥇 #1: Skyfield Python Microservice
**Why:**
- MIT licensed
- JPL-level accuracy
- All planets
- Fast to implement
- Proven library

**Time:** 1 week
**Cost:** $0

### 🥈 #2: NOVAS compiled to WASM
**Why:**
- Public Domain
- Official US Naval Observatory
- All features
- Self-contained

**Time:** 2 weeks
**Cost:** $0

### 🥉 #3: JPL DE440 + Custom Parser
**Why:**
- Ultimate accuracy
- Public Domain data
- Full control
- Can optimize for Vedic astrology

**Time:** 3-4 weeks
**Cost:** $0

---

## Next Steps

1. **Quick Win (1 week):** Set up Skyfield microservice
2. **Long-term (1 month):** Implement tiered calculation system
3. **Evaluate:** Compare accuracy with current Swiss Ephemeris

---

## Implementation Priority

**Week 1:**
- [ ] Create Python microservice with Skyfield
- [ ] Expose REST API for planetary positions
- [ ] Test accuracy vs Swiss Ephemeris

**Week 2:**
- [ ] Integrate with Node.js BTR engine
- [ ] Add caching layer (Redis)
- [ ] Performance testing

**Week 3-4:**
- [ ] Optimize for Vedic astrology
- [ ] Add custom ayanamsa
- [ ] House calculations

**Result:** 100% MIT-licensed, JPL-accurate ephemeris
