/**
 * Keeps the scenario state in the address bar so a link reopens the same scenario (`UC-11`).
 *
 * Active scenario, readable keys:
 *   sid, label, site | lat + lon, start, end, mast, panel, az, crit
 * Selected moment: `t`. Comparison list: one `cmp` parameter per scenario, each a JSON object
 * with the contract's field names.
 *
 * Parameters this file does not own (`door` from the app shell, `data` from api/config.ts, or
 * anything else) are never removed or reordered.
 */

import { CRITERIA, type Criterion, type Scenario, type UtcString } from '../api/types';
import { EMPTY_SCENARIO_STATE, MAX_COMPARE, type ScenarioState, type ScenarioStore } from './scenario-store';

export const SCENARIO_PARAMS = {
  scenarioId: 'sid',
  label: 'label',
  site: 'site',
  lat: 'lat',
  lon: 'lon',
  start: 'start',
  end: 'end',
  mast: 'mast',
  panel: 'panel',
  azimuth: 'az',
  criterion: 'crit',
  selectedUtc: 't',
  compare: 'cmp',
} as const;

const OWN_KEYS: readonly string[] = Object.values(SCENARIO_PARAMS);

/** Keys of the active scenario only (not the selected moment, not the comparison list). */
const ACTIVE_KEYS: readonly string[] = [
  SCENARIO_PARAMS.scenarioId,
  SCENARIO_PARAMS.label,
  SCENARIO_PARAMS.site,
  SCENARIO_PARAMS.lat,
  SCENARIO_PARAMS.lon,
  SCENARIO_PARAMS.start,
  SCENARIO_PARAMS.end,
  SCENARIO_PARAMS.mast,
  SCENARIO_PARAMS.panel,
  SCENARIO_PARAMS.azimuth,
  SCENARIO_PARAMS.criterion,
];

/** Used when a hand-written link names a scenario without an id. */
export const DEFAULT_SCENARIO_ID = 'a';

const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function isUtc(value: unknown): value is UtcString {
  return typeof value === 'string' && UTC_PATTERN.test(value);
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isCriterion(value: unknown): value is Criterion {
  return (CRITERIA as readonly unknown[]).includes(value);
}

/**
 * Builds a scenario from loosely typed fields, or `null` when a required field is missing
 * or out of range. Ranges follow ADR-0004: latitude -90..90, longitude -180..360, mast >= 0.
 */
export function scenarioFromFields(fields: Record<string, unknown>): Scenario | null {
  const start = fields.start_utc;
  const end = fields.end_utc;
  const panel = fields.panel_profile_id;
  if (!isUtc(start) || !isUtc(end) || typeof panel !== 'string' || panel === '') return null;

  const siteId = typeof fields.site_id === 'string' && fields.site_id !== '' ? fields.site_id : null;
  const lat = finite(fields.lat_deg);
  const lon = finite(fields.lon_deg);
  const hasCoords = lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 360;
  if (!siteId && !hasCoords) return null;

  const mastRaw = fields.mast_height_m;
  const mast = mastRaw === null || mastRaw === undefined || mastRaw === '' ? null : finite(mastRaw);
  if (mast !== null && mast < 0) return null;
  if (mastRaw !== null && mastRaw !== undefined && mastRaw !== '' && mast === null) return null;

  const scenario: Scenario = {
    scenario_id: typeof fields.scenario_id === 'string' && fields.scenario_id !== '' ? fields.scenario_id : DEFAULT_SCENARIO_ID,
    label: typeof fields.label === 'string' ? fields.label : '',
    site_id: siteId,
    lat_deg: siteId ? null : lat,
    lon_deg: siteId ? null : lon,
    start_utc: start,
    end_utc: end,
    mast_height_m: mast,
    panel_profile_id: panel,
  };
  const azimuth = finite(fields.fixed_azimuth_deg);
  if (azimuth !== null) scenario.fixed_azimuth_deg = azimuth;
  if (isCriterion(fields.earth_criterion)) scenario.earth_criterion = fields.earth_criterion;
  return scenario;
}

function activeFromParams(params: URLSearchParams): Scenario | null {
  const P = SCENARIO_PARAMS;
  const get = (key: string): string | undefined => params.get(key) ?? undefined;
  if (!params.has(P.start) && !params.has(P.site) && !params.has(P.lat)) return null;
  return scenarioFromFields({
    scenario_id: get(P.scenarioId),
    label: get(P.label),
    site_id: get(P.site),
    lat_deg: get(P.lat),
    lon_deg: get(P.lon),
    start_utc: get(P.start),
    end_utc: get(P.end),
    mast_height_m: get(P.mast),
    panel_profile_id: get(P.panel),
    fixed_azimuth_deg: get(P.azimuth),
    earth_criterion: get(P.criterion),
  });
}

function compareFromParams(params: URLSearchParams): Scenario[] {
  const out: Scenario[] = [];
  for (const raw of params.getAll(SCENARIO_PARAMS.compare)) {
    if (out.length >= MAX_COMPARE) break;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) continue;
    const scenario = scenarioFromFields(parsed as Record<string, unknown>);
    if (scenario && !out.some((s) => s.scenario_id === scenario.scenario_id)) out.push(scenario);
  }
  return out;
}

