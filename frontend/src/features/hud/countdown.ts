/**
 * Countdown rows built from `/api/now` (docs/design/gosterim-ve-arayuz.md, "Zorunlu
 * gösterimler" 3). Values are the server's hours, only converted to days and hours. A missing
 * value is told apart from a searched-and-not-found one: `search_limited` with `null` means the
 * event does not happen in the searched period; `null` alone means it was not computed.
 */

import type { EventList, EventType, NowStatus, SkyEvent } from '../../api/types';
import { eventTimeText, nextEvent, type EventTimeText } from '../timeline/event-range';
import { formatHours, parseUtc } from '../timeline/time';

export const NOT_AVAILABLE = 'not available';

export interface CountdownRow {
  key: 'sun' | 'earth' | 'night';
  label: string;
  /** Duration text, or a status sentence when there is no countdown. */
  value: string;
  /** `value` is a status sentence, not a duration. */
  status: boolean;
  /** Matching event of the events list, with its time or range. */
  event: { event: SkyEvent; time: EventTimeText } | null;
}

interface BodyText {
  upLabel: string;
  downLabel: string;
  upEvent: EventType;
  downEvent: EventType;
  noSet: string;
  noRise: string;
  unknownLabel: string;
}

const SUN: BodyText = {
  upLabel: 'Time to sunset',
  downLabel: 'Time to sunrise',
  upEvent: 'sunset',
  downEvent: 'sunrise',
  noSet: 'Sun does not set in this period',
  noRise: 'Sun does not rise in this period',
  unknownLabel: 'Sun',
};

const EARTH: BodyText = {
  upLabel: 'Time to Earthset',
  downLabel: 'Time to Earthrise',
  upEvent: 'earthset',
  downEvent: 'earthrise',
  noSet: 'Earth does not set in this period',
  noRise: 'Earth does not rise in this period',
  unknownLabel: 'Earth',
};

function matching(events: EventList | null, type: EventType, fromMs: number | null): CountdownRow['event'] {
  if (!events || fromMs === null) return null;
  const event = nextEvent(events.events, type, fromMs);
  return event ? { event, time: eventTimeText(event) } : null;
}

function bodyRow(
  key: 'sun' | 'earth',
  text: BodyText,
  up: boolean | null,
  hoursToSet: number | null,
  hoursToRise: number | null,
  now: NowStatus,
  events: EventList | null,
): CountdownRow {
  const fromMs = parseUtc(now.utc);
  if (up === null) {
    return { key, label: text.unknownLabel, value: NOT_AVAILABLE, status: true, event: null };
  }
  const label = up ? text.upLabel : text.downLabel;
  const hours = up ? hoursToSet : hoursToRise;
  const event = matching(events, up ? text.upEvent : text.downEvent, fromMs);
  if (hours !== null) return { key, label, value: formatHours(hours), status: false, event };
  const value = now.search_limited ? (up ? text.noSet : text.noRise) : NOT_AVAILABLE;
  return { key, label, value, status: true, event: null };
}

export function buildCountdown(now: NowStatus, events: EventList | null): CountdownRow[] {
  const sun = bodyRow('sun', SUN, now.sun_up, now.hours_to_sunset, now.hours_to_sunrise, now, events);
  const earth = bodyRow('earth', EARTH, now.earth_up, now.hours_to_earthset, now.hours_to_earthrise, now, events);
  const nightLabel = now.sun_up === false ? 'Night length (current)' : now.sun_up === true ? 'Night length (next)' : 'Night length';
  const night: CountdownRow =
    now.night_hours !== null
      ? { key: 'night', label: nightLabel, value: formatHours(now.night_hours), status: false, event: null }
      : {
          key: 'night',
          label: nightLabel,
          value: now.search_limited && now.sun_up === true ? 'No night in this period' : NOT_AVAILABLE,
          status: true,
          event: null,
        };
  return [sun, earth, night];
}
