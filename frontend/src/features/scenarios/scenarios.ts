import content from '../../content/scenarios.json';
import { recordingIndex } from '../../api/recorded';
import type { Scenario } from '../../api/types';
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