/** Reads the scenario state from address-bar parameters. Invalid parts are dropped. */
export function readScenarioParams(params: URLSearchParams): ScenarioState {
  const t = params.get(SCENARIO_PARAMS.selectedUtc);
  return {
    active: activeFromParams(params),
    selected_utc: isUtc(t) ? t : null,
    compare: compareFromParams(params),
  };
}

/** True when the parameters carry any scenario key. */
export function hasScenarioParams(params: URLSearchParams): boolean {
  return OWN_KEYS.some((key) => params.has(key));
}

/**
 * True when the address bar names an active scenario that could not be read, for example a
 * hand-written link without `panel`. Such keys are kept until the user sets a valid scenario.
 */
export function hasUnreadableActiveScenario(params: URLSearchParams): boolean {
  return ACTIVE_KEYS.some((key) => params.has(key)) && activeFromParams(params) === null;
}

/**
 * The valid fields of an active scenario in the address bar, even when the scenario as a whole
 * is incomplete. The setup panel can use them to pre-fill its form. Invalid values are left out.
 */
export function readScenarioDraft(params: URLSearchParams): Partial<Scenario> {
  const P = SCENARIO_PARAMS;
  const draft: Partial<Scenario> = {};
  const sid = params.get(P.scenarioId);
  if (sid) draft.scenario_id = sid;
  const label = params.get(P.label);
  if (label !== null) draft.label = label;
  const site = params.get(P.site);
  if (site) {
    draft.site_id = site;
  } else {
    const lat = finite(params.get(P.lat));
    const lon = finite(params.get(P.lon));
    if (lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 360) {
      draft.lat_deg = lat;
      draft.lon_deg = lon;
    }
  }
  const start = params.get(P.start);
  if (isUtc(start)) draft.start_utc = start;
  const end = params.get(P.end);
  if (isUtc(end)) draft.end_utc = end;
  const mast = finite(params.get(P.mast));
  if (mast !== null && mast >= 0) draft.mast_height_m = mast;
  const panel = params.get(P.panel);
  if (panel) draft.panel_profile_id = panel;
  const azimuth = finite(params.get(P.azimuth));
  if (azimuth !== null) draft.fixed_azimuth_deg = azimuth;
  const criterion = params.get(P.criterion);
  if (isCriterion(criterion)) draft.earth_criterion = criterion;
  return draft;
}

function compareEntry(s: Scenario): string {
  const entry: Record<string, unknown> = {
    scenario_id: s.scenario_id,
    label: s.label,
    site_id: s.site_id,
    lat_deg: s.lat_deg,
    lon_deg: s.lon_deg,
    start_utc: s.start_utc,
    end_utc: s.end_utc,
    mast_height_m: s.mast_height_m,
    panel_profile_id: s.panel_profile_id,
  };
  if (s.fixed_azimuth_deg !== undefined && s.fixed_azimuth_deg !== null) entry.fixed_azimuth_deg = s.fixed_azimuth_deg;
  if (s.earth_criterion !== undefined) entry.earth_criterion = s.earth_criterion;
  return JSON.stringify(entry);
}

export interface WriteOptions {
  /**
   * Leave the active-scenario keys in `existing` untouched when `state.active` is `null`.
   * Used while the address bar holds an incomplete scenario the user has not replaced yet.
   */
  keepActiveParams?: boolean;
}

/**
 * Writes the state into a copy of `existing`. Only this file's keys are replaced; every other
 * parameter keeps its value and position.
 */
