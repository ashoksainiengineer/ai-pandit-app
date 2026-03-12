# Skyfield Python Microservice Implementation Plan
## Recommended Solution (FREE + MIT Licensed)

---

## Why Skyfield?

1. **MIT License** ✅ - No GPL issues
2. **NASA JPL Data** ✅ - Public Domain, most accurate
3. **All Planets** ✅ - Sun through Pluto + Nodes
4. **Python** ✅ - Easy to write, fast to deploy
5. **Proven** ✅ - Used by professionals worldwide
6. **Active** ✅ - Maintained by Brandon Rhodes (ex-Planetary Science Institute)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI-Pandit System                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐        HTTP/JSON         ┌──────────────┐  │
│  │  Next.js     │  ═══════════════════════► │   Python     │  │
│  │  Frontend    │                           │  Microservice│  │
│  └──────────────┘                           └──────────────┘  │
│         │                                          │          │
│         ▼                                          ▼          │
│  ┌──────────────┐                           ┌──────────────┐  │
│  │  Express     │                           │   Skyfield   │  │
│  │  API (Node)  │◄═════════════════════════│   + JPL      │  │
│  └──────────────┘                           │   DE440      │  │
│         │                                   └──────────────┘  │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │  BTR Engine  │                                            │
│  │  (seconds-   │                                            │
│  │  precision)  │                                            │
│  └──────────────┘                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Create Python Microservice

