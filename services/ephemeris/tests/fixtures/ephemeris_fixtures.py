"""
Test fixture data for Ephemeris service tests.

Provides sample birth data, location coordinates, and expected planetary
positions for repeatable, deterministic test scenarios.
"""

from typing import Any

# ═════════════════════════════════════════════════════════
# Sample birth data — New Delhi, 1990-06-15 05:30 UTC
# ═════════════════════════════════════════════════════════

SAMPLE_BIRTH_DELHI: dict[str, Any] = {
    "datetime": "1990-06-15T05:30:00Z",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "bodies": ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"],
}

# ═════════════════════════════════════════════════════════
# Additional sample locations for multi-region tests
# ═════════════════════════════════════════════════════════

SAMPLE_BIRTH_MUMBAI: dict[str, Any] = {
    "datetime": "1985-10-02T03:15:00Z",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "bodies": ["sun", "moon", "mars"],
}

SAMPLE_BIRTH_LONDON: dict[str, Any] = {
    "datetime": "2000-01-01T12:00:00Z",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "bodies": ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"],
}

SAMPLE_BIRTH_SYDNEY: dict[str, Any] = {
    "datetime": "1975-08-20T20:45:00Z",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "bodies": ["sun", "moon", "mars", "jupiter", "saturn"],
}

# ═════════════════════════════════════════════════════════
# Location-only data for sunrise / transit calculations
# ═════════════════════════════════════════════════════════

LOCATION_DELHI: dict[str, Any] = {
    "latitude": 28.6139,
    "longitude": 77.2090,
}

LOCATION_MUMBAI: dict[str, Any] = {
    "latitude": 19.0760,
    "longitude": 72.8777,
}

LOCATION_VARANASI: dict[str, Any] = {
    "latitude": 25.3176,
    "longitude": 82.9739,
}

# ═════════════════════════════════════════════════════════
# Expected house cusps (reference values for regression)
# For ascendant ~7.645° on the Placidus system
# ═════════════════════════════════════════════════════════

PLACIDUS_REFERENCE: dict[str, Any] = {
    "ascendant_deg": 7.645,
    "midheaven_deg": 274.921,
    "latitude": 28.6139,
    "obliquity": 23.4392911,
    "expected_cusps": [7.645, 43.812, 71.189, 94.812, 124.812, 154.812, 184.812, 214.812, 244.812, 274.921, 299.329, 328.826],
}

# ═════════════════════════════════════════════════════════
# Dasha / period calculation test data
# ═════════════════════════════════════════════════════════

DASHA_MOON_POSITION: dict[str, Any] = {
    "nakshatra_index": 0,          # Ashwini
    "degree_in_nakshatra": 3.33,   # ~1 pada
    "expected_dasha_lord": "Ketu",
    "expected_period_years": 7,
}

# ═════════════════════════════════════════════════════════
# Edge-case birth data
# ═════════════════════════════════════════════════════════

EDGE_CASE_MIDNIGHT: dict[str, Any] = {
    "datetime": "1990-01-01T00:00:00Z",
    "latitude": 0.0,
    "longitude": 0.0,
    "bodies": ["sun", "moon"],
}

EDGE_CASE_ANTIPODEAN: dict[str, Any] = {
    "datetime": "2020-06-21T12:00:00Z",
    "latitude": -90.0,    # South Pole
    "longitude": 0.0,
    "bodies": ["sun"],
}

EDGE_CASE_DATE_LINE: dict[str, Any] = {
    "datetime": "2015-03-15T23:59:59Z",
    "latitude": 0.0,
    "longitude": 180.0,   # International Date Line
    "bodies": ["sun", "moon", "mars"],
}

# ═════════════════════════════════════════════════════════
# All known celestial bodies supported by the service
# ═════════════════════════════════════════════════════════

ALL_STANDARD_BODIES = [
    "sun",
    "moon",
    "mars",
    "mercury",
    "jupiter",
    "venus",
    "saturn",
    "rahu",
    "ketu",
]
