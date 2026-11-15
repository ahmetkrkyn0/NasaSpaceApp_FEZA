/**
 * Line of sight over the height maps (docs/design/3b-gorev-gorunumleri.md, section 6).
 *
 * Given a direction to a body that the server computed (the Sun from the sub-solar point of
 * `/api/body-series`, the Earth from the sub-Earth point and distance), this module walks over
 * the terrain towards the body and finds the terrain horizon in that direction. No ephemeris
 * work happens here: the body's direction, distance and apparent radius are inputs.
 *
 * Frame: the Moon-fixed frame of `globe/coords.ts` (north pole +Y, 0° longitude +Z, 90° E +X),
 * in metres from the Moon's centre. Map points are in the south polar stereographic metres of
 * `map/projection.ts`. The walk is done on the sphere, so the Moon's curvature is exact: a
 * point at the same height at an arc of θ sits θ/2 below the local horizontal.
 */

import type { LayerGrid } from '../../api/types';
import type { Vec3 } from '../globe/coords';
import { MOON_RADIUS_M, type ProjectedPoint } from '../map/projection';

const DEG = Math.PI / 180;
const R = MOON_RADIUS_M;

/** Unit vector of a map point (projected metres). */
export function unprojectUnit(x_m: number, y_m: number): Vec3 {
  const a = x_m / (2 * R);
  const b = y_m / (2 * R);
  const t2 = a * a + b * b;
  return { x: (2 * a) / (t2 + 1), y: (t2 - 1) / (t2 + 1), z: (2 * b) / (t2 + 1) };
}

/** Map point (projected metres) below a direction from the Moon's centre. */
export function projectUnit(u: Vec3): ProjectedPoint {
  const n = Math.hypot(u.x, u.y, u.z) || 1;
  const k = (2 * R) / (1 - u.y / n);
  return { x_m: (k * u.x) / n, y_m: (k * u.z) / n };
}

interface Level {
  values: Float32Array;
  rows: number;
  cols: number;
  x_min: number;
  y_max: number;
  x_max: number;
  y_min: number;
  dx: number;
  dy: number;
}

/** Height maps prepared for the walk, finest first. */
export interface ShadowTerrain {
  levels: Level[];
  /** Highest finite height of all levels, metres. */
  maxHeight_m: number;
  /** Cell size of the finest level, metres. */
  finest_m: number;
}

/**
 * Prepares nested height grids. Give them finest first; each point is read from the first grid
 * that has data there, so a detailed window sits inside a wider, coarser one. Grids without map
 * bounds are left out.
 */
export function prepareTerrain(grids: readonly LayerGrid[]): ShadowTerrain {
  const levels: Level[] = [];
  let maxHeight = -Infinity;
  for (const g of grids) {
    const b = g.bounds;
    if (!b || g.rows < 1 || g.cols < 1) continue;
    for (const v of g.values) if (Number.isFinite(v) && v > maxHeight) maxHeight = v;
    levels.push({
      values: g.values,
      rows: g.rows,
      cols: g.cols,
      x_min: b.x_min,
      y_max: b.y_max,
      x_max: b.x_max,
      y_min: b.y_min,
      dx: (b.x_max - b.x_min) / g.cols,
      dy: (b.y_max - b.y_min) / g.rows,
    });
  }
  const finest = levels.reduce((m, l) => Math.min(m, l.dx, l.dy), Infinity);
  return { levels, maxHeight_m: Number.isFinite(maxHeight) ? maxHeight : 0, finest_m: Number.isFinite(finest) ? finest : 0 };
}

/** Returned by `terrainHeight` for a point outside every grid. */
export const OUTSIDE = Number.NEGATIVE_INFINITY;

/**
 * Height in metres at a map point, bilinear between cell centres, from the finest grid that has
 * data there. `NaN` in a gap of every grid that covers the point, `OUTSIDE` beyond all grids.
 */
export function terrainHeight(terrain: ShadowTerrain, x_m: number, y_m: number): number {
  let covered = false;
  for (const l of terrain.levels) {
    if (x_m < l.x_min || x_m > l.x_max || y_m < l.y_min || y_m > l.y_max) continue;
    covered = true;
    let fc = (x_m - l.x_min) / l.dx - 0.5;
    let fr = (l.y_max - y_m) / l.dy - 0.5;
    if (fc < 0) fc = 0;
    else if (fc > l.cols - 1) fc = l.cols - 1;
    if (fr < 0) fr = 0;
    else if (fr > l.rows - 1) fr = l.rows - 1;
    const c0 = Math.floor(fc);
    const r0 = Math.floor(fr);
    const c1 = c0 + 1 < l.cols ? c0 + 1 : c0;
    const r1 = r0 + 1 < l.rows ? r0 + 1 : r0;
    const tc = fc - c0;
    const tr = fr - r0;
    const v = l.values;
    // A neighbour with no weight is not read, so a gap beside a valid cell does not hide it.
    let h = 0;
    const w00 = (1 - tr) * (1 - tc);
    const w01 = (1 - tr) * tc;
    const w10 = tr * (1 - tc);
    const w11 = tr * tc;
    if (w00 > 0) h += w00 * (v[r0 * l.cols + c0] ?? Number.NaN);
    if (w01 > 0) h += w01 * (v[r0 * l.cols + c1] ?? Number.NaN);
    if (w10 > 0) h += w10 * (v[r1 * l.cols + c0] ?? Number.NaN);
    if (w11 > 0) h += w11 * (v[r1 * l.cols + c1] ?? Number.NaN);
    if (Number.isFinite(h)) return h;
  }
  return covered ? Number.NaN : OUTSIDE;
}

