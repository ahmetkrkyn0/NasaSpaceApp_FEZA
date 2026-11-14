import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { eventsEclipseExample, eventsExample, skySeriesExample, horizonExample } from '../../api/examples';
import type { SkyEvent } from '../../api/types';
import { SkyStrip, eclipseDrawing, eclipseNote } from '../sky/SkyStrip';
import { MAX_RANGE_HOURS, eventsWindow, windowOf } from './data';
import { ECLIPSE_EXPLANATION, activeEclipse, eclipseSpans, obscuredText } from './eclipse';
import { TimelineView, eclipseLabel, type TimelineViewProps } from './TimelineView';

/** Apollo 11 window around the T5 eclipse of events-eclipse.json. */
const window = windowOf({
  scenario_id: 'e',
  label: 'Apollo 11',
  site_id: 'apollo-11',
  lat_deg: null,
  lon_deg: null,
  start_utc: '2027-02-15T00:00:00Z',
  end_utc: '2027-02-28T00:00:00Z',
  mast_height_m: null,
  panel_profile_id: 'vertical_tracking',
})!;

const START = Date.parse('2027-02-20T22:09:00Z');
const END = Date.parse('2027-02-21T00:36:00Z');

describe('eclipse spans', () => {
  it('pairs the start and end events of the example and keeps the server maximum', () => {
    const spans = eclipseSpans(eventsEclipseExample.events, window);
    expect(spans).toEqual([{ startMs: START, endMs: END, openStart: false, openEnd: false, maxObscured: 0.343 }]);
    expect(activeEclipse(spans, START + 60_000)).toBe(spans[0]);
    expect(activeEclipse(spans, END + 60_000)).toBeNull();
  });

  it('has no eclipse when the answer carries no eclipse events', () => {
    expect(eclipseSpans(eventsExample.events, window)).toEqual([]);
  });

  it('runs a span to the window edge when one of its events lies outside the answer', () => {
    const [start, end] = eventsEclipseExample.events as [SkyEvent, SkyEvent];
    const late = windowOf({ ...scenarioAt('2027-02-21T00:00:00Z', '2027-02-25T00:00:00Z') })!;
    expect(eclipseSpans([end], late)).toEqual([
      { startMs: late.startMs, endMs: END, openStart: true, openEnd: false, maxObscured: 0.343 },
    ]);
    const early = windowOf({ ...scenarioAt('2027-02-18T00:00:00Z', '2027-02-21T00:00:00Z') })!;
    expect(eclipseSpans([start, end], early)).toEqual([
      { startMs: START, endMs: early.endMs, openStart: false, openEnd: true, maxObscured: 0.343 },
    ]);
  });

  it('ends an unfinished eclipse where the events answer ends, not at the scenario end', () => {
    const [start] = eventsEclipseExample.events as [SkyEvent, SkyEvent];
    // Scenario longer than the events cap; the eclipse start falls inside the cap.
    const long = windowOf(scenarioAt('2026-12-25T00:00:00Z', '2027-04-30T00:00:00Z'))!;
    const covered = eventsWindow(long);
    expect(covered.endMs).toBe(long.startMs + MAX_RANGE_HOURS * 3_600_000);
    const [only] = eclipseSpans([start], covered);
    expect(only).toMatchObject({ startMs: START, endMs: covered.endMs, openEnd: true });
    expect(eclipseLabel(only!)).toContain('2027-02-20 22:09 UTC to after the range');
  });

  it('writes the covered share as a unit conversion of the server value', () => {
    expect(obscuredText(0.343)).toBe("up to 34.3 % of the Sun's disk covered");
    expect(obscuredText(null)).toBe('covered share not available');
  });
});

function scenarioAt(start_utc: string, end_utc: string) {
  return {
    scenario_id: 'e',
    label: 'Apollo 11',
    site_id: 'apollo-11',
    lat_deg: null,
    lon_deg: null,
    start_utc,
    end_utc,
    mast_height_m: null,
    panel_profile_id: 'vertical_tracking',
  };
}

describe('eclipse on the timeline', () => {
  const props: TimelineViewProps = {
    window,
    selectedMs: START,
    events: eventsEclipseExample,
    playing: false,
    speed: 6,
    onTogglePlay: () => undefined,
    onSpeed: () => undefined,
    onScrub: () => undefined,
    onJump: () => undefined,
  };

  it('marks the example eclipse on the Sun band with times, share and explanation', () => {
    const html = renderToStaticMarkup(<TimelineView {...props} />);
    expect(html).toContain('tl-eclipse');
    expect(html).toContain('Eclipse (cross-hatched, on the Sun band)');
    const label = eclipseLabel(eclipseSpans(eventsEclipseExample.events, window)[0]!);
    expect(label).toBe(
      `Eclipse, 2027-02-20 22:09 – 2027-02-21 00:36 UTC, up to 34.3 % of the Sun's disk covered. ${ECLIPSE_EXPLANATION}`,
    );
    // The example has no sunlit or dark windows; the eclipse mark still shows.
    expect(html).toContain('No sunlit or dark windows in the response');
  });

  it('shows no eclipse mark when the answer has no eclipse events', () => {
    const html = renderToStaticMarkup(<TimelineView {...props} events={eventsExample} />);
    expect(html).not.toContain('tl-eclipse');
    expect(html).not.toContain('Eclipse (cross-hatched');
  });
});

describe('eclipse on the horizon strip', () => {
  const span = eclipseSpans(eventsEclipseExample.events, window)[0]!;

  it('notes the eclipse with the server maximum and draws the Earth disk after the Sun', () => {
    const html = renderToStaticMarkup(
      <SkyStrip horizon={horizonExample} series={skySeriesExample} selectedMs={START} eclipse={span} />,
    );
    expect(html).toContain('sky-disk-eclipsed');
    expect(html).toContain('Largest share for this eclipse: up to 34.3 %');
    // Without disk sizes the covered part is not drawn, and the strip says so.
    expect(html).toContain('the covered part is not drawn');
    expect(html.indexOf('sky-disk-earth')).toBeGreaterThan(html.indexOf('sky-disk-sun'));
  });

  it('claims a drawn overlap only for a sized sample inside the eclipse', () => {
    const base = skySeriesExample.samples[0]!;
    const sized = (utc: string) => ({
      ...base,
      utc,
      sun: { ...base.sun, radius_deg: 0.27 },
      earth: { ...base.earth, radius_deg: 0.95 },
    });
    expect(eclipseDrawing(span, sized('2027-02-20T23:00:00Z'))).toBe('overlap');
    expect(eclipseDrawing(span, sized('2027-02-21T02:00:00Z'))).toBe('sample-outside');
    expect(eclipseDrawing(span, { ...base, utc: '2027-02-20T23:00:00Z' })).toBe('no-size');
    expect(eclipseNote(span, 'overlap')).toContain('the overlap shows the covered part');
    expect(eclipseNote(span, 'sample-outside')).toContain('The nearest sample lies outside the eclipse');
  });

  it('adds nothing outside an eclipse', () => {
    const html = renderToStaticMarkup(<SkyStrip horizon={horizonExample} series={skySeriesExample} selectedMs={START} />);
    expect(html).not.toContain('sky-disk-eclipsed');
    expect(html).not.toContain('Eclipse in progress');
  });
});
