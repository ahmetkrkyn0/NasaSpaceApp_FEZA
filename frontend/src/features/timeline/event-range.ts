/**
 * How an event time is written. When the server gives `utc_earliest` and `utc_latest`, the
 * time is a range: the event moved by a one arcminute horizon error down and up. It is a
 * sensitivity range, not a confidence interval, and is named so on screen (docs/PLAN.md,
 * section 12, decision 4; docs/design/olaylar-ve-sureler.md, "Hata payı").
 */

import type { EventType, SkyEvent } from '../../api/types';
import { MS_PER_MINUTE, formatUtc, formatUtcRange, parseUtc } from './time';

export const RANGE_MEANING = 'range for a one arcminute horizon error';
export const HIGH_UNCERTAINTY = 'high uncertainty';

/**
 * Range width from which an event is flagged "high uncertainty" (UC-10, S-04).
 *
 * Open decision, kept in this single constant until the team records it (issue #39). The value
 * separates the verified cases: a one arcminute horizon error moves an equatorial sunrise by
 * about 2 minutes (range about 4), but a Mons Mouton sunrise by at least about 22 minutes
 * (range about 43) and an Earth event at the Athena site by about 72 minutes
 * (docs/research/dogrulama/aciklanabilirlik.md, No 9 and 10).
 */
export const HIGH_UNCERTAINTY_RANGE_MINUTES = 30;

export const EVENT_LABEL: Record<EventType, string> = {
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  earthrise: 'Earthrise',
  earthset: 'Earthset',
  eclipse_start: 'Eclipse starts',
  eclipse_end: 'Eclipse ends',
};

export interface EventTimeText {
  /** One time, or two times when a range is known. */
  text: string;
  /** Present with a range: what the range means. */
  meaning: string | null;
  /** The range is at least `HIGH_UNCERTAINTY_RANGE_MINUTES` wide. */
  high: boolean;
  /** Range width in minutes, `null` without a range. */
  widthMinutes: number | null;
}

export function eventTimeText(event: SkyEvent): EventTimeText {
  const earliest = parseUtc(event.utc_earliest);
  const latest = parseUtc(event.utc_latest);
  if (earliest === null || latest === null) {
    return { text: formatUtc(event.utc), meaning: null, high: false, widthMinutes: null };
  }
  const low = Math.min(earliest, latest);
  const high = Math.max(earliest, latest);
  const widthMinutes = (high - low) / MS_PER_MINUTE;
  return {
    text: formatUtcRange(low, high),
    meaning: RANGE_MEANING,
    high: widthMinutes >= HIGH_UNCERTAINTY_RANGE_MINUTES,
    widthMinutes,
  };
}

/** First event of a type at or after a moment. */
export function nextEvent(events: readonly SkyEvent[], type: EventType, fromMs: number): SkyEvent | null {
  let best: SkyEvent | null = null;
  let bestMs = Number.POSITIVE_INFINITY;
  for (const event of events) {
    const t = parseUtc(event.utc);
    if (event.type !== type || t === null || t < fromMs) continue;
    if (t < bestMs) {
      best = event;
      bestMs = t;
    }
  }
  return best;
}
