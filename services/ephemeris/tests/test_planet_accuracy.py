"""Tests for planet position and ayanamsa accuracy against known reference values."""
from __future__ import annotations
import math
import pytest
from app.services.calculations import (
    get_ayanamsa_lahiri,
    normalize_degrees,
    calculate_ascendant_tropical,
    calculate_midheaven_tropical,
    calculate_true_obliquity_degrees,
    calculate_ramc_degrees,
    build_house_cusps,
    calculate_mean_node_longitude,
    calculate_true_node_longitude,
    calculate_chart,
)
from app.models.ephemeris import SingleEphemerisRequest
from skyfield.api import wgs84
from app.services.runtime import runtime


class TestAyanamsaAccuracy:
    """Verify Lahiri ayanamsa at known reference dates."""

    def test_ayanamsa_j2000(self):
        """Ayanamsa at J2000.0 should be approximately 23.856° (23°51'22")."""
        jd_j2000 = 2451545.0
        ayanamsa = get_ayanamsa_lahiri(jd_j2000)
        assert 23.85 <= ayanamsa <= 23.87, f"Ayanamsa at J2000: {ayanamsa}°, expected ~23.856°"

    def test_ayanamsa_2024(self):
        """Ayanamsa in 2024 should be approximately 24.19° (increased by ~0.34° from 2000)."""
        jd_2024_jan1 = 2460310.5  # Jan 1, 2024
        ayanamsa = get_ayanamsa_lahiri(jd_2024_jan1)
        assert 24.10 <= ayanamsa <= 24.30, f"Ayanamsa at 2024-01-01: {ayanamsa}°, expected ~24.19°"

    def test_ayanamsa_monotonically_increasing(self):
        """Ayanamsa should increase over time (precession)."""
        a1 = get_ayanamsa_lahiri(2451545.0)  # J2000
        a2 = get_ayanamsa_lahiri(2460310.5)  # 2024
        a3 = get_ayanamsa_lahiri(2488120.5)  # 2100
        assert a1 < a2 < a3, f"Ayanamsa must increase: {a1} < {a2} < {a3}"

    def test_ayanamsa_rate_approximately_50_arcsec_per_year(self):
        """Annual precession rate should be approximately 50.3 arcseconds."""
        jd_now = 2460310.5
        jd_next_year = jd_now + 365.25
        a_now = get_ayanamsa_lahiri(jd_now)
        a_next = get_ayanamsa_lahiri(jd_next_year)
        rate_arcsec = (a_next - a_now) * 3600
        assert 49 <= rate_arcsec <= 52, f"Precession rate: {rate_arcsec}\"/yr, expected ~50.3\""