/** A point on the ground: map metres and height above the reference sphere. */
export interface SurfacePoint {
  x_m: number;
  y_m: number;
  height_m: number;
}

export interface SightlineOptions {
  /** Eye height above the ground, metres (a mast). Default 0. */
  eye_m?: number;
  /** First step and smallest step, metres. Default: the finest cell size. */
  step_m?: number;
  /** Each step is at least this share of the distance walked, so far terrain is sampled sparsely. */
  growth?: number;
  /** The walk stops here, metres. Default 150 km, the range of the server's terrain horizon. */
  maxDistance_m?: number;
  /** Stop as soon as the horizon reaches this angle (degrees); used when only "blocked or not" matters. */
  stopAbove_deg?: number;
}

export const DEFAULT_GROWTH = 0.02;
export const DEFAULT_MAX_DISTANCE_M = 150_000;

export interface Sightline {
  /** Elevation of the body's centre above the local horizontal, degrees. */
  elevation_deg: number;
  /** Highest terrain angle towards the body, degrees; negative on open ground (the Moon curves away). */
  horizon_deg: number;
  /** The terrain point that sets the horizon; `null` when no terrain was read. */
  blocker: (SurfacePoint & { distance_m: number }) | null;
  /** Ground distance the walk covered with data, metres. Short when the grids end early. */
  reach_m: number;
}

/**
 * Terrain horizon from a ground point towards a body. `toBody` is the direction from the point
 * to the body in the Moon-fixed frame; it need not be a unit vector.
 */
export function sightline(terrain: ShadowTerrain, point: SurfacePoint, toBody: Vec3, options: SightlineOptions = {}): Sightline {
  const u = unprojectUnit(point.x_m, point.y_m);
  const bn = Math.hypot(toBody.x, toBody.y, toBody.z) || 1;
  const bx = toBody.x / bn;
  const by = toBody.y / bn;
  const bz = toBody.z / bn;
  const sinEl = Math.min(1, Math.max(-1, u.x * bx + u.y * by + u.z * bz));
  const elevation_deg = Math.asin(sinEl) / DEG;

  // Horizontal direction towards the body at the point.
  let ex = bx - sinEl * u.x;
  let ey = by - sinEl * u.y;
  let ez = bz - sinEl * u.z;
  const en = Math.hypot(ex, ey, ez);
  if (en < 1e-9 || terrain.levels.length === 0) {
    // Body at the zenith or nadir, or no terrain: nothing to walk over.
    return { elevation_deg, horizon_deg: -90, blocker: null, reach_m: 0 };
  }
  ex /= en;
  ey /= en;
  ez /= en;

  const r0 = R + point.height_m + (options.eye_m ?? 0);
  const step = Math.max(options.step_m ?? terrain.finest_m, 1e-3);
  const growth = options.growth ?? DEFAULT_GROWTH;
  const maxDistance = options.maxDistance_m ?? DEFAULT_MAX_DISTANCE_M;
  const stopAbove = options.stopAbove_deg !== undefined ? options.stopAbove_deg * DEG : Infinity;
  const rTop = R + terrain.maxHeight_m;

  let best = -Math.PI / 2;
  let blocker: Sightline['blocker'] = null;
  let reach = 0;
  for (let d = step; d <= maxDistance; d += Math.max(step, d * growth)) {
    const theta = d / R;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    // No terrain from here on can rise above the horizon already found: the angle to the
    // highest height of the data only falls with distance.
    if (Math.atan2(rTop * c - r0, rTop * s) < best) break;
    const gx = u.x * c + ex * s;
    const gy = u.y * c + ey * s;
    const gz = u.z * c + ez * s;
    const k = (2 * R) / (1 - gy);
    const x = k * gx;
    const y = k * gz;
    const h = terrainHeight(terrain, x, y);
    if (h === OUTSIDE) break;
    reach = d;
    if (Number.isNaN(h)) continue;
    const rt = R + h;
    const angle = Math.atan2(rt * c - r0, rt * s);
    if (angle > best) {
      best = angle;
      blocker = { x_m: x, y_m: y, height_m: h, distance_m: d };
      if (best >= stopAbove) break;
    }
  }
  return { elevation_deg, horizon_deg: best / DEG, blocker, reach_m: reach };
}

