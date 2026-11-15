import content from '../../content/scenarios.json';
import { recordingIndex } from '../../api/recorded';
import { getEvents, getPower, postCompare } from '../../api/client';
import { MIN_COMPARE_SCENARIOS, type CompareMetrics, type Scenario } from '../../api/types';
import { eventsRequest, powerRequest } from '../../state/scenario-tools';
import { scenarioStore, type ScenarioStore } from '../../state/scenario-store';
import { uiStore, type Door, type UiStore } from '../../shell/ui-state';

export interface ResearchScenario {
  id: string;
  title: string;
  question: string;
  sites: string[];
  door: Door;
  view: '2d-sky';
  vehicle: string;
  communication: string;
  watch: string[];
  sources: { label: string; file: string; row: string; url?: string }[];
}

export const RESEARCH_SCENARIOS = content.scenarios as ResearchScenario[];

export function researchState(preset: ResearchScenario) {
  const scenarios: Scenario[] = preset.sites.map((site_id) => ({
    scenario_id: `research-${preset.id}-${site_id}`,
    label: recordingIndex.places.find((p) => p.id === site_id)?.name ?? site_id,
    site_id, lat_deg: null, lon_deg: null,
    start_utc: recordingIndex.start_utc, end_utc: recordingIndex.end_utc,
    mast_height_m: recordingIndex.mast_height_m,
    panel_profile_id: recordingIndex.panel_profile_id, earth_criterion: 'center',
  }));
  const first = scenarios[0];
  if (!first) throw new Error(`Research scenario ${preset.id} needs a site.`);
  return { active: first, selected_utc: first.start_utc, compare: scenarios.length > 1 ? scenarios : [] };
}

/** Both chosen doors use the 2D sky as their main stage; illustrations stay labelled. */
export function openResearchScenario(preset: ResearchScenario, store: ScenarioStore = scenarioStore, ui: UiStore = uiStore) {
  store.replaceState(researchState(preset));
  ui.setDoor(preset.door);
  ui.setTab(preset.sites.length > 1 ? 'compare' : 'sky');
}

export interface PresetRow {
  scenario: Scenario;
  metrics: CompareMetrics;
}

export interface PresetApi {
  postCompare: typeof postCompare;
  getEvents: typeof getEvents;
  getPower: typeof getPower;
}

const API: PresetApi = { postCompare, getEvents, getPower };

/**
 * Metrics for a preset. Two or more sites go through `/api/compare`; a single site does not,
 * since the server asks for at least two scenarios there (HTTP 422, #140). Its metrics come
 * from `/api/events` and `/api/power`, the same answers the compare endpoint is built from.
 */
export async function presetAnswer(scenarios: readonly Scenario[], options: { signal?: AbortSignal } = {}, api: PresetApi = API): Promise<PresetRow[]> {
  if (scenarios.length >= MIN_COMPARE_SCENARIOS) {
    const response = await api.postCompare({ scenarios: [...scenarios] }, options);
    return response.scenarios.map((r) => ({ scenario: r.scenario, metrics: r.metrics }));
  }
  const scenario = scenarios[0];
  if (!scenario) return [];
  const [events, power] = await Promise.all([api.getEvents(eventsRequest(scenario), options), api.getPower(powerRequest(scenario), options)]);
  return [{ scenario, metrics: { ...events.metrics, mean_power_w: power.summary.mean_power_w } }];
}