export function writeScenarioParams(
  state: ScenarioState,
  existing: URLSearchParams,
  options: WriteOptions = {},
): URLSearchParams {
  const P = SCENARIO_PARAMS;
  const params = new URLSearchParams(existing);
  const keepActive = options.keepActiveParams === true && state.active === null;
  for (const key of OWN_KEYS) {
    if (!(keepActive && ACTIVE_KEYS.includes(key))) params.delete(key);
  }

  const a = state.active;
  if (a) {
    params.set(P.scenarioId, a.scenario_id);
    params.set(P.label, a.label);
    if (a.site_id !== null) {
      params.set(P.site, a.site_id);
    } else if (a.lat_deg !== null && a.lon_deg !== null) {
      params.set(P.lat, String(a.lat_deg));
      params.set(P.lon, String(a.lon_deg));
    }
    params.set(P.start, a.start_utc);
    params.set(P.end, a.end_utc);
    if (a.mast_height_m !== null) params.set(P.mast, String(a.mast_height_m));
    params.set(P.panel, a.panel_profile_id);
    if (a.fixed_azimuth_deg !== undefined && a.fixed_azimuth_deg !== null) params.set(P.azimuth, String(a.fixed_azimuth_deg));
    if (a.earth_criterion !== undefined) params.set(P.criterion, a.earth_criterion);
  }
  if (state.selected_utc !== null) params.set(P.selectedUtc, state.selected_utc);
  for (const s of state.compare.slice(0, MAX_COMPARE)) params.append(P.compare, compareEntry(s));
  return params;
}

// ---------------------------------------------------------------------------
// Binding to the browser
// ---------------------------------------------------------------------------

export interface UrlEnvironment {
  location: { pathname: string; search: string; hash: string };
  history: { state: unknown; replaceState(data: unknown, unused: string, url?: string | null): void };
  addEventListener?(type: 'popstate', listener: () => void): void;
  removeEventListener?(type: 'popstate', listener: () => void): void;
}

function browserEnvironment(): UrlEnvironment | null {
  const g = globalThis as unknown as Partial<UrlEnvironment> & {
    addEventListener?: UrlEnvironment['addEventListener'];
    removeEventListener?: UrlEnvironment['removeEventListener'];
  };
  if (!g.location || !g.history) return null;
  return {
    location: g.location,
    history: g.history,
    addEventListener: g.addEventListener?.bind(globalThis),
    removeEventListener: g.removeEventListener?.bind(globalThis),
  };
}

/**
 * Connects a store to the address bar: reads it once (when it holds scenario keys), then writes
 * every change with `history.replaceState` (scrubbing the timeline must not fill the history),
 * and re-reads on back and forward. Returns a function that disconnects. Does nothing outside a
 * browser unless an environment is passed in.
 *
 * An incomplete active scenario in the address bar (for example no `panel`) is not loaded, but
 * its keys stay in the address bar until the user sets a scenario, so a hand-written link is not
 * lost on the first state change. `readScenarioDraft` gives its valid fields.
 */
export function bindScenarioUrl(store: ScenarioStore, env: UrlEnvironment | null = browserEnvironment()): () => void {
  if (!env) return () => {};

  // Kept while the active scenario is still the one read from the address bar.
  let keepPartial = false;
  let activeAtRead: ScenarioState['active'] = null;

  const load = (params: URLSearchParams, clearWhenEmpty: boolean): void => {
    // Set before replaceState: the store notifies the writer below synchronously, and an
    // unreadable scenario always reads as `active: null`.
    keepPartial = hasUnreadableActiveScenario(params);
    activeAtRead = null;
    if (hasScenarioParams(params)) {
      store.replaceState(readScenarioParams(params));
    } else if (clearWhenEmpty) {
      store.replaceState(EMPTY_SCENARIO_STATE);
    }
    activeAtRead = store.getState().active;
  };

  const readUrl = (): void => load(new URLSearchParams(env.location.search), true);

  load(new URLSearchParams(env.location.search), false);

  const unsubscribe = store.subscribe((state) => {
    if (keepPartial && state.active !== activeAtRead) keepPartial = false;
    const current = new URLSearchParams(env.location.search);
    const next = writeScenarioParams(state, current, { keepActiveParams: keepPartial }).toString();
    if (next === current.toString()) return;
    const url = `${env.location.pathname}${next ? `?${next}` : ''}${env.location.hash}`;
    env.history.replaceState(env.history.state, '', url);
  });

  env.addEventListener?.('popstate', readUrl);
  return () => {
    unsubscribe();
    env.removeEventListener?.('popstate', readUrl);
  };
}