/**
 * Share of a disk's area above a straight horizon. `offset_deg` is the height of the disk's
 * centre above the horizon; the same definition as the server's `visible_fraction`
 * (docs/design/ufuk-hesabi.md, "Güneş'i disk olarak ele almak").
 */
export function diskFraction(offset_deg: number, radius_deg: number): number {
  if (!(radius_deg > 0)) return offset_deg >= 0 ? 1 : 0;
  const x = offset_deg / radius_deg;
  if (x >= 1) return 1;
  if (x <= -1) return 0;
  return 1 - (Math.acos(x) - x * Math.sqrt(1 - x * x)) / Math.PI;
}

/** Position of a ground point (with an eye height) in the Moon-fixed frame, metres. */
export function surfacePosition(point: SurfacePoint, eye_m = 0): Vec3 {
  const u = unprojectUnit(point.x_m, point.y_m);
  const r = R + point.height_m + eye_m;
  return { x: u.x * r, y: u.y * r, z: u.z * r };
}

/**
 * Direction from a ground point to a body at a finite distance (the Earth). `fromCentre` is the
 * unit direction from the Moon's centre (the server's sub-Earth point) and `distance_m` the
 * server's centre-to-centre distance; this only subtracts the point's own position.
 */
export function directionToNearBody(point: SurfacePoint, fromCentre: Vec3, distance_m: number, eye_m = 0): Vec3 {
  const p = surfacePosition(point, eye_m);
  return { x: fromCentre.x * distance_m - p.x, y: fromCentre.y * distance_m - p.y, z: fromCentre.z * distance_m - p.z };
}

/** A body as the server describes it, seen from the Moon. */
export interface SkyBody {
  /** Unit direction from the Moon's centre (sub-solar or sub-Earth point). */
  direction: Vec3;
  /** Centre-to-centre distance in metres; `null` for the Sun, whose direction is the same everywhere. */
  distance_m: number | null;
  /** Apparent radius in degrees, from the server. */
  radius_deg: number;
}

export interface Visibility extends Sightline {
  /** Share of the body's disk above the terrain horizon, 0 to 1. */
  fraction: number;
}

/** How much of a body's disk a ground point sees. */
export function bodyVisibility(terrain: ShadowTerrain, point: SurfacePoint, body: SkyBody, options: SightlineOptions = {}): Visibility {
  const to = body.distance_m === null ? body.direction : directionToNearBody(point, body.direction, body.distance_m, options.eye_m ?? 0);
  const line = sightline(terrain, point, to, options);
  return { ...line, fraction: diskFraction(line.elevation_deg - line.horizon_deg, body.radius_deg) };
}

/** The vertices of a mesh built over a height grid: which grid cell each one samples. */
export interface MeshCells {
  rows: number;
  cols: number;
  /** Grid row and column per vertex (`TerrainMesh.cells`). */
  cells: Uint32Array;
}

/**
 * Visible share of a body's disk at every vertex of a mesh (0 in shadow, 1 in full view, between
 * in the penumbra). A vertex over a gap of the grid gets `NaN`. The walk stops early once the
 * disk is fully covered.
 */
export function visibilityMap(
  terrain: ShadowTerrain,
  grid: LayerGrid,
  mesh: MeshCells,
  body: SkyBody,
  options: SightlineOptions = {},
): Float32Array {
  const count = mesh.rows * mesh.cols;
  const out = new Float32Array(count);
  const b = grid.bounds;
  if (!b) return out.fill(Number.NaN);
  const dx = (b.x_max - b.x_min) / grid.cols;
  const dy = (b.y_max - b.y_min) / grid.rows;
  const point: SurfacePoint = { x_m: 0, y_m: 0, height_m: 0 };
  const walk: SightlineOptions = { ...options };
  for (let k = 0; k < count; k += 1) {
    const r = mesh.cells[k * 2] ?? 0;
    const c = mesh.cells[k * 2 + 1] ?? 0;
    const h = grid.values[r * grid.cols + c] ?? Number.NaN;
    if (!Number.isFinite(h)) {
      out[k] = Number.NaN;
      continue;
    }
    point.x_m = b.x_min + (c + 0.5) * dx;
    point.y_m = b.y_max - (r + 0.5) * dy;
    point.height_m = h;
    const to = body.distance_m === null ? body.direction : directionToNearBody(point, body.direction, body.distance_m, options.eye_m ?? 0);
    // Elevation first: it sets the angle at which the disk is fully covered.
    const u = unprojectUnit(point.x_m, point.y_m);
    const n = Math.hypot(to.x, to.y, to.z) || 1;
    const el = Math.asin(Math.min(1, Math.max(-1, (u.x * to.x + u.y * to.y + u.z * to.z) / n))) / DEG;
    walk.stopAbove_deg = el + body.radius_deg;
    const line = sightline(terrain, point, to, walk);
    out[k] = diskFraction(line.elevation_deg - line.horizon_deg, body.radius_deg);
  }
  return out;
}
