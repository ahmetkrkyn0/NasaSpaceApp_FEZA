/**
 * Past missions (UC-13; docs/design/gecmis-gorev-vakalari.md, docs/design/athena-demosu.md).
 *
 * A case is a site, a landing moment and facts with an evidence level. Picking one loads the
 * site and the moment; the angles at that moment are computed by the server like any scenario.
 * A cause of a failure is never derived here: facts are shown as the source states them, with
 * the evidence label next to them (PLAN 4.1, rule 8).
 */

import { recordingIndex } from '../../api/recorded';
import type { EvidenceLevel, ReferenceMission, Scenario, Site } from '../../api/types';
import { DEFAULT_PANEL_PROFILE_ID, buildScenario } from '../../state/scenario-tools';

/** Labels from the design document, section 4 ("Kanıt düzeyi etiketi"). */
export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  official: 'Official report',
  preliminary: 'Preliminary',
  commentary: 'Commentary',
};

export const EVIDENCE_DESCRIPTION: Record<EvidenceLevel, string> = {
  official: 'Published by the agency or company, or by an official review.',
  preliminary: 'Early statement by the agency or company; not a final finding.',
  commentary: 'Comment by a third party.',
};

/** Closing sentence of the Athena case (docs/design/athena-demosu.md, step 6). */
export const ATHENA_CLOSING =
  'We do not claim to explain why a mission failed. We show how the sky differs between sites and dates.';

export const ATHENA_ID = 'im2-athena';
export const BLUE_GHOST_ID = 'blue-ghost-1';

/**
 * Scenario length after the landing. The demo uses one month (docs/design/athena-demosu.md,
 * section 5), the length the relay label needs to say anything (docs/design/role-etiketi.md).
 */
export const CASE_DAYS = 30;

/**
 * The scenario a case opens: its site from the landing moment on, at ground level (0 m), which
 * is how the reference angles were computed (docs/design/gecmis-gorev-vakalari.md, section 4).
 */
export function missionScenario(mission: ReferenceMission, sites: readonly Pick<Site, 'id' | 'name'>[]): Scenario {
  const site = sites.find((s) => s.id === mission.site_id) ?? { id: mission.site_id, name: mission.mission };
  return buildScenario(
    {
      place: { kind: 'site', site },
      start_utc: mission.landing_utc,
      days: CASE_DAYS,
      mast_height_m: 0,
      panel_profile_id: DEFAULT_PANEL_PROFILE_ID,
    },
    `${mission.mission}, landing`,
  );
}

/**
 * Whether the recorded server answers (data/examples/recorded/index.json) cover this scenario:
 * its place is recorded and its period and mast are the recorded ones. Example mode shows a
 * case's own numbers only then; otherwise the panels fall back to general examples.
 */
export function caseRecorded(scenario: Scenario): boolean {
  return (
    recordingIndex.places.some((p) => p.id === scenario.site_id) &&
    Date.parse(scenario.start_utc) === Date.parse(recordingIndex.start_utc) &&
    Date.parse(scenario.end_utc) === Date.parse(recordingIndex.end_utc) &&
    scenario.mast_height_m === recordingIndex.mast_height_m
  );
}

/**
 * The Athena demo: Athena first, Blue Ghost 1 second, both from their landing moments
 * (docs/design/athena-demosu.md, sections 4 and 5). `null` when either case is missing.
 */
export function demoScenarios(missions: readonly ReferenceMission[], sites: readonly Pick<Site, 'id' | 'name'>[]): [Scenario, Scenario] | null {
  const athena = missions.find((m) => m.id === ATHENA_ID);
  const blueGhost = missions.find((m) => m.id === BLUE_GHOST_ID);
  if (!athena || !blueGhost) return null;
  return [missionScenario(athena, sites), missionScenario(blueGhost, sites)];
}

/** The mission whose site and landing moment the active scenario has, if any. */
export function activeMission(missions: readonly ReferenceMission[], active: Scenario | null): ReferenceMission | null {
  if (!active) return null;
  return missions.find((m) => m.site_id === active.site_id && m.landing_utc === active.start_utc) ?? null;
}
