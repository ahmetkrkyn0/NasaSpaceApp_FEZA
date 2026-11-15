/**
 * South polar terrain on the 3D Moon: the LOLA height map from 80° S to the pole (the
 * `south-pole-cap` region of `/api/layers/elevation`) drawn as a relief on the globe, lit by the
 * Sun direction from the server's sub-solar point, with the shadows the terrain casts
 * (`terrain3d/shadow.ts`). No ephemeris work happens here.
 *
 * Positions are in globe units (radius 1 is the 1737.4 km reference sphere) in the frame of
 * `coords.ts`, which is also the frame of the shadow walk. Heights are drawn true to scale.
 */

import type { LayerGrid } from '../../api/types';
import { MOON_RADIUS_M } from '../map/projection';
import { heightAt } from '../terrain3d/geometry';
import { readoutText, slopeAt } from '../terrain3d/readout';
import { projectUnit, unprojectUnit, type MeshCells, type SkyBody } from '../terrain3d/shadow';
import { vectorToLatLon, type Vec3 } from './coords';

/** Region of `/api/layers/elevation` that holds the south polar cap. */
export const POLAR_REGION = 'south-pole-cap';

/** Map distance of 80° S from the pole on the south polar stereographic map: 2 R tan(5°). */
export const CAP_EDGE_M = 2 * MOON_RADIUS_M * Math.tan((5 * Math.PI) / 180);

/** Vertices per side at most; the 320 m grid is thinned to about 1 km between vertices. */
export const CAP_MAX_SIDE = 640;

/**
 * Apparent radius of the Sun's disk seen from the Moon, degrees. Assumed: the server's body
 * series gives no Sun distance; the true radius varies by about 1.7 % over the year.
 */
export const SUN_RADIUS_DEG = 0.2666;

export const POLAR_NOTE =
  'South of 80° S: LOLA heights at 320 m, true to scale, lit by the computed Sun direction with the shadows the terrain casts. Drawn in the browser from the height map; the Sun disk size is assumed.';
export const POLAR_MISSING_NOTE = 'The south polar height map is not available on the server, so the pole shows the surface image only.';

export interface PolarCap extends MeshCells {
  /** Globe units, three per vertex. */
  positions: Float32Array;
  /** Triangles inside 80° S over cells with data. */
  indices: Uint32Array;
  /** Grid cells between drawn vertices. */
  stride: number;
}

function sampled(count: number, stride: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < count; k += stride) out.push(k);
  if (out[out.length - 1] !== count - 1) out.push(count - 1);
  return out;
}

/**
 * Relief mesh of the cap: one vertex per `stride` cells (last row and column kept), each at its
 * true radius. Triangles are kept only inside `edge_m` of the pole and where all three corners
 * have data. `null` for a grid without map bounds.
 */
export function buildPolarCap(grid: LayerGrid, maxSide = CAP_MAX_SIDE, edge_m = CAP_EDGE_M): PolarCap | null {
  const b = grid.bounds;
  if (!b || grid.rows < 2 || grid.cols < 2) return null;
  const stride = Math.max(1, Math.ceil(Math.max(grid.rows, grid.cols) / maxSide));
  const rowsAt = sampled(grid.rows, stride);
  const colsAt = sampled(grid.cols, stride);
  const rows = rowsAt.length;
  const cols = colsAt.length;
  const dx = (b.x_max - b.x_min) / grid.cols;
  const dy = (b.y_max - b.y_min) / grid.rows;
  const positions = new Float32Array(rows * cols * 3);
  const cells = new Uint32Array(rows * cols * 2);
  const usable = new Uint8Array(rows * cols);
  for (let i = 0; i < rows; i += 1) {
    const r = rowsAt[i]!;
    for (let j = 0; j < cols; j += 1) {
      const c = colsAt[j]!;
      const k = i * cols + j;
      const x = b.x_min + (c + 0.5) * dx;
      const y = b.y_max - (r + 0.5) * dy;
      const h = grid.values[r * grid.cols + c] ?? Number.NaN;
      const u = unprojectUnit(x, y);
      const s = (MOON_RADIUS_M + (Number.isFinite(h) ? h : 0)) / MOON_RADIUS_M;
      positions[k * 3] = u.x * s;
      positions[k * 3 + 1] = u.y * s;
      positions[k * 3 + 2] = u.z * s;
      cells[k * 2] = r;
      cells[k * 2 + 1] = c;
      usable[k] = Number.isFinite(h) && Math.hypot(x, y) <= edge_m ? 1 : 0;
    }
  }
  const tri: number[] = [];
  for (let i = 0; i + 1 < rows; i += 1) {
    for (let j = 0; j + 1 < cols; j += 1) {
      const a = i * cols + j;
      const bb = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (usable[a] && usable[bb] && usable[c] && usable[d]) tri.push(a, c, bb, bb, c, d);
    }
  }
  return { rows, cols, cells, positions, indices: Uint32Array.from(tri), stride };
}

