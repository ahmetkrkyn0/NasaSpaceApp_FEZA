import { describe, expect, it } from 'vitest';
import type { LayerGrid } from '../../api/types';
import { latLonToVector, type Vec3 } from '../globe/coords';
import { MOON_RADIUS_M, forwardSouthPolar } from '../map/projection';
import { buildTerrain } from './geometry';
import {
  OUTSIDE,
  bodyVisibility,
  diskFraction,
  prepareTerrain,
  projectUnit,
  sightline,
  terrainHeight,
  unprojectUnit,
  visibilityMap,
  type SkyBody,
  type SurfacePoint,
} from './shadow';

const DEG = Math.PI / 180;
/** Centre of the Mons Mouton layer window, projected metres. */
const CX = 77_100;
const CY = 138_380;

/** Square height grid centred on a map point; `height` gets each cell centre. */
function makeGrid(cx: number, cy: number, size_m: number, res_m: number, height: (x: number, y: number) => number): LayerGrid {
  const n = Math.round(size_m / res_m);
  const bounds = { x_min: cx - size_m / 2, y_min: cy - size_m / 2, x_max: cx + size_m / 2, y_max: cy + size_m / 2 };
  const values = new Float32Array(n * n);
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      values[r * n + c] = height(bounds.x_min + (c + 0.5) * res_m, bounds.y_max - (r + 0.5) * res_m);
    }
  }
  return { name: 'elevation', rows: n, cols: n, values, min: null, max: null, resolution_m: res_m, validity: 'DERIVED', nodata_count: null, downsample: 1, bounds };
}

/** Direction to a body that stands `elevation_deg` high over the map direction from `from` to `target`. */
function bodyOver(from: SurfacePoint, target: { x_m: number; y_m: number }, elevation_deg: number): Vec3 {
  const u = unprojectUnit(from.x_m, from.y_m);
  const g = unprojectUnit(target.x_m, target.y_m);
  const d = u.x * g.x + u.y * g.y + u.z * g.z;
  const e = { x: g.x - d * u.x, y: g.y - d * u.y, z: g.z - d * u.z };
  const n = Math.hypot(e.x, e.y, e.z);
  const s = Math.sin(elevation_deg * DEG);
  const c = Math.cos(elevation_deg * DEG) / n;
  return { x: u.x * s + e.x * c, y: u.y * s + e.y * c, z: u.z * s + e.z * c };
}

const sunAt = (direction: Vec3, radius_deg = 0.01): SkyBody => ({ direction, distance_m: null, radius_deg });

describe('map and Moon-fixed frame', () => {
  it('projects a direction to the same map point as the map projection', () => {
    for (const [lat, lon] of [[-84.78, 29.13], [-89.5, -120], [-80, 179], [-85.2, 0]] as const) {
      const p = projectUnit(latLonToVector({ lat_deg: lat, lon_deg: lon }));
      const q = forwardSouthPolar(lat, lon);
      expect(p.x_m).toBeCloseTo(q.x_m, 4);
      expect(p.y_m).toBeCloseTo(q.y_m, 4);
    }
  });

  it('returns to the same direction', () => {
    const u = latLonToVector({ lat_deg: -84.78, lon_deg: 29.13 });
    const p = projectUnit(u);
    const back = unprojectUnit(p.x_m, p.y_m);
    expect(back.x).toBeCloseTo(u.x, 12);
    expect(back.y).toBeCloseTo(u.y, 12);
    expect(back.z).toBeCloseTo(u.z, 12);
  });

  it('puts the south pole at the map origin', () => {
    const u = unprojectUnit(0, 0);
    expect(u).toEqual({ x: 0, y: -1, z: 0 });
  });
});

