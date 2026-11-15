import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import candidatesExample from '../../../../data/examples/candidates.json';
import vectors from '../../../../data/examples/projection_vectors.json';
import { syntheticLayer } from '../../api/layers';
import type { CandidateList, LayerGrid } from '../../api/types';
import { forwardSouthPolar } from '../map/projection';
import { terrainAvailability } from './availability';
import {
  MAX_SIDE,
  VERTICAL_EXAGGERATION,
  buildTerrain,
  cellCentre,
  exaggerationNote,
  heightAt,
  meshHeightAt,
  placeOnTerrain,
  sunVector,
  vertexColours,
} from './geometry';
import { ApiError } from '../../api/errors';
import TerrainPanel, { missingText } from '.';

/** 3 x 4 grid, 20 m cells, heights rising to the east and to the south. */
function grid(values?: number[]): LayerGrid {
  const rows = 3;
  const cols = 4;
  const v = values ?? Array.from({ length: rows * cols }, (_, k) => 100 + (k % cols) * 10 + Math.floor(k / cols) * 1);
  return {
    name: 'elevation',
    rows,
    cols,
    values: Float32Array.from(v),
    min: v.reduce((a, b) => Math.min(a, b), Infinity),
    max: v.reduce((a, b) => Math.max(a, b), -Infinity),
    resolution_m: 20,
    validity: 'MEASURED',
    nodata_count: 0,
    downsample: 1,
    bounds: { x_min: 1000, y_min: 2000, x_max: 1080, y_max: 2060 },
  };
}

const xyz = (p: Float32Array, k: number) => [p[k * 3], p[k * 3 + 1], p[k * 3 + 2]] as const;

describe('terrain mesh from the height grid', () => {
  it('puts row 0 at the northern edge and column 0 at x_min (X-Layer-Bounds)', () => {
    const g = grid();
    expect(cellCentre(g, 0, 0)).toEqual({ x: 1010, y: 2050 });
    expect(cellCentre(g, 2, 3)).toEqual({ x: 1070, y: 2010 });
    const mesh = buildTerrain(g);
    expect(mesh.rows).toBe(3);
    expect(mesh.cols).toBe(4);
    // Centre of the bounds (1040, 2030) is the scene origin; kilometres; Z is minus the map y.
    const [x0, , z0] = xyz(mesh.positions, 0);
    expect(x0).toBeCloseTo(-0.03, 6);
    expect(z0).toBeCloseTo(-0.02, 6); // north edge: negative Z, top of the screen from above
    const [x1, , z1] = xyz(mesh.positions, 11);
    expect(x1).toBeCloseTo(0.03, 6);
    expect(z1).toBeCloseTo(0.02, 6);
  });

  it('applies the vertical exaggeration only to drawn heights, with the factor it reports', () => {
    const g = grid();
    const mesh = buildTerrain(g);
    expect(mesh.exaggeration).toBe(VERTICAL_EXAGGERATION);
    expect(exaggerationNote(mesh)).toBe(`Vertical exaggeration ×${VERTICAL_EXAGGERATION}`);
    // Cell (0, 3) is 30 m above the lowest cell: drawn 30 x factor metres up.
    const [, y] = xyz(mesh.positions, 3);
    expect(y).toBeCloseTo((30 * VERTICAL_EXAGGERATION) / 1000, 6);
    // The grid itself is not changed.
    expect(g.values[3]).toBe(130);
    expect(heightAt(g, 1070, 2050)).toBeCloseTo(130, 6);
  });

  it('thins a large grid to at most MAX_SIDE vertices per side, keeping the last row and column', () => {
    const n = 500;
    const big: LayerGrid = { ...grid(Array.from({ length: n * n }, () => 0)), rows: n, cols: n, bounds: { x_min: 0, y_min: 0, x_max: 20000, y_max: 20000 } };
    const mesh = buildTerrain(big);
    expect(mesh.rows).toBeLessThanOrEqual(MAX_SIDE + 1);
    expect(mesh.cells[(mesh.rows * mesh.cols - 1) * 2]).toBe(n - 1);
    expect(mesh.indices.length).toBe((mesh.rows - 1) * (mesh.cols - 1) * 6);
  });

  it('draws the example grid without bounds and places nothing on it', () => {
    const g = syntheticLayer('elevation');
    const mesh = buildTerrain(g);
    expect(mesh.mapped).toBe(false);
    expect(placeOnTerrain(g, mesh, -84.78, 29.13)).toBeNull();
  });
});