/** Outward unit normal of every vertex from its neighbours in the vertex grid. */
export function capNormals(cap: Pick<PolarCap, 'rows' | 'cols' | 'positions'>): Float32Array {
  const { rows, cols, positions: p } = cap;
  const out = new Float32Array(rows * cols * 3);
  const at = (i: number, j: number, axis: number) => p[(i * cols + j) * 3 + axis] ?? 0;
  for (let i = 0; i < rows; i += 1) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(rows - 1, i + 1);
    for (let j = 0; j < cols; j += 1) {
      const j0 = Math.max(0, j - 1);
      const j1 = Math.min(cols - 1, j + 1);
      const ax = at(i, j1, 0) - at(i, j0, 0);
      const ay = at(i, j1, 1) - at(i, j0, 1);
      const az = at(i, j1, 2) - at(i, j0, 2);
      const bx = at(i1, j, 0) - at(i0, j, 0);
      const by = at(i1, j, 1) - at(i0, j, 1);
      const bz = at(i1, j, 2) - at(i0, j, 2);
      let nx = ay * bz - az * by;
      let ny = az * bx - ax * bz;
      let nz = ax * by - ay * bx;
      const k = (i * cols + j) * 3;
      // Face away from the Moon's centre, whatever the order of the grid axes.
      if (nx * at(i, j, 0) + ny * at(i, j, 1) + nz * at(i, j, 2) < 0) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }
      const n = Math.hypot(nx, ny, nz) || 1;
      out[k] = nx / n;
      out[k + 1] = ny / n;
      out[k + 2] = nz / n;
    }
  }
  return out;
}

/** Grey of the ground under even light (linear colour). */
const GROUND = 0.62;

/** Light on ground the Sun does not reach, linear colour; not a physical value. */
export const CAP_AMBIENT = 0.03;
/** Brightest sunlit ground, linear colour. */
export const CAP_LIT = 0.5;
/** A slope facing the Sun at this sine (20°) or more is drawn at full brightness. */
export const FULL_LIGHT_SINE = Math.sin((20 * Math.PI) / 180);

/**
 * Grey per vertex (linear RGB). Under the Sun: ambient plus the sunlit share of the disk times
 * how squarely the slope faces the Sun, on a square-root curve that reaches full brightness at
 * 20°. Near the pole the Sun is never more than a few degrees up, so a linear curve would leave
 * level ground nearly black; the curve keeps it readable and is a drawing choice, not a
 * measurement. Without a Sun, slopes are shaded only by how far they lean.
 */
export function capColours(normals: Float32Array, sun: Vec3 | null, visible: Float32Array | null): Float32Array {
  const count = normals.length / 3;
  const out = new Float32Array(count * 3);
  for (let k = 0; k < count; k += 1) {
    const nx = normals[k * 3] ?? 0;
    const ny = normals[k * 3 + 1] ?? -1;
    const nz = normals[k * 3 + 2] ?? 0;
    let g: number;
    if (sun) {
      const facing = nx * sun.x + ny * sun.y + nz * sun.z;
      const share = visible ? visible[k] ?? 1 : 1;
      const direct = facing > 0 ? Math.min(1, Math.sqrt(facing / FULL_LIGHT_SINE)) * (Number.isFinite(share) ? share : 1) : 0;
      g = CAP_AMBIENT + (CAP_LIT - CAP_AMBIENT) * direct;
    } else {
      g = GROUND * (0.55 + 0.45 * Math.abs(ny));
    }
    out[k * 3] = g;
    out[k * 3 + 1] = g;
    out[k * 3 + 2] = g;
  }
  return out;
}

/** The Sun for the shadow walk, from the server's sub-solar direction. */
export function sunBody(direction: Vec3 | null): SkyBody | null {
  return direction ? { direction, distance_m: null, radius_deg: SUN_RADIUS_DEG } : null;
}

/** One line for the point under the cursor: latitude, longitude, height, slope, Sun share. */
export function capReadout(grid: LayerGrid, point: Vec3, sunShare: number | null): string {
  const ll = vectorToLatLon(point);
  const m = projectUnit(point);
  const height = Math.hypot(m.x_m, m.y_m) <= CAP_EDGE_M ? heightAt(grid, m.x_m, m.y_m) : null;
  return readoutText({
    lat_deg: ll.lat_deg,
    lon_deg: ll.lon_deg,
    height_m: height,
    slope_deg: height === null ? null : slopeAt(grid, m.x_m, m.y_m),
    sun_fraction: height === null ? null : sunShare,
  });
}

/** Index of the vertex nearest a point on the cap, from its map position. */
export function capVertexAt(grid: LayerGrid, cap: Pick<PolarCap, 'rows' | 'cols' | 'stride'>, point: Vec3): number | null {
  const b = grid.bounds;
  if (!b) return null;
  const m = projectUnit(point);
  const c = Math.floor(((m.x_m - b.x_min) / (b.x_max - b.x_min)) * grid.cols);
  const r = Math.floor(((b.y_max - m.y_m) / (b.y_max - b.y_min)) * grid.rows);
  if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return null;
  const i = Math.min(cap.rows - 1, Math.round(r / cap.stride));
  const j = Math.min(cap.cols - 1, Math.round(c / cap.stride));
  return i * cap.cols + j;
}

/** Ground width of one screen pixel in kilometres, for the scale bar. */
export function kmPerPixel(distanceToGround: number, fovDeg: number, heightPx: number): number {
  if (!(heightPx > 0)) return Number.NaN;
  const span = 2 * distanceToGround * Math.tan((fovDeg * Math.PI) / 360);
  return (span * MOON_RADIUS_M) / 1000 / heightPx;
}
