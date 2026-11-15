import { afterEach, expect, it } from 'vitest';
import { getEvents, getHorizon, getNow, getSkySeries, getPower, getCommWindow, getEarthLink } from './client';
import { resetApiConfig } from './config';
import { exampleSource, loadRecording } from './recorded';
import { eventsExample } from './examples';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { SummaryView } from '../shell/doors/DoorSummary';
import { HudView } from '../features/hud/HudView';

afterEach(resetApiConfig);
const span = { start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z', mast_height_m: 2 };

it('answers the selected far-side and equatorial sites with their actual Earth visibility', async () => {
  const far = await getEvents({ ...span, site_id: 'change-4' });
  const near = await getEvents({ ...span, site_id: 'apollo-11' });
  expect(far.metrics.earth_visible_fraction).toBe(0);
  expect(near.metrics.earth_visible_fraction).toBe(1);
  expect(near.metrics.longest_dark_hours).toBeGreaterThan(300);
});

it('loads a consistent horizon, sky, power and instant for the selected site', async () => {
  const location = { site_id: 'change-4', mast_height_m: 2 };
  expect((await getHorizon(location)).site_id).toBe('change-4');
  const sky = await getSkySeries({ ...location, start_utc: span.start_utc, hours: 720, step_minutes: 72 });
  expect(sky.samples.length).toBeGreaterThan(100);
  expect(sky.step_minutes).toBe(360);
  expect((await getNow({ ...location, utc: span.start_utc })).earth_up).toBe(false);
  const power = await getPower({ ...location, ...span, panel_profile_id: 'vertical_tracking' });
  expect(power.samples.length).toBeGreaterThan(1);
});

it('never substitutes a recording for another date, height, criterion, panel or coordinates', async () => {
  const request = { ...span, site_id: 'change-4' };
  for (const change of [
    { start_utc: '2026-11-01T00:00:00Z' }, { end_utc: '2026-12-30T00:00:00Z' },
    { mast_height_m: 0 }, { earth_criterion: 'full_disk' }, { site_id: 'unknown' },
  ]) {
    expect(await loadRecording('events', { ...request, ...change })).toBeNull();
  }
  expect(await loadRecording('power', { ...request, panel_profile_id: 'horizontal' })).toBeNull();
  expect(await loadRecording('events', { ...span, lat_deg: -45, lon_deg: 177 })).toBeNull();
  expect(await loadRecording('events', { ...request, start_utc: '2026-12-01T00:00:00.000Z' })).not.toBeNull();
});

it('labels a fallback with its actual place and dates next to the Explore result', async () => {
  const events = await getEvents({ ...span, site_id: 'change-4', start_utc: '2026-11-01T00:00:00Z' });
  expect(events).toEqual(eventsExample);
  expect(exampleSource(events)?.matched).toBe(false);
  const html = renderToStaticMarkup(createElement(SummaryView, {
    scenario: { scenario_id: 'x', label: "Chang'e 4", site_id: 'change-4', lat_deg: null, lon_deg: null, ...span, panel_profile_id: 'vertical_tracking' },
    window: { startMs: Date.parse('2026-11-01T00:00:00Z'), endMs: Date.parse(span.end_utc) }, events,
  }));
  expect(html).toContain('Example data');
  expect(html).toContain('Mons Mouton');
  expect(html).toContain('does not match');
  expect(html).not.toContain('At Chang');
});

it('cancels recording loads and returns independent copies', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(getEvents({ ...span, site_id: 'change-4' }, { signal: controller.signal })).rejects.toMatchObject({ code: 'aborted' });
  const first = await getEvents({ ...span, site_id: 'change-4' });
  first.metrics.earth_visible_fraction = 1;
  expect((await getEvents({ ...span, site_id: 'change-4' })).metrics.earth_visible_fraction).toBe(0);
});

it('identifies the actual instant of matched and fallback countdown and communication data', async () => {
  const initial = await getNow({ site_id: 'change-4', mast_height_m: 2, utc: span.start_utc });
  expect(exampleSource(initial)?.start_utc).toBe(initial.utc);
  expect(exampleSource(initial)?.end_utc).toBe(initial.utc);
  const fallback = await getNow({ site_id: 'change-4', mast_height_m: 2, utc: '2026-12-02T00:00:00Z' });
  expect(exampleSource(fallback)?.start_utc).toBe(fallback.utc);
  const html = renderToStaticMarkup(createElement(HudView, { now: fallback, events: null, selectedMs: Date.parse('2026-12-02T00:00:00Z') }));
  expect(html).toContain('Example data');
  expect(html).toContain('Mons Mouton');
  expect(html).toContain('does not match');
  const comm = await getCommWindow({ site_id: 'change-4', utc: '2026-12-02T00:00:00Z' });
  expect(exampleSource(comm)?.start_utc).toBe('2019-01-03T02:26:00Z');
  const link = await getEarthLink({ site_id: 'change-4', start_utc: '2020-01-01T00:00:00Z', end_utc: '2020-02-01T00:00:00Z' });
  expect(exampleSource(link)?.start_utc).toBe('2019-01-03T02:26:00Z');
  expect(exampleSource(link)?.end_utc).toBe('2019-02-02T02:26:00Z');
});
