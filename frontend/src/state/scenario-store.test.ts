import { describe, expect, it } from 'vitest';
import type { Scenario } from '../api/types';
import { MAX_COMPARE, createScenarioStore, normalizeScenario } from './scenario-store';

function scenario(id: string, overrides: Partial<Scenario> = {}): Scenario {
  return {
    scenario_id: id,
    label: id,
    site_id: 'mons-mouton-im2-target',
    lat_deg: null,
    lon_deg: null,
    start_utc: '2026-12-01T00:00:00Z',
    end_utc: '2026-12-31T00:00:00Z',
    mast_height_m: 0,
    panel_profile_id: 'vertical_tracking',
    ...overrides,
  };
}

describe('scenario store', () => {
  it('starts empty', () => {
    expect(createScenarioStore().getState()).toEqual({ active: null, selected_utc: null, compare: [] });
  });

  it('refuses a fifth scenario and keeps the list at four', () => {
    const store = createScenarioStore();
    for (const id of ['a', 'b', 'c', 'd']) expect(store.addToCompare(scenario(id))).toBe('added');
    expect(store.addToCompare(scenario('e'))).toBe('full');
    expect(store.getState().compare).toHaveLength(MAX_COMPARE);
    expect(store.getState().compare.map((s) => s.scenario_id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('replaces a scenario with the same id in place, even when the list is full', () => {
    const store = createScenarioStore();
    for (const id of ['a', 'b', 'c', 'd']) store.addToCompare(scenario(id));
    expect(store.addToCompare(scenario('b', { label: 'B, later' }))).toBe('replaced');
    expect(store.getState().compare[1]?.label).toBe('B, later');
    expect(store.getState().compare).toHaveLength(4);
  });

  it('removes a scenario by id', () => {
    const store = createScenarioStore();
    store.addToCompare(scenario('a'));
    store.addToCompare(scenario('b'));
    store.removeFromCompare('a');
    expect(store.getState().compare.map((s) => s.scenario_id)).toEqual(['b']);
  });

  it('publishes a new state object on every change and skips no-op updates', () => {
    const store = createScenarioStore();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    const before = store.getState();
    store.setSelectedUtc('2026-12-05T00:00:00Z');
    expect(store.getState()).not.toBe(before);
    store.setSelectedUtc('2026-12-05T00:00:00Z');
    store.removeFromCompare('missing');
    expect(calls).toBe(1);
    unsubscribe();
    store.setScenario(scenario('a'));
    expect(calls).toBe(1);
  });

  it('trims an oversized or duplicated list given to replaceState', () => {
    const store = createScenarioStore();
    store.replaceState({
      active: null,
      selected_utc: null,
      compare: ['a', 'a', 'b', 'c', 'd', 'e'].map((id) => scenario(id)),
    });
    expect(store.getState().compare.map((s) => s.scenario_id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('drops optional fields without a value', () => {
    expect(normalizeScenario(scenario('a', { fixed_azimuth_deg: null }))).not.toHaveProperty('fixed_azimuth_deg');
    expect(normalizeScenario(scenario('a', { fixed_azimuth_deg: 270, earth_criterion: 'full_disk' }))).toMatchObject({
      fixed_azimuth_deg: 270,
      earth_criterion: 'full_disk',
    });
  });
});