class TestPlanetPositionSanity:
    """Sanity checks for planet positions (not absolute accuracy — no reference kernel)."""

    @pytest.fixture
    def delhi_noon(self):
        """Delhi, India at noon UTC on 2024-01-01."""
        ts = runtime.get_timescale()
        dt = ts.utc(2024, 1, 1, 12, 0, 0)
        earth = runtime.get_kernel()["earth"]
        observer = earth + wgs84.latlon(28.6139, 77.2090)
        return {
            "moment": dt,
            "next_moment": ts.utc(2024, 1, 1, 12, 0, 1),
            "observer": earth,
            "ayanamsha": get_ayanamsa_lahiri(float(dt.ut1)),
        }

    def test_sun_within_30_degrees_of_known_position(self, delhi_noon):
        """Sun around Jan 1 should be near 280° tropical (Capricorn)."""
        chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        sun = next(p for p in chart.planets if p.body == "sun")
        # Sun is around 280° tropical (9-10° Capricorn sidereal ~255°)
        assert 270 <= sun.tropicalLongitude <= 290, f"Sun tropical: {sun.tropicalLongitude}°"
        assert 248 <= sun.siderealLongitude <= 260, f"Sun sidereal: {sun.siderealLongitude}°"

    def test_all_9_planets_present(self, delhi_noon):
        """Chart should have exactly 9 planet positions (7 grahas + Rahu + Ketu)."""
        chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        body_names = {p.body for p in chart.planets}
        expected = {"sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu"}
        assert body_names == expected, f"Got: {body_names}"

    def test_rahu_ketu_opposite(self, delhi_noon):
        """Rahu and Ketu should be exactly 180° apart."""
        chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        rahu = next(p for p in chart.planets if p.body == "rahu")
        ketu = next(p for p in chart.planets if p.body == "ketu")
        diff = abs(normalize_degrees(rahu.siderealLongitude - ketu.siderealLongitude) - 180)
        assert diff < 0.01, f"Rahu-Ketu not opposite: diff={diff}°"

    def test_ascendant_changes_with_longitude(self):
        """Ascendant at Delhi vs London at same UTC time should differ."""
        delhi_chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        london_chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 51.5074, "longitude": -0.1278},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        assert (
            delhi_chart.houses.ascendantSidereal != london_chart.houses.ascendantSidereal
        ), "Ascendant should differ by location"

    def test_planet_positions_consistent_across_locations(self):
        """Planet positions should be identical for all Earth locations (geocentric)."""
        delhi_chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        sydney_chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": -33.8688, "longitude": 151.2093},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        for dp, sp in zip(delhi_chart.planets, sydney_chart.planets):
            assert dp.body == sp.body
            assert abs(dp.siderealLongitude - sp.siderealLongitude) < 0.001, (
                f"{dp.body} differs: {dp.siderealLongitude} vs {sp.siderealLongitude}"
            )


class TestPlacidusHouseCusps:
    """Placidus house cusp validation."""

    def test_ascendant_is_cusp_1(self):
        """House 1 cusp should equal ascendant."""
        chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        assert abs(chart.houses.houseCuspsSidereal[0] - chart.houses.ascendantSidereal) < 0.001

    def test_opposite_cusps_180_apart(self):
        """Houses 1-7, 2-8, 3-9, 4-10, 5-11, 6-12 should be ~180° apart."""
        chart = calculate_chart(
            "2024-01-01T06:30:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T06:30:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        cusps = chart.houses.houseCuspsSidereal
        for i in range(6):
            diff = abs(normalize_degrees(cusps[i] - cusps[i + 6]) - 180)
            assert diff < 0.1, f"House {i + 1}-{i + 7} not opposite: diff={diff}°"

    def test_midheaven_is_cusp_10(self):
        """House 10 cusp should equal MC."""
        chart = calculate_chart(
            "2024-01-01T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-01-01T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )
        mc_sidereal = normalize_degrees(chart.houses.mcTropical - chart.ayanamsha)
        assert abs(chart.houses.houseCuspsSidereal[9] - mc_sidereal) < 0.001


class TestNodeCalculation:
    """Rahu/Ketu node calculation tests."""

    def test_true_node_within_expected_range(self):
        """True Rahu node should be within 10° of its mean position."""
        jd_tt = 2460310.5  # Jan 1, 2024
        mean_rahu = calculate_mean_node_longitude(jd_tt)
        true_rahu = calculate_true_node_longitude(jd_tt)
        diff = abs(normalize_degrees(true_rahu - mean_rahu))
        # True vs mean node difference is typically < 2°
        assert diff < 10, f"Mean-true node diff too large: {diff}°"

    def test_rahu_always_retrograde_in_chart(self):
        """Mean Rahu node always moves retrograde (negative speed). True node can briefly oscillate direct."""
        chart = calculate_chart(
            "2024-06-15T12:00:00Z",
            SingleEphemerisRequest(
                timestampUtc="2024-06-15T12:00:00Z",
                location={"latitude": 28.6139, "longitude": 77.2090},
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="mean",
            ),
        )
        rahu = next(p for p in chart.planets if p.body == "rahu")
        assert rahu.longitudeSpeed < 0, f"Mean Rahu should be retrograde, speed={rahu.longitudeSpeed}"
        assert rahu.retrograde is True, f"Mean Rahu retrograde flag should be True"
