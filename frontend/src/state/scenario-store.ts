/**
 * Scenario state shared by the panels: the active scenario, the selected moment and the
 * comparison list (at most four, the `/api/compare` limit).
 *
 * A tiny external store with no framework dependency. `getState` returns the same object until
 * something changes, and every change makes a new object, so the shell's `useStore(store,
 * selector)` hook can subscribe to it directly. The address-bar sync lives in url-sync.ts.
 */

import { MAX_COMPARE_SCENARIOS, type Scenario, type UtcString } from '../api/types';

export interface ScenarioState {
  /** Scenario being set up or analysed; `null` before the user picks one. */
  active: Scenario | null;
  /** Moment shown by the sky view, timeline and countdown. */
  selected_utc: UtcString | null;
  /** Scenarios on the Compare tab, in the order they were added. */
  compare: Scenario[];
}

export type Listener = (state: ScenarioState) => void;

export type AddToCompareResult = 'added' | 'replaced' | 'full';

export interface ScenarioStore {
  getState(): ScenarioState;
  /** Returns a function that removes the listener. */
  subscribe(listener: Listener): () => void;
  setScenario(scenario: Scenario | null): void;
  setSelectedUtc(utc: UtcString | null): void;
  /**
   * Adds a scenario to the comparison list. A scenario with the same `scenario_id` replaces
   * the old entry in place. A fifth distinct scenario is refused with `'full'`.
   */
  addToCompare(scenario: Scenario): AddToCompareResult;
  removeFromCompare(scenarioId: string): void;
  /** Replaces the whole state at once, for example when reading the address bar. */
  replaceState(next: ScenarioState): void;
}

export const MAX_COMPARE = MAX_COMPARE_SCENARIOS;

export const EMPTY_SCENARIO_STATE: ScenarioState = { active: null, selected_utc: null, compare: [] };

/**
 * Drops optional fields that carry no value (`fixed_azimuth_deg: null`, missing
 * `earth_criterion`), so a scenario compares equal before and after a trip through the URL.
 */
export function normalizeScenario(scenario: Scenario): Scenario {
  const { fixed_azimuth_deg, earth_criterion, ...required } = scenario;
  const out: Scenario = { ...required };
  if (fixed_azimuth_deg !== undefined && fixed_azimuth_deg !== null) out.fixed_azimuth_deg = fixed_azimuth_deg;
  if (earth_criterion !== undefined) out.earth_criterion = earth_criterion;
  return out;
}

function normalizeState(state: ScenarioState): ScenarioState {
  const seen = new Set<string>();
  const compare: Scenario[] = [];
  for (const s of state.compare) {
    if (seen.has(s.scenario_id) || compare.length >= MAX_COMPARE) continue;
    seen.add(s.scenario_id);
    compare.push(normalizeScenario(s));
  }
  return {
    active: state.active ? normalizeScenario(state.active) : null,
    selected_utc: state.selected_utc,
    compare,
  };
}

export function createScenarioStore(initial: ScenarioState = EMPTY_SCENARIO_STATE): ScenarioStore {
  let state = normalizeState(initial);
  const listeners = new Set<Listener>();

  function commit(next: ScenarioState): void {
    state = next;
    for (const listener of [...listeners]) listener(state);
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setScenario(scenario) {
      commit({ ...state, active: scenario ? normalizeScenario(scenario) : null });
    },
    setSelectedUtc(utc) {
      if (utc === state.selected_utc) return;
      commit({ ...state, selected_utc: utc });
    },
    addToCompare(scenario) {
      const entry = normalizeScenario(scenario);
      const index = state.compare.findIndex((s) => s.scenario_id === entry.scenario_id);
      if (index >= 0) {
        const compare = state.compare.slice();
        compare[index] = entry;
        commit({ ...state, compare });
        return 'replaced';
      }
      if (state.compare.length >= MAX_COMPARE) return 'full';
      commit({ ...state, compare: [...state.compare, entry] });
      return 'added';
    },
    removeFromCompare(scenarioId) {
      if (!state.compare.some((s) => s.scenario_id === scenarioId)) return;
      commit({ ...state, compare: state.compare.filter((s) => s.scenario_id !== scenarioId) });
    },
    replaceState(next) {
      commit(normalizeState(next));
    },
  };
}

/** The store the app uses. Tests create their own with `createScenarioStore`. */
export const scenarioStore = createScenarioStore();
