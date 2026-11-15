import { describe, expect, it } from 'vitest';
import type { LayerGrid } from '../../api/types';
import { MOON_RADIUS_M } from '../map/projection';
import { prepareTerrain, visibilityMap } from '../terrain3d/shadow';
import { latLonToVector, vectorToLatLon } from './coords';
import { CAP_AMBIENT, CAP_EDGE_M, CAP_LIT, FULL_LIGHT_SINE, buildPolarCap, capColours, capNormals, capReadout, capVertexAt, kmPerPixel, sunBody } from './polar';

/** Square grid centred on the pole, `half_m` to each side. */
function capGrid(half_m: number, n: number, height: (x: number, y: number) => number = () => 0): LayerGrid {
  const res = (2 * half_m) / n;
  const values = new Float32Array(n * n);
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) values[r * n + c] = height(-half_m + (c + 0.5) * res, half_m - (r + 0.5) * res);
  }
  return {
    name: 'elevation',
    rows: n,
    cols: n,
    values,
    min: null,
    max: null,
    resolution_m: res,
    validity: 'DERIVED',
    nodata_count: 0,
    downsample: 4,
    bounds: { x_min: -half_m, y_min: -half_m, x_max: half_m, y_max: half_m },
  };
}

const length = (p: Float32Array, k: number) => Math.hypot(p[k * 3]!, p[k * 3 + 1]!, p[k * 3 + 2]!);

describe('polar cap mesh', () => {
  it('puts 80 S at the edge of the cap', () => {
    const edge = latLonToVector({ lat_deg: -80, lon_deg: 0 });
    // Back through the map projection: the edge of the cap.
    expect(CAP_EDGE_M).toBeCloseTo(304_006, -1);
    expect(vectorToLatLon(edge).lat_deg).toBeCloseTo(-80, 9);
  });

  it('places vertices at their true radius and keeps the last row and column', () => {
    const grid = capGrid(10_000, 10, (x) => (x > 0 ? 1_737.4 : 0));
    const cap = buildPolarCap(grid, 4)!;
    expect(cap.stride).toBe(3);
    expect(cap.rows).toBe(4); // rows 0, 3, 6 and 9, which is already the last row
    expect(buildPolarCap(capGrid(10_000, 11), 4)!.rows).toBe(5); // 0, 3, 6, 9 and the last row 10
    expect(cap.cells[(cap.rows * cap.cols - 1) * 2]).toBe(9);
    // East half is 1737.4 m up: radius 1.001.
    // Float32 positions: about 7 digits, a few centimetres on the Moon.
    expect(length(cap.positions, cap.cols - 1)).toBeCloseTo(1.001, 6);
    expect(length(cap.positions, 0)).toBeCloseTo(1, 6);
  });

  it('draws only inside the edge and over cells with data', () => {
    const grid = capGrid(10_000, 10, (x, y) => (x < -5_000 && y > 5_000 ? Number.NaN : 0));
    const all = buildPolarCap(grid, 10, 1e9)!;
    const round = buildPolarCap(grid, 10, 8_000)!;
    expect(all.indices.length).toBeLessThan(9 * 9 * 6);
    expect(round.indices.length).toBeLessThan(all.indices.length);
    expect(buildPolarCap({ ...grid, bounds: null })).toBeNull();
  });

  it('has normals pointing away from the centre: straight down at the pole', () => {
    const cap = buildPolarCap(capGrid(10_000, 11), 11)!;
    const n = capNormals(cap);
    const mid = Math.floor(cap.rows / 2) * cap.cols + Math.floor(cap.cols / 2);
    expect(n[mid * 3 + 1]).toBeCloseTo(-1, 6);
  });
});

describe('cap colours', () => {
  const up = new Float32Array([0, -1, 0]);

  const sunAt = (deg: number) => ({ x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180), z: 0 });

  it('lights level ground on a square-root curve and keeps shadow at ambient', () => {
    const full = capColours(up, sunAt(20), new Float32Array([1]))[0]!;
    const low = capColours(up, sunAt(5), new Float32Array([1]))[0]!;
    expect(full).toBeCloseTo(CAP_LIT, 6);
    // sin 5 / sin 20 is about a quarter: half the way up.
    expect(low).toBeCloseTo(CAP_AMBIENT + (CAP_LIT - CAP_AMBIENT) * Math.sqrt(Math.sin((5 * Math.PI) / 180) / FULL_LIGHT_SINE), 6);
    expect(capColours(up, sunAt(20), new Float32Array([0]))[0]).toBeCloseTo(CAP_AMBIENT, 6);
    expect(capColours(up, sunAt(20), new Float32Array([0.5]))[0]).toBeCloseTo((CAP_AMBIENT + CAP_LIT) / 2, 6);
  });

  it('keeps ground the Sun is below the horizon of at ambient', () => {
    expect(capColours(up, sunAt(-2), null)[0]).toBeCloseTo(CAP_AMBIENT, 6);
  });

  it('uses even shading without a Sun', () => {
    expect(capColours(up, null, null)[0]).toBeCloseTo(0.62, 6);
  });
});

describe('terrain shadows on the cap', () => {
  it('a ridge shadows the ground behind it from a low Sun', () => {
    // A 2 km wall along x = 0; the Sun low in the +x direction (map +x is the globe's +X here).
    const grid = capGrid(40_000, 200, (x) => (Math.abs(x) < 400 ? 2_000 : 0));
    const cap = buildPolarCap(grid, 200)!;
    const sun = sunBody({ x: Math.cos((2 * Math.PI) / 180), y: -Math.sin((2 * Math.PI) / 180), z: 0 })!;
    const visible = visibilityMap(prepareTerrain([grid]), grid, cap, sun);
    const at = (x_m: number) => capVertexAt(grid, cap, latLonToVector(vectorToLatLon(unproject(x_m)), 1))!;
    expect(visible[at(-5_000)]).toBe(0);
    expect(visible[at(5_000)]).toBe(1);
  });
});

function unproject(x_m: number) {
  // Map point (x, 0) on the sphere: the stereographic inverse along the map's x axis.
  const a = x_m / (2 * MOON_RADIUS_M);
  return { x: (2 * a) / (a * a + 1), y: (a * a - 1) / (a * a + 1), z: 0 };
}

describe('cursor readout and scale', () => {
  it('reads latitude, longitude and height of a point on the cap', () => {
    const grid = capGrid(10_000, 10, () => 1_234);
    const text = capReadout(grid, latLonToVector({ lat_deg: -89.9, lon_deg: 45 }), 0.5);
    expect(text).toBe('89.9000° S, 45.0000° E · 1,234 m · slope 0.0° · Sun disk 50 %');
    expect(capReadout(grid, latLonToVector({ lat_deg: -70, lon_deg: 0 }), 1)).toBe('70.0000° S, 0.0000° E · no height here');
  });

  it('gives the ground size of a pixel', () => {
    // 1/1737.4 globe units away (1 km) with a 90 degree view over 1000 px: 2 km over 1000 px.
    expect(kmPerPixel(1 / 1737.4, 90, 1000)).toBeCloseTo(0.002, 9);
    expect(kmPerPixel(1, 35, 0)).toBeNaN();
  });
});
