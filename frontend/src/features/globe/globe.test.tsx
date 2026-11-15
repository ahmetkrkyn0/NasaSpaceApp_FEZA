import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { bodySeriesExample, sitesExample } from '../../api/examples';
import type { CandidateList, RecommendResponse, Scenario } from '../../api/types';
import { EMPTY_RECOMMEND_STATE } from '../../state/recommend-store';
import { windowOf } from '../timeline/data';
import { BODY_SERIES_STEP_S, bodySeriesRequest, lightAt } from './light';
import { MOON_TEXTURE_URL, SURFACE_IMAGE_NOTE, TEXTURE_ROTATION_Y } from './texture';
import { FAR_SIDE_CENTRE, NEAR_SIDE_CENTRE, graticule, latLonToVector, sunDirection, vectorToLatLon } from './coords';
import GlobePanel, { LIGHTING_NOTE, MoonGlobe, NO_LIGHTING_NOTE, NO_LIGHT, globePlaces, withPlace } from './index';

const places = globePlaces(sitesExample, EMPTY_RECOMMEND_STATE);

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 9);

describe('globe coordinates', () => {
  it('puts the poles on the vertical axis', () => {
    const n = latLonToVector({ lat_deg: 90, lon_deg: 37 });
    const s = latLonToVector({ lat_deg: -90, lon_deg: -120 });
    close(n.x, 0);
    close(n.y, 1);
    close(n.z, 0);
    close(s.y, -1);
  });

  it('faces 0° longitude to the camera and 180° away, east positive to the right', () => {
    const near = latLonToVector(NEAR_SIDE_CENTRE);
    const far = latLonToVector(FAR_SIDE_CENTRE);
    const east = latLonToVector({ lat_deg: 0, lon_deg: 90 });
    const west = latLonToVector({ lat_deg: 0, lon_deg: -90 });
    expect([near.x, near.y, near.z].map((v) => Math.round(v * 1e9) / 1e9)).toEqual([0, 0, 1]);
    close(far.z, -1);
    close(east.x, 1);
    close(west.x, -1);
  });

  it('scales with the radius and inverts back to the same latitude and longitude', () => {
    for (const p of [
      { lat_deg: -84.78, lon_deg: 29.13 },
      { lat_deg: 0.6742, lon_deg: 23.4731 },
      { lat_deg: -45.4561, lon_deg: 177.5885 },
      { lat_deg: 18.562, lon_deg: 61.81 },
    ]) {
      const v = latLonToVector(p, 3);
      close(Math.hypot(v.x, v.y, v.z), 3);
      const back = vectorToLatLon(v);
      close(back.lat_deg, p.lat_deg);
      close(back.lon_deg, p.lon_deg);
    }
  });

  it('draws parallels and meridians every 30°', () => {
    // Five parallels between the poles and twelve meridians.
    expect(graticule(30)).toHaveLength(5 + 12);
  });
});

