/**
 * Guided tasks of the Classroom door (docs/product/audience-strategy.md, section 3): a preset
 * state, a question and an explanation. The numbers a task shows are the server's answer for the
 * preset, fetched when the task opens; the content file holds none (PLAN F3-D1 acceptance).
 */

import content from '../../content/guided-tasks.json';
import { getEvents, type RequestOptions } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { EventList, EventMetrics, Scenario, Site } from '../../api/types';
import { DEFAULT_EARTH_CRITERION } from '../../api/types';
import { DEFAULT_PANEL_PROFILE_ID, buildScenario, dateToUtc, eventsRequest } from '../../state/scenario-tools';

export interface TaskSource {
  label: string;
  /** Validation file the row is in. */
  file: string;
  /** Row number in that file; the row is marked "doğrulandı". */
  row: string;
}

export interface GuidedTask {
  id: string;
  title: string;
  question: string;
  sites: string[];
  start_date: string;
  days: number;
  /** Values shown after the guess; all come from `/api/events`. */
  metrics: (keyof EventMetrics)[];
  explanation: string;
  /** Said under the answer table when the numbers answer a nearby question, not the one asked. */
  table_note?: string;
  sources: TaskSource[];
}

export const GUIDED_TASKS = content.tasks as GuidedTask[];

/**
 * The scenarios a task opens, one per site, all at ground level (0 m) with the default panel,
 * the setting of the verified example answers.
 */
export function taskScenarios(task: GuidedTask, sites: readonly Pick<Site, 'id' | 'name'>[]): Scenario[] {
  const start = dateToUtc(task.start_date);
  if (!start) throw new Error(`Guided task ${task.id} has an invalid start date.`);
  return task.sites.map((id) => {
    const site = sites.find((s) => s.id === id) ?? { id, name: id };
    return buildScenario({
      place: { kind: 'site', site },
      start_utc: start,
      days: task.days,
      mast_height_m: 0,
      panel_profile_id: DEFAULT_PANEL_PROFILE_ID,
    });
  });
}

/** The scenario state a task sets: first site active at its start; two or more sites go to the comparison. */
export function taskState(scenarios: readonly Scenario[]) {
  const [first] = scenarios;
  return {
    active: first ?? null,
    selected_utc: first?.start_utc ?? null,
    compare: scenarios.length > 1 ? [...scenarios] : [],
  };
}

export interface TaskAnswer {
  scenario: Scenario;
  /** `null` in example mode when the example file does not answer this scenario. */
  events: EventList | null;
}

/**
 * Whether `data/examples/events.json` answers this scenario. The file holds one condition only:
 * Mons Mouton test site, 1 to 31 December 2026, mast 0 m, criterion `center`
 * (data/examples/README.md). Example mode returns that file for any site, so its numbers are
 * shown only for that condition and never under another site's name.
 */
export function exampleAnswers(scenario: Scenario): boolean {
  return (
    scenario.site_id === 'mons-mouton-im2-target' &&
    scenario.start_utc === '2026-12-01T00:00:00Z' &&
    scenario.end_utc === '2026-12-31T00:00:00Z' &&
    scenario.mast_height_m === 0 &&
    (scenario.earth_criterion ?? DEFAULT_EARTH_CRITERION) === 'center'
  );
}

/** Server answers for every scenario of a task. */
export function fetchTaskAnswers(scenarios: readonly Scenario[], options?: RequestOptions): Promise<TaskAnswer[]> {
  const examples = getDataMode() === 'examples';
  return Promise.all(
    scenarios.map(async (scenario) => ({
      scenario,
      events: examples && !exampleAnswers(scenario) ? null : await getEvents(eventsRequest(scenario), options),
    })),
  );
}
