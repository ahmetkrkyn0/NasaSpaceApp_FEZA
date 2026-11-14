import { describe, expect, it } from 'vitest';
import {
  COMPARE_METRICS,
  bestScenarioId,
  displayDifference,
  displayNumber,
  displayText,
  displayWithUnit,
  exampleCompareResponse,
} from './compare-metrics';
import { compareExample } from './examples';
import type { Scenario } from './types';

const metric = (key: string) => COMPARE_METRICS.find((m) => m.key === key)!;

describe('metric display', () => {
  it('lists the six metrics of the comparison design, each with a direction', () => {
    expect(COMPARE_METRICS.map((m) => [m.key, m.better])).toEqual([
      ['sunlit_fraction', 'higher'],
      ['longest_dark_hours', 'lower'],
      ['max_sun_elevation_deg', 'higher'],
      ['earth_visible_fraction', 'higher'],
      ['longest_earth_hidden_hours', 'lower'],
      ['mean_power_w', 'higher'],
    ]);
  });

  it('shows fractions in percent and keeps fixed decimals', () => {
    expect(displayNumber(metric('earth_visible_fraction'), 0.723)).toBe(72.3);
    expect(displayText(metric('earth_visible_fraction'), 0.723)).toBe('72.3');
    expect(displayWithUnit(metric('max_sun_elevation_deg'), 6.47)).toBe('6.47°');
    expect(displayWithUnit(metric('longest_earth_hidden_hours'), 186.63)).toBe('186.6 h');
    expect(displayWithUnit(metric('mean_power_w'), null)).toBe('—');
    expect(displayText(metric('mean_power_w'), null)).toBe('');
  });

  it('subtracts shown values only when both are known', () => {
    expect(displayDifference(metric('longest_dark_hours'), 280, 232)).toBe(48);
    expect(displayDifference(metric('sunlit_fraction'), 0.5, null)).toBeNull();
  });

  it('picks the best by direction and refuses ties or single values', () => {
    expect(bestScenarioId(metric('max_sun_elevation_deg'), { a: 6.47, b: 11.4 })).toBe('b');
    expect(bestScenarioId(metric('longest_dark_hours'), { a: 280, b: 232, c: null })).toBe('b');
    expect(bestScenarioId(metric('longest_dark_hours'), { a: 280, b: 280 })).toBeNull();
    expect(bestScenarioId(metric('longest_dark_hours'), { a: 280, b: null })).toBeNull();
  });
});

describe('example-mode comparison', () => {
  const a = compareExample.scenarios[0]!.scenario;

  it('answers for the scenarios sent, in order, with their ids', () => {
    const other: Scenario = { ...a, scenario_id: 'x', label: 'Other', start_utc: '2026-12-06T00:00:00Z', end_utc: '2027-01-05T00:00:00Z' };
    const response = exampleCompareResponse([other, { ...a, scenario_id: 'mine', label: 'Mine' }], compareExample);
    expect(response.scenarios.map((r) => r.scenario.scenario_id)).toEqual(['x', 'mine']);
  });

  it('uses the example metrics only for a scenario that asks the same question', () => {
    const same = { ...a, scenario_id: 'mine', label: 'Mine', earth_criterion: undefined };
    const response = exampleCompareResponse([same], compareExample);
    expect(response.scenarios[0]!.metrics.earth_visible_fraction).toBe(0.723);
    expect(response.scenarios[0]!.metrics.max_sun_elevation_deg).toBe(6.47);
  });

  it('never invents numbers: any other scenario gets null metrics and Assumed', () => {
    const otherMast: Scenario = { ...a, scenario_id: 'm2', mast_height_m: 2 };
    const result = exampleCompareResponse([otherMast], compareExample).scenarios[0]!;
    expect(Object.values(result.metrics).every((v) => v === null)).toBe(true);
    expect(result.validity).toBe('SYNTHETIC');
  });

  it('gives one delta per metric with the contract unit names', () => {
    const response = exampleCompareResponse([a], compareExample);
    expect(response.deltas.map((d) => [d.metric, d.unit])).toEqual([
      ['sunlit_fraction', 'fraction'],
      ['longest_dark_hours', 'hours'],
      ['max_sun_elevation_deg', 'deg'],
      ['earth_visible_fraction', 'fraction'],
      ['longest_earth_hidden_hours', 'hours'],
      ['mean_power_w', 'W'],
    ]);
  });
});
