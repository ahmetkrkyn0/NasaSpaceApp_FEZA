import { describe, expect, it } from 'vitest';
import { createScenarioStore } from '../../state/scenario-store';
import { createUiStore } from '../../shell/ui-state';
import { readScenarioParams, writeScenarioParams } from '../../state/url-sync';
import { RESEARCH_SCENARIOS, openResearchScenario, researchState } from './scenarios';
import { getEvents, postCompare } from '../../api/client';
import { recordingIndex } from '../../api/recorded';

describe('ready-made research scenarios', () => {
  it('opens every preset at its recorded site, dates, mast, panel, door and 2D sky view', () => {
    expect(RESEARCH_SCENARIOS).toHaveLength(5);
    for (const preset of RESEARCH_SCENARIOS) {
      const scenarios = createScenarioStore();
      const ui = createUiStore({ read: () => ({ search: '' }), replace: () => {} });
      openResearchScenario(preset, scenarios, ui);
      const state = scenarios.getState();
      expect(state).toEqual(researchState(preset));
      expect(state.active?.site_id).toBe(preset.sites[0]);
      expect(state.active?.start_utc).toBe(recordingIndex.start_utc);
      expect(state.active?.end_utc).toBe(recordingIndex.end_utc);
      expect(state.active?.mast_height_m).toBe(2);
      expect(state.active?.panel_profile_id).toBe('vertical_tracking');
      expect(ui.getState().door).toBe(preset.door);
      expect(preset.view).toBe('2d-sky');
      const url = writeScenarioParams(state, new URLSearchParams(`door=${preset.door}&view=${preset.view}`));
      expect(readScenarioParams(url)).toEqual(state);
      expect(url.get('view')).toBe('2d-sky');
    }
  });

  it('backs every question and observation with verified research and recorded answers', async () => {
    for (const preset of RESEARCH_SCENARIOS) {
      expect(preset.question.length).toBeGreaterThan(10);
      expect(preset.watch).toHaveLength(3);
      expect(preset.vehicle).toBeTruthy();
      expect(preset.communication).toBeTruthy();
      expect(preset.sources.length).toBeGreaterThan(0);
      for (const source of preset.sources) {
        expect(source.file).toBeTruthy();
        expect(source.row).toBeTruthy();
      }
      for (const scenario of researchState(preset).compare.length ? researchState(preset).compare : [researchState(preset).active!]) {
        const events = await getEvents({ site_id: scenario.site_id!, start_utc: scenario.start_utc, end_utc: scenario.end_utc, mast_height_m: 2 });
        expect(events.metrics.earth_visible_fraction).not.toBeNull();
      }
    }
  });

  it('compares the top recorded recommendation with the target using recorded metrics', async () => {
    const preset = RESEARCH_SCENARIOS.find((p) => p.id === 'recommendation')!;
    const state = researchState(preset);
    const response = await postCompare({ scenarios: state.compare });
    expect(response.scenarios).toHaveLength(2);
    for (const result of response.scenarios) {
      expect(result.metrics.earth_visible_fraction).not.toBeNull();
      expect(result.metrics.mean_power_w).not.toBeNull();
    }
  });
});
