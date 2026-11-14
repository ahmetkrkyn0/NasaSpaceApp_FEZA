import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getCommWindow,
  getEvents,
  getHealth,
  getHorizon,
  getLayer,
  getNow,
  getPanelProfiles,
  getPower,
  getReferenceMissions,
  getSites,
  getSkySeries,
  postCompare,
} from './client';
import { configureApi, getDataMode, resetApiConfig } from './config';
import { ApiError, isApiError } from './errors';
import type { Scenario } from './types';

const SITE = { site_id: 'mons-mouton-im2-target' };

function scenario(id: string): Scenario {
  return {
    scenario_id: id,
    label: id,
    site_id: 'apollo-11',
    lat_deg: null,
    lon_deg: null,
    start_utc: '2026-12-01T00:00:00Z',
    end_utc: '2026-12-31T00:00:00Z',
    mast_height_m: 0,
    panel_profile_id: 'vertical_tracking',
  };
}

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (isApiError(error)) return error;
    throw error;
  }
  throw new Error('expected the call to fail');
}

/** A fetch that answers from a table of `url -> [status, body, headers]`; unknown URLs fail like a dead server. */
function fakeFetch(answers: Record<string, [number, BodyInit, Record<string, string>?]>, seen: string[] = []) {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    seen.push(url);
    const answer = answers[url];
    if (!answer) throw new TypeError('fetch failed');
    const [status, body, headers] = answer;
    return new Response(body, { status, headers });
  }) as typeof fetch;
}

beforeEach(() => resetApiConfig());
afterEach(() => {
  resetApiConfig();
  delete (globalThis as { location?: unknown }).location;
});

