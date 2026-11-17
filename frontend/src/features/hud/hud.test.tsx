import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { eventsExample, nowExample } from '../../api/examples';
import type { EventList, NowStatus } from '../../api/types';
import { HIGH_UNCERTAINTY_RANGE_MINUTES, RANGE_MEANING, eventTimeText, nextEvent } from '../timeline/event-range';
import { NOT_AVAILABLE, buildCountdown } from './countdown';
import { HudView } from './HudView';
import HudPanel from '.';

const NOW_MS = Date.parse(nowExample.utc);

describe('countdown rows from the example', () => {
  const rows = buildCountdown(nowExample, eventsExample);

  it('counts down to Earthrise with the server hours, converted to days and hours', () => {
    const earth = rows.find((r) => r.key === 'earth')!;
    expect(earth.label).toBe('Time to Earthrise');
    expect(earth.value).toBe('6 d 4.7 h');
    expect(earth.event?.event.utc).toBe('2026-12-11T04:41:00Z');
    expect(earth.event?.time.text).toBe('2026-12-11 04:41 UTC');
  });

  it('says not available for a Sun state the server did not compute', () => {
    const sun = rows.find((r) => r.key === 'sun')!;
    expect(nowExample.sun_up).toBeNull();
    expect(sun.value).toBe(NOT_AVAILABLE);
    expect(sun.status).toBe(true);
    expect(rows.find((r) => r.key === 'night')!.value).toBe(NOT_AVAILABLE);
  });
});

describe('countdown status sentences', () => {
  const limited: NowStatus = {
    ...nowExample,
    sun_up: true,
    hours_to_sunset: null,
    earth_up: false,
    hours_to_earthrise: null,
    night_hours: null,
    search_limited: true,
  };

  it('writes a status instead of a countdown when no event was found in the searched time', () => {
    const rows = buildCountdown(limited, null);
    expect(rows[0]).toMatchObject({ label: 'Time to sunset', value: 'Sun does not set in this period', status: true });
    expect(rows[1]).toMatchObject({ label: 'Time to Earthrise', value: 'Earth does not rise in this period' });
    expect(rows[2]?.value).toBe('No night in this period');
  });

  it('labels the night length as the current night when the Sun is down', () => {
    const rows = buildCountdown({ ...nowExample, sun_up: false, hours_to_sunrise: 2.5, night_hours: 280 }, null);
    expect(rows[0]).toMatchObject({ label: 'Time to sunrise', value: '2.5 h' });
    expect(rows[2]).toMatchObject({ label: 'Night length (current)', value: '11 d 16.0 h' });
  });
});

/** Constructed range for the display test; not product numbers. */
const ranged: EventList = {
  ...eventsExample,
  events: [
    { type: 'sunrise', utc: '2026-12-06T10:00:00Z', utc_earliest: '2026-12-06T09:40:00Z', utc_latest: '2026-12-06T10:22:00Z', criterion: 'first_limb' },
    { type: 'sunrise', utc: '2026-12-07T10:00:00Z', utc_earliest: '2026-12-07T09:59:00Z', utc_latest: '2026-12-07T10:01:00Z', criterion: 'first_limb' },
  ],
};

describe('event ranges', () => {
  it('writes two times and what the range means', () => {
    const text = eventTimeText(ranged.events[0]!);
    expect(text.text).toBe('2026-12-06 09:40 – 10:22 UTC');
    expect(text.meaning).toBe(RANGE_MEANING);
    expect(RANGE_MEANING).toBe('range for a one arcminute horizon error');
  });

  it('flags only wide ranges as high uncertainty', () => {
    expect(eventTimeText(ranged.events[0]!).widthMinutes).toBeGreaterThanOrEqual(HIGH_UNCERTAINTY_RANGE_MINUTES);
    expect(eventTimeText(ranged.events[0]!).high).toBe(true);
    expect(eventTimeText(ranged.events[1]!).high).toBe(false);
  });

  it('finds the next event of a type at or after a moment', () => {
    expect(nextEvent(ranged.events, 'sunrise', Date.parse('2026-12-06T12:00:00Z'))?.utc).toBe('2026-12-07T10:00:00Z');
    expect(nextEvent(ranged.events, 'sunset', 0)).toBeNull();
  });
});

describe('HudView', () => {
  it('shows the countdown with its validity and the moment it is for', () => {
    const html = renderToStaticMarkup(<HudView now={nowExample} events={eventsExample} selectedMs={NOW_MS} />);
    expect(html).toContain('Time to Earthrise');
    expect(html).toContain('6 d 4.7 h');
    expect(html).toContain('Assumed');
    expect(html).toContain('At <span class="hud-data">2026-12-05 00:00 UTC</span>');
  });

  it('marks an answer that belongs to another moment', () => {
    const html = renderToStaticMarkup(<HudView now={nowExample} events={eventsExample} selectedMs={NOW_MS + 3_600_000} />);
    expect(html).toContain('Values for');
  });

  it('shows a range with its meaning and the high uncertainty warning', () => {
    const now: NowStatus = { ...nowExample, sun_up: false, hours_to_sunrise: 34 };
    const html = renderToStaticMarkup(<HudView now={now} events={ranged} selectedMs={NOW_MS} />);
    expect(html).toContain('2026-12-06 09:40 – 10:22 UTC');
    expect(html).toContain('range for a one arcminute horizon error');
    expect(html).toContain('high uncertainty');
  });
});

describe('HudPanel', () => {
  it('is not a live region, so playback does not read every new value aloud', () => {
    const html = renderToStaticMarkup(<HudPanel />);
    expect(html).toContain('aria-label="Countdown"');
    expect(html).not.toContain('aria-live');
  });
});
