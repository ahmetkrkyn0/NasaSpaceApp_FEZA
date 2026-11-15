/**
 * Light for the globe from `/api/body-series` (issue #105). The series is asked for once per
 * scenario; the timeline then only picks the sample nearest the selected moment, so playback
 * never sends a request per frame. Samples are not interpolated: the server's points are shown
 * as they are.
 */

import type { BodySample, BodySeries, UtcString } from '../../api/types';
import { eventsWindow, type ScenarioWindow } from '../timeline/data';
import { parseUtc, toUtc } from '../timeline/time';
import type { LatLon } from './coords';

/** One sample per hour: the server default and well inside its 10 000 sample limit (ADR-0004). */
export const BODY_SERIES_STEP_S = 3600;

/** Request for a scenario window, capped at the two-month limit like the events request. */
export function bodySeriesRequest(window: ScenarioWindow): { start_utc: UtcString; end_utc: UtcString; step_s: number } | null {
  if (!(window.endMs >= window.startMs)) return null;
  const covered = eventsWindow(window);
  return { start_utc: toUtc(covered.startMs), end_utc: toUtc(covered.endMs), step_s: BODY_SERIES_STEP_S };
}

export interface LightSample {
  subSolar: LatLon;
  subEarth: LatLon;
  utc: UtcString;
  /** The selected moment is before the first or after the last sample. */
  outside: boolean;
}

/** The server sample nearest a moment, with whether the moment lies outside the series. */
export function nearestSample(series: BodySeries | null, ms: number): { sample: BodySample; outside: boolean } | null {
  if (!series || series.samples.length === 0) return null;
  let best: BodySample | null = null;
  let bestGap = Infinity;
  let first = Infinity;
  let last = -Infinity;
  for (const s of series.samples) {
    const t = parseUtc(s.utc);
    if (t === null) continue;
    first = Math.min(first, t);
    last = Math.max(last, t);
    const gap = Math.abs(t - ms);
    if (gap < bestGap) {
      bestGap = gap;
      best = s;
    }
  }
  return best ? { sample: best, outside: ms < first || ms > last } : null;
}

/** The sample nearest the selected moment, or `null` for an empty series. */
export function lightAt(series: BodySeries | null, ms: number): LightSample | null {
  const found = nearestSample(series, ms);
  if (!found) return null;
  const best = found.sample;
  return {
    subSolar: { lat_deg: best.sub_solar_lat_deg, lon_deg: best.sub_solar_lon_deg },
    subEarth: { lat_deg: best.sub_earth_lat_deg, lon_deg: best.sub_earth_lon_deg },
    utc: best.utc,
    outside: found.outside,
  };
}
