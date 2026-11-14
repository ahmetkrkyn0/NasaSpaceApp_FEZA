/**
 * Example responses from `data/examples/`, each assigned to its contract type.
 *
 * Two checks keep the files and the types in step:
 * 1. Compile time: `typed<T>()(json)` fails when a field is missing, has the wrong shape,
 *    or is not in the type (the error names the extra field).
 * 2. Run time: `findExampleProblems()` checks what TypeScript cannot see in JSON, because
 *    JSON imports widen string values: the closed value sets (`validity`, `category`, ...),
 *    the UTC format, and snake_case field names.
 *
 * The importing build must allow JSON modules (`resolveJsonModule`) and let the dev server
 * read the repository's `data/examples/` folder.
 */

import commWindowRelayJson from '../../../data/examples/comm-window-relay.json';
import commWindowJson from '../../../data/examples/comm-window.json';
import compareJson from '../../../data/examples/compare.json';
import errorJson from '../../../data/examples/error.json';
import eventsEclipseJson from '../../../data/examples/events-eclipse.json';
import eventsJson from '../../../data/examples/events.json';
import healthJson from '../../../data/examples/health.json';
import horizonJson from '../../../data/examples/horizon.json';
import nowJson from '../../../data/examples/now.json';
import panelProfilesJson from '../../../data/examples/panel-profiles.json';
import powerJson from '../../../data/examples/power.json';
import referenceMissionsJson from '../../../data/examples/reference-missions.json';
import sitesJson from '../../../data/examples/sites.json';
import skySeriesJson from '../../../data/examples/sky-series.json';
import validationJson from '../../../data/examples/validation.json';
import {
  CRITERIA,
  EVENT_TYPES,
  EVIDENCE_LEVELS,
  HORIZON_METHODS,
  PANEL_TYPES,
  RELAY_STATUSES,
  SITE_CATEGORIES,
  SITE_STATUSES,
  VALIDATION_KINDS,
  VALIDATION_STATUSES,
  VALIDITY_VALUES,
  WINDOW_KINDS,
  type ApiErrorBody,
  type CommWindow,
  type CompareResponse,
  type EventList,
  type Health,
  type HorizonProfile,
  type NowStatus,
  type PanelProfile,
  type PowerSeries,
  type ReferenceMission,
  type Site,
  type SkySeries,
  type ValidationReport,
} from './types';

// ---------------------------------------------------------------------------
// Compile-time check
// ---------------------------------------------------------------------------

/** The type as JSON imports see it: string unions become `string`. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends null | undefined
        ? T
        : T extends readonly (infer U)[]
          ? Widen<U>[]
          : T extends object
            ? { [K in keyof T]: Widen<T[K]> }
            : T;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;
type FieldOf<T, K extends PropertyKey> = T extends unknown ? (K extends keyof T ? T[K] : never) : never;

/** Field names present in the JSON value `J` but not in the type `T`, at any depth. */
type ExtraKeys<J, T> = J extends readonly (infer JE)[]
  ? NonNullable<T> extends readonly (infer TE)[]
    ? ExtraKeys<JE, TE>
    : never
  : J extends object
    ? NonNullable<T> extends object
      ? {
          [K in keyof J]-?: K extends KeysOfUnion<NonNullable<T>> ? ExtraKeys<J[K], FieldOf<NonNullable<T>, K>> : K;
        }[keyof J]
      : never
    : never;

/**
 * `typed<T>()(json)` returns `json` as `T`. It does not compile when the JSON misses a field
 * of `T`, has a field of the wrong shape, or has a field that `T` does not define.
 */
function typed<T>() {
  return <J extends Widen<T>>(
    json: J,
    ..._noExtraFields: [ExtraKeys<J, T>] extends [never] ? [] : ['field not in the contract type:', ExtraKeys<J, T>]
  ): T => json as unknown as T;
}

