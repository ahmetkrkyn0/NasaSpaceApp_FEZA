import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { earthLinkExample, earthLinkRelayExample } from '../../api/examples';
import type { LinkMode, Scenario } from '../../api/types';
import { LinkBody, LinkDiagram } from './index';
import {
  RELAY_ILLUSTRATION,
  bandSegments,
  earthLinkRequest,
  linkSentence,
  markerAt,
  stationsAt,
  windowAt,
} from './link';

/** A moment inside each kind of window of earth-link.json. */
const MOMENT: Record<LinkMode, string> = {
  direct: '2026-12-01T12:00:00Z',
  no_station: '2026-12-02T01:00:00Z',
  relay_needed: '2026-12-05T00:00:00Z',
};

describe('state at the selected moment', () => {
  it('finds each of the three modes in the windows, with its sentence and highlight', () => {
    expect(windowAt(earthLinkExample, MOMENT.direct)?.mode).toBe('direct');
    expect(windowAt(earthLinkExample, MOMENT.no_station)?.mode).toBe('no_station');
    expect(windowAt(earthLinkExample, MOMENT.relay_needed)?.mode).toBe('relay_needed');

    // The sentence names the stations that see the Moon at that moment, as the station cards do.
    expect(linkSentence(earthLinkExample, MOMENT.direct)).toBe(
      'At the selected moment the lander can talk to Earth directly: Earth is above its horizon and Madrid can see the Moon.',
    );
    expect(linkSentence(earthLinkExample, MOMENT.no_station)).toContain('none of the stations can see the Moon');
    expect(linkSentence(earthLinkExample, MOMENT.relay_needed)).toContain('it would need a relay satellite');

    for (const mode of ['direct', 'no_station', 'relay_needed'] as const) {
      const html = renderToStaticMarkup(<LinkBody link={earthLinkExample} utc={MOMENT[mode]} full />);
      expect(html).toContain(`link-state-${mode}`);
    }
  });

  it('highlights the stations that see the Moon at the moment', () => {
    expect(stationsAt(earthLinkExample, '2026-12-01T04:00:00Z').map((s) => s.id)).toEqual(['dsn-goldstone']);
    const html = renderToStaticMarkup(<LinkBody link={earthLinkExample} utc="2026-12-01T04:00:00Z" full />);
    expect(html.match(/link-card-on/g)).toHaveLength(1);
    expect(html).toContain('sees the Moon now');
  });

  it('the far-side example is relay_needed for the whole period', () => {
    for (const t of ['2019-01-03T02:26:00Z', '2019-01-15T00:00:00Z', '2019-02-02T02:26:00Z']) {
      expect(windowAt(earthLinkRelayExample, t)?.mode).toBe('relay_needed');
    }
    const segments = bandSegments(earthLinkRelayExample);
    expect(segments).toHaveLength(1);
    expect(segments[0]!.width).toBeCloseTo(100);
  });

  it('says so when the moment falls outside every window, and guesses nothing', () => {
    const outside = '2027-03-01T00:00:00Z';
    expect(windowAt(earthLinkExample, outside)).toBeNull();
    expect(linkSentence(earthLinkExample, outside)).toBe("The selected moment is outside this answer's period, so no link state is shown for it.");
    expect(markerAt(earthLinkExample, outside)).toBeNull();
    const html = renderToStaticMarkup(<LinkBody link={earthLinkExample} utc={outside} full />);
    expect(html).not.toContain('link-state-');
    expect(html).toContain('Outside the period');
  });
});

describe('relay drawing', () => {
  it('appears only when a relay is needed, and always with the Illustration label', () => {
    for (const mode of ['direct', 'no_station', null] as const) {
      const html = renderToStaticMarkup(<LinkDiagram mode={mode} link={earthLinkExample} inView={[]} />);
      expect(html).not.toContain('link-relay');
      expect(html).not.toContain(RELAY_ILLUSTRATION);
    }
    const relay = renderToStaticMarkup(<LinkDiagram mode="relay_needed" link={earthLinkExample} inView={[]} />);
    expect(relay).toContain('link-relay');
    expect(relay).toContain('>Illustration</span>: a relay satellite is not modelled.');
    expect(relay).not.toContain('Illustration</span>: Illustration');
    expect(relay).toContain('Diagram, not to scale.');
    // No orbit, coverage or delay number is written for the relay.
    expect(relay).not.toMatch(/\d+\s?(km|ms|s)\b/);
  });

  it('shows the sourced Queqiao example in the relay state only', () => {
    expect(renderToStaticMarkup(<LinkBody link={earthLinkRelayExample} utc="2019-01-15T00:00:00Z" full={false} />)).toContain('Queqiao');
    expect(renderToStaticMarkup(<LinkBody link={earthLinkExample} utc={MOMENT.direct} full={false} />)).not.toContain('Queqiao');
  });
});

describe('period band and details', () => {
  it('covers the period with one segment per window and marks the moment', () => {
    const segments = bandSegments(earthLinkExample);
    expect(segments).toHaveLength(earthLinkExample.link_windows.length);
    expect(segments.reduce((sum, s) => sum + s.width, 0)).toBeCloseTo(100);
    expect(markerAt(earthLinkExample, '2026-12-01T00:00:00Z')).toBe(0);
    expect(markerAt(earthLinkExample, '2026-12-31T00:00:00Z')).toBe(100);
  });

  it('the full view shows station shares with their label, the assumed elevation limit and the assumptions', () => {
    const html = renderToStaticMarkup(<LinkBody link={earthLinkExample} utc={MOMENT.direct} full />);
    expect(html).toContain('41.0 %');
    expect(html).toContain('Station elevation limit');
    expect(html).toContain('Assumed');
    for (const a of earthLinkExample.assumptions) expect(html).toContain(a.replaceAll("'", '&#x27;'));
    const summary = renderToStaticMarkup(<LinkBody link={earthLinkExample} utc={MOMENT.direct} full={false} />);
    expect(summary).not.toContain('Station elevation limit');
  });

  it('asks the server for the scenario period and Earth criterion', () => {
    const scenario: Scenario = {
      scenario_id: 's',
      label: 'Mons Mouton',
      site_id: 'mons-mouton-im2-target',
      lat_deg: null,
      lon_deg: null,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      mast_height_m: 2,
      panel_profile_id: 'vertical_tracking',
      earth_criterion: 'full_disk',
    };
    expect(earthLinkRequest(scenario)).toEqual({
      site_id: 'mons-mouton-im2-target',
      mast_height_m: 2,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      earth_criterion: 'full_disk',
    });
  });
});
