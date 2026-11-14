/**
 * Which horizon model each compared scenario was computed with (issue #71).
 *
 * The terrain horizon exists only for 2 m and 10 m masts, and only at sites that have a terrain
 * profile; any other height (0 m included), any other site and any custom coordinate uses the
 * flat horizon (ADR-0003, "Direk yüksekliği kuralı"). Two scenarios with different models are
 * not a like-for-like comparison: at Mons Mouton the flat horizon at 0 m gives more sunlight
 * than the terrain horizon at 2 m, and that gap is the model, not the mast (#48 walkthrough).
 *
 * The model is read from the server (`/api/horizon`, field `method`) and never guessed here.
 * The `validity` of a compare answer cannot stand in for it: it is `SYNTHETIC` on the terrain
 * horizon too, because the panel values are assumed (PR #75 review). So while the model is not
 * known (loading, failed, or example data), a difference is not tied to any input.
 */

import { getHorizon } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { HorizonMethod, LocationParams, Scenario, Validity } from '../../api/types';
import { TERRAIN_MAST_HEIGHTS, locationOf } from '../../state/scenario-tools';
import { VALIDITY_LABEL } from '../../ui/ValidityBadge';

/** Horizon method by `scenario_id`; a scenario is missing when its model could not be read. */
export type HorizonModels = Readonly<Record<string, HorizonMethod>>;

export const HORIZON_MODEL_LABEL: Record<HorizonMethod, string> = {
  terrain: 'terrain horizon',
  sphere: 'flat horizon',
};

/** "2 m and 10 m", from the heights that can have terrain horizons. */
export const TERRAIN_HEIGHTS_TEXT = TERRAIN_MAST_HEIGHTS.map((h) => `${h} m`).join(' and ');

/** Said wherever mast heights are chosen or compared. */
export const TERRAIN_RULE_TEXT = `Terrain horizons exist only for ${TERRAIN_HEIGHTS_TEXT} masts, and only at sites that have a terrain profile. Every other height and every other place uses a flat horizon, labelled Assumed.`;

const cache = new Map<string, Promise<HorizonMethod>>();

/** One request per location and mast height, shared by the panels; no abort signal for that reason. */
function methodAt(location: LocationParams, mastHeight: number): Promise<HorizonMethod> {
  const params = { ...location, mast_height_m: mastHeight };
  const key = JSON.stringify(params);
  const cached = cache.get(key);
  if (cached) return cached;
  const request = getHorizon(params).then((h) => h.method);
  cache.set(key, request);
  request.catch(() => cache.delete(key));
  return request;
}

/** Empties the cache. Used by tests. */
export function clearHorizonModelCache(): void {
  cache.clear();
}

/**
 * What is known about the horizon models of a set of scenarios:
 * - `loading`: the answer for this set has not arrived.
 * - `error`: the request failed.
 * - `unavailable`: example mode. Its one horizon file says nothing about another site or height.
 * - `ready`: the server's answer.
 */
export type ModelsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unavailable' }
  | { status: 'ready'; models: HorizonModels };

/** Outcome of one request, tagged with the set it was made for. */
export interface ModelsAnswer {
  key: string;
  state: ModelsState;
}

/** Key of a scenario set: everything the horizon model depends on. */
export function modelsKey(scenarios: readonly Scenario[]): string {
  return JSON.stringify([getDataMode(), scenarios.map((s) => [s.scenario_id, locationOf(s), s.mast_height_m])]);
}

/**
 * Horizon model of every scenario, from the server. A scenario without a mast height is left
 * out: `/api/horizon` and `/api/compare` fill a missing height from different defaults, so its
 * model cannot be matched (PR #75 review). Never rejects; failures come back as `error`.
 */
export async function fetchHorizonModels(scenarios: readonly Scenario[]): Promise<ModelsAnswer> {
  const key = modelsKey(scenarios);
  if (getDataMode() === 'examples') return { key, state: { status: 'unavailable' } };
  try {
    const known = scenarios.filter((s): s is Scenario & { mast_height_m: number } => s.mast_height_m !== null);
    const entries = await Promise.all(known.map(async (s) => [s.scenario_id, await methodAt(locationOf(s), s.mast_height_m)] as const));
    return { key, state: { status: 'ready', models: Object.fromEntries(entries) } };
  } catch {
    return { key, state: { status: 'error' } };
  }
}

/**
 * State for the set on screen. An answer for another set (the previous one, before the new
 * request starts) counts as loading, so an old model never sticks to a new result.
 */
export function modelsState(answer: ModelsAnswer | undefined, key: string): ModelsState {
  return answer && answer.key === key ? answer.state : { status: 'loading' };
}

/** Horizon method per mast height at one place, for the setup; same four states. */
export type MastModelsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'unavailable' }
  | { status: 'ready'; methods: Readonly<Record<number, HorizonMethod>> };

