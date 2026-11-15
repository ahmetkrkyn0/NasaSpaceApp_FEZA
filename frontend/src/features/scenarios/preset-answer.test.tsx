import { describe, expect, it, vi } from 'vitest';
import { getEvents, getPower, postCompare } from '../../api/client';
import { RESEARCH_SCENARIOS, presetAnswer, researchState, type PresetApi } from './scenarios';

/** Real example-mode answers, with call counts. */
function spyApi(): PresetApi & { calls: Record<keyof PresetApi, number> } {
  const calls = { postCompare: 0, getEvents: 0, getPower: 0 };
  return {
    calls,
    postCompare: vi.fn((...a: Parameters<typeof postCompare>) => (calls.postCompare++, postCompare(...a))),
    getEvents: vi.fn((...a: Parameters<typeof getEvents>) => (calls.getEvents++, getEvents(...a))),
    getPower: vi.fn((...a: Parameters<typeof getPower>) => (calls.getPower++, getPower(...a))),
  };
}

const scenariosOf = (id: string) => {
  const state = researchState(RESEARCH_SCENARIOS.find((p) => p.id === id)!);
  return state.compare.length ? state.compare : [state.active];
};

describe('preset metrics (#140, item 1)', () => {
  it('does not call /api/compare for a single-site preset, which the server refuses with 422', async () => {
    for (const id of ['polar-sun', 'far-side', 'equatorial-night']) {
      const api = spyApi();
      const rows = await presetAnswer(scenariosOf(id), {}, api);
      expect(api.calls.postCompare).toBe(0);
      expect(api.calls.getEvents).toBe(1);
      expect(api.calls.getPower).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.metrics.mean_power_w).not.toBeNull();
    }
  });

  it("gives the recorded Chang'e 4 values from events and power", async () => {
    const [row] = await presetAnswer(scenariosOf('far-side'), {}, spyApi());
    expect(row!.scenario.site_id).toBe('change-4');
    expect(row!.metrics.earth_visible_fraction).toBe(0);
  });

  it('calls /api/compare once for the two-site presets', async () => {
    for (const id of ['athena-points', 'recommendation']) {
      const api = spyApi();
      const rows = await presetAnswer(scenariosOf(id), {}, api);
      expect(api.calls.postCompare).toBe(1);
      expect(api.calls.getEvents).toBe(0);
      expect(rows).toHaveLength(2);
    }
  });
});
