import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventsEclipseExample, eventsExample, sitesExample } from '../../api/examples';
import type { EventMetrics, Scenario } from '../../api/types';
import { selectPanels } from '../../features/registry';
import { currentOnly, windowOf } from '../../features/timeline/data';
import { createScenarioStore, scenarioStore } from '../../state/scenario-store';
import { createUiStore, type Door } from '../ui-state';
import { STAGE_PANEL_IDS, arrangeDoor } from './arrange';
import { DoorLayout } from './DoorLayout';
import { SummaryView } from './DoorSummary';
import { percentText, placeName, summarySentence } from './summary';
import { SitePickerView } from './SitePicker';
import { applyPick, scenarioForPick } from './site-pick';
import { DEFAULT_DURATION_DAYS, DEFAULT_MAST_HEIGHT_M, DEFAULT_PANEL_PROFILE_ID, addDaysUtc } from '../../state/scenario-tools';

const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe('door arrangement', () => {
  it('puts the horizon strip on the Explore stage with the countdown and timeline', () => {
    const a = arrangeDoor({ door: 'explore', mode: 'plan' });
    // The Surface view goes to the end of the right column, so the strip, countdown and timeline
    // keep their places.
    expect(ids(a.stage)).toEqual(['sky']);
    expect(ids(a.head)).toEqual(['hud']);
    expect(ids(a.side).at(-1)).toBe('scene');
    expect(ids(a.head)).toEqual(['hud']);
    expect(ids(a.bottom)).toEqual(['timeline']);
    expect(ids(a.side)).not.toContain('sky');
  });

  it('keeps the guided tasks column next to the strip in Classroom', () => {
    const a = arrangeDoor({ door: 'classroom', mode: 'analyze' });
    expect(ids(a.left)).toContain('tasks');
    expect(ids(a.stage)).toEqual(['sky']);
    expect(ids(a.head)).toEqual(['hud']);
    expect(ids(a.side).at(-1)).toBe('scene');
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
    // The Surface view sits in the right column, not in the stage.
    const stage = html.slice(html.indexOf('door-stage-main'), html.indexOf('bottom-dock'));
    expect(stage).not.toContain('data-panel="scene"');
    expect(html.slice(html.indexOf('class="right-rail"'))).toContain('data-panel="scene"');
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
    // A dated label does not repeat the date in the sentence when the site is in the catalogue.
    const dated = { ...scenario, label: 'Mons Mouton (IM-2 target point), 2026-12-01' };
    expect(placeName(dated, [{ ...sitesExample[0]!, id: 'mons-mouton-im2-target', name: 'Mons Mouton (IM-2 target point)' }])).toBe(
      'Mons Mouton (IM-2 target point)',
    );
    const html = renderToStaticMarkup(<SummaryView scenario={unnamed} window={window} events={eventsExample} sites={[]} />);
    expect(html).toContain('At mons-mouton-im2-target, from');
  });

  it('points to the site picker when no scenario is set', () => {
    const html = renderToStaticMarkup(<SummaryView scenario={null} window={null} events={null} />);
    expect(html).toContain('Pick one above');
  });
});

describe('answers of the previous scenario', () => {
  it('are dropped while the new scenario loads or after it fails, so no sentence uses them', () => {
    expect(currentOnly({ status: 'loading', data: eventsExample, error: undefined }).data).toBeUndefined();
    const failed = currentOnly({ status: 'error', data: eventsExample, error: new Error('boom') });
    expect(failed.data).toBeUndefined();
    expect(failed.status).toBe('error');
    expect(currentOnly({ status: 'success', data: eventsExample, error: undefined }).data).toBe(eventsExample);
    const html = renderToStaticMarkup(<SummaryView scenario={scenario} window={window} events={null} />);
    expect(html).toContain('Loading the result');
    expect(html).not.toContain('Earth is in view');
  });
});

describe('site picker of the Explore and Classroom doors', () => {
  const NOW = Date.parse('2026-12-03T15:42:10Z');
  const mons = sitesExample.find((s) => s.id === 'mons-mouton-im2-target')!;
  const other = sitesExample.find((s) => s.id !== mons.id)!;

  it('starts a scenario from today with the setup defaults when none is active', () => {
    const s = scenarioForPick(null, mons, sitesExample, NOW);
    expect(s.site_id).toBe(mons.id);
    expect(s.start_utc).toBe('2026-12-03T00:00:00Z');
    expect(s.end_utc).toBe(addDaysUtc('2026-12-03T00:00:00Z', DEFAULT_DURATION_DAYS));
    expect(s.mast_height_m).toBe(DEFAULT_MAST_HEIGHT_M);
    expect(s.panel_profile_id).toBe(DEFAULT_PANEL_PROFILE_ID);
  });

  it('moves the active scenario to the picked site and keeps its dates and settings', () => {
    const active: Scenario = { ...scenario, mast_height_m: 10, earth_criterion: 'full_disk' };
    const s = scenarioForPick(active, other, sitesExample, NOW);
    expect(s.site_id).toBe(other.id);
    expect([s.start_utc, s.end_utc, s.mast_height_m, s.panel_profile_id, s.earth_criterion]).toEqual([
      active.start_utc,
      active.end_utc,
      10,
      active.panel_profile_id,
      'full_disk',
    ]);
  });

  it('lists the catalogue, shows the active site and the dates it covers', () => {
    const html = renderToStaticMarkup(<SitePickerView sites={sitesExample} active={scenario} onPick={() => undefined} />);
    expect(html).toContain('<option value="mons-mouton-im2-target" selected="">');
    expect(html).toContain('2026-12-01 to 2026-12-31 UTC');
    expect(html).not.toContain('Choose a site…');
    expect(sitesExample.every((s) => html.includes(`value="${s.id}"`))).toBe(true);
  });

  it('asks for a site when none is chosen and marks a custom point', () => {
    const empty = renderToStaticMarkup(<SitePickerView sites={sitesExample} active={null} onPick={() => undefined} />);
    expect(empty).toContain('Choose a site…');
    expect(empty).toContain(`${DEFAULT_DURATION_DAYS} days from today`);
    const custom = renderToStaticMarkup(
      <SitePickerView sites={sitesExample} active={{ ...scenario, site_id: null, lat_deg: -85, lon_deg: 30 }} onPick={() => undefined} />,
    );
    expect(custom).toContain('Custom point (set in the Plan door)');
  });

  it('is part of both door layouts', () => {
    for (const door of ['explore', 'classroom'] as const) {
      expect(renderToStaticMarkup(<DoorLayout door={door} mode="plan" />)).toContain('door-site-select');
    }
  });
});

describe('applying a site pick to the scenario store', () => {
  const NOW = Date.parse('2026-12-03T15:42:10Z');
  const mons = sitesExample.find((s) => s.id === 'mons-mouton-im2-target')!;
  const other = sitesExample.find((s) => s.id !== mons.id)!;

  it('moves a moment left from an earlier link to the start of a new scenario', () => {
    const store = createScenarioStore({ active: null, selected_utc: '2031-05-01T00:00:00Z', compare: [] });
    const next = applyPick(store, mons, sitesExample, NOW);
    expect(store.getState().active).toEqual(next);
    expect(store.getState().selected_utc).toBe(next.start_utc);
  });

  it('keeps the selected moment when the active scenario only changes site', () => {
    const store = createScenarioStore({ active: scenario, selected_utc: '2026-12-05T00:00:00Z', compare: [] });
    applyPick(store, other, sitesExample, NOW);
    expect(store.getState().active?.site_id).toBe(other.id);
    expect(store.getState().selected_utc).toBe('2026-12-05T00:00:00Z');
  });
});
