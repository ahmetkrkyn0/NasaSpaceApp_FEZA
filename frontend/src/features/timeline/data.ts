/**
 * Data containers shared by the sky view, timeline and countdown. Each hook turns the active
 * scenario into request parameters and calls the typed client (api/client.ts); the values are
 * shown as the server or the example files return them.
 */

import { useEffect, useState } from 'react';
import { getEvents, getHealth, getHorizon, getNow, getSkySeries } from '../../api/client';
import { getDataMode } from '../../api/config';
import type {
  EventList,
  Health,
  HorizonProfile,
  LocationParams,
  NowStatus,
  Scenario,
  SkySeries,
  UtcString,
} from '../../api/types';
import { useAsync, useStore, type AsyncState } from '../../lib/hooks';
import { scenarioStore, type ScenarioState } from '../../state/scenario-store';
import { MS_PER_HOUR, MS_PER_MINUTE, clamp, parseUtc, toUtc } from './time';

/**
 * `/api/sky-series`, `/api/events` and `/api/power` accept at most two months; the events range
 * must also be longer than zero (ADR-0004, "Sınırlar").
 */
export const MAX_RANGE_HOURS = 24 * 60;
export const MAX_SKY_SERIES_HOURS = MAX_RANGE_HOURS;

/** Upper bound on the number of sky samples one request asks for. */
const TARGET_SKY_SAMPLES = 600;

export interface ScenarioWindow {
  startMs: number;
  endMs: number;
}

/** Catalogue site or custom coordinates, as the scenario names them. */
export function locationOf(scenario: Scenario): LocationParams | null {
  if (scenario.site_id) return { site_id: scenario.site_id };
  if (scenario.lat_deg !== null && scenario.lon_deg !== null) {
    return { lat_deg: scenario.lat_deg, lon_deg: scenario.lon_deg };
  }
  return null;
}

/** `mast_height_m` is sent only when the scenario sets it; otherwise the server applies its rule. */
export function mastOf(scenario: Scenario): { mast_height_m?: number } {
  return scenario.mast_height_m === null ? {} : { mast_height_m: scenario.mast_height_m };
}

export function windowOf(scenario: Scenario | null): ScenarioWindow | null {
  if (!scenario) return null;
  const startMs = parseUtc(scenario.start_utc);
  const endMs = parseUtc(scenario.end_utc);
  if (startMs === null || endMs === null || endMs < startMs) return null;
  return { startMs, endMs };
}

/** The selected moment, kept inside the scenario window; the window start when none is set. */
export function selectedMsOf(state: ScenarioState): number | null {
  const window = windowOf(state.active);
  if (!window) return null;
  const selected = parseUtc(state.selected_utc);
  return selected === null ? window.startMs : clamp(selected, window.startMs, window.endMs);
}

/** Sky-series request for a window: whole hours, capped at the endpoint limit. */
export function skySeriesRequest(window: ScenarioWindow): { hours: number; step_minutes: number; capped: boolean } {
  const spanHours = Math.ceil((window.endMs - window.startMs) / MS_PER_HOUR);
  const hours = Math.min(spanHours, MAX_SKY_SERIES_HOURS);
  const step_minutes = Math.max(1, Math.ceil((hours * 60) / TARGET_SKY_SAMPLES));
  return { hours, step_minutes, capped: spanHours > MAX_SKY_SERIES_HOURS };
}

/**
 * Events request for a window: the window itself, or its first two months when longer.
 * `null` for an empty window, which the server refuses.
 */
export function eventsRequest(window: ScenarioWindow): { end_utc: UtcString; capped: boolean } | null {
  if (!(window.endMs > window.startMs)) return null;
  const limitMs = window.startMs + MAX_RANGE_HOURS * MS_PER_HOUR;
  const capped = window.endMs > limitMs;
  return { end_utc: toUtc(capped ? limitMs : window.endMs), capped };
}

export function useScenario(): { active: Scenario | null; window: ScenarioWindow | null; selectedMs: number | null } {
  const active = useStore(scenarioStore, (s) => s.active);
  const selectedMs = useStore(scenarioStore, selectedMsOf);
  return { active, window: windowOf(active), selectedMs };
}

function scenarioKey(scenario: Scenario | null): string {
  return scenario ? JSON.stringify(scenario) : '';
}

const idle = <T,>(): Promise<T | null> => Promise.resolve(null);

export function useEvents(scenario: Scenario | null): AsyncState<EventList | null> {
  return useAsync<EventList | null>(
    (signal) => {
      const location = scenario && locationOf(scenario);
      const window = windowOf(scenario);
      const request = window && eventsRequest(window);
      if (!scenario || !location || !request) return idle();
      return getEvents(
        {
          ...location,
          ...mastOf(scenario),
          start_utc: scenario.start_utc,
          end_utc: request.end_utc,
          earth_criterion: scenario.earth_criterion,
        },
        { signal },
      );
    },
    [scenarioKey(scenario), getDataMode()],
  ).state;
}

export interface SkyData {
  horizon: HorizonProfile;
  series: SkySeries;
  capped: boolean;
}

export function useSkyData(scenario: Scenario | null): AsyncState<SkyData | null> {
  return useAsync<SkyData | null>(
    async (signal) => {
      const location = scenario && locationOf(scenario);
      const window = windowOf(scenario);
      if (!scenario || !location || !window) return null;
      const request = skySeriesRequest(window);
      const [horizon, series] = await Promise.all([
        getHorizon({ ...location, ...mastOf(scenario) }, { signal }),
        getSkySeries(
          {
            ...location,
            ...mastOf(scenario),
            start_utc: scenario.start_utc,
            hours: request.hours,
            step_minutes: request.step_minutes,
          },
          { signal },
        ),
      ]);
      return { horizon, series, capped: request.capped };
    },
    [scenarioKey(scenario), getDataMode()],
  ).state;
}

/** Waits until a value has stopped changing for `delayMs`, so a drag does not flood the server. */
export function useSettled<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}

/** Delay before the countdown asks `/api/now` for a new moment. */
export const NOW_QUERY_DELAY_MS = 250;

export function useNow(scenario: Scenario | null, utc: UtcString | null): AsyncState<NowStatus | null> {
  const settledUtc = useSettled(utc, NOW_QUERY_DELAY_MS);
  return useAsync<NowStatus | null>(
    (signal) => {
      const location = scenario && locationOf(scenario);
      if (!scenario || !location || !settledUtc) return idle();
      return getNow(
        { ...location, ...mastOf(scenario), utc: settledUtc, earth_criterion: scenario.earth_criterion },
        { signal },
      );
    },
    [scenarioKey(scenario), settledUtc, getDataMode()],
  ).state;
}

export function useHealth(): AsyncState<Health> {
  return useAsync<Health>((signal) => getHealth({ signal }), [getDataMode()]).state;
}

/** Whole minutes; the timeline never selects a fraction of a minute. */
export function roundToMinute(ms: number): number {
  return Math.round(ms / MS_PER_MINUTE) * MS_PER_MINUTE;
}
