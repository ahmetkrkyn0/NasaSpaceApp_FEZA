import { describe, expect, it } from 'vitest';
import type { LayerGrid } from '../../api/types';
import { inverseSouthPolar } from '../map/projection';
import { agreementText, AGREEMENT_LIMIT } from '.';
import { buildTerrain, sunVector } from './geometry';
import { AMBIENT, LEVEL_BRIGHTNESS, exposureFor, hiddenShare, plainColours, sunlitColours, tintHidden, vertexNormals } from './lighting';
import { bodyFromSite, bodyVisibility, mapAxes, prepareTerrain, sightline, skyDirection, surfacePosition, toSceneAxes, type SurfacePoint } from './shadow';

const CX = 77_100;
const CY = 138_380;

function makeGrid(size_m: number, res_m: number, height: (x: number, y: number) => number): LayerGrid {
  const n = Math.round(size_m / res_m);
  const bounds = { x_min: CX - size_m / 2, y_min: CY - size_m / 2, x_max: CX + size_m / 2, y_max: CY + size_m / 2 };
  const values = new Float32Array(n * n);
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) values[r * n + c] = height(bounds.x_min + (c + 0.5) * res_m, bounds.y_max - (r + 0.5) * res_m);
  }
  return { name: 'elevation', rows: n, cols: n, values, min: null, max: null, resolution_m: res_m, validity: 'DERIVED', nodata_count: null, downsample: 1, bounds };
}

describe('server angles as a Moon-fixed direction', () => {
  const site = inverseSouthPolar(CX, CY);
  const point: SurfacePoint = { x_m: CX, y_m: CY, height_m: 0 };
  const flat = prepareTerrain([makeGrid(2_000, 20, () => 0)]);

  it('gives back the elevation it was built from (V1)', () => {
    for (const [az, el] of [[65.67, 2.47], [200, -1.5], [0, 6.47], [335.85, 11.19]] as const) {
      const to = skyDirection(site.lat_deg, site.lon_deg, az, el);
      expect(Math.hypot(to.x, to.y, to.z)).toBeCloseTo(1, 12);
      expect(sightline(flat, point, to).elevation_deg).toBeCloseTo(el, 9);
    }
  });

  it('agrees with the scene direction of the earlier view', () => {
    for (const [az, el] of [[65.67, 2.47], [200, -1.5], [123, 40]] as const) {
      const scene = toSceneAxes(CX, CY, skyDirection(site.lat_deg, site.lon_deg, az, el));
      const before = sunVector(az, el, site.lat_deg, site.lon_deg);
      expect(scene.x).toBeCloseTo(before.x, 9);
      expect(scene.y).toBeCloseTo(before.y, 9);
      expect(scene.z).toBeCloseTo(before.z, 9);
    }
  });

  it('has map axes at right angles', () => {
    const { up, alongX, alongY } = mapAxes(CX, CY);
    const dot = (a: typeof up, b: typeof up) => a.x * b.x + a.y * b.y + a.z * b.z;
    expect(dot(up, alongX)).toBeCloseTo(0, 12);
    expect(dot(up, alongY)).toBeCloseTo(0, 12);
    expect(dot(alongX, alongY)).toBeCloseTo(0, 12);
  });

  it('raises the Sun by the turn of the local vertical on ground nearer to it', () => {
    // 10 km along the ground towards the Sun the local vertical has turned by 10 km / R.
    const to = skyDirection(site.lat_deg, site.lon_deg, 90, 3);
    const along = toSceneAxes(CX, CY, to);
    const there: SurfacePoint = { x_m: CX + along.x * 10_000, y_m: CY - along.z * 10_000, height_m: 0 };
    const turned = (10_000 / 1_737_400) * (180 / Math.PI);
    expect(sightline(flat, there, to).elevation_deg).toBeCloseTo(3 + turned, 2);
  });
});

describe('a body placed from one site', () => {
  const site = inverseSouthPolar(CX, CY);
  const point: SurfacePoint = { x_m: CX, y_m: CY, height_m: 5_000 };
  const flat = prepareTerrain([makeGrid(2_000, 20, () => 5_000)]);

  it('keeps the Sun direction and gives the Earth a distance', () => {
    const sun = bodyFromSite(site.lat_deg, site.lon_deg, point, 2, { azimuth_true_deg: 65.67, elevation_deg: 2.47, radius_deg: 0.267, range_m: null });
    expect(sun.distance_m).toBeNull();
    expect(sun.direction).toEqual(skyDirection(site.lat_deg, site.lon_deg, 65.67, 2.47));
    const earth = bodyFromSite(site.lat_deg, site.lon_deg, point, 2, { azimuth_true_deg: 335.85, elevation_deg: 11.19, radius_deg: 0.95, range_m: 384_400_000 });
    expect(earth.distance_m).toBeGreaterThan(384_000_000);
    expect(earth.distance_m).toBeLessThan(386_200_000);
  });

  it('shows the Earth at the server elevation again from the same site and mast', () => {
    const earth = bodyFromSite(site.lat_deg, site.lon_deg, point, 2, { azimuth_true_deg: 335.85, elevation_deg: 11.19, radius_deg: 0.95, range_m: 384_400_000 });
    const seen = bodyVisibility(flat, point, earth, { eye_m: 2 });
    expect(seen.elevation_deg).toBeCloseTo(11.19, 6);
    expect(seen.fraction).toBe(1);
    // The body sits at the given range from the eye.
    const p = surfacePosition(point, 2);
    const c = { x: earth.direction.x * earth.distance_m!, y: earth.direction.y * earth.distance_m!, z: earth.direction.z * earth.distance_m! };
    expect(Math.hypot(c.x - p.x, c.y - p.y, c.z - p.z) / 384_400_000).toBeCloseTo(1, 9);
  });
});

