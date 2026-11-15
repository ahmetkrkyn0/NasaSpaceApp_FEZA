/**
 * What the 3D terrain says about the point under the cursor, and its scale bar
 * (docs/design/3b-gorev-gorunumleri.md, 4.2). Every value is read from the height map; the
 * latitude and longitude come from the map projection.
 */

import type { LayerGrid } from '../../api/types';
import { inverseSouthPolar } from '../map/projection';
import { cellSize, heightAt, type TerrainMesh } from './geometry';

const M_PER_KM = 1000;
const DEG = Math.PI / 180;

/** Slope in degrees at a map point, from the heights one cell to each side; `null` in a gap or off the map. */
export function slopeAt(grid: LayerGrid, x_m: number, y_m: number): number | null {
  const size = cellSize(grid);
  if (!size) return null;
  const e = heightAt(grid, x_m + size.dx, y_m);
  const w = heightAt(grid, x_m - size.dx, y_m);
  const n = heightAt(grid, x_m, y_m + size.dy);
  const s = heightAt(grid, x_m, y_m - size.dy);
  if (e === null || w === null || n === null || s === null) return null;
  const gx = (e - w) / (2 * size.dx);
  const gy = (n - s) / (2 * size.dy);
  return Math.atan(Math.hypot(gx, gy)) / DEG;
}

export interface CursorReadout {
  lat_deg: number;
  lon_deg: number;
  /** Height above the 1737.4 km sphere, metres; `null` in a gap of the map. */
  height_m: number | null;
  slope_deg: number | null;
  /** Share of the Sun's disk seen from here, when the shadow map is given. */
  sun_fraction: number | null;
}

/** Map metres of a scene point (kilometres, X along the map's x, Z against its y). */
export function sceneToMap(mesh: Pick<TerrainMesh, 'centre_m'>, x: number, z: number): { x_m: number; y_m: number } | null {
  if (!mesh.centre_m) return null;
  return { x_m: mesh.centre_m.x + x * M_PER_KM, y_m: mesh.centre_m.y - z * M_PER_KM };
}

/** Index of the mesh vertex nearest a scene point. */
export function nearestVertex(mesh: TerrainMesh, x: number, z: number): number {
  const { rows, cols, positions } = mesh;
  const x0 = positions[0] ?? 0;
  const z0 = positions[2] ?? 0;
  const dx = cols > 1 ? ((positions[(cols - 1) * 3] ?? 0) - x0) / (cols - 1) : 1;
  const dz = rows > 1 ? ((positions[(rows - 1) * cols * 3 + 2] ?? 0) - z0) / (rows - 1) : 1;
  const j = Math.min(cols - 1, Math.max(0, Math.round((x - x0) / (dx || 1))));
  const i = Math.min(rows - 1, Math.max(0, Math.round((z - z0) / (dz || 1))));
  return i * cols + j;
}

/** Readout for a scene point on the surface; `null` for a mesh without map bounds. */
export function cursorReadout(grid: LayerGrid, mesh: TerrainMesh, x: number, z: number, sunVisible: Float32Array | null = null): CursorReadout | null {
  const p = sceneToMap(mesh, x, z);
  if (!p) return null;
  const geo = inverseSouthPolar(p.x_m, p.y_m);
  const share = sunVisible ? sunVisible[nearestVertex(mesh, x, z)] ?? Number.NaN : Number.NaN;
  return {
    lat_deg: geo.lat_deg,
    lon_deg: geo.lon_deg,
    height_m: heightAt(grid, p.x_m, p.y_m),
    slope_deg: slopeAt(grid, p.x_m, p.y_m),
    sun_fraction: Number.isFinite(share) ? share : null,
  };
}

const hemi = (value: number, positive: string, negative: string) => `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;

/** One line of text for the readout. */
export function readoutText(r: CursorReadout): string {
  const parts = [`${hemi(r.lat_deg, 'N', 'S')}, ${hemi(r.lon_deg, 'E', 'W')}`];
  parts.push(r.height_m !== null ? `${Math.round(r.height_m).toLocaleString('en-US')} m` : 'no height here');
  if (r.slope_deg !== null) parts.push(`slope ${r.slope_deg.toFixed(1)}°`);
  if (r.sun_fraction !== null) parts.push(`Sun disk ${Math.round(r.sun_fraction * 100)} %`);
  return parts.join(' · ');
}

/** Round lengths a scale bar may show, kilometres. */
const STEPS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];

/**
 * Longest round length that fits in `maxPx` at the given ground size of a pixel; `null` when no
 * step fits or the size is not known.
 */
export function scaleBar(kmPerPx: number, maxPx = 120): { km: number; px: number; label: string } | null {
  if (!(kmPerPx > 0) || !Number.isFinite(kmPerPx)) return null;
  let best: number | null = null;
  for (const km of STEPS) if (km / kmPerPx <= maxPx) best = km;
  if (best === null) return null;
  return { km: best, px: best / kmPerPx, label: best < 1 ? `${Math.round(best * 1000)} m` : `${best} km` };
}