describe('terrain height from nested grids', () => {
  const fine = makeGrid(CX, CY, 2_000, 20, () => 10);
  const coarse = makeGrid(CX, CY, 40_000, 400, () => 50);
  const terrain = prepareTerrain([fine, coarse]);

  it('reads the finest grid where it has data and the coarser one outside it', () => {
    expect(terrainHeight(terrain, CX, CY)).toBeCloseTo(10, 6);
    expect(terrainHeight(terrain, CX + 5_000, CY)).toBeCloseTo(50, 6);
  });

  it('tells a point outside every grid from a gap', () => {
    expect(terrainHeight(terrain, CX + 30_000, CY)).toBe(OUTSIDE);
    const holed = makeGrid(CX, CY, 2_000, 20, () => Number.NaN);
    expect(terrainHeight(prepareTerrain([holed]), CX, CY)).toBeNaN();
    // A gap in the fine grid falls through to the coarse one.
    expect(terrainHeight(prepareTerrain([holed, coarse]), CX, CY)).toBeCloseTo(50, 6);
  });

  it('keeps the highest height and the finest cell size', () => {
    expect(terrain.maxHeight_m).toBe(50);
    expect(terrain.finest_m).toBe(20);
  });
});

describe('disk fraction', () => {
  it('is half when the centre is on the horizon (G4)', () => {
    expect(diskFraction(0, 0.267)).toBeCloseTo(0.5, 10);
  });

  it('is 0 below and 1 above the disk, and rises between', () => {
    expect(diskFraction(-0.267, 0.267)).toBe(0);
    expect(diskFraction(0.267, 0.267)).toBe(1);
    expect(diskFraction(-0.1, 0.267)).toBeLessThan(diskFraction(0.1, 0.267));
    // Symmetric about the half-covered disk.
    expect(diskFraction(0.1, 0.267) + diskFraction(-0.1, 0.267)).toBeCloseTo(1, 10);
  });

  it('treats a body without a radius as a point', () => {
    expect(diskFraction(0.001, 0)).toBe(1);
    expect(diskFraction(-0.001, 0)).toBe(0);
  });
});

describe('sightline over flat ground', () => {
  const flat = prepareTerrain([makeGrid(CX, CY, 10_000, 20, () => 0)]);
  const here: SurfacePoint = { x_m: CX, y_m: CY, height_m: 0 };
  const east = { x_m: CX + 4_000, y_m: CY };

  it('reports the elevation it was given', () => {
    expect(sightline(flat, here, bodyOver(here, east, 5)).elevation_deg).toBeCloseTo(5, 9);
    expect(sightline(flat, here, bodyOver(here, east, -2)).elevation_deg).toBeCloseTo(-2, 9);
  });

  it('is fully lit with the Sun 5 degrees up (G1)', () => {
    const v = bodyVisibility(flat, here, sunAt(bodyOver(here, east, 5)));
    expect(v.horizon_deg).toBeLessThan(0);
    expect(v.horizon_deg).toBeGreaterThan(-0.01);
    expect(v.fraction).toBe(1);
  });

  it('is dark with the Sun below the horizon (G3)', () => {
    expect(bodyVisibility(flat, here, sunAt(bodyOver(here, east, -2))).fraction).toBe(0);
  });

  it('stops early on open ground: nothing further can rise above the horizon found', () => {
    expect(sightline(flat, here, bodyOver(here, east, 5)).reach_m).toBeLessThan(100);
  });

  it('walks to the edge of the grid while higher ground could still appear', () => {
    // A peak off the path keeps the walk going; the grid ends 5 km east of the point.
    const peak = prepareTerrain([makeGrid(CX, CY, 10_000, 20, (x, y) => (x < CX - 4_900 && y < CY - 4_900 ? 5_000 : 0))]);
    const line = sightline(peak, here, bodyOver(here, east, 5));
    expect(line.reach_m).toBeGreaterThan(4_800);
    expect(line.reach_m).toBeLessThanOrEqual(5_100);
    expect(line.horizon_deg).toBeLessThan(0);
  });

  it('sees further down from a mast', () => {
    const ground = sightline(flat, here, bodyOver(here, east, 5));
    const mast = sightline(flat, here, bodyOver(here, east, 5), { eye_m: 10 });
    expect(mast.horizon_deg).toBeLessThan(ground.horizon_deg);
  });
});

