import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { horizonExample, skySeriesExample } from '../../api/examples';
import type { SkySample, SkySeries } from '../../api/types';
import { diskState, horizonNote, nearestSample, niceTicks, partialText, pathRuns } from './geometry';
import { SkyStrip, skySourceDetails } from './SkyStrip';

const T0 = Date.parse('2026-12-05T00:00:00Z');
const HOUR = 3_600_000;

function sample(hours: number, sunAz: number, sunEl: number, sunVisible: number, earthEl: number): SkySample {
  return {
    utc: new Date(T0 + hours * HOUR).toISOString().replace('.000Z', 'Z'),
    sun: { azimuth_true_deg: sunAz, elevation_deg: sunEl, horizon_deg: 0, visible_fraction: sunVisible, range_au: null, radius_deg: null },
    earth: { azimuth_true_deg: 10, elevation_deg: earthEl, horizon_deg: 0, visible_fraction: earthEl > 0 ? 1 : 0, range_km: null, radius_deg: null },
  };
}

/** Constructed three-sample series for the scrub test; not product numbers. */
const series: SkySeries = {
  ...skySeriesExample,
  start_utc: '2026-12-05T00:00:00Z',
  step_minutes: 60,
  samples: [sample(0, 100, 1, 1, 3), sample(1, 120, 0, 0.4, 2), sample(2, 350, -1, 0, -1)],
};

describe('sky geometry', () => {
  it('snaps to the nearest sample and flags moments outside the series', () => {
    expect(nearestSample(series, T0 + 0.4 * HOUR)?.index).toBe(0);
    expect(nearestSample(series, T0 + 0.6 * HOUR)?.index).toBe(1);
    expect(nearestSample(series, T0 + 2 * HOUR)?.outside).toBe(false);
    expect(nearestSample(series, T0 + 5 * HOUR)?.outside).toBe(true);
    expect(nearestSample({ ...series, samples: [] }, T0)).toBeNull();
  });

  it('tells visible, partial and hidden disks apart', () => {
    expect(diskState(1)).toBe('visible');
    expect(diskState(0.4)).toBe('partial');
    expect(diskState(0)).toBe('hidden');
    expect(partialText(0.4)).toBe('40 % visible');
    expect(partialText(1)).toBeNull();
  });

  it('breaks a path where the azimuth wraps through north', () => {
    expect(pathRuns(series.samples, 'sun').map((r) => r.length)).toEqual([2, 1]);
  });

  it('notes a flat horizon as terrain not included', () => {
    expect(horizonNote('SYNTHETIC', 'sphere')).toBe('terrain not included');
    expect(horizonNote('DERIVED', 'terrain')).toBeUndefined();
  });

  it('makes round axis ticks', () => {
    expect(niceTicks(-1.2, 3.4, 4)).toEqual([0, 2]);
    expect(niceTicks(-0.3, 0.9, 4)).toEqual([0, 0.5]);
  });
});

describe('SkyStrip with the example payloads', () => {
  const html = renderToStaticMarkup(
    <SkyStrip horizon={horizonExample} series={skySeriesExample} selectedMs={Date.parse(skySeriesExample.start_utc)} />,
  );

  it('shows the Assumed label and the terrain note for a SYNTHETIC answer', () => {
    expect(skySeriesExample.validity).toBe('SYNTHETIC');
    expect(html).toContain('Assumed');
    expect(html).toContain('terrain not included');
  });

  it('shows the example angles as the server sent them, with the UTC date', () => {
    expect(html).toContain('azimuth 65.67°');
    expect(html).toContain('elevation 2.47°');
    expect(html).toContain('azimuth 335.85°');
    expect(html).toContain('2025-03-06 17:30 UTC');
    expect(html).toContain('sky-ground');
  });

  it('says the apparent size is unavailable when the server sends none', () => {
    expect(html).toContain('Apparent disk size not available');
  });

  it('fills the source window from the response fields', () => {
    const details = skySourceDetails(horizonExample, skySeriesExample);
    expect(details).toContainEqual({ label: 'Horizon method', value: 'Flat horizon (sphere)' });
    expect(details.find((d) => d.label === 'Positions')?.value).toBe('SPICE DE440, MOON_ME, LT+S');
    expect(html).toContain('Flat horizon (sphere)');
  });
});

describe('SkyStrip follows the selected moment', () => {
  const at = (ms: number) => renderToStaticMarkup(<SkyStrip horizon={horizonExample} series={series} selectedMs={ms} />);

  it('moves the disks when the time changes', () => {
    const first = at(T0);
    const later = at(T0 + 2 * HOUR);
    expect(first).toContain('azimuth 100.00°');
    expect(later).toContain('azimuth 350.00°');
    expect(first).not.toEqual(later);
  });

  it('draws a hidden disk as an outline and a partial one with its share', () => {
    expect(at(T0 + 2 * HOUR)).toContain('sky-disk-sun sky-disk-hidden');
    const partial = at(T0 + HOUR);
    expect(partial).toContain('sky-disk-partial');
    expect(partial).toContain('40 % visible');
  });
});