**File:** `services/ephemeris/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install skyfield numpy fastapi uvicorn

# Download JPL ephemeris
RUN python -c "from skyfield.api import Loader; Load = Loader('./data'); Load('de440.bsp')"

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File:** `services/ephemeris/main.py`
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from skyfield.api import Loader, wgs84
from skyfield import almanac
import numpy as np
from typing import List, Dict
import math

app = FastAPI(title="AI-Pandit Ephemeris Service")

# Load JPL ephemeris
load = Loader('./data')
planets = load('de440.bsp')
ts = load.timescale()

# Planet mapping
PLANETS = {
    'sun': planets['sun'],
    'moon': planets['moon'],
    'mercury': planets['mercury'],
    'venus': planets['venus'],
    'mars': planets['mars'],
    'jupiter': planets['jupiter barycenter'],
    'saturn': planets['saturn barycenter'],
    'uranus': planets['uranus barycenter'],
    'neptune': planets['neptune barycenter'],
    'pluto': planets['pluto barycenter'],
}

# Earth for geocentric calculations
earth = planets['earth']

class PositionRequest(BaseModel):
    date: str  # ISO format: "2024-03-15T12:00:00Z"
    latitude: float
    longitude: float
    altitude: float = 0

class PlanetPosition(BaseModel):
    name: str
    longitude: float
    latitude: float
    distance: float
    speed: float

class HousesRequest(BaseModel):
    date: str
    latitude: float
    longitude: float
    house_system: str = "W"  # W = Whole Sign

@app.get("/health")
async def health():
    return {"status": "ok", "ephemeris_loaded": True}

@app.post("/positions", response_model=List[PlanetPosition])
async def get_positions(request: PositionRequest):
    """Get all planetary positions (tropical)"""
    try:
        # Parse date
        t = ts.utc(request.date)
        
        # Observer location
        observer = earth + wgs84.latlon(
            request.latitude, 
            request.longitude, 
            request.altitude
        )
        
        positions = []
        
        for name, planet in PLANETS.items():
            # Geocentric apparent position
            astrometric = observer.at(t).observe(planet)
            apparent = astrometric.apparent()
            
            # Ecliptic coordinates
            lat, lon, distance = apparent.ecliptic_latlon(epoch=None)
            
            # Calculate speed (degrees per day)
            t2 = ts.utc(t.utc_iso()[:19] + 'Z')  # 1 second later
            astrometric2 = observer.at(t2).observe(planet)
            apparent2 = astrometric2.apparent()
            lat2, lon2, _ = apparent2.ecliptic_latlon(epoch=None)
            
            # Handle wrap-around
            lon_diff = (lon2.degrees - lon.degrees)
            if lon_diff > 180:
                lon_diff -= 360
            elif lon_diff < -180:
                lon_diff += 360
            
            speed = lon_diff * 86400  # Convert to degrees/day
            
            positions.append(PlanetPosition(
                name=name,
                longitude=lon.degrees,
                latitude=lat.degrees,
                distance=distance.au,
                speed=speed
            ))
        
        # Calculate Mean Node (Rahu)
        mean_node_lon = calculate_mean_node(t)
        
        positions.append(PlanetPosition(
            name='mean_node',
            longitude=mean_node_lon,
            latitude=0,
            distance=0,
            speed=-0.053  # Approximate
        ))
        
        # Calculate True Node
        true_node_lon = calculate_true_node(t)
        positions.append(PlanetPosition(
            name='true_node',
            longitude=true_node_lon,
            latitude=0,
            distance=0,
            speed=-0.053
        ))
        
        return positions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_mean_node(t):
    """Calculate mean lunar ascending node longitude"""
    # Julian centuries from J2000
    jd = t.tt
    T = (jd - 2451545.0) / 36525
    
    # Mean longitude of ascending node (degrees)
    omega = 125.04455501 - 1934.1361843 * T + 0.0020762 * T * T + T**3 / 467410
    
    # Normalize to 0-360
    omega = omega % 360
    if omega < 0:
        omega += 360
    
    return omega

def calculate_true_node(t):
    """Calculate true lunar ascending node (simplified)"""
    # This is an approximation
    mean = calculate_mean_node(t)
    
    # Add nutation correction (simplified)
    jd = t.tt
    T = (jd - 2451545.0) / 36525
    
    # Mean elongation of moon
    D = 297.8502042 + 445267.1115168 * T - 0.0016300 * T * T + T**3 / 545868
    
    # Correction (simplified)
    correction = -1.5 * math.sin(math.radians(D))
    
    true_node = (mean + correction) % 360
    if true_node < 0:
        true_node += 360
    
    return true_node

@app.post("/sidereal-positions")
async def get_sidereal_positions(request: PositionRequest):
    """Get sidereal positions (Lahiri ayanamsa)"""
    try:
        t = ts.utc(request.date)
        
        # Calculate Lahiri ayanamsa
        ayanamsa = get_lahiri_ayanamsa(t.tt)
        
        # Get tropical positions
        tropical = await get_positions(request)
        
        # Convert to sidereal
        sidereal = []
        for pos in tropical:
            sidereal_lon = (pos.longitude - ayanamsa) % 360
            if sidereal_lon < 0:
                sidereal_lon += 360
            
            sidereal.append(PlanetPosition(
                name=pos.name,
                longitude=sidereal_lon,
                latitude=pos.latitude,
                distance=pos.distance,
                speed=pos.speed
            ))
        
        return {
            "ayanamsa": ayanamsa,
            "ayanamsa_name": "Lahiri (Chitrapaksha)",
            "positions": sidereal
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_lahiri_ayanamsa(jd):
    """Calculate Lahiri ayanamsa"""
    T = (jd - 2451545.0) / 36525
    
    # General precession in longitude (arcseconds)
    precession = 5029.0966 * T + 1.11113 * T * T - 0.000006 * T * T * T
    
    # Lahiri ayanamsa at J2000: 23.85 degrees
    # This is an approximation
    ayanamsa = 23.85 + precession / 3600
    
    return ayanamsa

@app.post("/houses")
async def get_houses(request: HousesRequest):
    """Calculate house cusps"""
    try:
        t = ts.utc(request.date)
        
        if request.house_system == "W":
            # Whole Sign System
            return calculate_whole_sign_houses(t, request.latitude, request.longitude)
        else:
            raise HTTPException(status_code=400, detail=f"House system {request.house_system} not implemented")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_whole_sign_houses(t, latitude, longitude):
    """Calculate whole sign house cusps"""
    
    # Calculate ascendant (simplified - should use proper formula)
    # For precise calculation, we'd need more complex trig
    
    # Get Sun position
    astrometric = earth.at(t).observe(planets['sun'])
    apparent = astrometric.apparent()
    _, sun_lon, _ = apparent.ecliptic_latlon(epoch=None)
    
    # Rough ascendant calculation (simplified)
    # Real implementation needs full astronomical formula
    sidereal_time = t.gast * 15  # Greenwich Apparent Sidereal Time in degrees
    ascendant = (sidereal_time + longitude + 90) % 360
    
    # Apply ayanamsa
    ayanamsa = get_lahiri_ayanamsa(t.tt)
    sidereal_asc = (ascendant - ayanamsa) % 360
    
    # Whole sign houses
    asc_sign = int(sidereal_asc / 30) * 30
    
    houses = []
    for i in range(12):
        cusp = (asc_sign + i * 30) % 360
        houses.append({
            "house": i + 1,
            "cusp": cusp
        })
    
    return {
        "system": "Whole Sign (W)",
        "ascendant": sidereal_asc,
        "houses": houses
    }

@app.post("/julian-day")
async def get_julian_day(date_str: str):
    """Convert ISO date to Julian Day"""
    try:
        t = ts.utc(date_str)
        return {
            "date": date_str,
            "julian_day_tt": t.tt,
            "julian_day_utc": t.utc_jpl()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Step 2: Create Node.js Client

**File:** `apps/api/src/lib/ephemeris-client.ts`
```typescript
// MIT Licensed Ephemeris Client
// Replaces swisseph-wasm with Skyfield microservice

import { logger } from './logger.js';

const EPHEMERIS_SERVICE_URL = process.env.EPHEMERIS_SERVICE_URL || 'http://localhost:8000';

export interface PlanetPosition {
    name: string;
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
}

export interface HouseCusp {
    house: number;
    cusp: number;
}

export interface HouseData {
    system: string;
    ascendant: number;
    houses: HouseCusp[];
}

export class EphemerisClient {
    private baseUrl: string;
    private cache: Map<string, any> = new Map();
    private cacheTTL: number = 60000; // 1 minute

    constructor(baseUrl = EPHEMERIS_SERVICE_URL) {
        this.baseUrl = baseUrl;
    }

