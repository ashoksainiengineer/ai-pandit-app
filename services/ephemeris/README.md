# AI-Pandit Ephemeris Service

Internal Skyfield-based astronomy service for the AI-Pandit production ephemeris stack.

## Scope

This service is an internal computation backend. It is not intended to be public-facing.

Current implementation:

- FastAPI service with health and readiness endpoints
- Skyfield + JPL kernel runtime bootstrap
- single and batch chart calculation endpoints
- Lahiri ayanamsha, tropical/sidereal longitudes, true/mean nodes
- ascendant calculation using ecliptic-horizon intersection
- explicit `whole_sign` and `equal` house system support
- typed request and response contracts shared with the TypeScript API

## Local Development

1. Bootstrap the local virtual environment and install dependencies.
2. Download the pinned JPL kernel.
3. Start the service.

Recommended commands:

```bash
sh services/ephemeris/scripts/bootstrap.sh
sh services/ephemeris/scripts/download-kernel.sh
sh services/ephemeris/scripts/dev.sh
```

## Key Environment Variables

- `EPHEMERIS_SERVICE_HOST`
- `EPHEMERIS_SERVICE_PORT`
- `EPHEMERIS_DATA_DIR`
- `EPHEMERIS_KERNEL_FILE`
- `EPHEMERIS_LOAD_KERNEL_ON_STARTUP`
- `EPHEMERIS_LOG_LEVEL`

## API Endpoints

- `GET /health`
- `GET /ready`
- `POST /v1/positions`
- `POST /v1/positions/batch`
- `POST /v1/sunrise`

## House Systems

- `placidus`: temporal quadrant cusps. This is the production default for cusp-driven KP and bhava calculations.
- `equal`: 30-degree houses anchored to the exact ascendant longitude.
- `whole_sign`: sign-boundary cusps anchored to the ascendant sign.

## Architecture Note

The API consumes this service as the canonical high-precision astronomy backend. Planetary longitudes, nodes, ascendant, sunrise, and cusp payloads are produced here; Vedic derivations stay in the TypeScript domain layer.

## Health Endpoints

- `GET /health`
- `GET /ready`
