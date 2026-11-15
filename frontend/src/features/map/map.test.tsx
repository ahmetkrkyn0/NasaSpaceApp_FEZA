import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import vectors from '../../../../data/examples/projection_vectors.json';
import { sitesExample } from '../../api/examples';
import { syntheticLayer } from '../../api/layers';
import type { CandidateList, RecommendResponse, Scenario } from '../../api/types';
import { EMPTY_RECOMMEND_STATE } from '../../state/recommend-store';
import { mapCandidates, withCustomPoint, withSite } from './index';
import { MapView, type MapViewProps } from './MapView';
import { MOON_RADIUS_M, forwardSouthPolar, inverseSouthPolar, normalizeLongitude } from './projection';
import { greyLevel, layerPixels } from './raster';

const MICRO_DEGREE = 1e-6;

/** Site names as they appear in rendered HTML (apostrophes are escaped). */
const htmlName = (name: string) => name.replace(/'/g, '&#x27;');

function lonGap(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return Math.min(d, 360 - d);
}

describe('south polar projection', () => {
  it('uses the radius of the vector file', () => {
    expect(vectors.crs_wkt).toContain(String(MOON_RADIUS_M));
  });

  it.each(vectors.points)('inverse of $id is within a millionth of a degree', (p) => {
    const geo = inverseSouthPolar(p.x_m, p.y_m);
    expect(Math.abs(geo.lat_deg - p.lat_deg)).toBeLessThan(MICRO_DEGREE);
    // The pole has no longitude; elsewhere compare modulo 360 (-180 and 180 are the same meridian).
    if (p.lat_deg !== -90) expect(lonGap(geo.lon_deg, p.lon_deg)).toBeLessThan(MICRO_DEGREE);
  });

  it.each(vectors.points)('forward of $id is within the file tolerance', (p) => {
    const xy = forwardSouthPolar(p.lat_deg, p.lon_deg);
    expect(Math.abs(xy.x_m - p.x_m)).toBeLessThan(vectors.tolerance_m);
    expect(Math.abs(xy.y_m - p.y_m)).toBeLessThan(vectors.tolerance_m);
  });

  it('folds longitudes into (-180, 180]', () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-180)).toBe(180);
    expect(normalizeLongitude(359.5)).toBeCloseTo(-0.5, 10);
  });
});

const scenario: Scenario = {
  scenario_id: 'a',
  label: 'Mons Mouton',
  site_id: 'mons-mouton-im2-target',
  lat_deg: null,
  lon_deg: null,
  start_utc: '2026-12-01T00:00:00Z',
  end_utc: '2026-12-31T00:00:00Z',
  mast_height_m: null,
  panel_profile_id: 'vertical_tracking',
};

describe('map picks', () => {
  it('a click makes the point the scenario location and keeps dates and panel', () => {
    const next = withCustomPoint(scenario, { lat_deg: -84.79061234567, lon_deg: 389.1 });
    expect(next.site_id).toBeNull();
    expect(next.lat_deg).toBe(-84.790612);
    expect(next.lon_deg).toBe(29.1);
    expect(next.start_utc).toBe(scenario.start_utc);
    expect(next.panel_profile_id).toBe(scenario.panel_profile_id);
  });

  it('a site marker makes the site the scenario location', () => {
    const site = sitesExample[0]!;
    const next = withSite({ ...scenario, site_id: null, lat_deg: 1, lon_deg: 2 }, site);
    expect(next).toMatchObject({ site_id: site.id, lat_deg: null, lon_deg: null, label: site.name });
  });
});

function render(overrides: Partial<MapViewProps>): string {
  const props: MapViewProps = {
    view: 'overview',
    onView: () => undefined,
    sites: sitesExample,
    activeSiteId: null,
    point: null,
    layerName: 'hillshade',
    onLayerName: () => undefined,
    layer: { kind: 'none' },
    onPickPoint: () => undefined,
    onPickSite: () => undefined,
    ...overrides,
  };
  return renderToStaticMarkup(<MapView {...props} />);
}

describe('MapView', () => {
  it('draws every catalogue site on the overview grid', () => {
    const html = render({});
    for (const site of sitesExample) expect(html).toContain(htmlName(site.name));
    expect(html).toContain('map-grid');
  });

  it('keeps the grid and markers when the layer is missing (503) and says so', () => {
    const html = render({ view: 'region', layer: { kind: 'unavailable', message: 'Layer file not found.' } });
    expect(html).toContain('Layer not available');
    expect(html).toContain('map-grid');
    for (const site of sitesExample) expect(html).toContain(htmlName(site.name));
  });

  it('does not place the example layer, which has no map bounds', () => {
    const html = render({ view: 'region', layer: { kind: 'ready', grid: syntheticLayer('hillshade') } });
    expect(html).toContain('no map bounds');
    expect(html).not.toContain('<image');
    expect(html).toContain('Assumed');
  });
});

