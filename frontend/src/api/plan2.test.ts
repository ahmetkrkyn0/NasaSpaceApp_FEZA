/**
 * Plan 2 data layer (issue #108; #97, section 4): the five new client functions in example and
 * live mode, the example files against their types, and the recommendation store.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createRecommendStore, isCandidateId, knownPlaceIds, candidateById } from '../state/recommend-store';
import { readScenarioParams, writeScenarioParams } from '../state/url-sync';
import { EMPTY_SCENARIO_STATE, createScenarioStore } from '../state/scenario-store';
import { getBodySeries, getCandidates, getEarthLink, getEvents, getGroundStations, postRecommend } from './client';
import { configureApi, resetApiConfig } from './config';
import {
  bodySeriesExample,
  candidatesExample,
  earthLinkExample,
  earthLinkRelayExample,
  findExampleProblems,
  groundStationsExample,
  recommendExample,
} from './examples';
import type { RecommendRequest } from './types';
import { LINK_MODES, RECOMMEND_METRICS } from './types';

afterEach(() => resetApiConfig());

const REQUEST: RecommendRequest = {
  region: 'mons-mouton',
  start_utc: '2026-12-01T00:00:00Z',
  end_utc: '2026-12-31T00:00:00Z',
  mast_height_m: 2,
  weights: { sunlit: 1, dark: 1, earth: 1, slope: 1, roughness: 0.5, psr_distance: 0 },
  limits: { max_slope_deg: 12 },
  psr_preference: 'far',
  include_catalogue_sites: true,
};

/** A fetch that records each request and answers with `body`. */
function recording(body: unknown, seen: { url: string; init?: RequestInit }[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push({ url: String(input), init });
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}

describe('example files of the new endpoints', () => {
  it('fit their types and the closed value sets (link modes, score metrics, region)', () => {
    // The compile-time check is `typed<T>()` in examples.ts; this is the run-time one.
    const mine = findExampleProblems().filter((p) =>
      /^(body-series|ground-stations|earth-link|earth-link-relay|candidates|recommend)\.json/.test(p),
    );
    expect(mine).toEqual([]);
    for (const w of [...earthLinkExample.link_windows, ...earthLinkRelayExample.link_windows]) expect(LINK_MODES).toContain(w.mode);
    for (const r of recommendExample.ranked) for (const c of r.components) expect(RECOMMEND_METRICS).toContain(c.metric);
  });

  it('cover the cases the panels are written against', () => {
    // Earth link: all three modes; the relay example is relay_needed for the whole period.
    expect(new Set(earthLinkExample.link_windows.map((w) => w.mode))).toEqual(new Set(LINK_MODES));
    expect(earthLinkRelayExample.link_windows.map((w) => w.mode)).toEqual(['relay_needed']);
    // Recommendation: an eliminated site has no score and says why; candidate ids look like cand-NN.
    const out = recommendExample.ranked.filter((r) => r.eliminated);
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) {
      expect(r.score).toBeNull();
      expect(r.eliminated_by.length).toBeGreaterThan(0);
    }
    // Both kinds of the #97 4.3 addendum: candidate regions (cand-NN) and catalogue sites.
    const kinds = candidatesExample.candidates.map((c) => c.kind);
    expect(new Set(kinds)).toEqual(new Set(['candidate', 'catalogue']));
    for (const c of candidatesExample.candidates) expect(isCandidateId(c.id)).toBe(c.kind === 'candidate');
    // Method fields of the #103 contract: the slope limit carries its source, assumptions are named.
    expect(candidatesExample.method.slope_limit_source).toContain('No 89');
    expect(candidatesExample.method.assumed).toContain('window_m');
    expect(candidatesExample.method.assumed).not.toContain('slope_limit_deg');
    // Ground stations carry their source.
    for (const s of groundStationsExample) expect(s.source.url).toMatch(/^https:\/\//);
  });
});

describe('client: example mode', () => {
  it('answers all five functions without a server', async () => {
    configureApi({
      fetch: (() => {
        throw new Error('example mode must not touch the network');
      }) as unknown as typeof fetch,
    });
    expect(await getBodySeries({ utc: '2026-12-05T00:00:00Z' })).toEqual(bodySeriesExample);
    expect(await getGroundStations()).toEqual(groundStationsExample);
    expect(await getEarthLink({ site_id: 'mons-mouton-im2-target', start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z' })).toEqual(
      earthLinkExample,
    );
    expect(await getEarthLink({ site_id: 'change-4', start_utc: '2019-01-03T02:26:00Z', end_utc: '2019-02-02T02:26:00Z' })).toEqual(
      earthLinkRelayExample,
    );
    expect(await getCandidates()).toEqual(candidatesExample);
    expect(await postRecommend(REQUEST)).toEqual(recommendExample);
  });

  it('a candidate id works as a site id: in the scenario, the address bar and the data layer', async () => {
    const scenario = {
      scenario_id: 'c1',
      label: 'Candidate 1',
      site_id: 'cand-01',
      lat_deg: null,
      lon_deg: null,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      mast_height_m: 2,
      panel_profile_id: 'vertical_tracking',
    };
    const store = createScenarioStore(EMPTY_SCENARIO_STATE);
    store.setScenario(scenario);
    const params = writeScenarioParams(store.getState(), new URLSearchParams());
    expect(params.get('site')).toBe('cand-01');
    expect(readScenarioParams(params).active?.site_id).toBe('cand-01');
    await expect(getEvents({ site_id: 'cand-01', start_utc: scenario.start_utc, end_utc: scenario.end_utc })).resolves.toBeTruthy();
  });
});

describe('client: live mode', () => {
  it('sends each request to its address with its parameters', async () => {
    const seen: { url: string; init?: RequestInit }[] = [];
    const answer = (body: unknown) => configureApi({ mode: 'live', fetch: recording(body, seen) });

    answer(bodySeriesExample);
    await getBodySeries({ start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-02T00:00:00Z', step_s: 3600 });
    await getBodySeries({ utc: '2026-12-05T00:00:00Z' });
    answer(groundStationsExample);
    await getGroundStations();
    answer(earthLinkExample);
    await getEarthLink({
      site_id: 'cand-01',
      mast_height_m: 2,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      min_station_elevation_deg: 10,
    });
    answer(candidatesExample);
    await getCandidates({ region: 'mons-mouton' });
    answer(recommendExample);
    await postRecommend(REQUEST);

    expect(seen.map((s) => s.url)).toEqual([
      '/api/body-series?start_utc=2026-12-01T00%3A00%3A00Z&end_utc=2026-12-02T00%3A00%3A00Z&step_s=3600',
      '/api/body-series?utc=2026-12-05T00%3A00%3A00Z',
      '/api/ground-stations',
      '/api/earth-link?site_id=cand-01&mast_height_m=2&start_utc=2026-12-01T00%3A00%3A00Z&end_utc=2026-12-31T00%3A00%3A00Z&min_station_elevation_deg=10',
      '/api/candidates?region=mons-mouton',
      '/api/recommend',
    ]);
    const post = seen[seen.length - 1]!;
    expect(post.init?.method).toBe('POST');
    expect(JSON.parse(String(post.init?.body))).toEqual(REQUEST);
  });
});

describe('recommend store', () => {
  it('loads the candidates and keeps the newest list', async () => {
    let resolveFirst: (v: typeof candidatesExample) => void = () => undefined;
    const calls: unknown[] = [];
    const store = createRecommendStore((params) => {
      calls.push(params);
      if (calls.length === 1) return new Promise((resolve) => (resolveFirst = resolve));
      return Promise.resolve({ ...candidatesExample, candidates: candidatesExample.candidates.slice(0, 1) });
    });
    const first = store.loadCandidates('mons-mouton');
    expect(store.getState().candidatesStatus).toBe('loading');
    await store.loadCandidates();
    expect(store.getState().candidates?.candidates).toHaveLength(1);
    // The slower first request answers last: it is dropped.
    resolveFirst(candidatesExample);
    await first;
    expect(store.getState().candidates?.candidates).toHaveLength(1);
    expect(calls).toEqual([{ region: 'mons-mouton' }, {}]);
    expect(candidateById(store.getState(), 'cand-01')?.name).toBe('Candidate 1');
  });

  it('reports a failed load and keeps the ranked answer as the server gave it', async () => {
    const store = createRecommendStore(() => Promise.reject(new Error('down')));
    let notified = 0;
    store.subscribe(() => (notified += 1));
    await store.loadCandidates();
    expect(store.getState().candidatesStatus).toBe('error');
    store.setRanked(recommendExample, REQUEST);
    expect(store.getState().ranked?.ranked.map((r) => r.site_id)).toEqual(recommendExample.ranked.map((r) => r.site_id));
    expect(store.getState().rankedRequest).toEqual(REQUEST);
    store.setRanked(null);
    expect(store.getState().ranked).toBeNull();
    expect(store.getState().rankedRequest).toBeNull();
    expect(notified).toBe(4);
  });

  it('offers loaded candidates next to loaded sites, as the site picker rule asks', async () => {
    const store = createRecommendStore(() => Promise.resolve(candidatesExample));
    expect(knownPlaceIds(['apollo-11'], store.getState())).toEqual(['apollo-11']);
    await store.loadCandidates();
    expect(knownPlaceIds(['apollo-11'], store.getState())).toEqual(['apollo-11', 'cand-01', 'cand-02', 'cand-03', 'mons-mouton-im2-target']);
    expect(isCandidateId('cand-07')).toBe(true);
    expect(isCandidateId('mons-mouton-im2-target')).toBe(false);
  });
});
