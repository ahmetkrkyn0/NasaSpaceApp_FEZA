/**
 * PR #57 review: the Power and Comms tabs must send a new request when a setting the server
 * reads changes, although the scenario keeps its `scenario_id`. The panels key their requests
 * on the parameter objects built here (`useRequest`), so a changed key means a new request.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { getCommWindow, getEvents, getPower } from '../../api/client';
import { configureApi, resetApiConfig } from '../../api/config';
import { commWindowExample, eventsExample, panelProfilesExample, powerExample, sitesExample } from '../../api/examples';
import type { Scenario } from '../../api/types';
import { createScenarioStore } from '../../state/scenario-store';
import { commWindowRequest, eventsRequest, powerRequest } from '../../state/scenario-tools';
import { EMPTY_FORM, checkForm } from '../setup/form';
import { requestKey } from '../setup/shared';

afterEach(() => resetApiConfig());

function setUp(panel = 'horizontal') {
  const setup = checkForm(
    { ...EMPTY_FORM, siteId: 'mons-mouton-im2-target', startDate: '2026-12-01', mastHeight: 2, panelId: panel },
    sitesExample,
    panelProfilesExample,
    null,
  );
  const store = createScenarioStore();
  store.setScenario(setup.scenario!);
  return store;
}

function active(store: ReturnType<typeof createScenarioStore>): Scenario {
  return store.getState().active!;
}

/** Records the address of every live request and answers with the matching example file. */
function recordingFetch(seen: string[]): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    seen.push(url);
    const body = url.includes('/power') ? powerExample : url.includes('/comm-window') ? commWindowExample : eventsExample;
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}

describe('Comms tab requests', () => {
  it('a new Earth criterion gives a new request with that criterion, same scenario id', async () => {
    const store = setUp();
    const before = active(store);
    const utc = before.start_utc;
    const keys = [requestKey(commWindowRequest(before, utc)), requestKey(eventsRequest(before))];

    // What the criterion picker does.
    store.setScenario({ ...before, earth_criterion: 'full_disk' });
    const after = active(store);
    expect(after.scenario_id).toBe(before.scenario_id);
    expect(requestKey(commWindowRequest(after, utc))).not.toBe(keys[0]);
    expect(requestKey(eventsRequest(after))).not.toBe(keys[1]);

    const seen: string[] = [];
    configureApi({ mode: 'live', fetch: recordingFetch(seen) });
    await getCommWindow(commWindowRequest(after, utc));
    await getEvents(eventsRequest(after));
    expect(seen).toHaveLength(2);
    for (const url of seen) expect(url).toContain('earth_criterion=full_disk');
  });

  it('the default criterion is sent when the scenario has none', () => {
    const { earth_criterion: _dropped, ...scenario } = active(setUp());
    expect(commWindowRequest(scenario, scenario.start_utc).earth_criterion).toBe('center');
    expect(eventsRequest(scenario).earth_criterion).toBe('center');
  });
});

describe('Power tab requests', () => {
  it('a new fixed panel direction gives a new request with that direction, same scenario id', async () => {
    const store = setUp('vertical_fixed');
    const before = active(store);
    expect(powerRequest(before)).not.toHaveProperty('fixed_azimuth_deg');
    const key = requestKey(powerRequest(before));

    // What "Set direction" does: west, then east (S-07).
    store.setScenario({ ...before, fixed_azimuth_deg: 270 });
    const west = active(store);
    expect(west.scenario_id).toBe(before.scenario_id);
    expect(requestKey(powerRequest(west))).not.toBe(key);
    store.setScenario({ ...west, fixed_azimuth_deg: 90 });
    const east = active(store);
    expect(requestKey(powerRequest(east))).not.toBe(requestKey(powerRequest(west)));

    const seen: string[] = [];
    configureApi({ mode: 'live', fetch: recordingFetch(seen) });
    await getPower(powerRequest(west));
    await getPower(powerRequest(east));
    expect(seen[0]).toContain('fixed_azimuth_deg=270');
    expect(seen[1]).toContain('fixed_azimuth_deg=90');
  });

  it('panel, mast and dates are part of the request key too', () => {
    const base = active(setUp());
    const key = requestKey(powerRequest(base));
    const changes: Partial<Scenario>[] = [
      { panel_profile_id: 'two_axis' },
      { mast_height_m: 10 },
      { start_utc: '2026-12-06T00:00:00Z' },
      { end_utc: '2026-12-20T00:00:00Z' },
    ];
    for (const change of changes) expect(requestKey(powerRequest({ ...base, ...change }))).not.toBe(key);
    expect(requestKey(powerRequest({ ...base }))).toBe(key);
  });
});