describe('shadow of a wall (G2)', () => {
  const WALL_X = CX + 1_000;
  const HEIGHT = 100;
  const SUN = 5;
  // West face at WALL_X, 100 m thick, running north to south across the grid.
  const terrain = prepareTerrain([makeGrid(CX, CY, 10_000, 20, (x) => (x >= WALL_X && x < WALL_X + 100 ? HEIGHT : 0))]);
  const length = HEIGHT / Math.tan(SUN * DEG);
  const fractionAt = (distance: number) => {
    const p: SurfacePoint = { x_m: WALL_X - distance, y_m: CY, height_m: 0 };
    return bodyVisibility(terrain, p, sunAt(bodyOver(p, { x_m: p.x_m + 4_000, y_m: p.y_m }, SUN)));
  };

  it('has the length of the wall height over the tangent of the Sun elevation', () => {
    expect(length).toBeGreaterThan(1_140);
    expect(length).toBeLessThan(1_146);
    expect(fractionAt(length - 80).fraction).toBe(0);
    expect(fractionAt(length + 80).fraction).toBe(1);
  });

  it('names the wall as the blocker', () => {
    const v = fractionAt(600);
    expect(v.blocker).not.toBeNull();
    expect(v.blocker!.height_m).toBeGreaterThan(HEIGHT * 0.9);
    expect(Math.abs(v.blocker!.distance_m - 600)).toBeLessThan(60);
    expect(v.horizon_deg).toBeCloseTo(Math.atan(HEIGHT / 600) / DEG, 0);
  });

  it('gives a penumbra with the real Sun radius', () => {
    const p: SurfacePoint = { x_m: WALL_X - length, y_m: CY, height_m: 0 };
    const v = bodyVisibility(terrain, p, sunAt(bodyOver(p, { x_m: p.x_m + 4_000, y_m: p.y_m }, SUN), 0.267));
    expect(v.fraction).toBeGreaterThan(0.05);
    expect(v.fraction).toBeLessThan(0.95);
  });
});

describe('curvature of the Moon (G5)', () => {
  const FAR = 100_000;
  const here: SurfacePoint = { x_m: CX, y_m: CY, height_m: 0 };
  const east = { x_m: CX + 50_000, y_m: CY };
  // Only ground beyond 100 km exists; nearer cells are gaps.
  const plateau = (height: number) =>
    prepareTerrain([makeGrid(CX, CY, 300_000, 1_000, (x) => (x >= CX + FAR ? height : Number.NaN))]);

  it('puts ground at the same height half the arc below the horizontal', () => {
    const line = sightline(plateau(0), here, bodyOver(here, east, 5), { step_m: 500 });
    const halfArc = (FAR / MOON_RADIUS_M / 2) / DEG;
    expect(halfArc).toBeCloseTo(1.649, 3);
    expect(line.horizon_deg).toBeLessThan(-halfArc + 0.01);
    expect(line.horizon_deg).toBeGreaterThan(-halfArc - 0.06);
    expect(line.blocker!.distance_m).toBeGreaterThan(99_000);
    expect(line.blocker!.distance_m).toBeLessThan(103_000);
  });

  it('needs about 2.9 km of height at 100 km to reach the horizontal', () => {
    const drop = (FAR * FAR) / (2 * MOON_RADIUS_M);
    expect(drop / 1000).toBeCloseTo(2.88, 2);
    const line = sightline(plateau(drop), here, bodyOver(here, east, 5), { step_m: 500 });
    // The first sample past 100 km can be up to 2 % further out, where the ground is a little lower.
    expect(Math.abs(line.horizon_deg)).toBeLessThan(0.1);
  });
});