describe('surface image', () => {
  it('lines the image up with the globe coordinates', () => {
    // The image is equirectangular and centred on 0°: u = 0 is -180°, v = 1 is the north pole.
    const sphere = new THREE.SphereGeometry(1, 96, 64);
    sphere.applyMatrix4(new THREE.Matrix4().makeRotationY(TEXTURE_ROTATION_Y));
    const pos = sphere.getAttribute('position');
    const uv = sphere.getAttribute('uv');
    let checked = 0;
    for (let i = 0; i < pos.count; i += 37) {
      const lat = (uv.getY(i) - 0.5) * 180;
      if (Math.abs(lat) > 89) continue; // longitude is undefined at the poles
      const lon = uv.getX(i) * 360 - 180;
      const at = vectorToLatLon({ x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) });
      // Positions are stored as float32, so agreement is to about 1e-5 degrees.
      expect(Math.abs(at.lat_deg - lat)).toBeLessThan(1e-4);
      const dLon = ((at.lon_deg - lon + 540) % 360) - 180;
      expect(Math.abs(dLon)).toBeLessThan(1e-4);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('is a file in the public media folder, credited, and labelled as not used in calculations', () => {
    const file = MOON_TEXTURE_URL.replace(/^.*media\//, '');
    expect(() => readFileSync(fileURLToPath(new URL(`../../../public/media/${file}`, import.meta.url)))).not.toThrow();
    const credits = readFileSync(fileURLToPath(new URL('../../../public/media/CREDITS.md', import.meta.url)), 'utf8');
    expect(credits).toContain(file);
    expect(credits).toContain('SVS 4720');
    expect(SURFACE_IMAGE_NOTE).toContain('not used in any calculation');
  });
});

describe('light direction', () => {
  it('comes only from the server sub-solar point', () => {
    const sub = { lat_deg: -1.2, lon_deg: 45.3 };
    expect(sunDirection(sub)).toEqual(latLonToVector(sub, 1));
    expect(sunDirection(null)).toBeNull();
    expect(sunDirection({ lat_deg: Number.NaN, lon_deg: 0 })).toBeNull();
  });

  it('has no ephemeris computation in the globe code', () => {
    for (const file of ['coords.ts', 'GlobeView.tsx', 'index.tsx']) {
      const text = readFileSync(fileURLToPath(new URL(`./${file}`, import.meta.url)), 'utf8');
      // No time-based astronomy: no Julian dates, obliquity, mean anomaly or Date arithmetic.
      expect(text).not.toMatch(/julian|obliquity|anomaly|getTime\(|Date\.now|new Date/i);
    }
  });
});

describe('globe panel', () => {
  it('stays closed until asked for, so no 3D code loads with the page', () => {
    const html = renderToStaticMarkup(<GlobePanel />);
    expect(html).toContain('Show 3D Moon');
    expect(html).not.toContain('globe-canvas');
  });

  it('says when the computed light is missing and offers a keyboard site list', () => {
    const html = renderToStaticMarkup(
      <MoonGlobe places={places} selectedId="mons-mouton-im2-target" onPick={() => undefined} light={NO_LIGHT} />,
    );
    expect(html).toContain(NO_LIGHTING_NOTE);
    expect(html).toContain('<select');
    expect(html).toContain('value="mons-mouton-im2-target" selected=""');
  });

  it('shows the lighting note and sub-Earth legend when the server gave both points', () => {
    const html = renderToStaticMarkup(
      <MoonGlobe
        places={places}
        selectedId={null}
        onPick={() => undefined}
        light={{ subSolar: { lat_deg: -1.2, lon_deg: 45.3 }, subEarth: { lat_deg: 3.1, lon_deg: -4.2 }, utc: '2026-12-05T00:00:00Z', validity: 'DERIVED' }}
      />,
    );
    expect(html).toContain(LIGHTING_NOTE);
    expect(html).toContain('sub-Earth point');
    expect(html).toContain('2026-12-05 00:00 UTC');
    expect(html).toContain('Derived');
  });
});

const scenario = (start_utc: string, end_utc: string): Scenario => ({
  scenario_id: 's',
  label: 'x',
  site_id: 'mons-mouton-im2-target',
  lat_deg: null,
  lon_deg: null,
  start_utc,
  end_utc,
  mast_height_m: null,
  panel_profile_id: 'vertical_tracking',
});

describe('body series for the globe', () => {
  it('asks once per scenario, hourly, capped at the two-month limit', () => {
    const month = bodySeriesRequest(windowOf(scenario('2026-12-01T00:00:00Z', '2026-12-31T00:00:00Z'))!);
    expect(month).toEqual({ start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z', step_s: BODY_SERIES_STEP_S });
    const long = bodySeriesRequest(windowOf(scenario('2026-12-01T00:00:00Z', '2027-04-01T00:00:00Z'))!);
    expect(long?.end_utc).toBe('2027-01-30T00:00:00Z');
  });

  it('takes the sample nearest the selected moment, without interpolating', () => {
    const at = lightAt(bodySeriesExample, Date.parse('2026-12-05T13:00:00Z'));
    expect(at?.utc).toBe('2026-12-05T12:00:00Z');
    expect(at?.subSolar).toEqual({ lat_deg: -1.453422, lon_deg: -134.715023 });
    expect(at?.subEarth).toEqual({ lat_deg: 6.209004, lon_deg: 5.627314 });
    expect(at?.outside).toBe(false);
    expect(lightAt(bodySeriesExample, Date.parse('2026-12-20T00:00:00Z'))?.outside).toBe(true);
    expect(lightAt(null, 0)).toBeNull();
  });
});

describe('places on the globe', () => {
  const candidates: CandidateList = {
    region: 'mons-mouton',
    method: {
      window_m: 200,
      stride_m: 100,
      slope_limit_deg: 12,
      slope_limit_source: 'x',
      min_separation_km: 2,
      max_candidates: 10,
      assumed: [],
      source: 'x',
      note: 'x',
    },
    candidates: [
      { id: 'cand-01', kind: 'candidate', name: 'Candidate 1', lat_deg: -85, lon_deg: 30, elevation_m: 0, mean_slope_deg: 3, max_slope_deg: 6, slope_std_deg: 1, safe_cell_fraction: 0.9, psr_fraction: 0, distance_to_psr_km: 3, has_terrain_horizon: true, validity: 'DERIVED' },
    ],
    validity: 'DERIVED',
  };
  const ranked = { ranked: [{ site_id: 'cand-01', eliminated: false }, { site_id: 'apollo-11', eliminated: true }] } as unknown as RecommendResponse;

  it('adds candidate regions as their own kind and ranks only non-eliminated places', () => {
    const list = globePlaces(sitesExample, { ...EMPTY_RECOMMEND_STATE, candidates, ranked });
    const cand = list.find((p) => p.id === 'cand-01');
    expect(cand).toMatchObject({ kind: 'candidate', rank: 1 });
    expect(list.find((p) => p.id === 'apollo-11')?.rank).toBeUndefined();
    expect(list.filter((p) => p.kind === 'site')).toHaveLength(sitesExample.length);
    // A catalogue entry in the candidate list is not drawn a second time.
    const catalogue = { ...candidates.candidates[0]!, id: sitesExample[0]!.id, kind: 'catalogue' as const };
    const withCatalogue = globePlaces(sitesExample, { ...EMPTY_RECOMMEND_STATE, candidates: { ...candidates, candidates: [catalogue] } });
    expect(withCatalogue).toHaveLength(sitesExample.length);
  });

  it('moves the scenario to a picked place, candidates included', () => {
    const next = withPlace(scenario('2026-12-01T00:00:00Z', '2026-12-31T00:00:00Z'), { id: 'cand-01', name: 'Candidate 1', lat_deg: -85, lon_deg: 30, kind: 'candidate' });
    expect([next.site_id, next.lat_deg, next.lon_deg, next.label, next.start_utc]).toEqual(['cand-01', null, null, 'Candidate 1', '2026-12-01T00:00:00Z']);
  });
});
