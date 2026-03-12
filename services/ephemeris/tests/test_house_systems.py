from app.services.calculations import (
    build_equal_house_cusps,
    build_placidus_house_cusps,
    build_whole_sign_house_cusps,
)
from app.models.ephemeris import SunriseRequest, LocationRequest
from app.services.calculations import calculate_sunrise


def test_equal_house_cusps_follow_exact_ascendant() -> None:
    cusps = build_equal_house_cusps(343.9259291122297)

    assert len(cusps) == 12
    assert round(cusps[0], 6) == 343.925929
    assert round(cusps[1], 6) == 13.925929
    assert round(cusps[6], 6) == 163.925929


def test_whole_sign_house_cusps_follow_sign_boundaries() -> None:
    cusps = build_whole_sign_house_cusps(343.9259291122297)

    assert len(cusps) == 12
    assert cusps[0] == 330
    assert cusps[1] == 0
    assert cusps[6] == 150


def test_calculate_sunrise_returns_expected_utc_timestamp() -> None:
    response = calculate_sunrise(
        SunriseRequest(
            startTimestampUtc="1990-01-01T00:00:00Z",
            endTimestampUtc="1990-01-02T00:00:00Z",
            location=LocationRequest(latitude=28.6139, longitude=77.2090),
        )
    )

    assert response.sunriseTimestampUtc is not None
    assert response.sunriseTimestampUtc.startswith("1990-01-01T01:43:")


def test_placidus_house_cusps_match_reference_sample() -> None:
    cusps = build_placidus_house_cusps(
        7.645294051652559,
        274.92084068996803,
        28.6139,
        275.36094588771846,
        23.4392911,
    )

    assert round(cusps[0], 3) == 7.645
    assert round(cusps[1], 3) == 43.812
    assert round(cusps[2], 3) == 71.189
    assert round(cusps[9], 3) == 274.921
    assert round(cusps[10], 3) == 299.329
    assert round(cusps[11], 3) == 328.826
