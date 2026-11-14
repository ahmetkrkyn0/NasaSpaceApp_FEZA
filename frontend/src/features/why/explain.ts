/**
 * "Why" cards (UC-09; docs/design/karsilastirma-ve-aciklama.md, "Neden kartları").
 *
 * Rules the cards follow:
 * 1. A card says only what the server computed. Texts come from content/why-cards.json and hold
 *    no numbers; every number is a value of a `/api/compare` answer.
 * 2. The Plan level ties a difference to one input with a counterfactual: scenario A is copied
 *    with a single input taken from B and the copy is computed by the server next to A.
 * The only arithmetic here is subtracting two server values and converting a fraction of the
 * period to hours (docs/PLAN.md, section 4.1, rule 2).
 */

import content from '../../content/why-cards.json';
import { postCompare, type RequestOptions } from '../../api/client';
import { COMPARE_METRICS, displayDifference, displayWithUnit, type MetricDef } from '../../api/compare-metrics';
import {
  DEFAULT_EARTH_CRITERION,
  MAX_COMPARE_SCENARIOS,
  type CompareMetricName,
  type CompareResponse,
  type CompareScenarioResult,
  type Scenario,
} from '../../api/types';

export const WHY_LEVELS = ['explore', 'classroom', 'plan'] as const;
export type WhyLevel = (typeof WHY_LEVELS)[number];

/** Inputs a counterfactual can change, in the order the cards list them. */
export const INPUTS = ['date', 'place', 'mast', 'panel', 'criterion'] as const;
export type InputName = (typeof INPUTS)[number];

export const INPUT_LABEL: Record<InputName, string> = content.inputs;

type MetricText = { explore: string; classroom: string; related: string };
const METRIC_TEXT = content.metrics as Record<CompareMetricName, MetricText>;
const COMMON = content.common;

/** The scenario fields each input covers. */
const INPUT_FIELDS: Record<InputName, readonly (keyof Scenario)[]> = {
  date: ['start_utc', 'end_utc'],
  place: ['site_id', 'lat_deg', 'lon_deg'],
  mast: ['mast_height_m'],
  panel: ['panel_profile_id', 'fixed_azimuth_deg'],
  criterion: ['earth_criterion'],
};

/** Field value with the contract defaults applied, so a missing optional field equals its default. */
function fieldValue(s: Scenario, field: keyof Scenario): unknown {
  if (field === 'fixed_azimuth_deg') return s.fixed_azimuth_deg ?? null;
  if (field === 'earth_criterion') return s.earth_criterion ?? DEFAULT_EARTH_CRITERION;
  return s[field];
}

/** Inputs whose values differ between two scenarios. */
export function differingInputs(a: Scenario, b: Scenario): InputName[] {
  return INPUTS.filter((input) => INPUT_FIELDS[input].some((field) => fieldValue(a, field) !== fieldValue(b, field)));
}

