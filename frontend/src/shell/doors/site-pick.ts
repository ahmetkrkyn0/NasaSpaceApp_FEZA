/**
 * Site choice for the Explore and Classroom doors (scenario S-03, step 1: "picks Mons Mouton
 * from the list"). These doors have no setup panel, so a pick either moves the active scenario
 * to the new site with the same dates and settings, or, with no scenario yet, starts one with
 * the setup panel's defaults.
 */

import type { Scenario, Site, UtcString } from '../../api/types';
import type { ScenarioStore } from '../../state/scenario-store';
import {
  DEFAULT_DURATION_DAYS,
  DEFAULT_MAST_HEIGHT_M,
  DEFAULT_PANEL_PROFILE_ID,
  buildScenario,
  sameDateAnotherSite,
} from '../../state/scenario-tools';

const MS_PER_DAY = 86_400_000;

/** Today at 00:00 UTC, the start of a scenario picked without one. */
export function todayUtc(nowMs: number): UtcString {
  return new Date(Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY).toISOString().replace('.000Z', 'Z');
}

/**
 * The scenario after picking `site`: the active one moved to the site (dates, mast, panel and
 * criterion kept), or a new one from today with the default length, mast and panel.
 */
export function scenarioForPick(active: Scenario | null, site: Site, sites: readonly Site[], nowMs: number): Scenario {
  if (active) return sameDateAnotherSite(active, site, sites);
  return buildScenario({
    place: { kind: 'site', site },
    start_utc: todayUtc(nowMs),
    days: DEFAULT_DURATION_DAYS,
    mast_height_m: DEFAULT_MAST_HEIGHT_M,
    panel_profile_id: DEFAULT_PANEL_PROFILE_ID,
  });
}

/**
 * Applies a pick to the store. A new scenario starts with the selected moment at its start, so
 * a moment left in the address bar from an earlier link cannot fall outside the new range; a
 * moved scenario keeps its moment, since its dates do not change.
 */
export function applyPick(store: Pick<ScenarioStore, 'getState' | 'setScenario' | 'setSelectedUtc'>, site: Site, sites: readonly Site[], nowMs: number): Scenario {
  const active = store.getState().active;
  const next = scenarioForPick(active, site, sites, nowMs);
  store.setScenario(next);
  if (!active) store.setSelectedUtc(next.start_utc);
  return next;
}

/** Select value for the active scenario: its site id, or a marker for a custom point. */
export const CUSTOM_POINT = '__custom__';

export function pickerValue(active: Scenario | null): string {
  if (!active) return '';
  return active.site_id ?? CUSTOM_POINT;
}
