import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getEvents, getNow } from '../../api/client';
import { HudView, fallbackAnswer } from './HudView';

const SITE = { site_id: 'change-4', mast_height_m: 2 };
const RECORDED = { start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z' };
const AT = '2026-12-01T00:00:00Z';
const NOTE = 'This example does not match the selected site, period or settings';

describe('countdown example note (PR #135 review, item 2)', () => {
  it('shows no warning when both answers are recordings of this site and period', async () => {
    const now = await getNow({ ...SITE, utc: AT });
    const events = await getEvents({ ...SITE, ...RECORDED });
    expect(fallbackAnswer(now, events)).toBeNull();
    expect(renderToStaticMarkup(<HudView now={now} events={events} selectedMs={Date.parse(AT)} />)).not.toContain(NOTE);
  });

  it('warns when only the events answer is a general example, though the moment is recorded', async () => {
    const now = await getNow({ ...SITE, utc: AT });
    // Same start moment, but the period ends after the recording: events falls back.
    const events = await getEvents({ ...SITE, start_utc: RECORDED.start_utc, end_utc: '2027-01-15T00:00:00Z' });
    expect(fallbackAnswer(now, events)).toBe(events);
    expect(renderToStaticMarkup(<HudView now={now} events={events} selectedMs={Date.parse(AT)} />)).toContain(NOTE);
  });

  it('still warns when the now answer is the general example', async () => {
    const now = await getNow({ ...SITE, utc: '2026-12-10T00:00:00Z' });
    const events = await getEvents({ ...SITE, ...RECORDED });
    expect(fallbackAnswer(now, events)).toBe(now);
    expect(renderToStaticMarkup(<HudView now={now} events={events} selectedMs={Date.parse('2026-12-10T00:00:00Z')} />)).toContain(NOTE);
  });
});
