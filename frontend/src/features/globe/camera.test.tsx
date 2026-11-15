import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sitesExample } from '../../api/examples';
import { EMPTY_RECOMMEND_STATE } from '../../state/recommend-store';
import { latLonToVector, turnTowards } from './coords';
import { EVEN_LIGHT_NOTE, LIGHTING_NOTE, MoonGlobe, NO_LIGHTING_NOTE, NO_LIGHT, drawnSun, globePlaces, lightingNote } from './index';

const source = (file: string) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
const places = globePlaces(sitesExample, EMPTY_RECOMMEND_STATE);
const LIGHT = { subSolar: { lat_deg: -1.2, lon_deg: 45.3 }, subEarth: { lat_deg: 3.1, lon_deg: -4.2 }, utc: '2026-12-05T00:00:00Z', validity: 'DERIVED' as const };

describe('picking a site keeps the camera (#107, item 2)', () => {
  it('leaves the camera alone when the new place already faces it', () => {
    const camera = latLonToVector({ lat_deg: 0, lon_deg: 0 }, 2.7);
    expect(turnTowards(camera, { lat_deg: 10, lon_deg: 20 })).toBeNull();
  });

  it('turns to a hidden place at the same distance, so the zoom stays', () => {
    const camera = latLonToVector({ lat_deg: 0, lon_deg: 0 }, 2.7);
    const next = turnTowards(camera, { lat_deg: -89.5, lon_deg: 180 })!;
    expect(next).not.toBeNull();
    expect(Math.hypot(next.x, next.y, next.z)).toBeCloseTo(2.7, 9);
  });

  it('builds the globe and the terrain scenes without the selection, so a pick never rebuilds them', () => {
    expect(source('./GlobeView.tsx')).toContain('}, [places, theme]);');
    expect(source('./GlobeView.tsx')).toContain('}, [selectedId]);');
    expect(source('../terrain3d/TerrainView.tsx')).toContain('}, [mesh]);');
    expect(source('../terrain3d/TerrainView.tsx')).toContain('}, [marks, selectedId]);');
  });
});

describe('even light (#107, item 1)', () => {
  it('is the viewer choice only; the computed light stays the default', () => {
    const sun = { x: 0, y: 0, z: 1 };
    expect(drawnSun(sun, false)).toBe(sun);
    expect(drawnSun(sun, true)).toBeNull();
    expect(lightingNote(sun, false)).toBe(LIGHTING_NOTE);
    expect(lightingNote(sun, true)).toBe(EVEN_LIGHT_NOTE);
    expect(lightingNote(null, true)).toBe(NO_LIGHTING_NOTE);
    expect(EVEN_LIGHT_NOTE).toContain('not the computed illumination');
  });

  it('is a keyboard button, off by default, and says it is not the computed light when on', () => {
    const off = renderToStaticMarkup(<MoonGlobe places={places} selectedId={null} onPick={() => undefined} light={LIGHT} />);
    expect(off).toContain('aria-pressed="false"');
    expect(off).toContain('Even light</button>');
    expect(off).toContain(LIGHTING_NOTE);
    const on = renderToStaticMarkup(<MoonGlobe places={places} selectedId={null} onPick={() => undefined} light={LIGHT} initialEven />);
    expect(on).toContain('aria-pressed="true"');
    expect(on).toContain(EVEN_LIGHT_NOTE);
    // The sample time belongs to the computed light, so it is not shown with even light.
    expect(on).not.toContain('2026-12-05 00:00 UTC');
  });

  it('is disabled when the computed Sun direction is not loaded', () => {
    const html = renderToStaticMarkup(<MoonGlobe places={places} selectedId={null} onPick={() => undefined} light={NO_LIGHT} />);
    expect(html).toMatch(/disabled=""[^>]*>Even light<\/button>/);
  });
});
