/**
 * Pure helpers of the 3D terrain view (issue #106). They turn the server's height grid
 * (`/api/layers/elevation`, its `X-Layer-Bounds`) into vertex positions, place sites with the
 * map projection of `../map/projection` (the only place its constants live) and turn the
 * server's Sun azimuth and elevation at the selected site into a light direction. Nothing about
 * the Sun is computed here; azimuth and elevation come from `/api/sky-series`.
 *
 * Scene axes: X along the map's x (towards 90 E), Z = minus the map's y, Y up, in kilometres.
 * Looking down with the camera's up along -Z, the grid's row 0 (its northern edge, `y_max`)
 * is at the top, as on the 2D map.
 */

import type { LayerGrid } from '../../api/types';
import { forwardSouthPolar } from '../map/projection';

/** Heights are drawn this many times taller than they are. Shown on screen next to the view. */
export const VERTICAL_EXAGGERATION = 3;

/** Longest side of the drawn mesh, in vertices; the grid is thinned to fit. */
export const MAX_SIDE = 250;

const M_PER_KM = 1000;

export interface TerrainMesh {
  /** Vertices per row and per column of the drawn mesh. */
  rows: number;
  cols: number;
  /** Grid cells between neighbouring vertices. */
  stride: number;
  /** `x, y, z` per vertex in kilometres; heights already multiplied by `exaggeration`. */
  positions: Float32Array;
  /** Grid row and column each vertex samples. */
  cells: Uint32Array;
  /** Two triangles per mesh cell. */
  indices: Uint32Array;
  /** Height (metres, not exaggerated) that sits at scene height 0. */
  baseHeight_m: number;
  exaggeration: number;
  /** `false` for the example grid, which has no map bounds: positions are then in cell units. */
  mapped: boolean;
  /** Grid centre in projected metres (map frame), when mapped. */
  centre_m: { x: number; y: number } | null;
}

/** Cell size in metres along x and y, from the bounds and the grid shape. */
export function cellSize(grid: LayerGrid): { dx: number; dy: number } | null {
  const b = grid.bounds;
  if (!b || grid.cols < 1 || grid.rows < 1) return null;
  return { dx: (b.x_max - b.x_min) / grid.cols, dy: (b.y_max - b.y_min) / grid.rows };
}

/** Projected metres of a cell centre; row 0 is the northern edge (`y_max`). */
export function cellCentre(grid: LayerGrid, row: number, col: number): { x: number; y: number } | null {
  const size = cellSize(grid);
  const b = grid.bounds;
  if (!size || !b) return null;
  return { x: b.x_min + (col + 0.5) * size.dx, y: b.y_max - (row + 0.5) * size.dy };
}

function finiteMin(values: Float32Array): number {
  let min = Infinity;
  for (const v of values) if (Number.isFinite(v) && v < min) min = v;
  return Number.isFinite(min) ? min : 0;
}

/** Sample indices along one side: every `stride` cells, always ending on the last cell. */
function samples(length: number, stride: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < length; i += stride) out.push(i);
  if (out[out.length - 1] !== length - 1) out.push(length - 1);
  return out;
}

/** Mesh of a height grid, thinned to at most `maxSide` vertices per side. */
export function buildTerrain(
  grid: LayerGrid,
  exaggeration: number = VERTICAL_EXAGGERATION,
  maxSide: number = MAX_SIDE,
): TerrainMesh {
  const stride = Math.max(1, Math.ceil(Math.max(grid.rows, grid.cols) / maxSide));
  const rowIdx = samples(grid.rows, stride);
  const colIdx = samples(grid.cols, stride);
  const rows = rowIdx.length;
  const cols = colIdx.length;
  const base = finiteMin(grid.values);
  const size = cellSize(grid);
  const b = grid.bounds;
  const centre = b ? { x: (b.x_min + b.x_max) / 2, y: (b.y_min + b.y_max) / 2 } : null;

  const positions = new Float32Array(rows * cols * 3);
  const cells = new Uint32Array(rows * cols * 2);
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const r = rowIdx[i] ?? 0;
      const c = colIdx[j] ?? 0;
      const v = grid.values[r * grid.cols + c] ?? Number.NaN;
      const h = Number.isFinite(v) ? v : base;
      const k = i * cols + j;
      let x: number;
      let z: number;
      if (size && b && centre) {
        x = (b.x_min + (c + 0.5) * size.dx - centre.x) / M_PER_KM;
        z = -(b.y_max - (r + 0.5) * size.dy - centre.y) / M_PER_KM;
      } else {
        x = c - (grid.cols - 1) / 2;
        z = r - (grid.rows - 1) / 2;
      }
      positions[k * 3] = x;
      positions[k * 3 + 1] = ((h - base) * exaggeration) / (size ? M_PER_KM : 1);
      positions[k * 3 + 2] = z;
      cells[k * 2] = r;
      cells[k * 2 + 1] = c;
    }
  }
  const indices = new Uint32Array((rows - 1) * (cols - 1) * 6);
  let n = 0;
  for (let i = 0; i < rows - 1; i += 1) {
    for (let j = 0; j < cols - 1; j += 1) {
      const a = i * cols + j;
      const bb = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.set([a, c, bb, bb, c, d], n);
      n += 6;
    }
  }
  return { rows, cols, stride, positions, cells, indices, baseHeight_m: base, exaggeration, mapped: Boolean(size), centre_m: centre };
}

