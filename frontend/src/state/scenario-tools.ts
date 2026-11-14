/**
 * Building and changing scenarios for the setup and Compare panels: input checks, date
 * arithmetic on calendar days, the two comparison templates and the launch-slip scenario.
 * No sky computation (docs/PLAN.md, section 4.1, rule 2).
 */

import type { Criterion, LocationParams, Scenario, Site, UtcString } from '../api/types';

/**
 * Mast heights offered in the setup: 2, 5, 10 and 20 m (docs/design/guc-degerlendirmesi.md,
 * section 8), plus 0 m, the ground-level flat horizon the reference tests and S-01 use
 * (ADR-0003, "Direk yüksekliği kuralı").
 */
export const MAST_HEIGHTS = [0, 2, 5, 10, 20] as const;

/** Heights with precomputed terrain horizons; any other height uses the flat horizon (ADR-0003). */
export const TERRAIN_MAST_HEIGHTS: readonly number[] = [2, 10];

export const DEFAULT_DURATION_DAYS = 30;
/** `/api/sky-series` takes at most 24 x 60 hours (ADR-0004, "Sınırlar"). */
export const MAX_DURATION_DAYS = 60;
export const DEFAULT_PANEL_PROFILE_ID = 'vertical_tracking';
export const DEFAULT_MAST_HEIGHT_M = 2;
/** Fixed id of the launch-slip scenario, so moving the slider replaces it. */
export const SLIP_SCENARIO_ID = 'slip';

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

function parseNumber(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text.trim());
  return Number.isFinite(value) ? value : null;
}

export function checkLatitude(text: string): Checked<number> {
  const value = parseNumber(text);
  if (value === null) return { ok: false, error: 'Enter a latitude in degrees.' };
  if (value < -90 || value > 90) return { ok: false, error: 'Latitude must be between -90 and 90 degrees.' };
  return { ok: true, value };
}

/** Longitude between -180 and 360 is accepted; values above 180 are converted to east-positive -180..180. */
export function checkLongitude(text: string): Checked<{ value: number; converted: boolean }> {
  const value = parseNumber(text);
  if (value === null) return { ok: false, error: 'Enter a longitude in degrees.' };
  if (value < -180 || value > 360) return { ok: false, error: 'Longitude must be between -180 and 360 degrees.' };
  const normalized = normalizeLongitude(value);
  return { ok: true, value: { value: normalized, converted: normalized !== value } };
}

/** `359.9` -> `-0.1`; values in -180..180 stay as they are. */
export function normalizeLongitude(lon: number): number {
  if (lon <= 180) return lon;
  return Math.round((lon - 360) * 1e9) / 1e9;
}

// ---------------------------------------------------------------------------
// Dates (calendar days in UTC)
// ---------------------------------------------------------------------------