describe('sunlit colours', () => {
  const site = inverseSouthPolar(CX, CY);
  // A ramp rising to the map east at 10 %: its normal leans west.
  const ramp = makeGrid(2_000, 100, (x) => (x - CX) * 0.1);
  const level = makeGrid(2_000, 100, () => 0);

  it('reads normals from the true heights, whatever the exaggeration', () => {
    const a = vertexNormals(buildTerrain(ramp, 1));
    const b = vertexNormals(buildTerrain(ramp, 3));
    const k = (10 * 20 + 10) * 3;
    expect(a[k]).toBeCloseTo(-0.1 / Math.hypot(0.1, 1), 4);
    expect(a[k + 1]).toBeCloseTo(1 / Math.hypot(0.1, 1), 4);
    expect(b[k]).toBeCloseTo(a[k]!, 4);
    expect(vertexNormals(buildTerrain(level))[k + 1]).toBeCloseTo(1, 6);
  });

  it('draws level sunlit ground at the level brightness and shadow at the ambient', () => {
    const mesh = buildTerrain(level);
    const sun = skyDirection(site.lat_deg, site.lon_deg, 90, 3);
    const count = mesh.rows * mesh.cols;
    const lit = sunlitColours(mesh, { base: plainColours(mesh, 1), sun, visible: new Float32Array(count).fill(1) });
    const dark = sunlitColours(mesh, { base: plainColours(mesh, 1), sun, visible: new Float32Array(count) });
    const centre = (10 * 20 + 10) * 3;
    expect(lit[centre]).toBeCloseTo(AMBIENT + (1 - AMBIENT) * LEVEL_BRIGHTNESS, 2);
    expect(dark[centre]).toBeCloseTo(AMBIENT, 6);
  });

  it('makes a slope facing the Sun brighter than one facing away', () => {
    const sunEast = skyDirection(site.lat_deg, site.lon_deg, 0, 5);
    const east = toSceneAxes(CX, CY, sunEast);
    // Sun over the map direction the ramp falls towards (west) or rises towards (east).
    const overWest = skyDirection(site.lat_deg, site.lon_deg, east.x > 0 ? 180 : 0, 5);
    const overEast = skyDirection(site.lat_deg, site.lon_deg, east.x > 0 ? 0 : 180, 5);
    const mesh = buildTerrain(ramp);
    const centre = (10 * 20 + 10) * 3;
    const facing = sunlitColours(mesh, { base: plainColours(mesh, 1), sun: overWest, visible: null })[centre]!;
    const away = sunlitColours(mesh, { base: plainColours(mesh, 1), sun: overEast, visible: null })[centre]!;
    expect(facing).toBeGreaterThan(away);
  });

  it('keeps the exposure bounded when the Sun is at or below the horizon', () => {
    expect(exposureFor(0)).toBe(LEVEL_BRIGHTNESS / 0.02);
    expect(exposureFor(-0.5)).toBe(LEVEL_BRIGHTNESS / 0.02);
    expect(exposureFor(1)).toBe(LEVEL_BRIGHTNESS);
  });

  it('leaves a mesh without map bounds unlit', () => {
    const unmapped = buildTerrain({ ...level, bounds: null });
    const base = plainColours(unmapped, 0.4);
    expect(Array.from(sunlitColours(unmapped, { base, sun: { x: 0, y: 1, z: 0 }, visible: null }))).toEqual(Array.from(base));
  });
});

describe('Earth out of view', () => {
  it('tints only the vertices that see less than half of the disk', () => {
    const colours = new Float32Array(9).fill(0.5);
    const out = tintHidden(colours, Float32Array.from([0, 1, Number.NaN]), [1, 0, 0], 0.5);
    expect(Array.from(out.slice(0, 3))).toEqual([0.75, 0.25, 0.25]);
    expect(Array.from(out.slice(3))).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  it('counts the hidden share without the gaps', () => {
    expect(hiddenShare(Float32Array.from([0, 0.2, 1, Number.NaN]))).toBeCloseTo(2 / 3, 6);
    expect(hiddenShare(Float32Array.from([Number.NaN]))).toBeNull();
  });
});

describe('comparison with the server at the site', () => {
  it('agrees within the limit and says so when it does not', () => {
    expect(AGREEMENT_LIMIT).toBe(0.1);
    const ok = agreementText('Sun', 0.95, 1);
    expect(ok.agrees).toBe(true);
    expect(ok.text).toContain('95 % on this map, 100 % from the server');
    expect(ok.text).not.toContain('Approximate');
    const off = agreementText('Earth', 1, 0.2);
    expect(off.agrees).toBe(false);
    expect(off.text).toContain('Approximate: they differ');
  });
});
