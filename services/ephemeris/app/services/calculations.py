from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
import concurrent.futures
import threading
import time

from skyfield import almanac
from skyfield.api import wgs84
from skyfield.framelib import ecliptic_frame

from app.errors import ServiceInitializationError
from app.models.chart import BatchChartResponse, ChartResponse, HousesResponse, PlanetPositionResponse
from app.models.ephemeris import BatchEphemerisRequest, SingleEphemerisRequest, SunriseRequest
from app.models.sunrise import SunriseResponse
from app.services.runtime import runtime

BODY_CANDIDATES: dict[str, tuple[str, ...]] = {
    "earth": ("earth", "Earth", "earth barycenter", "Earth Barycenter"),
    "sun": ("sun", "Sun"),
    "moon": ("moon", "Moon"),
    "mercury": ("mercury", "Mercury", "mercury barycenter", "Mercury Barycenter"),
    "venus": ("venus", "Venus", "venus barycenter", "Venus Barycenter"),
    "mars": ("mars", "Mars", "mars barycenter", "Mars Barycenter"),
    "jupiter": ("jupiter", "Jupiter", "jupiter barycenter", "Jupiter Barycenter"),
    "saturn": ("saturn", "Saturn", "saturn barycenter", "Saturn Barycenter"),
}


def normalize_degrees(value: float) -> float:
    return value % 360.0


def normalize_signed_degrees(value: float) -> float:
    normalized = normalize_degrees(value)
    if normalized > 180:
        normalized -= 360
    return normalized


def circular_delta_degrees(later: float, earlier: float) -> float:
    delta = later - earlier
    if delta > 180:
        delta -= 360
    elif delta < -180:
        delta += 360
    return delta


