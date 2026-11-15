/**
 * Sunlight on the 3D terrain (docs/design/3b-gorev-gorunumleri.md, section 6.5). The colours of
 * the mesh are lit here, per vertex, from the Sun direction the server gave and the share of the
 * Sun's disk each vertex sees (`shadow.ts`). The drawing then needs no light of its own.
 */

import type { Vec3 } from '../globe/coords';
import type { TerrainMesh } from './geometry';
import { toSceneAxes } from './shadow';

/** Grey of unlit-layer ground when the computed light replaces the hillshade layer. */
export const PLAIN_GROUND = 0.62;

/** Light that reaches ground in shadow, so that its shape stays readable. Not a physical value. */
export const AMBIENT = 0.12;

/** Level ground in full sunlight is drawn at this brightness, whatever the Sun's elevation. */
export const LEVEL_BRIGHTNESS = 0.6;

const M_PER_KM = 1000;

/** Unit normal of every vertex from the true heights (the exaggeration is taken out), scene axes. */
export function vertexNormals(mesh: TerrainMesh): Float32Array {
  const { rows, cols, positions, exaggeration } = mesh;
  const out = new Float32Array(rows * cols * 3);
  const at = (i: number, j: number, axis: number) => positions[(i * cols + j) * 3 + axis] ?? 0;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const j0 = j > 0 ? j - 1 : j;
      const j1 = j < cols - 1 ? j + 1 : j;
      const i0 = i > 0 ? i - 1 : i;
      const i1 = i < rows - 1 ? i + 1 : i;
      const dx = at(i, j1, 0) - at(i, j0, 0) || 1;
      const dz = at(i1, j, 2) - at(i0, j, 2) || 1;
      const hx = (at(i, j1, 1) - at(i, j0, 1)) / exaggeration / dx;
      const hz = (at(i1, j, 1) - at(i0, j, 1)) / exaggeration / dz;
      const n = Math.hypot(hx, 1, hz);
      const k = (i * cols + j) * 3;
      out[k] = -hx / n;
      out[k + 1] = 1 / n;
      out[k + 2] = -hz / n;
    }
  }
  return out;
}

/** Sun elevation at the centre of the mesh, as a sine; the exposure is set from it. */
export function centreSunSine(mesh: TerrainMesh, sun: Vec3): number {
  if (!mesh.centre_m) return 0;
  return toSceneAxes(mesh.centre_m.x, mesh.centre_m.y, sun).y;
}

/**
 * Brightness factor so that level ground in full sunlight at the mesh centre comes out at
 * `LEVEL_BRIGHTNESS`. At a low Sun the ground would otherwise be nearly black and slopes facing
 * the Sun would carry all the detail; the factor is shown next to the view.
 */
export function exposureFor(sunSine: number): number {
  return LEVEL_BRIGHTNESS / Math.max(sunSine, 0.02);
}

export interface SunlightInput {
  /** Base colour per vertex, RGB 0..1. */
  base: Float32Array;
  /** Unit direction to the Sun in the Moon-fixed frame. */
  sun: Vec3;
  /** Share of the Sun's disk each vertex sees; `null` while it is being worked out (slopes only). */
  visible: Float32Array | null;
  /** From `vertexNormals`; computed when absent. */
  normals?: Float32Array;
}

/**
 * Colours of the mesh under the Sun: base colour times (ambient + sunlit share times how squarely
 * the slope faces the Sun). The Sun's direction is turned into each vertex's own local axes, so
 * its elevation changes across the map as it does on the Moon. A mesh without map bounds is
 * returned unlit.
 */
export function sunlitColours(mesh: TerrainMesh, { base, sun, visible, normals }: SunlightInput): Float32Array {
  const count = mesh.rows * mesh.cols;
  const out = new Float32Array(count * 3);
  if (!mesh.centre_m) {
    out.set(base.subarray(0, count * 3));
    return out;
  }
  const n = normals ?? vertexNormals(mesh);
  const exposure = exposureFor(centreSunSine(mesh, sun));
  for (let k = 0; k < count; k += 1) {
    const x_m = mesh.centre_m.x + (mesh.positions[k * 3] ?? 0) * M_PER_KM;
    const y_m = mesh.centre_m.y - (mesh.positions[k * 3 + 2] ?? 0) * M_PER_KM;
    const s = toSceneAxes(x_m, y_m, sun);
    const facing = Math.max(0, (n[k * 3] ?? 0) * s.x + (n[k * 3 + 1] ?? 1) * s.y + (n[k * 3 + 2] ?? 0) * s.z);
    const share = visible ? visible[k] ?? 1 : 1;
    const direct = Math.min(1, exposure * facing * (Number.isFinite(share) ? share : 1));
    const light = AMBIENT + (1 - AMBIENT) * direct;
    out[k * 3] = (base[k * 3] ?? 0) * light;
    out[k * 3 + 1] = (base[k * 3 + 1] ?? 0) * light;
    out[k * 3 + 2] = (base[k * 3 + 2] ?? 0) * light;
  }
  return out;
}

/** One grey for every vertex: the ground under the computed light. */
export function plainColours(mesh: Pick<TerrainMesh, 'rows' | 'cols'>, grey: number = PLAIN_GROUND): Float32Array {
  return new Float32Array(mesh.rows * mesh.cols * 3).fill(grey);
}

/**
 * Blends a tint over the vertices where a body's visible share is below `below` (the Earth out
 * of view). Vertices without a value are left as they are.
 */
export function tintHidden(
  colours: Float32Array,
  visible: Float32Array,
  tint: readonly [number, number, number],
  strength = 0.45,
  below = 0.5,
): Float32Array {
  const out = new Float32Array(colours);
  for (let k = 0; k < visible.length; k += 1) {
    const v = visible[k] ?? Number.NaN;
    if (!(v < below)) continue;
    for (let ch = 0; ch < 3; ch += 1) {
      out[k * 3 + ch] = (out[k * 3 + ch] ?? 0) * (1 - strength) + tint[ch]! * strength;
    }
  }
  return out;
}

/** Share of the vertices that see less than half of a body's disk; gaps are left out. */
export function hiddenShare(visible: Float32Array): number | null {
  let hidden = 0;
  let known = 0;
  for (const v of visible) {
    if (!Number.isFinite(v)) continue;
    known += 1;
    if (v < 0.5) hidden += 1;
  }
  return known === 0 ? null : hidden / known;
}