/** `2026-12-01` -> `2026-12-01T00:00:00Z`, or `null` for anything that is not a real date. */
export function dateToUtc(date: string): UtcString | null {
  const match = DATE_PATTERN.exec(date);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(y, m - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return `${date}T00:00:00Z`;
}

export function utcToDate(utc: UtcString): string {
  return utc.slice(0, 10);
}

function toIso(ms: number): UtcString {
  return new Date(ms).toISOString().replace('.000Z', 'Z');
}

export function addDaysUtc(utc: UtcString, days: number): UtcString {
  return toIso(Date.parse(utc) + days * DAY_MS);
}

export function scenarioDays(scenario: Scenario): number {
  return Math.round((Date.parse(scenario.end_utc) - Date.parse(scenario.start_utc)) / DAY_MS);
}

export function checkDuration(text: string): Checked<number> {
  const value = parseNumber(text);
  if (value === null || !Number.isInteger(value)) return { ok: false, error: 'Enter the length in whole days.' };
  if (value < 1 || value > MAX_DURATION_DAYS) {
    return { ok: false, error: `The length must be between 1 and ${MAX_DURATION_DAYS} days.` };
  }
  return { ok: true, value };
}

export interface DateRange {
  start_utc: UtcString | null;
  end_utc: UtcString | null;
}

/**
 * Checks that a scenario of `days` days starting on `date` fits the range the server can compute.
 * Outside it the error names the range and `suggestion` is the nearest start date that fits.
 */
export function checkStartDate(
  date: string,
  days: number,
  range: DateRange | null,
): { ok: true; value: UtcString } | { ok: false; error: string; suggestion: string | null } {
  const start = dateToUtc(date);
  if (!start) return { ok: false, error: 'Enter a start date as YYYY-MM-DD.', suggestion: null };
  if (!range || !range.start_utc || !range.end_utc) return { ok: true, value: start };
  const first = Date.parse(range.start_utc);
  const last = Date.parse(range.end_utc);
  const s = Date.parse(start);
  const e = s + days * DAY_MS;
  if (s >= first && e <= last) return { ok: true, value: start };
  const message = `The server can compute ${utcToDate(range.start_utc)} to ${utcToDate(range.end_utc)}.`;
  const earliest = Math.ceil(first / DAY_MS) * DAY_MS;
  const latest = Math.floor((last - days * DAY_MS) / DAY_MS) * DAY_MS;
  if (latest < earliest) return { ok: false, error: `${message} A ${days}-day scenario does not fit.`, suggestion: null };
  const nearest = s < earliest ? earliest : latest;
  return { ok: false, error: message, suggestion: utcToDate(toIso(nearest)) };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export type ScenarioPlace = { kind: 'site'; site: Pick<Site, 'id' | 'name'> } | { kind: 'custom'; lat_deg: number; lon_deg: number };

export interface ScenarioInput {
  place: ScenarioPlace;
  start_utc: UtcString;
  days: number;
  mast_height_m: number | null;
  panel_profile_id: string;
  fixed_azimuth_deg?: number | null;
  earth_criterion?: Criterion;
}

/** Short stable id from what the scenario asks, so the same scenario never appears twice. */
export function scenarioIdFor(s: Omit<Scenario, 'scenario_id' | 'label'>): string {
  const key = JSON.stringify([
    s.site_id,
    s.lat_deg,
    s.lon_deg,
    s.start_utc,
    s.end_utc,
    s.mast_height_m,
    s.panel_profile_id,
    s.fixed_azimuth_deg ?? null,
    s.earth_criterion ?? 'center',
  ]);
  let hash = 5381;
  for (let i = 0; i < key.length; i += 1) hash = ((hash * 33) ^ key.charCodeAt(i)) >>> 0;
  return `s${hash.toString(36)}`;
}

function placeName(place: ScenarioPlace): string {
  if (place.kind === 'site') return place.site.name;
  return `${place.lat_deg.toFixed(4)}, ${place.lon_deg.toFixed(4)}`;
}

export function buildScenario(input: ScenarioInput, label?: string): Scenario {
  const base: Omit<Scenario, 'scenario_id' | 'label'> = {
    site_id: input.place.kind === 'site' ? input.place.site.id : null,
    lat_deg: input.place.kind === 'custom' ? input.place.lat_deg : null,
    lon_deg: input.place.kind === 'custom' ? input.place.lon_deg : null,
    start_utc: input.start_utc,
    end_utc: addDaysUtc(input.start_utc, input.days),
    mast_height_m: input.mast_height_m,
    panel_profile_id: input.panel_profile_id,
  };
  if (input.fixed_azimuth_deg !== undefined && input.fixed_azimuth_deg !== null) base.fixed_azimuth_deg = input.fixed_azimuth_deg;
  if (input.earth_criterion !== undefined) base.earth_criterion = input.earth_criterion;
  return {
    scenario_id: scenarioIdFor(base),
    label: label ?? `${placeName(input.place)}, ${utcToDate(input.start_utc)}`,
    ...base,
  };
}

/** The place of a scenario, named from the site list when it is a catalogue site. */
export function placeOf(scenario: Scenario, sites: readonly Pick<Site, 'id' | 'name'>[]): ScenarioPlace {
  if (scenario.site_id !== null) {
    const site = sites.find((s) => s.id === scenario.site_id) ?? { id: scenario.site_id, name: scenario.site_id };
    return { kind: 'site', site };
  }
  return { kind: 'custom', lat_deg: scenario.lat_deg ?? 0, lon_deg: scenario.lon_deg ?? 0 };
}

export function placeLabel(scenario: Scenario, sites: readonly Pick<Site, 'id' | 'name'>[]): string {
  return placeName(placeOf(scenario, sites));
}

function inputOf(scenario: Scenario, sites: readonly Pick<Site, 'id' | 'name'>[]): ScenarioInput {
  const input: ScenarioInput = {
    place: placeOf(scenario, sites),
    start_utc: scenario.start_utc,
    days: scenarioDays(scenario),
    mast_height_m: scenario.mast_height_m,
    panel_profile_id: scenario.panel_profile_id,
  };
  if (scenario.fixed_azimuth_deg !== undefined) input.fixed_azimuth_deg = scenario.fixed_azimuth_deg;
  if (scenario.earth_criterion !== undefined) input.earth_criterion = scenario.earth_criterion;
  return input;
}

/** Template "same site, another date": same place and settings, new start, same length. */
export function sameSiteAnotherDate(scenario: Scenario, startUtc: UtcString, sites: readonly Pick<Site, 'id' | 'name'>[]): Scenario {
  return buildScenario({ ...inputOf(scenario, sites), start_utc: startUtc });
}

/** Template "same date, another site": same dates and settings, another catalogue site. */
export function sameDateAnotherSite(scenario: Scenario, site: Pick<Site, 'id' | 'name'>, sites: readonly Pick<Site, 'id' | 'name'>[]): Scenario {
  return buildScenario({ ...inputOf(scenario, sites), place: { kind: 'site', site } });
}

/** The active scenario with its launch slipped by `days`; always id `slip`, so it replaces itself. */
export function slippedScenario(scenario: Scenario, days: number, sites: readonly Pick<Site, 'id' | 'name'>[]): Scenario {
  const input = inputOf(scenario, sites);
  const moved = buildScenario({ ...input, start_utc: addDaysUtc(scenario.start_utc, days) });
  return { ...moved, scenario_id: SLIP_SCENARIO_ID, label: `${placeName(input.place)}, launch +${days} d` };
}

/** Location parameters for the API. */
export function locationOf(scenario: Scenario): LocationParams {
  if (scenario.site_id !== null) return { site_id: scenario.site_id };
  return { lat_deg: scenario.lat_deg ?? 0, lon_deg: scenario.lon_deg ?? 0 };
}

/** Same location and mast height for every API call of a scenario. */
export function locationWithMast(scenario: Scenario): LocationParams & { mast_height_m?: number } {
  const location = locationOf(scenario);
  return scenario.mast_height_m === null ? location : { ...location, mast_height_m: scenario.mast_height_m };
}

/** Moment the panels show: the selected moment if it lies in the scenario, else the start. */
export function momentIn(scenario: Scenario, selected: UtcString | null): UtcString {
  if (selected) {
    const t = Date.parse(selected);
    if (t >= Date.parse(scenario.start_utc) && t <= Date.parse(scenario.end_utc)) return selected;
  }
  return scenario.start_utc;
}