    async getHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }

    async getSiderealPositions(
        date: Date,
        latitude: number,
        longitude: number
    ): Promise<{ ayanamsa: number; positions: PlanetPosition[] }> {
        const cacheKey = `sidereal_${date.toISOString()}_${latitude}_${longitude}`;
        
        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }

        const response = await fetch(`${this.baseUrl}/sidereal-positions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: date.toISOString(),
                latitude,
                longitude
            })
        });

        if (!response.ok) {
            throw new Error(`Ephemeris service error: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache result
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    async getHouses(
        date: Date,
        latitude: number,
        longitude: number,
        system = 'W'
    ): Promise<HouseData> {
        const response = await fetch(`${this.baseUrl}/houses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: date.toISOString(),
                latitude,
                longitude,
                house_system: system
            })
        });

        if (!response.ok) {
            throw new Error(`Ephemeris service error: ${response.status}`);
        }

        return response.json();
    }

    async getJulianDay(date: Date): Promise<number> {
        const response = await fetch(`${this.baseUrl}/julian-day?date_str=${encodeURIComponent(date.toISOString())}`);
        const data = await response.json();
        return data.julian_day_tt;
    }
}

// Singleton instance
export const ephemerisClient = new EphemerisClient();
```

---

### Step 3: Update Docker Compose

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  api:
    build: ./apps/api
    ports:
      - "3001:3001"
    environment:
      - EPHEMERIS_SERVICE_URL=http://ephemeris:8000
    depends_on:
      - ephemeris

  ephemeris:
    build: ./services/ephemeris
    ports:
      - "8000:8000"
    volumes:
      - ephemeris-data:/app/data

volumes:
  ephemeris-data:
```

---

### Step 4: Testing Script

**File:** `scripts/test-skyfield-accuracy.ts`
```typescript
// Compare Skyfield vs Swiss Ephemeris accuracy

import { ephemerisClient } from '../apps/api/src/lib/ephemeris-client.js';
import { initSwissEph, calculateEphemeris } from '../apps/api/src/lib/ephemeris.js';

async function testAccuracy() {
    await initSwissEph();
    
    const testDate = new Date('2024-03-15T12:00:00Z');
    const latitude = 28.6139;  // Delhi
    const longitude = 77.2090;
    
    // Get Swiss Ephemeris data
    const swissData = await calculateEphemeris({
        date: testDate,
        latitude,
        longitude
    });
    
    // Get Skyfield data
    const skyfieldData = await ephemerisClient.getSiderealPositions(
        testDate, latitude, longitude
    );
    
    // Compare
    console.log('Accuracy Comparison:');
    console.log('===================');
    
    for (const swissPlanet of swissData.planets) {
        const skyPlanet = skyfieldData.positions.find(
            p => p.name === swissPlanet.name
        );
        
        if (skyPlanet) {
            const diff = Math.abs(swissPlanet.longitude - skyPlanet.longitude);
            console.log(`${swissPlanet.name}: ${diff.toFixed(4)} degrees`);
        }
    }
}

testAccuracy();
```

---

## Deployment Options

### Option 1: Docker Compose (Local Development)
```bash
docker-compose up -d
```

### Option 2: Cloud Run (Production)
```bash
# Deploy Python service
gcloud run deploy ephemeris-service \
  --source services/ephemeris \
  --platform managed \
  --region asia-south1

# Set environment variable
gcloud run services update api \
  --set-env-vars EPHEMERIS_SERVICE_URL=https://ephemeris-service-xxx.a.run.app
```

### Option 3: Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ephemeris-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ephemeris
  template:
    metadata:
      labels:
        app: ephemeris
    spec:
      containers:
      - name: ephemeris
        image: gcr.io/PROJECT/ephemeris:latest
        ports:
        - containerPort: 8000
```

---

## Performance Considerations

### Caching Strategy
1. **In-memory cache** (1 minute TTL) - For repeated requests
2. **Redis cache** (24 hour TTL) - For popular dates
3. **Pre-calculated tables** - For date range queries

### Expected Performance
- Single position calculation: ~50ms
- With caching: ~5ms
- BTR pipeline (10000 candidates): ~10 seconds

---

## License Summary

| Component | License | Status |
|-----------|---------|--------|
| Your Node.js code | MIT (your choice) | ✅ |
| Your Python code | MIT (your choice) | ✅ |
| Skyfield library | MIT | ✅ |
| JPL DE440 data | Public Domain | ✅ |
| FastAPI framework | MIT | ✅ |

**Result: 100% GPL-free!**

---

## Timeline

| Day | Task |
|-----|------|
| 1 | Create Python microservice with basic endpoints |
| 2 | Add sidereal calculations + Lahiri ayanamsa |
| 3 | Add house calculations |
| 4 | Create Node.js client + integrate |
| 5 | Testing + accuracy validation |
| 6 | Deployment + caching optimization |

**Total: 6 days**

---

## Next Steps

1. **Review this plan** - Any questions or modifications?
2. **Start implementation** - I can help write the code
3. **Test accuracy** - Compare with Swiss Ephemeris
4. **Deploy** - Get it running in your infrastructure

Ready to start? 🚀
