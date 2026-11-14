/**
 * South polar stereographic projection of the PGDA height maps, and its inverse
 * (ADR-0004, "Harita katmanı adları"; data/examples/projection_vectors.json):
 * sphere R = 1737400 m, latitude of origin -90, central meridian 0, true scale at the pole,
 * metres; x grows towards 90 E, y towards 0 E.
 *
 * This is a map conversion, not sky computation: it turns a clicked map point into the
 * latitude and longitude the server then computes with.
 */

/** Sphere radius of the projection, metres (ADR-0002; the CRS in projection_vectors.json). */
export const MOON_RADIUS_M = 1_737_400;

const DEG = Math.PI / 180;

export interface ProjectedPoint {
  x_m: number;
  y_m: number;
}

export interface GeoPoint {
  lat_deg: number;
  lon_deg: number;
}

/** Latitude and longitude (degrees) to projected metres. */
export function forwardSouthPolar(lat_deg: number, lon_deg: number): ProjectedPoint {
  const rho = 2 * MOON_RADIUS_M * Math.tan(Math.PI / 4 + (lat_deg * DEG) / 2);
  const lambda = lon_deg * DEG;
  return { x_m: rho * Math.sin(lambda), y_m: rho * Math.cos(lambda) };
}

/** Projected metres to latitude and longitude; longitude in (-180, 180]. */
export function inverseSouthPolar(x_m: number, y_m: number): GeoPoint {
  const rho = Math.hypot(x_m, y_m);
  const lat_deg = (2 * Math.atan(rho / (2 * MOON_RADIUS_M)) - Math.PI / 2) / DEG;
  const lon_deg = rho === 0 ? 0 : Math.atan2(x_m, y_m) / DEG;
  return { lat_deg, lon_deg };
}

/** Longitude folded into (-180, 180]. */
export function normalizeLongitude(lon_deg: number): number {
  const wrapped = ((((lon_deg + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
}