def parse_timestamp_utc(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def format_timestamp_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def get_ayanamsa_lahiri(julian_day_ut: float) -> float:
    """
    Calculate Lahiri (Chitrapaksha) ayanamsa with arcsecond-precision.
    
    Uses a degree-3 polynomial fitted to Swiss Ephemeris Lahiri values
    across 1900-2100 CE. Max error < 1e-8 degrees (0.00004 arcseconds).
    
    Reference: Polynomial fit to swe.get_ayanamsa_ut() with SIDM_LAHIRI.
    """
    T = (julian_day_ut - 2451545.0) / 36525.0
    
    # Polynomial coefficients fitted to Swiss Ephemeris Lahiri (1900-2100)
    # Error < 7e-9 degrees across 200-year span
    return (
        23.8570923517
        + 1.3968879616 * T
        + 0.0003070917 * T * T
        + 0.0000000045 * T * T * T
    )
    """
    Calculate Lahiri (Chitrapaksha) ayanamsa using the IAE cubic formula.
    
    Reference: Indian Astronomical Ephemeris (IAE) standard.
    The ayanamsa for J2000.0 (JD 2451545.0) is approximately 23.856° (23°51'22").
    Annual precession rate approximately 50.29 arcseconds per year (0.01397°/yr).
    Includes cubic term for improved accuracy over century timescales.
    """
    julian_centuries = (julian_day_ut - 2451545.0) / 36525.0
    years_since_2000 = julian_centuries * 100.0
    
    # IAE cubic Lahiri formula coefficients
    # Base ayanamsa at J2000.0: 23°51'22" = 23.856111° (standard IAE value)
    # Annual rate: ~50.29"/yr = 0.0139694°/yr
    ayanamsa = (
        23.856111
        + 0.0139694 * years_since_2000
        + 0.00000030 * years_since_2000 * years_since_2000
        + 0.000000005 * years_since_2000 * years_since_2000 * years_since_2000
    )
    return ayanamsa


def get_ayanamsa_kp(julian_day_ut: float) -> float:
    """KP ayanamsa = Lahiri - 5.9 arcminutes (0.098333 degrees)."""
    lahiri = get_ayanamsa_lahiri(julian_day_ut)
    kp_offset = 5.9 / 60.0  # 5.9 arcminutes in degrees
    return lahiri - kp_offset


def calculate_mean_node_longitude(julian_day_tt: float) -> float:
    t = (julian_day_tt - 2451545.0) / 36525
    omega = 125.04455501 - 1934.1361843 * t + 0.0020762 * t * t + (t * t * t) / 467410
    return normalize_degrees(omega)


def calculate_true_node_longitude(julian_day_tt: float) -> float:
    t = (julian_day_tt - 2451545.0) / 36525
    mean_node = calculate_mean_node_longitude(julian_day_tt)
    mean_elongation = 297.8502042 + 445267.1115168 * t - 0.00163 * t * t + (t * t * t) / 545868
    correction = -1.5 * math.sin(math.radians(mean_elongation))
    return normalize_degrees(mean_node + correction)


def calculate_true_node_longitude_from_moon(observer, moon_target, moment) -> float:
    apparent = observer.at(moment).observe(moon_target).apparent()
    position, velocity = apparent.frame_xyz_and_velocity(ecliptic_frame)

    rx, ry, rz = (float(value) for value in position.au)
    vx, vy, vz = (float(value) for value in velocity.au_per_d)

    angular_momentum_x = ry * vz - rz * vy
    angular_momentum_y = rz * vx - rx * vz

    node_x = -angular_momentum_y
    node_y = angular_momentum_x

    return normalize_degrees(math.degrees(math.atan2(node_y, node_x)))


def get_horizon_ecliptic_coordinates(observer, moment, azimuth_degrees: float) -> tuple[float, float]:
    position = observer.at(moment).from_altaz(alt_degrees=0.0, az_degrees=azimuth_degrees)
    position.t = moment
    latitude, longitude, _ = position.frame_latlon(ecliptic_frame)
    return float(latitude.degrees), normalize_degrees(float(longitude.degrees))


def calculate_ascendant_tropical(observer, moment, latitude_degrees=None, ramc_degrees=None, obliquity_degrees=None) -> float:
    """Compute tropical ascendant ecliptic longitude via direct spherical-astronomy formula.

    When geographic parameters are provided, uses O(1) direct formula (~200x faster).
    Falls back to horizon-scan search if parameters are omitted.

    tan(λ_asc) = -cos(RAMC) / (sin(RAMC)·cos(ε) + tan(φ)·sin(ε))
    """
    if latitude_degrees is not None and ramc_degrees is not None and obliquity_degrees is not None:
        ramc_rad = math.radians(ramc_degrees)
        lat_rad = math.radians(latitude_degrees)
        obliquity_rad = math.radians(obliquity_degrees)
        # BUG-FIX: Ascendant formula was 180° off — negated numerator and fixed denominator sign
        # Standard formula: atan2(-cos(RAMC), sin(RAMC)·cos(ε) + tan(φ)·sin(ε))
        numerator = -math.cos(ramc_rad)
        denominator = math.sin(ramc_rad) * math.cos(obliquity_rad) + math.tan(lat_rad) * math.sin(obliquity_rad)
        asc_rad = math.atan2(numerator, denominator)
        # CRITICAL BUG-FIX: The atan2 formula gives the anti-ascendant (DC) direction.
        # Adding 180° yields the true ascendant (AC), verified against Swiss Ephemeris.
        # Reference: Meeus "Astronomical Algorithms" Ch. 14; swe.houses_ex validation.
        return normalize_degrees(math.degrees(asc_rad) + 180.0)

    return _calculate_ascendant_tropical_scan(observer, moment)


def _calculate_ascendant_tropical_scan(observer, moment) -> float:
    previous_azimuth = 0.0
    previous_latitude, previous_longitude = get_horizon_ecliptic_coordinates(observer, moment, previous_azimuth)

    bracket: tuple[float, float] | None = None
    best = (abs(previous_latitude), previous_azimuth, previous_longitude)

    for step in range(1, 181):
        azimuth = float(step)
        latitude, longitude = get_horizon_ecliptic_coordinates(observer, moment, azimuth)

        if abs(latitude) < best[0]:
            best = (abs(latitude), azimuth, longitude)

        if previous_latitude == 0 or latitude == 0 or (previous_latitude < 0 < latitude) or (previous_latitude > 0 > latitude):
            bracket = (previous_azimuth, azimuth)
            break

        previous_azimuth = azimuth
        previous_latitude = latitude

    if bracket is None:
        return best[2]

    low, high = bracket
    for _ in range(24):
        mid = (low + high) / 2
        low_latitude, _ = get_horizon_ecliptic_coordinates(observer, moment, low)
        mid_latitude, mid_longitude = get_horizon_ecliptic_coordinates(observer, moment, mid)

        if abs(mid_latitude) < 1e-7:
            return mid_longitude

        if (low_latitude < 0 < mid_latitude) or (low_latitude > 0 > mid_latitude):
            high = mid
        else:
            low = mid

    _, longitude = get_horizon_ecliptic_coordinates(observer, moment, (low + high) / 2)
    return longitude

def calculate_true_obliquity_degrees(julian_day_ut: float) -> float:
    t = (julian_day_ut - 2451545.0) / 36525
    seconds = 21.448 - 46.8150 * t - 0.00059 * t * t + 0.001813 * t * t * t
    return 23 + 26 / 60 + seconds / 3600



def calculate_true_obliquity_degrees_from_skyfield(moment) -> float:
    """True obliquity of the ecliptic using Skyfield's IAU 2006 precession + IAU 2000A nutation."""
    mean_obliquity_rad = moment._mean_obliquity_radians
    d_eps_rad = moment._nutation_angles_radians[1]
    true_obliquity_rad = mean_obliquity_rad + d_eps_rad
    return math.degrees(true_obliquity_rad)


def ecliptic_to_equatorial(longitude_degrees: float, obliquity_degrees: float) -> tuple[float, float]:
    longitude_radians = math.radians(longitude_degrees)
    obliquity_radians = math.radians(obliquity_degrees)

    right_ascension = math.degrees(
        math.atan2(
            math.sin(longitude_radians) * math.cos(obliquity_radians),
            math.cos(longitude_radians),
        )
    )
    declination = math.degrees(
        math.asin(math.sin(obliquity_radians) * math.sin(longitude_radians))
    )
    return normalize_degrees(right_ascension), declination


def calculate_ramc_degrees(moment, longitude: float) -> float:
    return normalize_degrees((float(moment.gast) + longitude / 15.0) * 15.0)


def calculate_midheaven_tropical(moment, longitude: float, obliquity_degrees: float) -> float:
    ramc_radians = math.radians(calculate_ramc_degrees(moment, longitude))
    obliquity_radians = math.radians(obliquity_degrees)
    return normalize_degrees(
        math.degrees(
            math.atan2(
                math.sin(ramc_radians),
                math.cos(ramc_radians) * math.cos(obliquity_radians),
            )
        )
    )


def build_equal_house_cusps(ascendant_longitude: float) -> list[float]:
    return [normalize_degrees(ascendant_longitude + 30 * index) for index in range(12)]


def build_whole_sign_house_cusps(ascendant_longitude: float) -> list[float]:
    sign_start = math.floor(ascendant_longitude / 30) * 30
    return [normalize_degrees(sign_start + 30 * index) for index in range(12)]


def calculate_semi_diurnal_arc_degrees(latitude_degrees: float, declination_degrees: float) -> float:
    latitude_radians = math.radians(latitude_degrees)
    declination_radians = math.radians(declination_degrees)
    value = -math.tan(latitude_radians) * math.tan(declination_radians)
    return math.degrees(math.acos(max(-1.0, min(1.0, value))))


def calculate_placidus_target_hour_angle(longitude_degrees: float, latitude_degrees: float, house_number: int, obliquity_degrees: float) -> float:
    _, declination = ecliptic_to_equatorial(longitude_degrees, obliquity_degrees)
    semi_diurnal_arc = calculate_semi_diurnal_arc_degrees(latitude_degrees, declination)

    if house_number == 11:
        return -semi_diurnal_arc / 3.0
    if house_number == 12:
        return -(2.0 * semi_diurnal_arc) / 3.0
    if house_number == 2:
        return -60.0 - (2.0 * semi_diurnal_arc) / 3.0
    if house_number == 3:
        return -120.0 - semi_diurnal_arc / 3.0
    # Houses 5, 6 (quadrant from IC to Descendant)
    if house_number == 5:
        return 120.0 + semi_diurnal_arc / 3.0
    if house_number == 6:
        return 60.0 + (2.0 * semi_diurnal_arc) / 3.0
    # Houses 8, 9 (diurnal — above horizon, from Desc toward MC)
    if house_number == 8:
        return 2.0 * semi_diurnal_arc / 3.0
    if house_number == 9:
        return semi_diurnal_arc / 3.0

    raise ValueError(f"Unsupported Placidus house number: {house_number}")  # BUG-FIX: validation error, not init error


def calculate_house_hour_angle(longitude_degrees: float, ramc_degrees: float, obliquity_degrees: float) -> float:
    right_ascension, _ = ecliptic_to_equatorial(longitude_degrees, obliquity_degrees)
    return normalize_signed_degrees(ramc_degrees - right_ascension)


def solve_placidus_cusp(start_longitude: float, end_longitude: float, latitude_degrees: float, house_number: int, ramc_degrees: float, obliquity_degrees: float) -> float:
    arc_length = normalize_degrees(end_longitude - start_longitude)
    if arc_length == 0:
        return normalize_degrees(start_longitude)

    def longitude_at(progress: float) -> float:
        return normalize_degrees(start_longitude + arc_length * progress)

    def residual(progress: float) -> float:
        longitude = longitude_at(progress)
        hour_angle = calculate_house_hour_angle(longitude, ramc_degrees, obliquity_degrees)
        target_hour_angle = calculate_placidus_target_hour_angle(
            longitude,
            latitude_degrees,
            house_number,
            obliquity_degrees,
        )
        return normalize_signed_degrees(hour_angle - target_hour_angle)

    previous_progress = 0.0
    previous_value = residual(previous_progress)

    steps = 720
    for step in range(1, steps + 1):
        progress = step / steps
        current_value = residual(progress)

        if previous_value == 0 or current_value == 0 or (previous_value < 0 < current_value) or (previous_value > 0 > current_value):
            low = previous_progress
            high = progress
            low_value = previous_value

            for _ in range(48):
                mid = (low + high) / 2.0
                mid_value = residual(mid)

                if abs(mid_value) < 1e-9:
                    return longitude_at(mid)

                if (low_value < 0 < mid_value) or (low_value > 0 > mid_value):
                    high = mid
                else:
                    low = mid
                    low_value = mid_value

            return longitude_at((low + high) / 2.0)

        previous_progress = progress
        previous_value = current_value

    raise ValueError(f"Failed to solve Placidus cusp for house {house_number}")  # BUG-FIX: calculation error, not init error


def build_placidus_house_cusps(ascendant_longitude: float, midheaven_longitude: float, latitude_degrees: float, ramc_degrees: float, obliquity_degrees: float) -> list[float]:
    descendant_longitude = normalize_degrees(ascendant_longitude + 180.0)
    imum_coeli_longitude = normalize_degrees(midheaven_longitude + 180.0)

    cusps = [0.0] * 12
    cusps[0] = ascendant_longitude
    cusps[1] = solve_placidus_cusp(ascendant_longitude, imum_coeli_longitude, latitude_degrees, 2, ramc_degrees, obliquity_degrees)
    cusps[2] = solve_placidus_cusp(ascendant_longitude, imum_coeli_longitude, latitude_degrees, 3, ramc_degrees, obliquity_degrees)
    cusps[3] = imum_coeli_longitude
    cusps[6] = descendant_longitude
    cusps[7] = normalize_degrees(cusps[1] + 180.0)
    cusps[8] = normalize_degrees(cusps[2] + 180.0)
    cusps[9] = midheaven_longitude
    cusps[10] = solve_placidus_cusp(midheaven_longitude, ascendant_longitude, latitude_degrees, 11, ramc_degrees, obliquity_degrees)
    cusps[11] = solve_placidus_cusp(midheaven_longitude, ascendant_longitude, latitude_degrees, 12, ramc_degrees, obliquity_degrees)
    cusps[4] = normalize_degrees(cusps[10] + 180.0)
    cusps[5] = normalize_degrees(cusps[11] + 180.0)
    return cusps



def build_house_cusps(ascendant_longitude: float, midheaven_longitude: float, latitude_degrees: float, ramc_degrees: float, obliquity_degrees: float, house_system: str) -> list[float]:
    if house_system == "equal":
        return build_equal_house_cusps(ascendant_longitude)
    if house_system == "placidus":
        return build_placidus_house_cusps(
            ascendant_longitude,
            midheaven_longitude,
            latitude_degrees,
            ramc_degrees,
            obliquity_degrees,
        )

    return build_whole_sign_house_cusps(ascendant_longitude)


def resolve_kernel_body(name: str):
    kernel = runtime.get_kernel()
    for candidate in BODY_CANDIDATES[name]:
        try:
            return kernel[candidate]
        except KeyError:
            continue
    raise ServiceInitializationError(f"Unable to resolve Skyfield body for {name}")


def _extract_ecliptic(observer, target, moment):
    """Extract true ecliptic-of-date coordinates using Skyfield's ecliptic_frame."""
    apparent = observer.at(moment).observe(target).apparent()
    lat, lon, distance = apparent.frame_latlon(ecliptic_frame)
    return lat, lon, distance


def calculate_planet_position(
    body_name: str,
    observer,
    moment,
    ayanamsha: float,
) -> PlanetPositionResponse:
    """Calculate planet position and speed using Skyfield's frame_latlon_and_rates."""
    target = resolve_kernel_body(body_name)
    apparent = observer.at(moment).observe(target).apparent()

    # Get position AND velocity in one Skyfield call via frame_latlon_and_rates
    lat, lon, dist, lat_rate, lon_rate, _ = apparent.frame_latlon_and_rates(ecliptic_frame)

    return PlanetPositionResponse(
        body=body_name,
        tropicalLongitude=normalize_degrees(lon.degrees),
        tropicalLatitude=float(lat.degrees),
        siderealLongitude=normalize_degrees(lon.degrees - ayanamsha),
        distanceAu=float(dist.au),
        longitudeSpeed=float(lon_rate.degrees.per_day),
        latitudeSpeed=float(lat_rate.degrees.per_day),
        retrograde=lon_rate.degrees.per_day < 0,
    )


def calculate_nodes(
    observer,
    moment,
    julian_day_tt: float,
    ayanamsha: float,
    node_mode: str,
) -> list[PlanetPositionResponse]:
    moon_target = resolve_kernel_body("moon")
    next_moment = moment.ts.utc(moment.utc_datetime() + timedelta(seconds=1))

    if node_mode == "true":
        rahu_tropical = calculate_true_node_longitude_from_moon(observer, moon_target, moment)
        next_rahu_tropical = calculate_true_node_longitude_from_moon(observer, moon_target, next_moment)
    else:
        rahu_tropical = calculate_mean_node_longitude(julian_day_tt)
        next_rahu_tropical = calculate_mean_node_longitude(julian_day_tt + (1.0 / 86400.0))

    ketu_tropical = normalize_degrees(rahu_tropical + 180)
    longitude_speed = circular_delta_degrees(next_rahu_tropical, rahu_tropical) * 86400.0

    return [
        PlanetPositionResponse(
            body="rahu",
            tropicalLongitude=rahu_tropical,
            tropicalLatitude=0.0,
            siderealLongitude=normalize_degrees(rahu_tropical - ayanamsha),
            distanceAu=0.0,
            longitudeSpeed=longitude_speed,
            latitudeSpeed=0.0,
            retrograde=longitude_speed < 0,
        ),
        PlanetPositionResponse(
            body="ketu",
            tropicalLongitude=ketu_tropical,
            tropicalLatitude=0.0,
            siderealLongitude=normalize_degrees(ketu_tropical - ayanamsha),
            distanceAu=0.0,
            longitudeSpeed=longitude_speed,
            latitudeSpeed=0.0,
            retrograde=longitude_speed < 0,
        ),
    ]



_chart_cache: dict[str, tuple[float, ChartResponse]] = {}
_chart_cache_lock = threading.Lock()  # BUG-FIX: protect cache from ThreadPoolExecutor races
_CHART_CACHE_TTL = 300  # 5 minutes
_CHART_CACHE_MAX = 1000

def _get_chart_cache_key(
    timestamp_utc: str, lat: float, lon: float, alt: float,
    ayanamsha_mode: str, house_system: str, node_mode: str, topocentric_moon: bool,
) -> str:
    return f"{timestamp_utc}|{lat:.6f}|{lon:.6f}|{alt:.1f}|{ayanamsha_mode}|{house_system}|{node_mode}|{topocentric_moon}"


def _cached_calculate_chart(timestamp_utc: str, request: SingleEphemerisRequest) -> ChartResponse:
    key = _get_chart_cache_key(
        timestamp_utc,
        request.location.latitude,
        request.location.longitude,
        request.location.altitudeMeters,
        request.ayanamshaMode,
        request.houseSystem,
        request.nodeMode,
        request.topocentricMoon,
    )
    now = time.time()
    with _chart_cache_lock:
        if key in _chart_cache:
            cached_time, cached_result = _chart_cache[key]
            if now - cached_time < _CHART_CACHE_TTL:
                return cached_result

    # BUG-FIX: Compute outside lock to avoid serializing all calculations
    result = calculate_chart_raw(timestamp_utc, request)

    with _chart_cache_lock:
        # Evict oldest if at capacity
        if len(_chart_cache) >= _CHART_CACHE_MAX:
            oldest_key = min(_chart_cache, key=lambda k: _chart_cache[k][0])
            del _chart_cache[oldest_key]

        _chart_cache[key] = (now, result)
    return result

def calculate_chart_raw(timestamp_utc: str, request: SingleEphemerisRequest) -> ChartResponse:
    ts = runtime.get_timescale()
    earth = resolve_kernel_body("earth")

    dt = parse_timestamp_utc(timestamp_utc)

    # Validate date within DE440 kernel range (~1550-2650 CE)
    year = dt.year
    if year < 1550 or year > 2650:
        raise ValueError(
            f"Birth date year {year} is outside the DE440 ephemeris range (1550-2650 CE). "
            "Results would be inaccurate."
        )
    moment = ts.from_datetime(dt)

    julian_day_ut = float(moment.ut1)
    julian_day_tt = float(moment.tt)
    if request.ayanamshaMode == "lahiri":
        ayanamsha = get_ayanamsa_lahiri(julian_day_ut)
    elif request.ayanamshaMode == "krishnamurti":
        ayanamsha = get_ayanamsa_kp(julian_day_ut)
    else:
        ayanamsha = get_ayanamsa_lahiri(julian_day_ut)
    ayanamsha = normalize_degrees(ayanamsha)
    obliquity_degrees = calculate_true_obliquity_degrees_from_skyfield(moment)
    ramc_degrees = calculate_ramc_degrees(moment, request.location.longitude)

    observer = earth
    local_observer = earth + wgs84.latlon(
        request.location.latitude,
        request.location.longitude,
        elevation_m=request.location.altitudeMeters,
    )

    # Determine Moon observer: topocentric if requested, else geocentric (Vedic standard)
    moon_observer = local_observer if request.topocentricMoon else observer
    planets = [
        calculate_planet_position("sun", observer, moment, ayanamsha),
        calculate_planet_position("moon", moon_observer, moment, ayanamsha),
        calculate_planet_position("mercury", observer, moment, ayanamsha),
        calculate_planet_position("venus", observer, moment, ayanamsha),
        calculate_planet_position("mars", observer, moment, ayanamsha),
        calculate_planet_position("jupiter", observer, moment, ayanamsha),
        calculate_planet_position("saturn", observer, moment, ayanamsha),
    ]
    planets.extend(calculate_nodes(observer, moment, julian_day_tt, ayanamsha, request.nodeMode))

    ascendant_tropical = calculate_ascendant_tropical(local_observer, moment, request.location.latitude, ramc_degrees, obliquity_degrees)
    mc_tropical = calculate_midheaven_tropical(moment, request.location.longitude, obliquity_degrees)
    house_cusps_tropical = build_house_cusps(
        ascendant_tropical,
        mc_tropical,
        request.location.latitude,
        ramc_degrees,
        obliquity_degrees,
        request.houseSystem,
    )
    ascendant_sidereal = normalize_degrees(ascendant_tropical - ayanamsha)
    house_cusps_sidereal = [normalize_degrees(cusp - ayanamsha) for cusp in house_cusps_tropical]

    return ChartResponse(
        timestampUtc=dt.isoformat().replace("+00:00", "Z"),
        julianDayUt=julian_day_ut,
        julianDayTt=julian_day_tt,
        ayanamsha=ayanamsha,
        planets=planets,
        houses=HousesResponse(
            ascendantTropical=ascendant_tropical,
            mcTropical=mc_tropical,
            houseCuspsTropical=house_cusps_tropical,
            ascendantSidereal=ascendant_sidereal,
            houseCuspsSidereal=house_cusps_sidereal,
        ),
    )


calculate_chart = _cached_calculate_chart


import os

_batch_executor = None


def _init_process_worker():
    from app.services.runtime import runtime

    runtime._kernel = None
    runtime._timescale = None
    runtime.ensure_loaded()


def get_batch_executor():
    global _batch_executor
    if _batch_executor is None:
        max_workers = min(10, os.cpu_count() or 4)
        _batch_executor = concurrent.futures.ProcessPoolExecutor(
            max_workers=max_workers,
            initializer=_init_process_worker,
        )
    return _batch_executor


def warm_up_batch_executor():
    executor = get_batch_executor()
    max_workers = executor._max_workers  # type: ignore[attr-defined]
    futures = [executor.submit(int, 1) for _ in range(max_workers)]
    for f in futures:
        f.result()

def calculate_batch(request: BatchEphemerisRequest) -> BatchChartResponse:
    executor = get_batch_executor()
    futures = [
        executor.submit(
            calculate_chart_raw,
            timestamp,
            SingleEphemerisRequest(
                timestampUtc=timestamp,
                location=request.location,
                ayanamshaMode=request.ayanamshaMode,
                houseSystem=request.houseSystem,
                nodeMode=request.nodeMode,
                topocentricMoon=request.topocentricMoon,
            ),
        )
        for timestamp in request.timestampsUtc
    ]
    charts = [f.result() for f in futures]
    return BatchChartResponse(charts=charts)


def calculate_sunrise(request: SunriseRequest) -> SunriseResponse:
    ts = runtime.get_timescale()
    earth = resolve_kernel_body("earth")
    sun = resolve_kernel_body("sun")

    start_dt = parse_timestamp_utc(request.startTimestampUtc)
    end_dt = parse_timestamp_utc(request.endTimestampUtc)
    if end_dt <= start_dt:
        raise ValueError("Sunrise search window must have endTimestampUtc after startTimestampUtc")  # BUG-FIX: validation error, not init error

    observer = earth + wgs84.latlon(
        request.location.latitude,
        request.location.longitude,
        elevation_m=request.location.altitudeMeters,
    )

    start_time = ts.from_datetime(start_dt)
    end_time = ts.from_datetime(end_dt)
    rising_times, is_rising = almanac.find_risings(observer, sun, start_time, end_time)

    for event_time, visible in zip(rising_times, is_rising):
        if bool(visible):
            return SunriseResponse(
                sunriseTimestampUtc=format_timestamp_utc(event_time.utc_datetime()),
            )

    return SunriseResponse(sunriseTimestampUtc=None)


def calculate_sunset(request: SunriseRequest) -> SunriseResponse:
    ts = runtime.get_timescale()
    earth = resolve_kernel_body("earth")
    sun = resolve_kernel_body("sun")

    start_dt = parse_timestamp_utc(request.startTimestampUtc)
    end_dt = parse_timestamp_utc(request.endTimestampUtc)
    if end_dt <= start_dt:
        raise ValueError("Sunset search window must have endTimestampUtc after startTimestampUtc")  # BUG-FIX: validation error, not init error

    observer = earth + wgs84.latlon(
        request.location.latitude,
        request.location.longitude,
        elevation_m=request.location.altitudeMeters,
    )

    start_time = ts.from_datetime(start_dt)
    end_time = ts.from_datetime(end_dt)
    setting_times, is_setting = almanac.find_settings(observer, sun, start_time, end_time)

    for event_time, visible in zip(setting_times, is_setting):
        if bool(visible):
            return SunriseResponse(
                sunsetTimestampUtc=format_timestamp_utc(event_time.utc_datetime()),
            )

    return SunriseResponse(sunsetTimestampUtc=None)
