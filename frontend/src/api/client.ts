/**
 * One typed function per endpoint (ADR-0004). In `examples` mode they answer from
 * `data/examples/` without a server; in `live` mode they call `/api`. Every failure is an
 * `ApiError` (errors.ts), so callers handle a single error type.
 *
 * The interface does no sky computation here: values come from the server or the examples
 * as they are (docs/PLAN.md, section 4.1, rule 2).
 */

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
  validationExample,
  bodySeriesExample,
  groundStationsExample,
  earthLinkExample,
  earthLinkRelayExample,
  candidatesExample,
  recommendExample,
  sitesExample,
  skySeriesExample,
} from './examples';
import { decodeLayer, syntheticLayer } from './layers';
import { recordedOrExample } from './recorded';
import { recordedComparison } from './recorded-compare';
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
  type WideLayerRegion,
  type LocationParams,
  type NowStatus,
  type PanelProfile,
  type PowerSeries,
  type ReferenceMission,
  type ValidationReport,
  type BodySeries,
  type CandidateList,
  type EarthLink,
  type GroundStation,
  type RecommendRequest,
  type RecommendResponse,
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
/** A wide region serves only `elevation` (the server answers 422 for another layer). */
export type LayerParams = { region: LayerRegion | WideLayerRegion };
/** A period with a step in seconds, or a single instant (#97, section 4.1). */
export type BodySeriesParams = { start_utc: UtcString; end_utc: UtcString; step_s: number } | { utc: UtcString };
export type EarthLinkParams = LocationParams &
  WithMast & { start_utc: UtcString; end_utc: UtcString; min_station_elevation_deg?: number; earth_criterion?: Criterion };
export type CandidatesParams = { region?: LayerRegion };

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
  return isLive() ? getJson('/horizon', params, options) : recordedOrExample('horizon', params, horizonExample, options?.signal);
}

export function getSkySeries(params: SkySeriesParams, options?: RequestOptions): Promise<SkySeries> {
  return isLive() ? getJson('/sky-series', params, options) : recordedOrExample('sky-series', params, skySeriesExample, options?.signal);
}

/** Prefer a matching site recording; otherwise retain the documented generic examples. */
export function getEvents(params: EventsParams, options?: RequestOptions): Promise<EventList> {
  if (isLive()) return getJson('/events', params, options);
  const eclipse = 'site_id' in params && params.site_id === 'apollo-11';
  return recordedOrExample('events', params, eclipse ? eventsEclipseExample : eventsExample, options?.signal);
}

export function getNow(params: NowParams, options?: RequestOptions): Promise<NowStatus> {
  return isLive() ? getJson('/now', params, options) : recordedOrExample('now', params, nowExample, options?.signal);
}

/** Instant recordings match their UTC exactly; fallback answers retain their source identity. */
export function getCommWindow(params: CommWindowParams, options?: RequestOptions): Promise<CommWindow> {
  if (isLive()) return getJson('/comm-window', params, options);
  const relay = 'site_id' in params && params.site_id === 'change-4';
  return recordedOrExample('comm-window', params, relay ? commWindowRelayExample : commWindowExample, options?.signal);
}

export function getPower(params: PowerParams, options?: RequestOptions): Promise<PowerSeries> {
  return isLive() ? getJson('/power', params, options) : recordedOrExample('power', params, powerExample, options?.signal);
}

/**
 * At most four scenarios. Both modes answer five or more with the server's
 * `too_many_scenarios` error (HTTP 422), so the interface sees the same failure either way.
 *
 * Example mode uses matched event/power recordings, then `compare.json`; questions
 * answered by neither source get `null` metrics (compare-metrics.ts).
 */
export function postCompare(body: CompareRequest, options?: RequestOptions): Promise<CompareResponse> {
  if (isLive()) return postJson('/compare', body, options);
  if (body.scenarios.length > MAX_COMPARE_SCENARIOS) {
    return Promise.reject(
      new ApiError('too_many_scenarios', `At most ${MAX_COMPARE_SCENARIOS} scenarios can be compared.`, 422),
    );
  }
  return recordedComparison(body.scenarios, compareExample, options?.signal);
}

export function getReferenceMissions(options?: RequestOptions): Promise<ReferenceMission[]> {
  return isLive() ? getJson('/reference-missions', {}, options) : fromExample(referenceMissionsExample, options);
}

export function getPanelProfiles(options?: RequestOptions): Promise<PanelProfile[]> {
  return isLive() ? getJson('/panel-profiles', {}, options) : fromExample(panelProfilesExample, options);
}

/** Sub-solar and sub-Earth points over a period or at an instant (`/api/body-series`). */
export function getBodySeries(params: BodySeriesParams, options?: RequestOptions): Promise<BodySeries> {
  return isLive() ? getJson('/body-series', params, options) : recordedOrExample('body-series', params, bodySeriesExample, options?.signal);
}

/** The Earth stations whose view of the Moon the link is computed for (`/api/ground-stations`). */
export function getGroundStations(options?: RequestOptions): Promise<GroundStation[]> {
  return isLive() ? getJson('/ground-stations', {}, options) : fromExample(groundStationsExample, options);
}

/**
 * Link windows of a site: direct, no station, or relay needed (`/api/earth-link`). Example mode
 * answers the far-side Chang'e 4 site with the whole-period relay example.
 */
export function getEarthLink(params: EarthLinkParams, options?: RequestOptions): Promise<EarthLink> {
  if (isLive()) return getJson('/earth-link', params, options);
  const relay = 'site_id' in params && params.site_id === 'change-4';
  return recordedOrExample('earth-link', params, relay ? earthLinkRelayExample : earthLinkExample, options?.signal);
}

/** Candidate regions found in the elevation maps (`/api/candidates`). */
export function getCandidates(params: CandidatesParams = {}, options?: RequestOptions): Promise<CandidateList> {
  return isLive() ? getJson('/candidates', params, options) : recordedOrExample('candidates', params, candidatesExample, options?.signal);
}

/** Ranked candidate regions and catalogue sites for the user's weights (`POST /api/recommend`). */
export function postRecommend(body: RecommendRequest, options?: RequestOptions): Promise<RecommendResponse> {
  return isLive() ? postJson('/recommend', body, options) : recordedOrExample('recommend', { ...body }, recommendExample, options?.signal);
}

/** The stored validation report (ADR-0004, "/api/validation"); the server does not rerun the tests. */
export function getValidation(options?: RequestOptions): Promise<ValidationReport> {
  return isLive() ? getJson('/validation', {}, options) : fromExample(validationExample, options);
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
