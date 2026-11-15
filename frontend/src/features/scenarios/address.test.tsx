import { describe, expect, it } from 'vitest';
import { getEvents } from '../../api/client';
import { exampleSource, recordingIndex } from '../../api/recorded';
import { createUiStore } from '../../shell/ui-state';
import { createScenarioStore } from '../../state/scenario-store';
import { locationWithMast } from '../../state/scenario-tools';
import { bindScenarioUrl, type UrlEnvironment } from '../../state/url-sync';
import { RESEARCH_SCENARIOS, openResearchScenario } from './scenarios';

/** A fake address bar shared by the scenario binding and the door store. */
function addressBar() {
  const location = { pathname: '/', search: '', hash: '' };
  const env: UrlEnvironment = {
    location,
    history: {
      state: null,
      replaceState: (_data, _unused, url) => {
        location.search = url ? new URL(url, 'http://x').search : '';
      },
    },
  };
  const ui = createUiStore({
    read: () => ({ search: location.search }) as Location,
    replace: (search) => {
      location.search = search;
    },
  });
  return { location, env, ui };
}

describe('opening a research scenario (PR #135 review, item 3)', () => {
  it("writes the preset to the address bar and loads the recorded Chang'e 4 answer, Earth in view 0 %", async () => {
    const preset = RESEARCH_SCENARIOS.find((p) => p.sites[0] === 'change-4')!;
    const { location, env, ui } = addressBar();
    const store = createScenarioStore();
    const unbind = bindScenarioUrl(store, env);
    openResearchScenario(preset, store, ui);
    unbind();

    const params = new URLSearchParams(location.search);
    expect(params.get('site')).toBe('change-4');
    expect(params.get('start')).toBe(recordingIndex.start_utc);
    expect(params.get('end')).toBe(recordingIndex.end_utc);
    expect(params.get('mast')).toBe('2');
    expect(params.get('door')).toBe(preset.door);

    // The request the panels send for this scenario is answered by the recording, not a general example.
    const active = store.getState().active!;
    const events = await getEvents({ ...locationWithMast(active), start_utc: active.start_utc, end_utc: active.end_utc, earth_criterion: 'center' });
    const source = exampleSource(events);
    expect(source?.matched).toBe(true);
    expect(source?.label).toBe("Chang'e 4");
    // Known recorded value (checked live by the chief in the PR #135 review): the far side never sees Earth.
    expect(events.metrics.earth_visible_fraction).toBe(0);
  });
});
