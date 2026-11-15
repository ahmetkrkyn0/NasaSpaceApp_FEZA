import { exampleCompareResponse } from './compare-metrics';
import { loadRecording } from './recorded';
import type { CompareResponse, CompareScenarioResult, EventList, PowerSeries, Scenario } from './types';

/** Assemble stored metrics, then use the existing comparison rules. No sky recomputation. */
export async function recordedComparison(scenarios: readonly Scenario[], fallback: CompareResponse, signal?: AbortSignal): Promise<CompareResponse> {
  const recorded = await Promise.all(scenarios.map(async (scenario): Promise<CompareScenarioResult | null> => {
    if (!scenario.site_id) return null;
    const params = {
      site_id: scenario.site_id, start_utc: scenario.start_utc, end_utc: scenario.end_utc,
      mast_height_m: scenario.mast_height_m ?? 2, earth_criterion: scenario.earth_criterion ?? 'center',
    };
    const [events, power] = await Promise.all([
      loadRecording<EventList>('events', params, signal),
      loadRecording<PowerSeries>('power', {
        site_id: scenario.site_id, start_utc: scenario.start_utc, end_utc: scenario.end_utc,
        mast_height_m: scenario.mast_height_m ?? 2, panel_profile_id: scenario.panel_profile_id,
        ...(scenario.fixed_azimuth_deg != null ? { fixed_azimuth_deg: scenario.fixed_azimuth_deg } : {}),
      }, signal),
    ]);
    if (!events || !power) return null;
    return {
      scenario, metrics: { ...events.response.metrics, mean_power_w: power.response.summary.mean_power_w },
      now: null, validity: events.response.validity === 'SYNTHETIC' || power.response.validity === 'SYNTHETIC' ? 'SYNTHETIC' : 'DERIVED',
    };
  }));
  const answers = [...recorded.filter((r): r is CompareScenarioResult => r !== null), ...fallback.scenarios];
  return exampleCompareResponse(scenarios, { scenarios: answers, deltas: [] });
}
