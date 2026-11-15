/** Lazy, immutable API recordings. No positions or visibility are calculated here. */
import index from '../../../data/examples/recorded/index.json';
import { ApiError } from './errors';

type Params = Record<string, unknown>;
interface Envelope<T> { params: Params; response: T; recorded_utc: string; main_sha: string; server_version: string }
export interface ExampleSource {
  matched: boolean;
  label: string;
  start_utc: string;
  end_utc: string;
  recorded_utc?: string;
  sky_step_minutes?: number;
  period_label?: string;
}
const sources = new WeakMap<object, ExampleSource>();
const files = import.meta.glob<{ default: Envelope<unknown> }>('../../../data/examples/recorded/*/*.json');
export const recordingIndex = index;

export function exampleSource(value: unknown): ExampleSource | undefined {
  return typeof value === 'object' && value !== null ? sources.get(value) : undefined;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
const same = (a: unknown, b: unknown) => a === b || (typeof a === 'string' && typeof b === 'string' && a.endsWith('Z') && b.endsWith('Z') && Date.parse(a) === Date.parse(b));

/** Match every scientific input; sampling is explicitly coarser in the offline sky series. */
export function matchesRecording(endpoint: string, request: Params, recorded: Params): boolean {
  const keys = new Set([...Object.keys(request), ...Object.keys(recorded)]);
  for (const key of keys) {
    if (key === 'step_minutes' && endpoint === 'sky-series') continue;
    if (key === 'step_s' && endpoint === 'body-series') continue;
    const defaults: Params = { mast_height_m: 2, earth_criterion: 'center', region: 'mons-mouton' };
    const a = request[key] ?? defaults[key];
    const b = recorded[key] ?? defaults[key];
    if (!same(a, b) && canonical(a) !== canonical(b)) return false;
  }
  return true;
}

export async function loadRecording<T>(endpoint: string, params: Params, signal?: AbortSignal): Promise<{ response: T; source: ExampleSource } | null> {
  if (signal?.aborted) throw new ApiError('aborted', 'The request was cancelled.');
  const folder = typeof params.site_id === 'string' ? params.site_id : 'region';
  if (folder !== 'region' && !index.places.some((p) => p.id === folder)) return null;
  const loader = files[`../../../data/examples/recorded/${folder}/${endpoint}.json`];
  if (!loader) return null;
  const { default: envelope } = await loader();
  if (signal?.aborted) throw new ApiError('aborted', 'The request was cancelled.');
  if (!matchesRecording(endpoint, params, envelope.params)) return null;
  return {
    response: envelope.response as T,
    source: {
      matched: true, label: index.places.find((p) => p.id === folder)?.name ?? 'Mons Mouton region',
      start_utc: typeof envelope.params.utc === 'string' ? envelope.params.utc : index.start_utc,
      end_utc: typeof envelope.params.utc === 'string' ? envelope.params.utc : index.end_utc,
      ...(endpoint === 'horizon' ? { period_label: 'time-independent horizon profile' } : {}),
      recorded_utc: envelope.recorded_utc,
      sky_step_minutes: index.sky_step_minutes,
    },
  };
}

export async function recordedOrExample<T>(endpoint: string, params: Params, fallback: T, signal?: AbortSignal): Promise<T> {
  const match = await loadRecording<T>(endpoint, params, signal);
  const value = structuredClone(match?.response ?? fallback);
  const eclipse = endpoint === 'events' && params.site_id === 'apollo-11';
  const relay = (endpoint === 'comm-window' || endpoint === 'earth-link') && params.site_id === 'change-4';
  const sky = endpoint === 'sky-series';
  const body = endpoint === 'body-series';
  const instant = value && typeof value === 'object' && 'utc' in value && typeof value.utc === 'string' ? value.utc : null;
  const samples = value && typeof value === 'object' && 'samples' in value && Array.isArray(value.samples) ? value.samples as { utc: string }[] : [];
  const windows = value && typeof value === 'object' && 'link_windows' in value && Array.isArray(value.link_windows) ? value.link_windows as { start_utc: string; end_utc: string }[] : [];
  const first = instant ?? samples[0]?.utc ?? windows[0]?.start_utc;
  const last = instant ?? samples[samples.length - 1]?.utc ?? windows[windows.length - 1]?.end_utc;
  const source: ExampleSource = match?.source ?? {
    matched: false, label: body ? 'Moon and Earth geometry example' : sky ? 'IM-2 Athena landing point' : eclipse ? 'Apollo 11 eclipse example' : relay ? "Chang'e 4" : 'Mons Mouton example',
    start_utc: first ?? (eclipse ? '2027-02-20T00:00:00Z' : '2026-12-01T00:00:00Z'),
    end_utc: last ?? (eclipse ? '2027-02-22T00:00:00Z' : endpoint === 'power' ? '2027-01-01T00:00:00Z' : '2026-12-31T00:00:00Z'),
    ...(endpoint === 'horizon' ? { period_label: 'time-independent horizon profile' } : {}),
  };
  if (value && typeof value === 'object') sources.set(value, source);
  return value;
}
