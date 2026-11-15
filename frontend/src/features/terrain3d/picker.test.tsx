import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { GlobePlace } from '../globe/GlobeView';
import { TerrainPlacePicker, terrainPlaceList } from '.';
import type { TerrainMark } from './TerrainView';

const PLACES: GlobePlace[] = [
  { id: 'site-a', name: 'Site A', lat_deg: -89, lon_deg: 0, kind: 'site' },
  { id: 'cand-2', name: 'Candidate 2', lat_deg: -88, lon_deg: 10, kind: 'candidate', rank: 2 },
  { id: 'cand-1', name: 'Candidate 1', lat_deg: -88, lon_deg: 20, kind: 'candidate', rank: 1 },
  { id: 'far', name: 'Far site', lat_deg: 0, lon_deg: 0, kind: 'site' },
];
const at = { x: 0, y: 0, z: 0 };
const MARKS: TerrainMark[] = ['site-a', 'cand-2', 'cand-1'].map((id) => ({ id, kind: id.startsWith('cand') ? 'candidate' : 'site', at }));

describe('keyboard pick on the 3D terrain (#107, item 4)', () => {
  it('lists only the places drawn on the terrain, top ranked first', () => {
    expect(terrainPlaceList(PLACES, MARKS).map((p) => p.id)).toEqual(['cand-1', 'cand-2', 'site-a']);
  });

  it('is a native select with the selected mark chosen', () => {
    const html = renderToStaticMarkup(<TerrainPlacePicker places={terrainPlaceList(PLACES, MARKS)} selectedId="cand-2" onPick={() => undefined} />);
    expect(html).toContain('<select');
    expect(html).toContain('value="cand-2" selected=""');
    expect(html).toContain('1. Candidate 1 (candidate)');
    expect(html).not.toContain('Far site');
    expect(html).not.toContain('tabindex="-1"');
  });

  it('asks for a choice when the selection is not on the terrain, and is off when nothing is drawn', () => {
    expect(renderToStaticMarkup(<TerrainPlacePicker places={terrainPlaceList(PLACES, MARKS)} selectedId="far" onPick={() => undefined} />)).toContain(
      'Choose a place…',
    );
    const none = renderToStaticMarkup(<TerrainPlacePicker places={[]} selectedId={null} onPick={() => undefined} />);
    expect(none).toContain('disabled=""');
    expect(none).toContain('No places on this terrain');
  });
});