describe('layer raster', () => {
  it('maps the range to grey and leaves missing cells transparent', () => {
    expect(greyLevel(0, 0, 10)).toBe(0);
    expect(greyLevel(10, 0, 10)).toBe(255);
    expect(greyLevel(Number.NaN, 0, 10)).toBe(-1);
    const grid = syntheticLayer('elevation');
    const pixels = layerPixels(grid, 'elevation');
    expect(pixels[3]).toBe(255);
    expect(pixels[pixels.length - 1]).toBe(0);
  });
});

describe('candidate regions on the map', () => {
  const method = {
    window_m: 200,
    stride_m: 100,
    slope_limit_deg: 12,
    slope_limit_source: 'x',
    min_separation_km: 2,
    max_candidates: 10,
    assumed: [],
    source: 'x',
    note: 'x',
  };
  const candidate = (id: string, lat_deg: number, lon_deg: number) => ({
    id,
    kind: 'candidate' as const,
    name: `Candidate ${id}`,
    lat_deg,
    lon_deg,
    elevation_m: 0,
    mean_slope_deg: 3,
    max_slope_deg: 6,
    slope_std_deg: 1,
    safe_cell_fraction: 0.9,
    psr_fraction: 0,
    distance_to_psr_km: 3,
    has_terrain_horizon: true,
    validity: 'DERIVED' as const,
  });
  const list: CandidateList = {
    region: 'mons-mouton',
    method,
    candidates: [
      candidate('cand-01', -85, 30),
      candidate('cand-02', -84.5, 32),
      { ...candidate(sitesExample[0]!.id, 0, 0), kind: 'catalogue' as const },
    ],
    validity: 'DERIVED',
  };
  const ranked = {
    ranked: [
      { site_id: 'cand-02', eliminated: false },
      { site_id: 'cand-01', eliminated: true },
    ],
  } as unknown as RecommendResponse;

  it('takes only candidate regions, ranked by the last recommendation', () => {
    const marks = mapCandidates(sitesExample, { ...EMPTY_RECOMMEND_STATE, candidates: list, ranked });
    expect(marks).toEqual([
      { id: 'cand-01', name: 'Candidate cand-01', lat_deg: -85, lon_deg: 30 },
      { id: 'cand-02', name: 'Candidate cand-02', lat_deg: -84.5, lon_deg: 32, rank: 1 },
    ]);
    expect(mapCandidates(sitesExample, EMPTY_RECOMMEND_STATE)).toEqual([]);
  });

  it('draws them as squares at their latitude and longitude, top ranks larger', () => {
    const html = render({
      candidates: [
        { id: 'cand-01', name: 'Candidate 1', lat_deg: -85, lon_deg: 30 },
        { id: 'cand-02', name: 'Candidate 2', lat_deg: -84.5, lon_deg: 32, rank: 1 },
      ],
      activeSiteId: 'cand-01',
    });
    // Overview: 4 SVG units per degree, half side 6.4 (8 for the top three).
    expect(html).toContain('<rect x="113.6" y="333.6" width="12.8" height="12.8"');
    expect(html).toContain('<rect x="120" y="330" width="16" height="16"');
    expect(html).toContain('class="map-candidate is-active"');
    expect(html).toContain('class="map-candidate is-top"');
    expect(html).toContain('Candidate 2, candidate region, rank 1 in the last recommendation');
    expect(html).toContain('Candidate region (larger: top three of the last recommendation)');
  });

  it('places them with the south polar projection in the region view', () => {
    const c = { id: 'cand-01', name: 'Candidate 1', lat_deg: -85, lon_deg: 30 };
    const html = render({ view: 'region', layer: { kind: 'none' }, candidates: [c] });
    const p = forwardSouthPolar(c.lat_deg, c.lon_deg);
    const rect = /<g class="map-candidate"[^>]*><title>[^<]*<\/title><rect x="([^"]+)" y="([^"]+)" width="([^"]+)"/.exec(html);
    expect(rect).not.toBeNull();
    const half = Number(rect![3]) / 2;
    expect(Number(rect![1]) + half).toBeCloseTo(p.x_m, 6);
    expect(Number(rect![2]) + half).toBeCloseTo(-p.y_m, 6);
  });

  it('shows no candidate legend without candidates', () => {
    expect(render({})).not.toContain('Candidate region');
  });
});
