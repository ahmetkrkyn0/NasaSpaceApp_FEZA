/**
 * The six comparison metrics (docs/design/karsilastirma-ve-aciklama.md, section 4), how they
 * are shown, and the example-mode stand-in for `POST /api/compare`.
 *
 * Display rules are shared by the Compare table and the CSV export, so a downloaded number is
 * the number on screen. The only arithmetic here is unit conversion (fraction to percent) and
 * rounding (docs/PLAN.md, section 4.1, rule 2).
 */

import type {
  CompareDelta,
  CompareMetricName,
  CompareMetrics,
  CompareResponse,
  CompareScenarioResult,
  Scenario,
  Validity,
} from './types';
import { DEFAULT_EARTH_CRITERION } from './types';

export interface MetricDef {
  key: CompareMetricName;
  /** Interface text. */
  label: string;
  /** Unit after conversion, as shown on screen and in CSV headers. */
  unit: string;
  /** Unit name used in the contract's `CompareDelta.unit`. */
  contractUnit: string;
  better: 'higher' | 'lower';
  /** Fraction metrics are shown in percent. */
  percent: boolean;
  decimals: number;
}

export const COMPARE_METRICS: readonly MetricDef[] = [
  { key: 'sunlit_fraction', label: 'Sunlit time', unit: '%', contractUnit: 'fraction', better: 'higher', percent: true, decimals: 1 },
  { key: 'longest_dark_hours', label: 'Longest dark', unit: 'h', contractUnit: 'hours', better: 'lower', percent: false, decimals: 1 },
  { key: 'max_sun_elevation_deg', label: 'Highest Sun', unit: '°', contractUnit: 'deg', better: 'higher', percent: false, decimals: 2 },
  { key: 'earth_visible_fraction', label: 'Earth in view', unit: '%', contractUnit: 'fraction', better: 'higher', percent: true, decimals: 1 },
  { key: 'longest_earth_hidden_hours', label: 'Longest Earth gap', unit: 'h', contractUnit: 'hours', better: 'lower', percent: false, decimals: 1 },
  { key: 'mean_power_w', label: 'Mean panel power', unit: 'W', contractUnit: 'W', better: 'higher', percent: false, decimals: 1 },
];

/** The metric value as shown: percent for fractions, rounded; `null` stays `null`. */
export function displayNumber(def: MetricDef, value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const shown = def.percent ? value * 100 : value;
  const factor = 10 ** def.decimals;
  return Math.round(shown * factor) / factor;
}

/** Text of a value without its unit, for tables and CSV: fixed decimals, `''` when unknown. */
export function displayText(def: MetricDef, value: number | null | undefined): string {
  const n = displayNumber(def, value);
  return n === null ? '' : n.toFixed(def.decimals);
}

/** Text of a value with its unit; an em dash when unknown. */
export function displayWithUnit(def: MetricDef, value: number | null | undefined): string {
  const text = displayText(def, value);
  if (text === '') return '—';
  return def.unit === '°' ? `${text}°` : `${text} ${def.unit}`;
}

/**
 * Difference of a value from the reference value, in displayed units. Both numbers come from the
 * server; this only subtracts the two shown values. `null` when either is unknown.
 */
export function displayDifference(def: MetricDef, value: number | null | undefined, reference: number | null | undefined): number | null {
  const a = displayNumber(def, value);
  const b = displayNumber(def, reference);
  if (a === null || b === null) return null;
  const factor = 10 ** def.decimals;
  return Math.round((a - b) * factor) / factor;
}

/** Scenario id with the best value, or `null` with fewer than two known values or a tie for best. */
export function bestScenarioId(def: MetricDef, values: Record<string, number | null>): string | null {
  const known = Object.entries(values).filter((entry): entry is [string, number] => entry[1] !== null);
  if (known.length < 2) return null;
  const sign = def.better === 'higher' ? 1 : -1;
  let best = known[0]!;
  let tie = false;
  for (const entry of known.slice(1)) {
    const d = sign * (entry[1] - best[1]);
    if (d > 0) {
      best = entry;
      tie = false;
    } else if (d === 0) {
      tie = true;
    }
  }
  return tie ? null : best[0];
}

const EMPTY_METRICS: CompareMetrics = {
  sunlit_fraction: null,
  longest_dark_hours: null,
  max_sun_elevation_deg: null,
  earth_visible_fraction: null,
  longest_earth_hidden_hours: null,
  mean_power_w: null,
};

/** Two scenarios ask the same question when everything but their id and label is the same. */
export function sameQuestion(a: Scenario, b: Scenario): boolean {
  return (
    a.site_id === b.site_id &&
    a.lat_deg === b.lat_deg &&
    a.lon_deg === b.lon_deg &&
    a.start_utc === b.start_utc &&
    a.end_utc === b.end_utc &&
    a.mast_height_m === b.mast_height_m &&
    a.panel_profile_id === b.panel_profile_id &&
    (a.fixed_azimuth_deg ?? null) === (b.fixed_azimuth_deg ?? null) &&
    (a.earth_criterion ?? DEFAULT_EARTH_CRITERION) === (b.earth_criterion ?? DEFAULT_EARTH_CRITERION)
  );
}

/**
 * Example-mode answer to `POST /api/compare` for the scenarios actually sent. A scenario that asks
 * the same question as one in the example file gets that file's metrics; any other scenario gets
 * `null` metrics and `SYNTHETIC`, never an invented number. The best scenario per metric follows
 * the direction in `COMPARE_METRICS`, as the server does.
 */
export function exampleCompareResponse(scenarios: readonly Scenario[], example: CompareResponse): CompareResponse {
  const results: CompareScenarioResult[] = scenarios.map((scenario) => {
    const match = example.scenarios.find((r) => sameQuestion(r.scenario, scenario));
    const validity: Validity = match ? match.validity : 'SYNTHETIC';
    return {
      scenario: structuredClone(scenario),
      metrics: match ? { ...match.metrics } : { ...EMPTY_METRICS },
      now: null,
      validity,
    };
  });
  const deltas: CompareDelta[] = COMPARE_METRICS.map((def) => {
    const values: Record<string, number | null> = {};
    for (const r of results) values[r.scenario.scenario_id] = r.metrics[def.key];
    return { metric: def.key, values, unit: def.contractUnit, best_scenario_id: bestScenarioId(def, values) };
  });
  return { scenarios: results, deltas };
}
