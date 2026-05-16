"""Tests for batch ephemeris calculation and worker pool behaviour."""
from __future__ import annotations

import pytest
from app.models.ephemeris import BatchEphemerisRequest, LocationRequest, SingleEphemerisRequest
from app.services.calculations import calculate_batch, calculate_chart


class TestBatchCalculation:
    """Verify batch endpoint correctness, ordering, and consistency."""

    @pytest.fixture
    def delhi_location(self) -> LocationRequest:
        return LocationRequest(latitude=28.6139, longitude=77.2090)

    def test_batch_returns_same_count_as_input(self, delhi_location: LocationRequest):
        request = BatchEphemerisRequest(
            timestampsUtc=[f"2024-01-01T{h:02d}:00:00Z" for h in range(24)],
            location=delhi_location,
            ayanamshaMode="lahiri",
            houseSystem="placidus",
            nodeMode="true",
        )
        result = calculate_batch(request)
        assert len(result.charts) == 24

    def test_batch_preserves_timestamp_order(self, delhi_location: LocationRequest):
        timestamps = [
            "2024-06-15T06:00:00Z",
            "2024-06-15T12:00:00Z",
            "2024-06-15T18:00:00Z",
        ]
        request = BatchEphemerisRequest(
            timestampsUtc=timestamps,
            location=delhi_location,
            ayanamshaMode="lahiri",
            houseSystem="placidus",
            nodeMode="true",
        )
        result = calculate_batch(request)
        returned_timestamps = [c.timestampUtc for c in result.charts]
        assert returned_timestamps == timestamps

    def test_batch_results_match_individual_calculations(self, delhi_location: LocationRequest):
        timestamp = "2024-03-21T12:00:00Z"

        single = calculate_chart(
            timestamp,
            SingleEphemerisRequest(
                timestampUtc=timestamp,
                location=delhi_location.model_dump(),
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            ),
        )

        batch = calculate_batch(
            BatchEphemerisRequest(
                timestampsUtc=[timestamp],
                location=delhi_location,
                ayanamshaMode="lahiri",
                houseSystem="placidus",
                nodeMode="true",
            )
        )

        assert len(batch.charts) == 1
        batched = batch.charts[0]

        assert len(batched.planets) == len(single.planets)
        for bp, sp in zip(batched.planets, single.planets):
            assert bp.body == sp.body
            assert abs(bp.tropicalLongitude - sp.tropicalLongitude) < 1e-9
            assert abs(bp.siderealLongitude - sp.siderealLongitude) < 1e-9

        assert abs(batched.houses.ascendantTropical - single.houses.ascendantTropical) < 1e-9
        assert abs(batched.houses.ascendantSidereal - single.houses.ascendantSidereal) < 1e-9

        assert abs(batched.ayanamsha - single.ayanamsha) < 1e-9

    def test_batch_with_more_workers_than_charts(self, delhi_location: LocationRequest):
        """Ensure pool handles gracefully when chart count < worker count."""
        request = BatchEphemerisRequest(
            timestampsUtc=["2024-01-01T00:00:00Z"],
            location=delhi_location,
            ayanamshaMode="lahiri",
            houseSystem="placidus",
            nodeMode="true",
        )
        result = calculate_batch(request)
        assert len(result.charts) == 1
        assert result.charts[0].timestampUtc == "2024-01-01T00:00:00Z"

    def test_batch_with_different_house_systems(self, delhi_location: LocationRequest):
        for house_system in ("whole_sign", "equal", "placidus"):
            request = BatchEphemerisRequest(
                timestampsUtc=["2024-01-01T06:30:00Z", "2024-01-01T18:30:00Z"],
                location=delhi_location,
                ayanamshaMode="lahiri",
                houseSystem=house_system,
                nodeMode="true",
            )
            result = calculate_batch(request)
            assert len(result.charts) == 2
            assert (
                result.charts[0].houses.ascendantSidereal
                != result.charts[1].houses.ascendantSidereal
            )

    def test_batch_all_nine_planets_present(self, delhi_location: LocationRequest):
        request = BatchEphemerisRequest(
            timestampsUtc=["2024-01-01T12:00:00Z"],
            location=delhi_location,
            ayanamshaMode="lahiri",
            houseSystem="placidus",
            nodeMode="true",
        )
        result = calculate_batch(request)
        bodies = {p.body for p in result.charts[0].planets}
        expected = {"sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu"}
        assert bodies == expected
