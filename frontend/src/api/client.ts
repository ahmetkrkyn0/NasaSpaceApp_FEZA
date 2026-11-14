/**
 * One typed function per endpoint (ADR-0004). In `examples` mode they answer from
 * `data/examples/` without a server; in `live` mode they call `/api`. Every failure is an
 * `ApiError` (errors.ts), so callers handle a single error type.
 *
 * The interface does no sky computation here: values come from the server or the examples
 * as they are (docs/PLAN.md, section 4.1, rule 2).
 */

import { exampleCompareResponse } from './compare-metrics';
import { getApiConfig } from './config';
import { ApiError, errorFromResponse, errorFromThrown } from './errors';
import {
  commWindowExample,
  commWindowRelayExample,
  compareExample,
  eventsEclipseExample,
  eventsExample,
  healthExample,
  horizonExample,
  nowExample,
  panelProfilesExample,
  powerExample,
  referenceMissionsExample,
  sitesExample,
  skySeriesExample,
} from './examples';
import { decodeLayer, syntheticLayer } from './layers';
import {
  MAX_COMPARE_SCENARIOS,
  type CommWindow,
  type CompareRequest,
  type CompareResponse,
  type Criterion,
  type EventList,
  type Health,
  type HorizonProfile,
  type LayerGrid,
  type LayerName,
  type LayerRegion,
  type LocationParams,
  type NowStatus,
  type PanelProfile,
  type PowerSeries,
  type ReferenceMission,
  type Site,
  type SiteCategory,
  type SkySeries,
  type UtcString,
  type WithMast,
} from './types';

export interface RequestOptions {
  signal?: AbortSignal;
}

export type HorizonParams = LocationParams & WithMast;
export type SkySeriesParams = LocationParams &
  WithMast & { start_utc: UtcString; hours: number; step_minutes: number };
export type EventsParams = LocationParams &
  WithMast & { start_utc: UtcString; end_utc: UtcString; earth_criterion?: Criterion };
export type NowParams = LocationParams & WithMast & { utc: UtcString; earth_criterion?: Criterion };
export type CommWindowParams = NowParams;
export type PowerParams = LocationParams &
  WithMast & { start_utc: UtcString; end_utc: UtcString; panel_profile_id: string; fixed_azimuth_deg?: number };
export type LayerParams = { region: LayerRegion };

type Query = Record<string, string | number | boolean | undefined | null>;

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function queryString(query: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

async function send(path: string, init: RequestInit, options?: RequestOptions): Promise<Response> {
  const { baseUrl, fetch: injected } = getApiConfig();
  const doFetch = injected ?? globalThis.fetch;
  let response: Response;
  try {
    response = await doFetch(`${baseUrl}${path}`, { ...init, signal: options?.signal });
  } catch (thrown) {
    throw errorFromThrown(thrown);
  }
  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // keep the empty body; the status still describes the failure
    }
    throw errorFromResponse(response.status, response.statusText, body);
  }
  return response;
}

async function getJson<T>(path: string, query: Query, options?: RequestOptions): Promise<T> {
  const response = await send(`${path}${queryString(query)}`, { method: 'GET' }, options);
  return readJson<T>(response);
}

async function postJson<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  const response = await send(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    options,
  );
  return readJson<T>(response);
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (thrown) {
    if (thrown instanceof Error && thrown.name === 'AbortError') throw errorFromThrown(thrown);
    throw new ApiError('invalid_response', 'The server answer is not valid JSON.', response.status);
  }
}

/** Example mode: a fresh copy, so a caller that edits the result cannot change the example. */
function fromExample<T>(value: T, options?: RequestOptions): Promise<T> {
  if (options?.signal?.aborted) return Promise.reject(new ApiError('aborted', 'The request was cancelled.'));
  return Promise.resolve(structuredClone(value));
}