describe('nested grids (G6)', () => {
  const here: SurfacePoint = { x_m: CX, y_m: CY, height_m: 0 };
  const east = { x_m: CX + 4_000, y_m: CY };
  const fine = makeGrid(CX, CY, 2_000, 20, () => 0);
  const coarse = makeGrid(CX, CY, 40_000, 200, (x) => (x >= CX + 10_000 && x < CX + 10_600 ? 500 : 0));

  it('stops at the edge of the fine grid when it is alone', () => {
    const line = sightline(prepareTerrain([fine]), here, bodyOver(here, east, 1));
    expect(line.reach_m).toBeLessThanOrEqual(1_020);
    expect(line.horizon_deg).toBeLessThan(0);
  });

  it('walks on into the coarse grid and finds the far wall', () => {
    const line = sightline(prepareTerrain([fine, coarse]), here, bodyOver(here, east, 1));
    // 500 m at 10 km, less the 29 m the Moon curves away: about 2.7 degrees.
    expect(line.horizon_deg).toBeGreaterThan(2.5);
    expect(line.horizon_deg).toBeLessThan(2.9);
    expect(Math.abs(line.blocker!.distance_m - 10_000)).toBeLessThan(400);
    // A Sun 1 degree up is hidden by a wall outside the fine grid.
    expect(bodyVisibility(prepareTerrain([fine, coarse]), here, sunAt(bodyOver(here, east, 1))).fraction).toBe(0);
    expect(bodyVisibility(prepareTerrain([fine]), here, sunAt(bodyOver(here, east, 1))).fraction).toBe(1);
  });
});

describe('a near body (the Earth)', () => {
  it('stands lower than its direction from the centre by the parallax', () => {
    const flat = prepareTerrain([makeGrid(0, 0, 2_000, 20, () => 0)]);
    const pole: SurfacePoint = { x_m: 0, y_m: 0, height_m: 0 };
    const earth: SkyBody = { direction: latLonToVector({ lat_deg: 0, lon_deg: 0 }), distance_m: 384_400_000, radius_deg: 0.95 };
    const v = bodyVisibility(flat, pole, earth);
    // From the centre the body is on the pole's horizontal; from the surface it is R/D lower.
    expect(v.elevation_deg).toBeCloseTo(-Math.atan(MOON_RADIUS_M / 384_400_000) / DEG, 6);
    expect(v.elevation_deg).toBeCloseTo(-0.259, 3);
    expect(v.fraction).toBeGreaterThan(0);
    expect(v.fraction).toBeLessThan(0.5);
  });
});

describe('visibility map of a mesh', () => {
  // A ridge 300 m high along the middle, running north to south.
  const grid = makeGrid(CX, CY, 4_000, 100, (x) => (Math.abs(x - CX) < 150 ? 300 : 0));
  const terrain = prepareTerrain([grid]);
  const mesh = buildTerrain(grid);
  const centre: SurfacePoint = { x_m: CX, y_m: CY, height_m: 300 };
  const sun = sunAt(bodyOver(centre, { x_m: CX + 4_000, y_m: CY }, 10));
  const lit = visibilityMap(terrain, grid, mesh, sun);
  const at = (row: number, col: number) => lit[row * mesh.cols + col];

  it('has one value per vertex', () => {
    expect(mesh.cols).toBe(40);
    expect(lit).toHaveLength(mesh.rows * mesh.cols);
  });

  it('is dark behind the ridge and lit on the Sun side and far behind', () => {
    // The Sun is in the east: columns just west of the ridge are in its shadow.
    expect(at(20, 14)).toBe(0);
    expect(at(20, 30)).toBe(1);
    // 300 m at 10 degrees throws 1.7 km; the western edge, 1.85 km away, is clear of it.
    expect(at(20, 0)).toBe(1);
  });

  it('matches the single point answer', () => {
    const p: SurfacePoint = { x_m: grid.bounds!.x_min + 14.5 * 100, y_m: grid.bounds!.y_max - 20.5 * 100, height_m: 0 };
    expect(at(20, 14)).toBe(bodyVisibility(terrain, p, sun).fraction);
  });

  it('marks a vertex over a gap', () => {
    const holed = makeGrid(CX, CY, 400, 100, (x) => (x < CX ? Number.NaN : 0));
    const out = visibilityMap(prepareTerrain([holed]), holed, buildTerrain(holed), sun);
    expect(out[0]).toBeNaN();
    expect(out[3]).toBe(1);
  });
});
