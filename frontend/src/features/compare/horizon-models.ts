/**
 * Which horizon model each compared scenario was computed with (issue #71).
 *
 * The terrain horizon exists only for 2 m and 10 m masts at sites with an elevation map; any
 * other height, 0 m included, uses the flat horizon and is labelled `SYNTHETIC` (ADR-0003,
 * "Direk yüksekliği kuralı"). Two scenarios with different models are not a like-for-like
 * comparison: at Mons Mouton the flat horizon at 0 m gives more sunlight than the terrain
 * horizon at 2 m, and that gap is the model, not the mast (#48 walkthrough).
 *
 * The model is read from the server (`/api/horizon`, field `method`), never guessed here.
 */

import { getHorizon } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { HorizonMethod, Scenario, Validity } from '../../api/types';
import { TERRAIN_MAST_HEIGHTS, locationWithMast } from '../../state/scenario-tools';
import { VALIDITY_LABEL } from '../../ui/ValidityBadge';

export interface HorizonModel {
  method: HorizonMethod;
  validity: Validity;
}

/** Horizon model by `scenario_id`; a scenario is missing when its model is not known. */
export type HorizonModels = Readonly<Record<string, HorizonModel>>;

export const HORIZON_MODEL_LABEL: Record<HorizonMethod, string> = {
  terrain: 'terrain horizon',
  sphere: 'flat horizon',
};

/** "2 m and 10 m", from the heights that have terrain horizons. */
export const TERRAIN_HEIGHTS_TEXT = TERRAIN_MAST_HEIGHTS.map((h) => `${h} m`).join(' and ');

/** Said wherever mast heights are chosen or compared. */
export const TERRAIN_RULE_TEXT = `Terrain horizons exist only for ${TERRAIN_HEIGHTS_TEXT} masts, at sites with an elevation map. Every other height uses a flat horizon, labelled Assumed.`;

const cache = new Map<string, Promise<HorizonModel>>();

/** One request per location and mast height, shared by the panels; no abort signal for that reason. */
function modelOf(scenario: Scenario): Promise<HorizonModel> {
  const params = locationWithMast(scenario);
  const key = JSON.stringify(params);
  const cached = cache.get(key);
  if (cached) return cached;
  const request = getHorizon(params).then((h) => ({ method: h.method, validity: h.validity }));
  cache.set(key, request);
  request.catch(() => cache.delete(key));
  return request;
}

/**
 * Horizon model of every scenario, from the server. Example mode answers every request with one
 * file (data/examples/horizon.json), which says nothing about another site or height, so no
 * model is reported there and callers fall back to the reliability labels.
 */
export async function fetchHorizonModels(scenarios: readonly Scenario[]): Promise<HorizonModels> {
  if (getDataMode() === 'examples') return {};
  const entries = await Promise.all(scenarios.map(async (s) => [s.scenario_id, await modelOf(s)] as const));
  return Object.fromEntries(entries);
}

/** Empties the cache. Used by tests. */
export function clearHorizonModelCache(): void {
  cache.clear();
}

export interface ModelSide {
  /** Scenario letter or name. */
  name: string;
  model: HorizonModel | undefined;
  /** Reliability label of the scenario's compare result. */
  validity: Validity | undefined;
}

export type ModelMix =
  | { kind: 'same' }
  /** The server reported different horizon models. */
  | { kind: 'horizon'; text: string }
  /** Models are not known, but the reliability labels differ. */
  | { kind: 'validity'; text: string };

function list(parts: readonly string[]): string {
  return parts.join(', ');
}

/**
 * Whether the scenarios are a like-for-like comparison. Different horizon models, or different
 * reliability labels when the models are not known, mean a difference between them cannot be
 * tied to one input.
 */
export function modelMix(sides: readonly ModelSide[]): ModelMix {
  const methods = new Set(sides.map((s) => s.model?.method).filter((m): m is HorizonMethod => m !== undefined));
  if (methods.size > 1) {
    return {
      kind: 'horizon',
      text: list(sides.filter((s) => s.model).map((s) => `${s.name}: ${HORIZON_MODEL_LABEL[s.model!.method]}`)),
    };
  }
  const validities = new Set(sides.map((s) => s.validity).filter((v): v is Validity => v !== undefined));
  if (validities.size > 1) {
    return { kind: 'validity', text: list(sides.filter((s) => s.validity).map((s) => `${s.name}: ${VALIDITY_LABEL[s.validity!]}`)) };
  }
  return { kind: 'same' };
}

/** Warning shown above a comparison whose scenarios are not like for like; `null` when they are. */
export function mixWarning(mix: ModelMix): string | null {
  if (mix.kind === 'horizon') {
    return `These scenarios were computed with different horizon models (${mix.text}). A difference between them mixes the inputs with the horizon model, so it does not show the effect of the mast height, the date or the site alone. ${TERRAIN_RULE_TEXT}`;
  }
  if (mix.kind === 'validity') {
    return `These scenarios carry different reliability labels (${mix.text}), so they were not computed the same way, for example terrain against flat horizon. A difference between them does not show the effect of one input alone. ${TERRAIN_RULE_TEXT}`;
  }
  return null;
}