/** Height at projected metres, bilinear between cell centres; `null` outside the grid or in a gap. */
export function heightAt(grid: LayerGrid, x_m: number, y_m: number): number | null {
  const size = cellSize(grid);
  const b = grid.bounds;
  if (!size || !b) return null;
  if (x_m < b.x_min || x_m > b.x_max || y_m < b.y_min || y_m > b.y_max) return null;
  const fc = Math.min(Math.max((x_m - b.x_min) / size.dx - 0.5, 0), grid.cols - 1);
  const fr = Math.min(Math.max((b.y_max - y_m) / size.dy - 0.5, 0), grid.rows - 1);
  const c0 = Math.floor(fc);
  const r0 = Math.floor(fr);
  const c1 = Math.min(c0 + 1, grid.cols - 1);
  const r1 = Math.min(r0 + 1, grid.rows - 1);
  const tc = fc - c0;
  const tr = fr - r0;
  // A neighbour with no weight is skipped, so a gap next to a valid cell does not hide it.
  const terms: [number, number, number][] = [
    [r0, c0, (1 - tr) * (1 - tc)],
    [r0, c1, (1 - tr) * tc],
    [r1, c0, tr * (1 - tc)],
    [r1, c1, tr * tc],
  ];
  let v = 0;
  for (const [r, c, w] of terms) {
    if (w === 0) continue;
    const h = grid.values[r * grid.cols + c] ?? Number.NaN;
    if (!Number.isFinite(h)) return null;
    v += w * h;
  }
  return v;
}

/** Index of the last entry of an ascending list that is at or below `x` (0 below the first). */
function segment(edges: readonly number[], x: number): number {
  let i = 0;
  while (i < edges.length - 2 && (edges[i + 1] ?? Infinity) <= x) i += 1;
  return i;
}

/**
 * Drawn surface height (scene units, already exaggerated) at scene `x`, `z`, read from the
 * thinned mesh triangles themselves, so a mark sits on the surface that is drawn rather than on
 * the full grid. Points between the grid edge and the outer vertices take the edge height.
 */
export function meshHeightAt(mesh: TerrainMesh, x: number, z: number): number {
  const { rows, cols, positions } = mesh;
  const px = (k: number, axis: number) => positions[k * 3 + axis] ?? 0;
  if (rows < 2 || cols < 2) return px(0, 1);
  const xs = Array.from({ length: cols }, (_, j) => px(j, 0));
  const zs = Array.from({ length: rows }, (_, i) => px(i * cols, 2));
  const j = segment(xs, x);
  const i = segment(zs, z);
  const clamp = (t: number) => Math.min(Math.max(t, 0), 1);
  const u = clamp((x - (xs[j] ?? 0)) / ((xs[j + 1] ?? 1) - (xs[j] ?? 0) || 1));
  const v = clamp((z - (zs[i] ?? 0)) / ((zs[i + 1] ?? 1) - (zs[i] ?? 0) || 1));
  // The two triangles of the quad, split along b-c as in `buildTerrain`'s indices.
  const a = i * cols + j;
  const ya = px(a, 1);
  const yb = px(a + 1, 1);
  const yc = px(a + cols, 1);
  const yd = px(a + cols + 1, 1);
  if (u + v <= 1) return ya + u * (yb - ya) + v * (yc - ya);
  return yd + (1 - u) * (yc - yd) + (1 - v) * (yb - yd);
}