export interface MastModelsAnswer {
  key: string;
  state: MastModelsState;
}

export function mastModelsKey(location: LocationParams | null, heights: readonly number[]): string {
  return JSON.stringify([getDataMode(), location, heights]);
}

/** The horizon model the server uses at this place for each mast height offered. */
export async function fetchMastModels(location: LocationParams, heights: readonly number[]): Promise<MastModelsAnswer> {
  const key = mastModelsKey(location, heights);
  if (getDataMode() === 'examples') return { key, state: { status: 'unavailable' } };
  try {
    const entries = await Promise.all(heights.map(async (h) => [h, await methodAt(location, h)] as const));
    return { key, state: { status: 'ready', methods: Object.fromEntries(entries) } };
  } catch {
    return { key, state: { status: 'error' } };
  }
}

export function mastModelsState(answer: MastModelsAnswer | undefined, key: string): MastModelsState {
  return answer && answer.key === key ? answer.state : { status: 'loading' };
}

export interface ModelSide {
  /** Scenario letter or name. */
  name: string;
  scenarioId: string;
  /** Reliability label of the scenario's compare result, when there is one. */
  validity?: Validity | undefined;
}

export type ModelMix =
  /** Every model is known and they are the same. Only then may a difference be tied to an input. */
  | { kind: 'same' }
  /** The server reported different horizon models. */
  | { kind: 'horizon'; text: string }
  /** Same horizon model, but different reliability labels: still not computed the same way. */
  | { kind: 'validity'; text: string }
  /** At least one model is not known. */
  | { kind: 'unknown'; reason: 'loading' | 'error' | 'unavailable' };

/**
 * Whether the scenarios are a like-for-like comparison. Different horizon models are reported
 * as soon as two known models differ. If any model is missing the answer is `unknown`, never
 * `same`: equal reliability labels do not show equal horizon models.
 */
export function modelMix(sides: readonly ModelSide[], state: ModelsState): ModelMix {
  const models = state.status === 'ready' ? state.models : {};
  const known = sides.filter((s) => models[s.scenarioId] !== undefined);
  if (new Set(known.map((s) => models[s.scenarioId])).size > 1) {
    return { kind: 'horizon', text: known.map((s) => `${s.name}: ${HORIZON_MODEL_LABEL[models[s.scenarioId]!]}`).join(', ') };
  }
  if (known.length < sides.length) {
    return { kind: 'unknown', reason: state.status === 'ready' ? 'error' : state.status };
  }
  const labelled = sides.filter((s) => s.validity !== undefined);
  if (new Set(labelled.map((s) => s.validity)).size > 1) {
    return { kind: 'validity', text: labelled.map((s) => `${s.name}: ${VALIDITY_LABEL[s.validity!]}`).join(', ') };
  }
  return { kind: 'same' };
}

const UNKNOWN_TEXT: Record<'loading' | 'error' | 'unavailable', string> = {
  loading: 'Checking which horizon model each scenario uses…',
  error: 'The horizon model of these scenarios could not be read, so a difference between them is not tied to the mast height, the date or the site.',
  unavailable:
    'The example data does not say which horizon model a scenario uses, so a difference between them is not tied to the mast height, the date or the site. Add ?data=live to the address to read it from the server.',
};

/** Note shown above a comparison that is not known to be like for like; `null` when it is. */
export function mixWarning(mix: ModelMix): string | null {
  if (mix.kind === 'same') return null;
  if (mix.kind === 'horizon') {
    return `These scenarios were computed with different horizon models (${mix.text}). A difference between them mixes the inputs with the horizon model, so it does not show the effect of the mast height, the date or the site alone. ${TERRAIN_RULE_TEXT}`;
  }
  if (mix.kind === 'validity') {
    return `These scenarios carry different reliability labels (${mix.text}), so they were not computed the same way. A difference between them does not show the effect of one input alone.`;
  }
  return UNKNOWN_TEXT[mix.reason];
}

/** Whether the note is a warning (a known mismatch or a failure) or only a status line. */
export function mixIsWarning(mix: ModelMix): boolean {
  return mix.kind === 'horizon' || mix.kind === 'validity' || (mix.kind === 'unknown' && mix.reason === 'error');
}

/** Sentence for different reliability labels among compared results; `null` when they agree. */
export function validityNote(sides: readonly ModelSide[]): string | null {
  const labelled = sides.filter((s) => s.validity !== undefined);
  if (new Set(labelled.map((s) => s.validity)).size < 2) return null;
  const text = labelled.map((s) => `${s.name}: ${VALIDITY_LABEL[s.validity!]}`).join(', ');
  return `These scenarios carry different reliability labels (${text}), so they were not computed the same way. A difference between them does not show the effect of one input alone.`;
}