describe('marks on the terrain', () => {
  it('places a latitude and longitude through the map projection of ../map/projection', () => {
    // A point of the projection vectors, with a grid built around it.
    const v = (vectors as unknown as { points: { lat_deg: number; lon_deg: number; x_m: number; y_m: number }[] }).points.find(
      (p) => p.lat_deg < -80,
    );
    expect(v).toBeDefined();
    if (!v) return;
    const p = forwardSouthPolar(v.lat_deg, v.lon_deg);
    expect(p.x_m).toBeCloseTo(v.x_m, 0);
    const g: LayerGrid = { ...grid(), bounds: { x_min: p.x_m - 40, y_min: p.y_m - 30, x_max: p.x_m + 40, y_max: p.y_m + 30 } };
    const mesh = buildTerrain(g);
    const at = placeOnTerrain(g, mesh, v.lat_deg, v.lon_deg);
    expect(at).not.toBeNull();
    expect(at?.x).toBeCloseTo(0, 6);
    expect(at?.z).toBeCloseTo(0, 6);
  });

  it('reads a mark height from the drawn (thinned) mesh, not the full grid', () => {
    // 5 x 5 grid with a spike in the middle cell; thinned with stride 2 the spike is still a
    // vertex, but a point between vertices must sit on the drawn triangles.
    const n = 5;
    const values = Array.from({ length: n * n }, (_, k) => (k === 12 ? 500 : 100));
    const g: LayerGrid = { ...grid(values), rows: n, cols: n, bounds: { x_min: 0, y_min: 0, x_max: 100, y_max: 100 } };
    const mesh = buildTerrain(g, 3, 3);
    expect(mesh.stride).toBe(2);
    // Every vertex reads back its own drawn height.
    for (let k = 0; k < mesh.rows * mesh.cols; k += 1) {
      const [x, y, z] = xyz(mesh.positions, k);
      expect(meshHeightAt(mesh, x ?? 0, z ?? 0)).toBeCloseTo(y ?? 0, 9);
    }
    // Three quarters of the way from the corner vertex (0, 0) to the spike vertex (2, 2) lies in
    // the triangle b-c-d of that quad: half the drawn spike height. The full grid there (between
    // cells 1 and 2) is lower, so a mark placed from it would sink into the drawn slope.
    const [xa, , za] = xyz(mesh.positions, 0);
    const [xs, ys, zs] = xyz(mesh.positions, mesh.cols + 1);
    const x = (xa ?? 0) + 0.75 * ((xs ?? 0) - (xa ?? 0));
    const z = (za ?? 0) + 0.75 * ((zs ?? 0) - (za ?? 0));
    expect(meshHeightAt(mesh, x, z)).toBeCloseTo((ys ?? 0) / 2, 9);
    // Diagonal b-c of the quad: both its ends are flat ground, so the drawn surface there is too.
    expect(meshHeightAt(mesh, ((xa ?? 0) + (xs ?? 0)) / 2, ((za ?? 0) + (zs ?? 0)) / 2)).toBeCloseTo(0, 9);
  });

  it('keeps a valid cell when a neighbour with no weight is a gap', () => {
    const values = Array.from({ length: 12 }, () => 100);
    values[1] = Number.NaN;
    const g = grid(values);
    // Exactly on the centre of cell (0, 0): its east neighbour has weight 0.
    expect(heightAt(g, 1010, 2050)).toBe(100);
    // Between the two cells the gap counts: no height.
    expect(heightAt(g, 1020, 2050)).toBeNull();
  });

  it('leaves out points outside the grid', () => {
    const g = grid();
    expect(placeOnTerrain(g, buildTerrain(g), 0, 0)).toBeNull();
  });
});

describe('light from the server Sun angles', () => {
  it('turns azimuth from true north and elevation into a scene direction', () => {
    // On the 0 E meridian north is +y on the map, which is -Z in the scene; east is +X.
    const n = sunVector(0, 0, -85, 0);
    expect(n.x).toBeCloseTo(0, 6);
    expect(n.z).toBeCloseTo(-1, 6);
    const e = sunVector(90, 0, -85, 0);
    expect(e.x).toBeCloseTo(1, 6);
    const up = sunVector(123, 90, -85, 40);
    expect(up.y).toBeCloseTo(1, 6);
    const any = sunVector(200, 3, -84.78, 29.13);
    expect(Math.hypot(any.x, any.y, any.z)).toBeCloseTo(1, 6);
  });
});

describe('surface colours', () => {
  it('uses the colour layer and keeps NaN cells as ground grey', () => {
    const g = grid();
    const mesh = buildTerrain(g);
    const pixels = new Uint8ClampedArray(g.rows * g.cols * 4);
    pixels.set([255, 0, 0, 255], 0); // cell (0, 0) opaque red
    const colours = vertexColours(mesh, g, g, pixels);
    expect(Array.from(colours.slice(0, 3))).toEqual([1, 0, 0]);
    expect(colours[3]).toBeCloseTo(0.55, 6); // transparent: ground grey
  });
});

describe('availability and panel', () => {
  const list = candidatesExample as unknown as CandidateList;

  it('is on only for a selected place of the region list', () => {
    expect(terrainAvailability(null, null).enabled).toBe(false);
    expect(terrainAvailability(null, list).reason).toContain('Choose a site');
    expect(terrainAvailability('apollo-11', list).reason).toContain('outside the south pole region');
    expect(terrainAvailability(list.candidates[0]?.id ?? '', list).enabled).toBe(true);
  });

  it('renders its notes before the layers arrive, without errors', () => {
    const html = renderToStaticMarkup(<TerrainPanel places={[]} selectedId={null} onPick={() => undefined} />);
    expect(html).toContain('Hillshade');
    expect(html).toContain('Permanent shadow');
    expect(html).toContain('cast shadows are not computed');
  });
});

describe('missing layers', () => {
  it('explains a 503 instead of failing', () => {
    const text = missingText(new ApiError('data_unavailable', 'Layer not available.', 503), 'The elevation layer');
    expect(text).toContain('not available on the server');
    expect(text).toContain('The 2D map still works');
    expect(missingText(new ApiError('network', 'offline'), 'The slope layer')).toContain('could not be loaded');
  });
});