describe('examples mode', () => {
  beforeEach(() => {
    configureApi({
      fetch: (() => {
        throw new Error('examples mode must not touch the network');
      }) as unknown as typeof fetch,
    });
  });

  it('is the default', () => {
    expect(getDataMode()).toBe('examples');
  });

  it('answers all twelve functions without a server', async () => {
    const results = await Promise.all([
      getHealth(),
      getSites(),
      getHorizon({ ...SITE, mast_height_m: 2 }),
      getSkySeries({ ...SITE, start_utc: '2025-03-06T17:30:00Z', hours: 0, step_minutes: 60 }),
      getEvents({ ...SITE, start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z' }),
      getNow({ ...SITE, utc: '2026-12-05T00:00:00Z' }),
      getCommWindow({ ...SITE, utc: '2026-12-05T00:00:00Z' }),
      getPower({
        ...SITE,
        start_utc: '2026-12-01T00:00:00Z',
        end_utc: '2027-01-01T00:00:00Z',
        panel_profile_id: 'vertical_tracking',
      }),
      postCompare({ scenarios: [scenario('a'), scenario('b')] }),
      getReferenceMissions(),
      getPanelProfiles(),
      getLayer('psr', { region: 'mons-mouton' }),
    ]);
    expect(results).toHaveLength(12);
    for (const result of results) expect(result).toBeTruthy();
  });

  it('returns copies, so editing a result does not change the example', async () => {
    const first = await getSites();
    first[0]!.name = 'changed';
    expect((await getSites())[0]!.name).not.toBe('changed');
  });

  it('filters sites by category', async () => {
    const clps = await getSites({ category: 'clps' });
    expect(clps.length).toBeGreaterThan(0);
    expect(clps.every((s) => s.category === 'clps')).toBe(true);
  });

  it('answers Apollo 11 with the eclipse example and Chang\'e 4 with the relay example', async () => {
    const events = await getEvents({ site_id: 'apollo-11', start_utc: '2027-02-20T00:00:00Z', end_utc: '2027-02-22T00:00:00Z' });
    expect(events.events[0]?.type).toBe('eclipse_start');
    const comm = await getCommWindow({ site_id: 'change-4', utc: '2019-01-03T02:26:00Z' });
    expect(comm.relay_status).toBe('required');
  });

  it('refuses a fifth scenario like the server does', async () => {
    const error = await failure(postCompare({ scenarios: ['a', 'b', 'c', 'd', 'e'].map(scenario) }));
    expect(error.code).toBe('too_many_scenarios');
    expect(error.status).toBe(422);
  });

  it('returns a small synthetic layer that cannot pass for terrain', async () => {
    const grid = await getLayer('elevation', { region: 'mons-mouton' });
    expect(grid.validity).toBe('SYNTHETIC');
    expect(grid.bounds).toBeNull();
    expect(grid.resolution_m).toBeNull();
    expect(grid.values).toHaveLength(grid.rows * grid.cols);
  });

  it('honours an aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    expect((await failure(getHealth({ signal: controller.signal }))).code).toBe('aborted');
  });
});

describe('live mode', () => {
  it('sends requests to /api with query parameters', async () => {
    const seen: string[] = [];
    configureApi({ mode: 'live', fetch: fakeFetch({ '/api/sites?category=apollo': [200, '[]'] }, seen) });
    expect(await getSites({ category: 'apollo' })).toEqual([]);
    expect(seen).toEqual(['/api/sites?category=apollo']);
  });

  it.each([
    [404, 'site_not_found', "No site with id 'x'."],
    [422, 'invalid_parameter', 'utc is not an ISO 8601 time.'],
    [503, 'data_unavailable', 'SPICE kernels are not loaded.'],
  ])('turns HTTP %i into ApiError %s with code and message kept', async (status, code, message) => {
    configureApi({
      mode: 'live',
      fetch: fakeFetch({ '/api/health': [status, JSON.stringify({ error: { code, message } })] }),
    });
    const error = await failure(getHealth());
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
  });

  it('turns an error status without the contract body into http_error', async () => {
    configureApi({ mode: 'live', fetch: fakeFetch({ '/api/panel-profiles': [500, '<html>oops</html>'] }) });
    const error = await failure(getPanelProfiles());
    expect(error.code).toBe('http_error');
    expect(error.status).toBe(500);
  });

  it('turns an unreachable server into network_error', async () => {
    configureApi({ mode: 'live', fetch: fakeFetch({}) });
    const error = await failure(getReferenceMissions());
    expect(error.code).toBe('network_error');
    expect(error.status).toBeNull();
  });

  it('turns a 2xx body that is not JSON into invalid_response', async () => {
    configureApi({ mode: 'live', fetch: fakeFetch({ '/api/health': [200, 'not json'] }) });
    expect((await failure(getHealth())).code).toBe('invalid_response');
  });

  it('decodes a layer from its little-endian body and X-Layer headers', async () => {
    const values = [1.5, -2, Number.NaN, 4, 5, 6];
    const buffer = new ArrayBuffer(values.length * 4);
    const view = new DataView(buffer);
    values.forEach((v, i) => view.setFloat32(i * 4, v, true));
    configureApi({
      mode: 'live',
      fetch: fakeFetch({
        '/api/layers/psr?format=f32&region=mons-mouton': [
          200,
          buffer,
          {
            'X-Layer-Rows': '2',
            'X-Layer-Cols': '3',
            'X-Layer-Validity': 'DERIVED',
            'X-Layer-Bounds': '-1000,-2000,1000,2000',
          },
        ],
      }),
    });
    const grid = await getLayer('psr', { region: 'mons-mouton' });
    expect([grid.rows, grid.cols]).toEqual([2, 3]);
    expect(grid.values[0]).toBe(1.5);
    expect(Number.isNaN(grid.values[2])).toBe(true);
    expect(grid.validity).toBe('DERIVED');
    expect(grid.bounds).toEqual({ x_min: -1000, y_min: -2000, x_max: 1000, y_max: 2000 });
  });
});

describe('data mode switch', () => {
  it('?data=live in the address bar overrides the configured mode', () => {
    (globalThis as { location?: unknown }).location = { search: '?door=plan&data=live' };
    expect(getDataMode()).toBe('live');
  });

  it('ignores an unset or unknown mode value', () => {
    configureApi({ mode: undefined });
    configureApi({ mode: 'staging' });
    expect(getDataMode()).toBe('examples');
  });
});