/** Scenario letter as shown in the Compare table: A, B, C, D. */
export function letter(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Copy of `a` with one input taken from `b`; its id is distinct from `a` and from the other copies. */
export function withInputFrom(a: Scenario, b: Scenario, input: InputName, bLetter = 'B'): Scenario {
  const next: Scenario = { ...a };
  for (const field of INPUT_FIELDS[input]) {
    const value = b[field];
    if (value === undefined) delete (next as Partial<Scenario>)[field];
    else (next as unknown as Record<string, unknown>)[field] = value;
  }
  next.scenario_id = `${a.scenario_id}-with-${input}`;
  next.label = `${a.label}, ${INPUT_LABEL[input]} of ${bLetter}`;
  return next;
}

/**
 * The `/api/compare` bodies for the counterfactuals of a pair: A followed by at most three copies,
 * so every body holds 2 to 4 scenarios (ADR-0004). No request when fewer than two inputs differ:
 * with one input the whole difference already belongs to it.
 */
export function counterfactualRequests(a: Scenario, b: Scenario, bLetter = 'B'): Scenario[][] {
  const inputs = differingInputs(a, b);
  if (inputs.length < 2) return [];
  const copies = inputs.map((input) => withInputFrom(a, b, input, bLetter));
  const perRequest = MAX_COMPARE_SCENARIOS - 1;
  const requests: Scenario[][] = [];
  for (let i = 0; i < copies.length; i += perRequest) requests.push([a, ...copies.slice(i, i + perRequest)]);
  return requests;
}

export interface Counterfactual {
  input: InputName;
  scenario: Scenario;
  /** Server answer for the copy; `undefined` if the answer did not include it. */
  result: CompareScenarioResult | undefined;
}

/** Runs the counterfactual requests of a pair and returns one entry per differing input. */
export async function fetchCounterfactuals(
  a: Scenario,
  b: Scenario,
  bLetter = 'B',
  post: (body: { scenarios: Scenario[] }, options?: RequestOptions) => Promise<CompareResponse> = postCompare,
  options?: RequestOptions,
): Promise<Counterfactual[]> {
  const requests = counterfactualRequests(a, b, bLetter);
  const answers = await Promise.all(requests.map((scenarios) => post({ scenarios }, options)));
  const byId = new Map(answers.flatMap((answer) => answer.scenarios.map((r) => [r.scenario.scenario_id, r] as const)));
  return requests
    .flatMap((scenarios) => scenarios.slice(1))
    .map((scenario) => ({
      input: differingInputs(a, scenario)[0]!,
      scenario,
      result: byId.get(scenario.scenario_id),
    }));
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function metricDef(key: CompareMetricName): MetricDef {
  return COMPARE_METRICS.find((m) => m.key === key)!;
}

/** The metric shown next to this one at the Classroom level. */
export function relatedMetric(def: MetricDef): MetricDef {
  return metricDef(METRIC_TEXT[def.key].related as CompareMetricName);
}

/** Classroom text: what the number measures, as the server computes it. */
export function classroomText(def: MetricDef): string {
  return METRIC_TEXT[def.key].classroom;
}

export interface Named {
  /** For example "A (Mons Mouton, 2026-12-01)". */
  name: string;
  scenario: Scenario;
  value: number | null;
}

export type Comparison =
  | { kind: 'unknown' }
  | { kind: 'same' }
  | { kind: 'differs'; better: Named; worse: Named; amount: string };

/** Whole hours above ten, one decimal down to 0.1 h, minutes below that, so a gap is never shown as zero. */
export function hoursText(hours: number): string {
  if (hours >= 10) return `${Math.round(hours)} hours`;
  if (hours >= 0.1) return `${hours.toFixed(1)} hours`;
  const minutes = Math.round(hours * 60);
  return minutes >= 1 ? `${minutes} minutes` : 'less than a minute';
}

/** Length of the scenario period in milliseconds, from its start and end instants. */
function periodMs(s: Scenario): number {
  return Date.parse(s.end_utc) - Date.parse(s.start_utc);
}

/**
 * How far apart two values are, in words. A fraction becomes hours when both periods have the
 * same length (unit conversion); otherwise it stays in percentage points.
 */
export function compareValues(def: MetricDef, a: Named, b: Named): Comparison {
  const diff = displayDifference(def, b.value, a.value);
  if (diff === null || a.value === null || b.value === null) return { kind: 'unknown' };
  if (diff === 0) return { kind: 'same' };
  const bBetter = def.better === 'higher' ? diff > 0 : diff < 0;
  const [better, worse] = bBetter ? [b, a] : [a, b];
  let amount: string;
  if (def.percent) {
    // Hours only when both periods are equally long, checked on the instants, not on rounded days.
    const ms = periodMs(a.scenario);
    amount =
      ms > 0 && ms === periodMs(b.scenario)
        ? hoursText((Math.abs(b.value - a.value) * ms) / 3_600_000)
        : `${Math.abs(diff).toFixed(def.decimals)} percentage points of the time`;
  } else {
    amount = displayWithUnit(def, Math.abs(diff));
  }
  return { kind: 'differs', better, worse, amount };
}

/** The one-sentence answer (Explore level, also the headline of the other levels). */
export function headline(def: MetricDef, a: Named, b: Named): string {
  const result = compareValues(def, a, b);
  if (result.kind === 'unknown') return fill(COMMON.unknown, { label: def.label });
  if (result.kind === 'same') return fill(COMMON.same, { a: a.name, b: b.name, label: def.label });
  return fill(METRIC_TEXT[def.key].explore, { better: result.better.name, worse: result.worse.name, amount: result.amount });
}

export interface PlanRow {
  label: string;
  /** Value text of the scenario in this row. */
  value: string;
  /** Signed difference from A in displayed units; `null` when unknown. */
  diff: number | null;
  validity: CompareScenarioResult['validity'] | null;
}

/** Plan level: the total difference, then one row per input changed alone. */
export function planRows(def: MetricDef, a: Named, b: Named, bLetter: string, counterfactuals: readonly Counterfactual[]): PlanRow[] {
  const rows: PlanRow[] = [
    { label: `${bLetter}: every input as in ${bLetter}`, value: displayWithUnit(def, b.value), diff: displayDifference(def, b.value, a.value), validity: null },
  ];
  for (const cf of counterfactuals) {
    const value = cf.result ? cf.result.metrics[def.key] : null;
    rows.push({
      label: `A with the ${INPUT_LABEL[cf.input]} of ${bLetter}`,
      value: displayWithUnit(def, value),
      diff: displayDifference(def, value, a.value),
      validity: cf.result?.validity ?? null,
    });
  }
  return rows;
}

/** Sentence above the Plan rows, or the reason there are no rows. */
export function planIntro(a: Scenario, b: Scenario, aName: string, bName: string): string {
  const inputs = differingInputs(a, b);
  if (inputs.length === 0) return fill(COMMON.same_inputs, { a: aName, b: bName });
  if (inputs.length === 1) return fill(COMMON.one_input, { a: aName, b: bName, input: INPUT_LABEL[inputs[0]!] });
  return fill(COMMON.counterfactual_intro, { a: aName, b: bName });
}

export const PLAN_NOTE = COMMON.counterfactual_note;
export const NONE_KNOWN = COMMON.none_known;

/** Result of one scenario in a compare answer. */
export function resultFor(response: CompareResponse, scenarioId: string): CompareScenarioResult | undefined {
  return response.scenarios.find((r) => r.scenario.scenario_id === scenarioId);
}