export interface ScenePoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Scene position of a latitude and longitude on the drawn surface, through the map projection;
 * `null` when the point is outside the grid, the grid has no bounds, or the height there is missing.
 */
export function placeOnTerrain(grid: LayerGrid, mesh: TerrainMesh, lat_deg: number, lon_deg: number): ScenePoint | null {
  if (!mesh.centre_m) return null;
  const p = forwardSouthPolar(lat_deg, lon_deg);
  // The full grid says whether there is data here; the height is read from the drawn mesh.
  if (heightAt(grid, p.x_m, p.y_m) === null) return null;
  const x = (p.x_m - mesh.centre_m.x) / M_PER_KM;
  const z = -(p.y_m - mesh.centre_m.y) / M_PER_KM;
  return { x, y: meshHeightAt(mesh, x, z), z };
}

/**
 * Unit vector towards the Sun in scene axes, from the server's azimuth (from true north,
 * clockwise to east) and elevation at a site. North at a point of the south polar map points
 * away from the pole, east is a quarter turn clockwise of it; this only reorients the server's
 * angles onto the drawing.
 */
export function sunVector(azimuth_deg: number, elevation_deg: number, lat_deg: number, lon_deg: number): ScenePoint {
  const p = forwardSouthPolar(lat_deg, lon_deg);
  const rho = Math.hypot(p.x_m, p.y_m) || 1;
  const north = { x: p.x_m / rho, y: p.y_m / rho };
  const east = { x: north.y, y: -north.x };
  const az = (azimuth_deg * Math.PI) / 180;
  const el = (elevation_deg * Math.PI) / 180;
  const mx = Math.cos(el) * (Math.cos(az) * north.x + Math.sin(az) * east.x);
  const my = Math.cos(el) * (Math.cos(az) * north.y + Math.sin(az) * east.y);
  return { x: mx, y: Math.sin(el), z: -my };
}

/** Text shown with the view; it states the factor the mesh was built with. */
export function exaggerationNote(mesh: Pick<TerrainMesh, 'exaggeration'>): string {
  return `Vertical exaggeration ×${mesh.exaggeration}`;
}

export const SHADING_NOTE = 'Shading uses the Sun direction at the selected site; cast shadows are not computed.';
export const NO_SUN_NOTE = 'Even light: the Sun direction at the selected site is not loaded.';
export const PSR_SURFACE_NOTE = 'Permanent shadow: shadow, not ice. Ice presence is uncertain.';

/** Surface colours offered over the terrain: the 2D map's layers and colour scales. */
export const SURFACE_LAYERS = ['hillshade', 'slope', 'psr'] as const;
export type SurfaceLayer = (typeof SURFACE_LAYERS)[number];

/** Grey of the ground under the permanent-shadow mask. */
const PSR_GROUND = 0.55;

/**
 * RGB per vertex (0..1) from a colour layer, through `layerPixels` of the 2D map. A colour grid
 * of another shape is sampled proportionally; transparent cells (NaN) stay ground grey, and the
 * permanent-shadow mask is blended over the ground by its opacity.
 */
export function vertexColours(
  mesh: TerrainMesh,
  heightGrid: Pick<LayerGrid, 'rows' | 'cols'>,
  colourGrid: LayerGrid,
  pixels: Uint8ClampedArray,
): Float32Array {
  const out = new Float32Array(mesh.rows * mesh.cols * 3);
  const sr = colourGrid.rows / heightGrid.rows;
  const sc = colourGrid.cols / heightGrid.cols;
  for (let k = 0; k < mesh.rows * mesh.cols; k += 1) {
    const r = Math.min(colourGrid.rows - 1, Math.floor(((mesh.cells[k * 2] ?? 0) + 0.5) * sr));
    const c = Math.min(colourGrid.cols - 1, Math.floor(((mesh.cells[k * 2 + 1] ?? 0) + 0.5) * sc));
    const o = (r * colourGrid.cols + c) * 4;
    const a = (pixels[o + 3] ?? 0) / 255;
    for (let ch = 0; ch < 3; ch += 1) {
      const v = (pixels[o + ch] ?? 0) / 255;
      out[k * 3 + ch] = a * v + (1 - a) * PSR_GROUND;
    }
  }
  return out;
}
