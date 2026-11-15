/**
 * Placement of the bodies in the space scene (issue #123). The interface does no ephemeris,
 * rotation or visibility work (#97, section 3): every direction comes from a point the server
 * gave in `/api/body-series`, and this module only turns those points into scene positions.
 *
 * Scene frame: the Moon's body-fixed frame of the 3D Moon (`globe/coords.ts`), Moon radius 1.
 * - Earth's direction is the server's sub-Earth point on the Moon.
 * - Earth's orientation is fixed by two Earth-fixed points of the same sample: the point below
 *   the Moon (`earth_sub_lunar_*`) must face the Moon, and the point below the Sun
 *   (`earth_sub_solar_*`) must face the Sun, whose direction is the server's sub-solar point on
 *   the Moon. Two point pairs fix a rotation (the TRIAD construction); no Earth rotation angle is
 *   derived from the clock. The Sun is far enough that its direction seen from Earth and from
 *   the Moon differ by less than 0.2°, which only affects the roll about the Earth–Moon line.
 * - Distances and sizes are compressed so both bodies fit in one view ("Not to scale").
 */

import type { BodySample } from '../../api/types';
import { latLonToVector, type LatLon, type Vec3 } from '../globe/coords';

/** Display scale only: real values are 220 Moon radii and 3.67 Moon radii. */
export const EARTH_DISTANCE = 9;
export const EARTH_RADIUS = 1.8;

/** Row-major 3 x 3 rotation taking Earth-fixed vectors to scene vectors. */
export type Rotation = readonly [number, number, number, number, number, number, number, number, number];

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const scale = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const norm = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const unit = (a: Vec3): Vec3 => scale(a, 1 / norm(a));

export function applyRotation(r: Rotation, v: Vec3): Vec3 {
  return {
    x: r[0] * v.x + r[1] * v.y + r[2] * v.z,
    y: r[3] * v.x + r[4] * v.y + r[5] * v.z,
    z: r[6] * v.x + r[7] * v.y + r[8] * v.z,
  };
}

/**
 * Rotation that takes `a1` to `b1` exactly and puts `a2` in the plane of `b1` and `b2`
 * (TRIAD). `null` when either pair is parallel, so the roll is not defined.
 */
export function triad(a1: Vec3, a2: Vec3, b1: Vec3, b2: Vec3): Rotation | null {
  const ca = cross(a1, a2);
  const cb = cross(b1, b2);
  if (norm(ca) < 1e-9 || norm(cb) < 1e-9) return null;
  const t1 = unit(a1);
  const t2 = unit(ca);
  const t3 = cross(t1, t2);
  const s1 = unit(b1);
  const s2 = unit(cb);
  const s3 = cross(s1, s2);
  // R = S * T^T, with the triads as columns.
  const S = [s1, s2, s3];
  const T = [t1, t2, t3];
  const m = (i: 'x' | 'y' | 'z', j: 'x' | 'y' | 'z') => S[0]![i] * T[0]![j] + S[1]![i] * T[1]![j] + S[2]![i] * T[2]![j];
  return [m('x', 'x'), m('x', 'y'), m('x', 'z'), m('y', 'x'), m('y', 'y'), m('y', 'z'), m('z', 'x'), m('z', 'y'), m('z', 'z')];
}

export interface EarthPose {
  /** Unit vector from the Moon's centre to Earth (the server's sub-Earth point). */
  direction: Vec3;
  /** Earth's centre in the scene. */
  centre: Vec3;
  /** Earth-fixed to scene rotation, or `null` when the Sun, Earth and Moon are in line. */
  rotation: Rotation | null;
  /** Unit vector to the Sun (the server's sub-solar point on the Moon). */
  sun: Vec3;
}

const finite = (...xs: number[]) => xs.every(Number.isFinite);

/** Earth's place and orientation for one server sample; `null` when a field is not a number. */
export function earthPose(sample: BodySample): EarthPose | null {
  const s = sample;
  if (
    !finite(
      s.sub_earth_lat_deg,
      s.sub_earth_lon_deg,
      s.sub_solar_lat_deg,
      s.sub_solar_lon_deg,
      s.earth_sub_lunar_lat_deg,
      s.earth_sub_lunar_lon_deg,
      s.earth_sub_solar_lat_deg,
      s.earth_sub_solar_lon_deg,
    )
  ) {
    return null;
  }
  const direction = latLonToVector({ lat_deg: s.sub_earth_lat_deg, lon_deg: s.sub_earth_lon_deg });
  const sun = latLonToVector({ lat_deg: s.sub_solar_lat_deg, lon_deg: s.sub_solar_lon_deg });
  const toMoonEarthFixed = latLonToVector({ lat_deg: s.earth_sub_lunar_lat_deg, lon_deg: s.earth_sub_lunar_lon_deg });
  const toSunEarthFixed = latLonToVector({ lat_deg: s.earth_sub_solar_lat_deg, lon_deg: s.earth_sub_solar_lon_deg });
  const rotation = triad(toMoonEarthFixed, toSunEarthFixed, scale(direction, -1), sun);
  return { direction, centre: scale(direction, EARTH_DISTANCE), rotation, sun };
}

/** Scene point of an Earth-fixed latitude and longitude (a ground station), slightly above the surface. */
export function earthPoint(pose: EarthPose, place: LatLon, lift = 1.0): Vec3 | null {
  if (!pose.rotation) return null;
  const local = latLonToVector(place, EARTH_RADIUS * lift);
  return add(pose.centre, applyRotation(pose.rotation, local));
}

/** Point on the Moon (radius 1) for a site, slightly above the surface. */
export function moonPoint(place: LatLon, lift = 1.0): Vec3 {
  return latLonToVector(place, lift);
}

/**
 * Drawing position of the schematic relay satellite: above the Moon, between the site's zenith
 * and the Earth direction, so the dashed path can be seen. It is not an orbit and says nothing
 * about where a real relay would be.
 */
export function relayPoint(site: LatLon, earthDirection: Vec3, height = 2.4): Vec3 {
  const up = latLonToVector(site);
  const mid = add(up, earthDirection);
  if (norm(mid) > 0.2) return scale(unit(mid), height);
  // Site and Earth on opposite sides: go round the limb, perpendicular to the Earth direction.
  const side = cross(earthDirection, Math.abs(earthDirection.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 });
  return scale(unit(side), height);
}

/** Angle in degrees between two vectors, for tests and checks. */
export function angleDeg(a: Vec3, b: Vec3): number {
  const c = dot(a, b) / (norm(a) * norm(b));
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

/**
 * Decorative star field: random points on a far sphere from a fixed seed, so it is the same on
 * every load. It is not a star catalogue and the UI says so.
 */
export function decorativeStars(count: number, radius: number, seed = 12345): Vec3[] {
  let state = seed >>> 0;
  const next = () => {
    // Linear congruential generator (Numerical Recipes constants).
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const stars: Vec3[] = [];
  for (let i = 0; i < count; i += 1) {
    const z = next() * 2 - 1;
    const a = next() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    stars.push({ x: radius * r * Math.cos(a), y: radius * z, z: radius * r * Math.sin(a) });
  }
  return stars;
}
