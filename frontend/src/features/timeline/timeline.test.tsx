import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { eventsExample, healthExample } from '../../api/examples';
import type { Health, Scenario } from '../../api/types';
import { createScenarioStore } from '../../state/scenario-store';
import { bandSegments, dayTicks, eventMarks, fractionOf } from './bands';
import { MAX_SKY_SERIES_HOURS, locationOf, mastOf, selectedMsOf, skySeriesRequest, windowOf } from './data';
import { jumpAllowed, planJump } from './jumps';
import { PLAYBACK_TICK_MS, playbackStep } from './playback';
import { LUNAR_DAY_MS, addCalendarMonths, formatHours, formatUtc, formatUtcRange, toUtc } from './time';
import { TimelineView, type TimelineViewProps } from './TimelineView';

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

describe('time formatting', () => {
  it('writes every time in UTC with its date', () => {
    expect(formatUtc('2026-12-03T10:03:00Z')).toBe('2026-12-03 10:03 UTC');
    expect(formatUtc(null)).toBe('not available');
    expect(formatUtcRange(Date.parse('2026-12-03T23:50:00Z'), Date.parse('2026-12-04T00:20:00Z'))).toBe(
      '2026-12-03 23:50 – 2026-12-04 00:20 UTC',
    );
    expect(toUtc(Date.parse('2026-12-03T10:03:00.400Z'))).toBe('2026-12-03T10:03:00Z');
  });

  it('converts hours to days, hours and minutes', () => {
    expect(formatHours(148.68)).toBe('6 d 4.7 h');
    expect(formatHours(5.5)).toBe('5.5 h');
    expect(formatHours(0.25)).toBe('15 min');
  });

  it('steps calendar months and keeps the day where it can', () => {
    expect(toUtc(addCalendarMonths(Date.parse('2026-12-05T06:00:00Z'), 1))).toBe('2027-01-05T06:00:00Z');
    expect(toUtc(addCalendarMonths(Date.parse('2027-01-31T00:00:00Z'), 1))).toBe('2027-02-28T00:00:00Z');
  });
});

describe('scenario to request', () => {
  it('names the site, or the coordinates, and the mast only when set', () => {
    expect(locationOf(scenario)).toEqual({ site_id: 'mons-mouton-im2-target' });
    expect(locationOf({ ...scenario, site_id: null, lat_deg: -85, lon_deg: 30 })).toEqual({ lat_deg: -85, lon_deg: 30 });
    expect(mastOf(scenario)).toEqual({});
    expect(mastOf({ ...scenario, mast_height_m: 10 })).toEqual({ mast_height_m: 10 });
  });

  it('asks the sky series for the window, capped at two months', () => {
    expect(skySeriesRequest(window)).toEqual({ hours: 720, step_minutes: 72, capped: false });
    const long = skySeriesRequest({ startMs: window.startMs, endMs: window.startMs + 100 * 86_400_000 });
    expect(long.hours).toBe(MAX_SKY_SERIES_HOURS);
    expect(long.capped).toBe(true);
  });

  it('keeps the selected moment inside the window and starts at the window start', () => {
    const store = createScenarioStore();
    store.setScenario(scenario);
    expect(selectedMsOf(store.getState())).toBe(window.startMs);
    store.setSelectedUtc('2027-03-01T00:00:00Z');
    expect(selectedMsOf(store.getState())).toBe(window.endMs);
  });
});

