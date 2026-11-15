/**
 * Earth link view (issue #110; #97, section 4.2). Three states, from the server's windows only:
 * `direct` (Earth in view from the site and a station sees the Moon), `no_station` (Earth in view,
 * no station sees the Moon) and `relay_needed` (Earth not in view from the site). The state at a
 * moment is looked up in the windows; nothing about visibility is computed here.
 */

import type { EarthLinkParams } from '../../api/client';
import { DEFAULT_EARTH_CRITERION, type EarthLink, type LinkMode, type LinkWindow, type Scenario, type StationLink, type UtcString } from '../../api/types';
import { locationWithMast } from '../../state/scenario-tools';

export const MODE_LABEL: Record<LinkMode, string> = {
  direct: 'Direct to Earth',
  no_station: 'No station sees the Moon',
  relay_needed: 'Relay needed',
};

/** Shown after the "Illustration" label on the relay path: no relay satellite is computed. */
export const RELAY_ILLUSTRATION = 'a relay satellite is not modelled';

export const DIAGRAM_NOTE = 'Diagram, not to scale.';

function within(w: { start_utc: UtcString; end_utc: UtcString }, t: number, last: boolean): boolean {
  const start = Date.parse(w.start_utc);
  const end = Date.parse(w.end_utc);
  return t >= start && (t < end || (last && t === end));
}

/** The link window holding the moment, or `null` when the moment is outside every window. */
export function windowAt(link: Pick<EarthLink, 'link_windows'>, utc: UtcString): LinkWindow | null {
  const t = Date.parse(utc);
  const windows = link.link_windows;
  return windows.find((w, i) => within(w, t, i === windows.length - 1)) ?? null;
}

/** Stations whose own windows hold the moment. */
export function stationsAt(link: Pick<EarthLink, 'stations'>, utc: UtcString): StationLink[] {
  const t = Date.parse(utc);
  return link.stations.filter((s) => s.windows.some((w, i) => within(w, t, i === s.windows.length - 1)));
}

function names(link: Pick<EarthLink, 'stations'>, ids: readonly string[]): string {
  const list = ids.map((id) => link.stations.find((s) => s.id === id)?.name ?? id);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** One sentence for the selected moment (Explore), built only from the server's windows. */
export function linkSentence(link: EarthLink, utc: UtcString): string {
  const w = windowAt(link, utc);
  if (!w) return "The selected moment is outside this answer's period, so no link state is shown for it.";
  if (w.mode === 'direct') {
    // The stations that see the Moon at this moment; the window's list covers its whole span.
    const now = stationsAt(link, utc).map((s) => s.id);
    const who = names(link, now.length > 0 ? now : w.station_ids);
    return who
      ? `At the selected moment the lander can talk to Earth directly: Earth is above its horizon and ${who} can see the Moon.`
      : 'At the selected moment the lander can talk to Earth directly: Earth is above its horizon and a station can see the Moon.';
  }
  if (w.mode === 'no_station') {
    return 'At the selected moment Earth is above the horizon, but none of the stations can see the Moon, so there is no direct link.';
  }
  return 'At the selected moment Earth is below the horizon here, so the lander cannot talk to Earth directly; it would need a relay satellite.';
}

export interface BandSegment {
  window: LinkWindow;
  /** Left edge and width in percent of the answer's period. */
  left: number;
  width: number;
}

/** Period covered by the windows: first start to last end. */
export function period(link: Pick<EarthLink, 'link_windows'>): { start: number; end: number } | null {
  if (link.link_windows.length === 0) return null;
  const starts = link.link_windows.map((w) => Date.parse(w.start_utc));
  const ends = link.link_windows.map((w) => Date.parse(w.end_utc));
  return { start: Math.min(...starts), end: Math.max(...ends) };
}

/** Band segments, one per window, as shares of the period (a drawing position, not a computation). */
export function bandSegments(link: Pick<EarthLink, 'link_windows'>): BandSegment[] {
  const p = period(link);
  if (!p || p.end <= p.start) return [];
  const span = p.end - p.start;
  return link.link_windows.map((w) => ({
    window: w,
    left: ((Date.parse(w.start_utc) - p.start) / span) * 100,
    width: ((Date.parse(w.end_utc) - Date.parse(w.start_utc)) / span) * 100,
  }));
}

/** Position of a moment on the band in percent, or `null` outside the period. */
export function markerAt(link: Pick<EarthLink, 'link_windows'>, utc: UtcString): number | null {
  const p = period(link);
  const t = Date.parse(utc);
  if (!p || t < p.start || t > p.end || p.end <= p.start) return null;
  return ((t - p.start) / (p.end - p.start)) * 100;
}

/**
 * `/api/earth-link` for the scenario period, with its Earth criterion. The station elevation
 * limit is left to the server's default, which the answer reports as an assumption.
 */
export function earthLinkRequest(scenario: Scenario): EarthLinkParams {
  return {
    ...locationWithMast(scenario),
    start_utc: scenario.start_utc,
    end_utc: scenario.end_utc,
    earth_criterion: scenario.earth_criterion ?? DEFAULT_EARTH_CRITERION,
  };
}
