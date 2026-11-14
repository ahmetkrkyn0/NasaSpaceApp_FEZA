import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventsEclipseExample, eventsExample, sitesExample } from '../../api/examples';
import type { EventMetrics, Scenario } from '../../api/types';
import { selectPanels } from '../../features/registry';
import { windowOf } from '../../features/timeline/data';
import { scenarioStore } from '../../state/scenario-store';
import { createUiStore, type Door } from '../ui-state';
import { STAGE_PANEL_IDS, arrangeDoor } from './arrange';
import { DoorLayout } from './DoorLayout';
import { SummaryView } from './DoorSummary';
import { percentText, placeName, summarySentence } from './summary';

const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe('door arrangement', () => {
  it('puts the horizon strip on the Explore stage with the countdown and timeline', () => {
    const a = arrangeDoor({ door: 'explore', mode: 'plan' });
    expect(ids(a.stage)).toEqual(['sky']);
    expect(ids(a.head)).toEqual(['hud']);
    expect(ids(a.bottom)).toEqual(['timeline']);
    expect(ids(a.side)).not.toContain('sky');
  });

  it('keeps the guided tasks column next to the strip in Classroom', () => {
    const a = arrangeDoor({ door: 'classroom', mode: 'analyze' });
    expect(ids(a.left)).toContain('tasks');
    expect(ids(a.stage)).toEqual(['sky']);
    expect(ids(a.bottom)).toEqual(['timeline']);
  });

  it.each(['explore', 'classroom'] as Door[])('places each panel the registry gives %s exactly once and nothing else', (door) => {
    const filter = { door, mode: 'plan' as const };
    const a = arrangeDoor(filter);
    const placed = [...a.left, ...a.stage, ...a.head, ...a.bottom, ...a.side].map((p) => p.id).sort();
    const registered = (['leftRail', 'center', 'canvasOverlay', 'rightRail', 'bottomDock'] as const)
      .flatMap((slot) => ids(selectPanels(slot, filter)))
      .sort();
    expect(placed).toEqual(registered);
    expect(placed).not.toContain('map');
    expect(STAGE_PANEL_IDS.every((id) => placed.includes(id))).toBe(true);
  });
});

describe('changing the door keeps the scenario', () => {
  const query =
    '?site=mons-mouton-im2-target&start=2026-12-01T00%3A00%3A00Z&end=2026-12-31T00%3A00%3A00Z&panel=vertical_tracking&t=2026-12-05T00%3A00%3A00Z&door=plan';

  it.each(['explore', 'classroom', 'plan'] as Door[])('keeps site, dates and selected moment in the URL for %s', (door) => {
    let search = query;
    const store = createUiStore({ read: () => ({ search }), replace: (next) => (search = next) });
    store.setDoor(door);
    const before = new URLSearchParams(query);
    const after = new URLSearchParams(search);
    for (const key of ['site', 'start', 'end', 'panel', 't']) expect(after.get(key)).toBe(before.get(key));
    expect(after.get('door')).toBe(door);
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(['explore', 'classroom'] as const)('never writes the scenario while the %s layout renders', (door) => {
    const setScenario = vi.spyOn(scenarioStore, 'setScenario');
    const setSelected = vi.spyOn(scenarioStore, 'setSelectedUtc');
    const html = renderToStaticMarkup(<DoorLayout door={door} mode="plan" />);
    expect(html).toContain(`data-door-layout="${door}"`);
    expect(html).toContain('data-panel="sky"');
    expect(html).toContain('data-panel="timeline"');
    expect(setScenario).not.toHaveBeenCalled();
    expect(setSelected).not.toHaveBeenCalled();
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
const window = windowOf(scenario)!;

const none: EventMetrics = {
  sunlit_fraction: null,
  longest_dark_hours: null,
  max_sun_elevation_deg: null,
  earth_visible_fraction: null,
  longest_earth_hidden_hours: null,
};

describe('one-sentence result', () => {
  it('is built from the example metrics only', () => {
    expect(summarySentence({ label: 'Mons Mouton', startMs: window.startMs, endMs: window.endMs, metrics: eventsExample.metrics })).toBe(
      'At Mons Mouton, from 2026-12-01 to 2026-12-31, Earth is in view 72 % of the time.',
    );
  });

  it('follows the metrics it is given, with every clause from a server value', () => {
    const metrics = { ...none, sunlit_fraction: 0.634, longest_dark_hours: 148.68, earth_visible_fraction: 0.5 };
    expect(summarySentence({ label: 'X', startMs: window.startMs, endMs: window.endMs, metrics })).toBe(
      'At X, from 2026-12-01 to 2026-12-31, the Sun is up 63 % of the time, the longest dark period lasts 6 d 4.7 h and Earth is in view 50 % of the time.',
    );
    expect(summarySentence({ label: 'X', startMs: 0, endMs: 0, metrics: { ...none, longest_dark_hours: 0 } })).toContain('there is no dark period');
  });

  it('gives no sentence when no metric is present', () => {
    expect(summarySentence({ label: 'X', startMs: 0, endMs: 0, metrics: none })).toBeNull();
  });

  it('never rounds a small share to zero or a large one to all', () => {
    expect(percentText(0.001)).toBe('under 1 %');
    expect(percentText(0.999)).toBe('over 99 %');
    expect(percentText(0)).toBe('0 %');
    expect(percentText(1)).toBe('100 %');
  });

  it('shows the validity label beside the sentence', () => {
    const html = renderToStaticMarkup(<SummaryView scenario={scenario} window={window} events={eventsExample} />);
    expect(html).toContain('Earth is in view 72 % of the time');
    expect(html).toContain('Assumed');
    expect(html).toContain('terrain not included');
  });

  it('says the summary is not available when the answer has no metrics', () => {
    const html = renderToStaticMarkup(<SummaryView scenario={scenario} window={window} events={eventsEclipseExample} />);
    expect(html).toContain('Summary not available');
    expect(html).toContain('Assumed');
  });

  it('names a scenario without a label from the site catalogue', () => {
    const unnamed = { ...scenario, label: '' };
    expect(placeName(unnamed, [{ ...sitesExample[0]!, id: 'mons-mouton-im2-target', name: 'Mons Mouton (IM-2)' }])).toBe('Mons Mouton (IM-2)');
    expect(placeName(unnamed, [])).toBe('mons-mouton-im2-target');
    expect(placeName({ ...unnamed, site_id: null, lat_deg: -84.5, lon_deg: 12 }, [])).toBe('-84.5°, 12°');
    const html = renderToStaticMarkup(<SummaryView scenario={unnamed} window={window} events={eventsExample} sites={[]} />);
    expect(html).toContain('At mons-mouton-im2-target, from');
  });

  it('points to the Plan door when no scenario is set', () => {
    const html = renderToStaticMarkup(<SummaryView scenario={null} window={null} events={null} />);
    expect(html).toContain('Choose a site and dates in the Plan door');
  });
});
