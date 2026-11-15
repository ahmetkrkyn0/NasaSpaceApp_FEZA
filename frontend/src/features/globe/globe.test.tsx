import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sitesExample } from '../../api/examples';
import { FAR_SIDE_CENTRE, NEAR_SIDE_CENTRE, graticule, latLonToVector, sunDirection, vectorToLatLon } from './coords';
import GlobePanel, { LIGHTING_NOTE, MoonGlobe, NO_LIGHTING_NOTE, NO_LIGHT } from './index';

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
      <MoonGlobe sites={sitesExample} selectedId="mons-mouton-im2-target" onPick={() => undefined} light={NO_LIGHT} />,
    );
    expect(html).toContain(NO_LIGHTING_NOTE);
    expect(html).toContain('<select');
    expect(html).toContain('value="mons-mouton-im2-target" selected=""');
  });

  it('shows the lighting note and sub-Earth legend when the server gave both points', () => {
    const html = renderToStaticMarkup(
      <MoonGlobe
        sites={sitesExample}
        selectedId={null}
        onPick={() => undefined}
        light={{ subSolar: { lat_deg: -1.2, lon_deg: 45.3 }, subEarth: { lat_deg: 3.1, lon_deg: -4.2 } }}
      />,
    );
    expect(html).toContain(LIGHTING_NOTE);
    expect(html).toContain('sub-Earth point');
  });
});
