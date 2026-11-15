/**
 * Coordinate conversion for the 3D Moon globe (issue #105). The interface does no ephemeris
 * work: the Sun and Earth directions come from the server's sub-solar and sub-Earth points
 * (`/api/body-series`), and this module only turns a latitude and longitude into a point on
 * the globe (docs/PLAN.md, 4.1, rule 2; #97, section 3).
 *
 * Globe frame (three.js, Y up): the north pole is +Y, 0° longitude (the centre of the near side)
 * is +Z, so it faces the starting camera, and east longitude is positive towards +X, which puts
 * the east limb on the viewer's right as the near side is seen from Earth.
 */

export interface LatLon {
  lat_deg: number;
  lon_deg: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const DEG = Math.PI / 180;

/** Point on a sphere of radius `r` for a selenographic latitude and east longitude. */
export function latLonToVector({ lat_deg, lon_deg }: LatLon, r = 1): Vec3 {
  const lat = lat_deg * DEG;
  const lon = lon_deg * DEG;
  return {
    x: r * Math.cos(lat) * Math.sin(lon),
    y: r * Math.sin(lat),
    z: r * Math.cos(lat) * Math.cos(lon),
  };
}

/** Inverse of `latLonToVector` for a point on (or scaled from) the sphere. */
export function vectorToLatLon({ x, y, z }: Vec3): LatLon {
  const r = Math.hypot(x, y, z);
  if (r === 0) return { lat_deg: 0, lon_deg: 0 };
  return { lat_deg: Math.asin(y / r) / DEG, lon_deg: Math.atan2(x, z) / DEG };
}

/**
 * Unit vector from the Moon's centre towards the Sun, read from the server's sub-solar point.
 * The sub-solar point is where the Sun is overhead, so the direction to the Sun passes through
 * it; nothing else is used. `null` when the server gave no point.
 */
export function sunDirection(subSolar: LatLon | null): Vec3 | null {
  if (!subSolar || !Number.isFinite(subSolar.lat_deg) || !Number.isFinite(subSolar.lon_deg)) return null;
  return latLonToVector(subSolar, 1);
}

/** Centres of the near and far side, for their labels. */
export const NEAR_SIDE_CENTRE: LatLon = { lat_deg: 0, lon_deg: 0 };
export const FAR_SIDE_CENTRE: LatLon = { lat_deg: 0, lon_deg: 180 };

/** Graticule lines every `step` degrees: parallels and meridians as point lists. */
export function graticule(stepDeg = 30, segments = 72): LatLon[][] {
  const lines: LatLon[][] = [];
  for (let lat = -90 + stepDeg; lat < 90; lat += stepDeg) {
    const line: LatLon[] = [];
    for (let i = 0; i <= segments; i++) line.push({ lat_deg: lat, lon_deg: -180 + (360 * i) / segments });
    lines.push(line);
  }
  for (let lon = -180; lon < 180; lon += stepDeg) {
    const line: LatLon[] = [];
    for (let i = 0; i <= segments; i++) line.push({ lat_deg: -90 + (180 * i) / segments, lon_deg: lon });
    lines.push(line);
  }
  return lines;
}
