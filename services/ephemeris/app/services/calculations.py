from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

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
    julian_centuries = (julian_day_ut - 2451545.0) / 36525
    return 23.85 + 0.01397 * (julian_day_ut - 2451545.0) / 365.25 + 0.0003 * julian_centuries * julian_centuries


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


def calculate_ascendant_tropical(observer, moment) -> float:
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

    raise ServiceInitializationError(f"Unsupported Placidus house number: {house_number}")


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

    raise ServiceInitializationError(f"Failed to solve Placidus cusp for house {house_number}")


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
    apparent = observer.at(moment).observe(target).apparent()
    # Preserve existing "ecliptic of date" behavior for Vedic outputs.
    # Keep a docs-aligned fallback path for Skyfield API compatibility.
    try:
        latitude, longitude, distance = apparent.ecliptic_latlon(epoch="date")
    except TypeError:
        latitude, longitude, distance = apparent.ecliptic_latlon()
    except AttributeError:
        latitude, longitude, distance = apparent.frame_latlon(ecliptic_frame)
    return latitude, longitude, distance


def calculate_planet_position(
    body_name: str,
    observer,
    moment,
    next_moment,
    ayanamsha: float,
) -> PlanetPositionResponse:
    target = resolve_kernel_body(body_name)
    latitude, longitude, distance = _extract_ecliptic(observer, target, moment)
    next_latitude, next_longitude, _ = _extract_ecliptic(observer, target, next_moment)

    longitude_degrees = normalize_degrees(longitude.degrees)
    next_longitude_degrees = normalize_degrees(next_longitude.degrees)
    longitude_speed = circular_delta_degrees(next_longitude_degrees, longitude_degrees) * 86400
    latitude_speed = (next_latitude.degrees - latitude.degrees) * 86400

    return PlanetPositionResponse(
        body=body_name,
        tropicalLongitude=longitude_degrees,
        tropicalLatitude=float(latitude.degrees),
        siderealLongitude=normalize_degrees(longitude_degrees - ayanamsha),
        distanceAu=float(distance.au),
        longitudeSpeed=float(longitude_speed),
        latitudeSpeed=float(latitude_speed),
        retrograde=longitude_speed < 0,
    )


def calculate_nodes(
    observer,
    moment,
    next_moment,
    julian_day_tt: float,
    ayanamsha: float,
    node_mode: str,
) -> list[PlanetPositionResponse]:
    moon_target = resolve_kernel_body("moon")

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


def calculate_chart(timestamp_utc: str, request: SingleEphemerisRequest) -> ChartResponse:
    ts = runtime.get_timescale()
    earth = resolve_kernel_body("earth")

    dt = parse_timestamp_utc(timestamp_utc)
    next_dt = dt + timedelta(seconds=1)
    moment = ts.from_datetime(dt)
    next_moment = ts.from_datetime(next_dt)

    julian_day_ut = float(moment.ut1)
    julian_day_tt = float(moment.tt)
    ayanamsha = get_ayanamsa_lahiri(julian_day_ut)
    obliquity_degrees = calculate_true_obliquity_degrees(julian_day_ut)
    ramc_degrees = calculate_ramc_degrees(moment, request.location.longitude)

    observer = earth
    local_observer = earth + wgs84.latlon(
        request.location.latitude,
        request.location.longitude,
        elevation_m=request.location.altitudeMeters,
    )
    planets = [
        calculate_planet_position("sun", observer, moment, next_moment, ayanamsha),
        calculate_planet_position("moon", observer, moment, next_moment, ayanamsha),
        calculate_planet_position("mercury", observer, moment, next_moment, ayanamsha),
        calculate_planet_position("venus", observer, moment, next_moment, ayanamsha),
        calculate_planet_position("mars", observer, moment, next_moment, ayanamsha),
        calculate_planet_position("jupiter", observer, moment, next_moment, ayanamsha),
        calculate_planet_position("saturn", observer, moment, next_moment, ayanamsha),
    ]
    planets.extend(calculate_nodes(observer, moment, next_moment, julian_day_tt, ayanamsha, request.nodeMode))

    ascendant_tropical = calculate_ascendant_tropical(local_observer, moment)
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


def calculate_batch(request: BatchEphemerisRequest) -> BatchChartResponse:
    charts = [
        calculate_chart(
            timestamp,
            SingleEphemerisRequest(
                timestampUtc=timestamp,
                location=request.location,
                ayanamshaMode=request.ayanamshaMode,
                houseSystem=request.houseSystem,
                nodeMode=request.nodeMode,
            ),
        )
        for timestamp in request.timestampsUtc
    ]
    return BatchChartResponse(charts=charts)


def calculate_sunrise(request: SunriseRequest) -> SunriseResponse:
    ts = runtime.get_timescale()
    earth = resolve_kernel_body("earth")
    sun = resolve_kernel_body("sun")

    start_dt = parse_timestamp_utc(request.startTimestampUtc)
    end_dt = parse_timestamp_utc(request.endTimestampUtc)
    if end_dt <= start_dt:
        raise ServiceInitializationError("Sunrise search window must have endTimestampUtc after startTimestampUtc")

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