function isLive(): boolean {
  return getApiConfig().mode === 'live';
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export function getHealth(options?: RequestOptions): Promise<Health> {
  return isLive() ? getJson('/health', {}, options) : fromExample(healthExample, options);
}

export function getSites(params: { category?: SiteCategory } = {}, options?: RequestOptions): Promise<Site[]> {
  if (isLive()) return getJson('/sites', params, options);
  const { category } = params;
  return fromExample(category ? sitesExample.filter((s) => s.category === category) : sitesExample, options);
}

export function getHorizon(params: HorizonParams, options?: RequestOptions): Promise<HorizonProfile> {
  return isLive() ? getJson('/horizon', params, options) : fromExample(horizonExample, options);
}

export function getSkySeries(params: SkySeriesParams, options?: RequestOptions): Promise<SkySeries> {
  return isLive() ? getJson('/sky-series', params, options) : fromExample(skySeriesExample, options);
}

/** Example mode answers the Apollo 11 site with the eclipse example, every other site with the Earth events example. */
export function getEvents(params: EventsParams, options?: RequestOptions): Promise<EventList> {
  if (isLive()) return getJson('/events', params, options);
  const eclipse = 'site_id' in params && params.site_id === 'apollo-11';
  return fromExample(eclipse ? eventsEclipseExample : eventsExample, options);
}

export function getNow(params: NowParams, options?: RequestOptions): Promise<NowStatus> {
  return isLive() ? getJson('/now', params, options) : fromExample(nowExample, options);
}

/** Example mode answers the Chang'e 4 site with the relay example, every other site with the Mons Mouton example. */
export function getCommWindow(params: CommWindowParams, options?: RequestOptions): Promise<CommWindow> {
  if (isLive()) return getJson('/comm-window', params, options);
  const relay = 'site_id' in params && params.site_id === 'change-4';
  return fromExample(relay ? commWindowRelayExample : commWindowExample, options);
}

export function getPower(params: PowerParams, options?: RequestOptions): Promise<PowerSeries> {
  return isLive() ? getJson('/power', params, options) : fromExample(powerExample, options);
}

/**
 * At most four scenarios. Both modes answer five or more with the server's
 * `too_many_scenarios` error (HTTP 422), so the interface sees the same failure either way.
 *
 * Example mode answers for the scenarios actually sent: a scenario that matches one in
 * `compare.json` gets its metrics, any other gets `null` metrics (compare-metrics.ts).
 */
export function postCompare(body: CompareRequest, options?: RequestOptions): Promise<CompareResponse> {
  if (isLive()) return postJson('/compare', body, options);
  if (body.scenarios.length > MAX_COMPARE_SCENARIOS) {
    return Promise.reject(
      new ApiError('too_many_scenarios', `At most ${MAX_COMPARE_SCENARIOS} scenarios can be compared.`, 422),
    );
  }
  return fromExample(exampleCompareResponse(body.scenarios, compareExample), options);
}

export function getReferenceMissions(options?: RequestOptions): Promise<ReferenceMission[]> {
  return isLive() ? getJson('/reference-missions', {}, options) : fromExample(referenceMissionsExample, options);
}

export function getPanelProfiles(options?: RequestOptions): Promise<PanelProfile[]> {
  return isLive() ? getJson('/panel-profiles', {}, options) : fromExample(panelProfilesExample, options);
}

/** Example mode returns a small synthetic grid (layers.ts), never real terrain. */
export async function getLayer(name: LayerName, params: LayerParams, options?: RequestOptions): Promise<LayerGrid> {
  if (!isLive()) return fromExample(syntheticLayer(name), options);
  const path = `/layers/${encodeURIComponent(name)}${queryString({ format: 'f32', region: params.region })}`;
  const response = await send(path, { method: 'GET' }, options);
  let buffer: ArrayBuffer;
  try {
    buffer = await response.arrayBuffer();
  } catch (thrown) {
    throw errorFromThrown(thrown);
  }
  return decodeLayer(buffer, response.headers, name);
}
