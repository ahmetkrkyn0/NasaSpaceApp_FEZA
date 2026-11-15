import { describe, expect, it } from 'vitest';
import type { LayerGrid } from '../../api/types';
import { forwardSouthPolar } from '../map/projection';
import { buildTerrain } from './geometry';
import { cursorReadout, nearestVertex, readoutText, scaleBar, sceneToMap, slopeAt } from './readout';

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

describe('slope from the height map', () => {
  it('is the angle of a ramp and zero on level ground', () => {
    // 10 % to the east and 10 % to the north: the steepest slope is atan(0.1 * sqrt 2).
    const ramp = makeGrid(2_000, 20, (x, y) => (x - CX) * 0.1 + (y - CY) * 0.1);
    expect(slopeAt(ramp, CX, CY)).toBeCloseTo((Math.atan(0.1 * Math.SQRT2) * 180) / Math.PI, 3);
    expect(slopeAt(makeGrid(2_000, 20, () => 500), CX, CY)).toBeCloseTo(0, 9);
  });

  it('is unknown off the map and beside a gap', () => {
    const grid = makeGrid(2_000, 20, (x) => (x > CX + 500 ? Number.NaN : 0));
    expect(slopeAt(grid, CX + 5_000, CY)).toBeNull();
    expect(slopeAt(grid, CX + 495, CY)).toBeNull();
    expect(slopeAt(grid, CX, CY)).toBe(0);
  });
});

describe('cursor readout', () => {
  const grid = makeGrid(2_000, 20, (x) => 5_000 + (x - CX) * 0.05);
  const mesh = buildTerrain(grid);

  it('turns a scene point back into the map point it was drawn from', () => {
    expect(sceneToMap(mesh, 0, 0)).toEqual({ x_m: CX, y_m: CY });
    expect(sceneToMap(mesh, 0.5, -0.25)).toEqual({ x_m: CX + 500, y_m: CY + 250 });
    expect(sceneToMap({ centre_m: null }, 0, 0)).toBeNull();
  });

  it('gives latitude, longitude, height and slope of the point', () => {
    const r = cursorReadout(grid, mesh, 0.2, 0)!;
    const back = forwardSouthPolar(r.lat_deg, r.lon_deg);
    expect(back.x_m).toBeCloseTo(CX + 200, 4);
    expect(back.y_m).toBeCloseTo(CY, 4);
    expect(r.height_m).toBeCloseTo(5_010, 3);
    expect(r.slope_deg).toBeCloseTo((Math.atan(0.05) * 180) / Math.PI, 3);
    expect(r.sun_fraction).toBeNull();
  });

  it('reads the Sun share of the nearest vertex', () => {
    const lit = new Float32Array(mesh.rows * mesh.cols).fill(1);
    const k = nearestVertex(mesh, 0.2, 0);
    lit[k] = 0.25;
    expect(cursorReadout(grid, mesh, 0.2, 0, lit)!.sun_fraction).toBe(0.25);
    expect(cursorReadout(grid, mesh, -0.6, 0.4, lit)!.sun_fraction).toBe(1);
  });

  it('finds the corner vertices and clamps outside the mesh', () => {
    expect(nearestVertex(mesh, -99, -99)).toBe(0);
    expect(nearestVertex(mesh, 99, 99)).toBe(mesh.rows * mesh.cols - 1);
  });

  it('has no readout for a grid without map bounds', () => {
    const plain = { ...grid, bounds: null };
    expect(cursorReadout(plain, buildTerrain(plain), 0, 0)).toBeNull();
  });

  it('writes one line with hemispheres and units', () => {
    expect(readoutText({ lat_deg: -84.78, lon_deg: 29.13, height_m: 5208.3, slope_deg: 0.81, sun_fraction: 0.5 })).toBe(
      '84.7800° S, 29.1300° E · 5,208 m · slope 0.8° · Sun disk 50 %',
    );
    expect(readoutText({ lat_deg: 1, lon_deg: -2, height_m: null, slope_deg: null, sun_fraction: null })).toBe('1.0000° N, 2.0000° W · no height here');
  });
});

describe('scale bar', () => {
  it('takes the longest round length that fits', () => {
    // 0.05 km per pixel: 5 km is 100 px, 10 km would be 200 px.
    expect(scaleBar(0.05)).toEqual({ km: 5, px: 100, label: '5 km' });
    expect(scaleBar(0.001)).toEqual({ km: 0.1, px: 100, label: '100 m' });
  });

  it('is absent when nothing fits or the size is unknown', () => {
    expect(scaleBar(0)).toBeNull();
    expect(scaleBar(Number.NaN)).toBeNull();
    // So close that even 50 m is wider than the bar may be.
    expect(scaleBar(0.0001)).toBeNull();
  });
});
