import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import vectors from '../../../../data/examples/projection_vectors.json';
import { sitesExample } from '../../api/examples';
import { syntheticLayer } from '../../api/layers';
import type { Scenario } from '../../api/types';
import { withCustomPoint, withSite } from './index';
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