export const healthExample = typed<Health>()(healthJson);
export const sitesExample = typed<Site[]>()(sitesJson);
export const horizonExample = typed<HorizonProfile>()(horizonJson);
export const skySeriesExample = typed<SkySeries>()(skySeriesJson);
export const eventsExample = typed<EventList>()(eventsJson);
export const eventsEclipseExample = typed<EventList>()(eventsEclipseJson);
export const nowExample = typed<NowStatus>()(nowJson);
export const commWindowExample = typed<CommWindow>()(commWindowJson);
export const commWindowRelayExample = typed<CommWindow>()(commWindowRelayJson);
export const powerExample = typed<PowerSeries>()(powerJson);
export const compareExample = typed<CompareResponse>()(compareJson);
export const referenceMissionsExample = typed<ReferenceMission[]>()(referenceMissionsJson);
export const panelProfilesExample = typed<PanelProfile[]>()(panelProfilesJson);
export const errorExample = typed<ApiErrorBody>()(errorJson);
export const validationExample = typed<ValidationReport>()(validationJson);

/** Every example by its file name in `data/examples/`. */
export const EXAMPLES = {
  'health.json': healthExample,
  'sites.json': sitesExample,
  'horizon.json': horizonExample,
  'sky-series.json': skySeriesExample,
  'events.json': eventsExample,
  'events-eclipse.json': eventsEclipseExample,
  'now.json': nowExample,
  'comm-window.json': commWindowExample,
  'comm-window-relay.json': commWindowRelayExample,
  'power.json': powerExample,
  'compare.json': compareExample,
  'reference-missions.json': referenceMissionsExample,
  'panel-profiles.json': panelProfilesExample,
  'error.json': errorExample,
  'validation.json': validationExample,
} as const;

export type ExampleFile = keyof typeof EXAMPLES;

// ---------------------------------------------------------------------------
// Run-time check
// ---------------------------------------------------------------------------

/** Closed value sets by field name. `type` covers both event types and panel types. */
const ALLOWED: Record<string, readonly string[]> = {
  validity: VALIDITY_VALUES,
  landing_utc_validity: VALIDITY_VALUES,
  category: SITE_CATEGORIES,
  status: SITE_STATUSES,
  outcome: SITE_STATUSES,
  method: HORIZON_METHODS,
  kind: WINDOW_KINDS,
  criterion: CRITERIA,
  earth_criterion: CRITERIA,
  relay_status: RELAY_STATUSES,
  evidence: EVIDENCE_LEVELS,
  type: [...EVENT_TYPES, ...PANEL_TYPES],
};

/**
 * The validation report reuses the names `status` and `kind` for its own value sets
 * (ADR-0004, "/api/validation"), so its file is checked against these instead.
 */
const VALIDATION_ALLOWED: Record<string, readonly string[]> = {
  ...ALLOWED,
  status: VALIDATION_STATUSES,
  kind: VALIDATION_KINDS,
};

/** Value sets per example file, where a file differs from `ALLOWED`. */
const FILE_ALLOWED: Partial<Record<string, Record<string, readonly string[]>>> = {
  'validation.json': VALIDATION_ALLOWED,
};

const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const FIELD_PATTERN = /^[a-z][a-z0-9_]*$/;
/** Objects whose keys are data (scenario ids), not field names. */
const DATA_KEYED = new Set(['values']);

function isUtcField(key: string): boolean {
  return key === 'utc' || key.endsWith('_utc');
}

function walk(value: unknown, path: string, out: string[], keysAreData = false, sets: Record<string, readonly string[]> = ALLOWED): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, out, false, sets));
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    const here = `${path}.${key}`;
    if (!keysAreData && !FIELD_PATTERN.test(key)) out.push(`${here}: field name is not snake_case`);
    const allowed = keysAreData ? undefined : sets[key];
    if (allowed && child !== null && !allowed.includes(child as string)) {
      out.push(`${here}: "${String(child)}" is not one of ${allowed.join(', ')}`);
    }
    if (!keysAreData && isUtcField(key) && child !== null && !(typeof child === 'string' && UTC_PATTERN.test(child))) {
      out.push(`${here}: "${String(child)}" is not a UTC time ending in Z`);
    }
    walk(child, here, out, DATA_KEYED.has(key), sets);
  }
}

/** Problems in one value; empty when it is clean. */
export function findProblems(value: unknown, path = '$', sets: Record<string, readonly string[]> = ALLOWED): string[] {
  const out: string[] = [];
  walk(value, path, out, false, sets);
  return out;
}

/** Problems in every example file; empty when all are clean. */
export function findExampleProblems(): string[] {
  return Object.entries(EXAMPLES).flatMap(([file, value]) => findProblems(value, file, FILE_ALLOWED[file] ?? ALLOWED));
}