describe('bands and marks from the example events', () => {
  it('places the Earth windows across the window in order', () => {
    const segments = bandSegments(eventsExample.windows, ['earth_visible', 'earth_hidden'], window);
    expect(segments.map((s) => s.kind)).toEqual(['earth_visible', 'earth_hidden', 'earth_visible', 'earth_hidden']);
    expect(segments[0]!.from).toBe(0);
    expect(segments[3]!.to).toBe(1);
    expect(bandSegments(eventsExample.windows, ['sunlit', 'dark'], window)).toEqual([]);
  });

  it('marks the three events', () => {
    const marks = eventMarks(eventsExample.events, window);
    expect(marks.map((m) => m.event.type)).toEqual(['earthset', 'earthrise', 'earthset']);
    expect(marks[0]!.at).toBeCloseTo(fractionOf(Date.parse('2026-12-03T10:03:00Z'), window), 12);
  });

  it('labels whole UTC days on the scale', () => {
    const ticks = dayTicks(window);
    expect(ticks[0]).toBe(window.startMs);
    expect(ticks.length).toBeGreaterThan(2);
  });
});

describe('jumps', () => {
  it('moves the cursor inside the window', () => {
    const result = planJump(scenario, window, window.startMs, 'lunar_day', 1);
    expect(result.scenario).toBeNull();
    expect(result.selectedMs).toBe(window.startMs + LUNAR_DAY_MS);
  });

  it('shifts the window with the cursor past its edge, keeping its length', () => {
    const result = planJump(scenario, window, window.startMs + 86_400_000, 'month', 1);
    // 2 December plus one calendar month is 2 January: the window moves by 31 days.
    expect(result.scenario?.start_utc).toBe('2027-01-01T00:00:00Z');
    expect(result.scenario?.end_utc).toBe('2027-01-31T00:00:00Z');
    expect(result.selectedMs).toBe(Date.parse('2027-01-02T00:00:00Z'));
  });

  it('refuses a jump outside the ephemeris range', () => {
    const health: Health = { ...healthExample, ephemeris_range: { start_utc: '2026-11-01T00:00:00Z', end_utc: '2027-01-15T00:00:00Z' } };
    expect(jumpAllowed(planJump(scenario, window, window.startMs, 'lunar_day', 1), window, health)).toBe(true);
    expect(jumpAllowed(planJump(scenario, window, window.startMs + 86_400_000, 'month', 1), window, health)).toBe(false);
    expect(jumpAllowed(planJump(scenario, window, window.startMs, 'month', -1), window, null)).toBe(true);
  });
});

describe('playback', () => {
  it('advances by the speed and stops at the window end', () => {
    const step = playbackStep(window.startMs, window.endMs, 6);
    expect(step.ms - window.startMs).toBe(6 * 3_600_000 * (PLAYBACK_TICK_MS / 1000));
    expect(playbackStep(window.endMs - 1000, window.endMs, 24)).toEqual({ ms: window.endMs, done: true });
  });
});

describe('TimelineView', () => {
  const props: TimelineViewProps = {
    window,
    selectedMs: Date.parse('2026-12-05T00:00:00Z'),
    events: eventsExample,
    playing: false,
    speed: 6,
    onTogglePlay: () => undefined,
    onSpeed: () => undefined,
    onScrub: () => undefined,
    onJump: () => undefined,
  };

  it('draws the Earth bands, hatches hidden windows and lists the events with UTC dates', () => {
    const html = renderToStaticMarkup(<TimelineView {...props} />);
    expect(html).toContain('tl-seg-earth_visible');
    expect(html).toContain('tl-seg-earth_hidden');
    expect(html).toContain('Earth hidden (hatched)');
    expect(html).toContain('Earthset, 2026-12-03 10:03 UTC');
    expect(html).toContain('Selected <span class="tl-data">2026-12-05 00:00 UTC</span>');
    expect(html).toContain('No sunlit or dark windows in the response');
    expect(html).toContain('Assumed');
  });

  it('places the cursor at the selected moment', () => {
    const fraction = fractionOf(props.selectedMs, window);
    expect(renderToStaticMarkup(<TimelineView {...props} />)).toContain(`left:${fraction * 100}%`);
  });

  it('disables a jump that leaves the ephemeris range', () => {
    const html = renderToStaticMarkup(<TimelineView {...props} disabledJumps={new Set(['month:1'])} />);
    expect(html).toContain('disabled=""');
  });
});
