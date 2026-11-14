/**
 * Issue #71: a comparison across horizon models (terrain at 2 m and 10 m where the site has a
 * profile, flat anywhere else) must say so and must not tie the difference to one input.
 *
 * As on the live server, every compare result below is `SYNTHETIC`, on the terrain horizon too
 * (the panel values are assumed), so the reliability label cannot tell the models apart
 * (PR #75 review). The metric values are test fixtures shaped like the #48 walkthrough.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi, resetApiConfig } from '../../api/config';
import { horizonExample, sitesExample } from '../../api/examples';
import type { CompareMetrics, CompareResponse, Scenario, Validity } from '../../api/types';
import { MAST_HEIGHTS, buildScenario } from '../../state/scenario-tools';
import SetupPanel, { MastOptions, mastHorizonKind, mastPlaceNote } from '../setup';
import { counterfactualScenarios, metricDef, planIntro, planRows, withInputFrom } from '../why/explain';
import { PlanDetail, WhyCards } from '../why';
import { ResultTable } from './index';
import {
  TERRAIN_HEIGHTS_TEXT,
  TERRAIN_RULE_TEXT,
  clearHorizonModelCache,
  fetchHorizonModels,
  fetchMastModels,
  mastModelsKey,
  mastModelsState,
  mixIsWarning,
  mixWarning,
  modelMix,
  modelsKey,
  modelsState,
  type MastModelsState,
  type ModelsState,
} from './horizon-models';

afterEach(() => {
  resetApiConfig();
  clearHorizonModelCache();
});

const MONS = sitesExample.find((s) => s.id === 'mons-mouton-im2-target')!;
const APOLLO = sitesExample.find((s) => s.id === 'apollo-11')!;

function atMast(mast: number, site = MONS): Scenario {
  return buildScenario({
    place: { kind: 'site', site },
    start_utc: '2026-12-01T00:00:00Z',
    days: 30,
    mast_height_m: mast,
    panel_profile_id: 'vertical_tracking',
  });
}

const EMPTY: CompareMetrics = {
  sunlit_fraction: null,
  longest_dark_hours: null,
  max_sun_elevation_deg: null,
  earth_visible_fraction: null,
  longest_earth_hidden_hours: null,
  mean_power_w: null,
};

/** Compare answer; `SYNTHETIC` unless said otherwise, as the live server answers. */
function response(entries: [Scenario, Partial<CompareMetrics>, Validity?][]): CompareResponse {
  return {
    scenarios: entries.map(([scenario, metrics, validity]) => ({ scenario, metrics: { ...EMPTY, ...metrics }, now: null, validity: validity ?? 'SYNTHETIC' })),
    deltas: [],
  };
}

/**
 * A server where only Mons Mouton has terrain profiles, at 2 m and 10 m (ADR-0003). Every other
 * height and every other site answers with the flat horizon.
 */
function liveHorizon(seen: string[] = []): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    seen.push(url);
    const terrain = url.includes('site_id=mons-mouton-im2-target') && /mast_height_m=(2|10)(&|$)/.test(url);
    const body = { ...horizonExample, method: terrain ? 'terrain' : 'sphere', validity: terrain ? 'DERIVED' : 'SYNTHETIC' };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;
}

const ground = atMast(0);
const two = atMast(2);
const five = atMast(5);
const ten = atMast(10);
const ready = (models: Record<string, 'terrain' | 'sphere'>): ModelsState => ({ status: 'ready', models });
const sides = (a: Scenario, b: Scenario) => [
  { name: 'A', scenarioId: a.scenario_id, validity: 'SYNTHETIC' as const },
  { name: 'B', scenarioId: b.scenario_id, validity: 'SYNTHETIC' as const },
];

describe('horizon model of compared scenarios', () => {
  it('reads the model from /api/horizon; example data reports none', async () => {
    expect((await fetchHorizonModels([ground, two])).state).toEqual({ status: 'unavailable' });

    const seen: string[] = [];
    configureApi({ mode: 'live', fetch: liveHorizon(seen) });
    expect((await fetchHorizonModels([ground, two])).state).toEqual(ready({ [ground.scenario_id]: 'sphere', [two.scenario_id]: 'terrain' }));
    expect(seen).toHaveLength(2);
    // The same location and mast is asked once.
    await fetchHorizonModels([two]);
    expect(seen).toHaveLength(2);
  });

  it('a failed request is an error, never "same"', async () => {
    configureApi({
      mode: 'live',
      fetch: (async () => {
        throw new TypeError('fetch failed');
      }) as typeof fetch,
    });
    const answer = await fetchHorizonModels([ground, two]);
    expect(answer.state).toEqual({ status: 'error' });
    expect(modelMix(sides(ground, two), answer.state)).toEqual({ kind: 'unknown', reason: 'error' });
  });

  it('tells different models apart although both results are SYNTHETIC', () => {
    const state = ready({ [ground.scenario_id]: 'sphere', [two.scenario_id]: 'terrain' });
    expect(modelMix(sides(ground, two), state)).toEqual({ kind: 'horizon', text: 'A: flat horizon, B: terrain horizon' });
    expect(modelMix(sides(two, ten), ready({ [two.scenario_id]: 'terrain', [ten.scenario_id]: 'terrain' }))).toEqual({ kind: 'same' });
    expect(TERRAIN_HEIGHTS_TEXT).toBe('2 m and 10 m');
  });

  it('is unknown, not same, while a model is missing: equal labels do not show equal models (review 2)', () => {
    for (const status of ['loading', 'error', 'unavailable'] as const) {
      const mix = modelMix(sides(ground, two), { status });
      expect(mix).toEqual({ kind: 'unknown', reason: status });
      expect(mixWarning(mix)).not.toBeNull();
    }
    // Only one of the two models came back.
    expect(modelMix(sides(ground, two), ready({ [two.scenario_id]: 'terrain' })).kind).toBe('unknown');
    expect(mixIsWarning({ kind: 'unknown', reason: 'loading' })).toBe(false);
    expect(mixIsWarning({ kind: 'unknown', reason: 'error' })).toBe(true);
    expect(mixWarning({ kind: 'same' })).toBeNull();
  });

  it('never matches an answer to another set, and leaves out a scenario without a mast height (optional notes)', async () => {
    configureApi({ mode: 'live', fetch: liveHorizon() });
    const answer = await fetchHorizonModels([ground, two]);
    expect(modelsState(answer, modelsKey([ground, two])).status).toBe('ready');
    // The list changed (same ids could carry other inputs, as the fixed `slip` id does): the old answer counts as loading.
    expect(modelsState(answer, modelsKey([ground, ten]))).toEqual({ status: 'loading' });
    expect(modelsKey([{ ...two, mast_height_m: 10 }])).not.toBe(modelsKey([two]));

    const noMast = { ...two, scenario_id: 'no-mast', mast_height_m: null };
    const state = (await fetchHorizonModels([ground, noMast])).state;
    expect(state).toEqual(ready({ [ground.scenario_id]: 'sphere' }));
    expect(modelMix(sides(ground, noMast), state).kind).toBe('unknown');
  });
});

describe('Compare table across horizon models', () => {
  const answer = response([
    [ground, { sunlit_fraction: 0.6, mean_power_w: 210 }],
    [two, { sunlit_fraction: 0.5, mean_power_w: 190 }],
  ]);

  it('names each model and says the difference is not the mast height alone', () => {
    const html = renderToStaticMarkup(<ResultTable response={answer} models={ready({ [ground.scenario_id]: 'sphere', [two.scenario_id]: 'terrain' })} />);
    expect(html).toContain('different horizon models (A: flat horizon, B: terrain horizon)');
    expect(html).toContain('does not show the effect of the mast height, the date or the site alone');
    expect(html).toContain(TERRAIN_RULE_TEXT);
    expect(html).toContain('>flat horizon</span>');
    expect(html).toContain('>terrain horizon</span>');
  });

  it('stays quiet for 2 m against 10 m, both on the terrain horizon (S-05)', () => {
    const likeForLike = response([
      [two, { sunlit_fraction: 0.5 }],
      [ten, { sunlit_fraction: 0.52 }],
    ]);
    const html = renderToStaticMarkup(<ResultTable response={likeForLike} models={ready({ [two.scenario_id]: 'terrain', [ten.scenario_id]: 'terrain' })} />);
    expect(html).not.toContain('different horizon models');
    expect(html).not.toContain('role="note"');
  });

  it('says the model is not known in example data and while it loads', () => {
    expect(renderToStaticMarkup(<ResultTable response={answer} models={{ status: 'unavailable' }} />)).toContain(
      'The example data does not say which horizon model a scenario uses',
    );
    expect(renderToStaticMarkup(<ResultTable response={answer} />)).toContain('Checking which horizon model each scenario uses');
  });
});

describe('Why cards across horizon models', () => {
  const answer = response([
    [ground, { sunlit_fraction: 0.6 }],
    [two, { sunlit_fraction: 0.5 }],
  ]);
  const mixed = ready({ [ground.scenario_id]: 'sphere', [two.scenario_id]: 'terrain' });
  const mix = modelMix(sides(ground, two), mixed);

  it('does not tie the difference to the mast height, although it is the only input that differs', () => {
    expect(planIntro(ground, two, 'A', 'B', { kind: 'same' })).toContain('so the whole difference comes from it');
    const intro = planIntro(ground, two, 'A', 'B', mix);
    expect(intro).toContain('different horizon models (A: flat horizon, B: terrain horizon)');
    expect(intro).toContain('cannot be tied to a single input');
    expect(intro).not.toContain('whole difference');

    for (const level of ['explore', 'classroom', 'plan'] as const) {
      const html = renderToStaticMarkup(<WhyCards list={[ground, two]} response={answer} level={level} focus={null} models={mixed} />);
      expect(html).toContain('different horizon models (A: flat horizon, B: terrain horizon)');
      expect(html).toContain('Not a like-for-like difference');
      expect(html).not.toContain('whole difference');
    }
  });

  it('does not tie the difference to an input while the model is not known (review 2)', () => {
    for (const reason of ['loading', 'error', 'unavailable'] as const) {
      const intro = planIntro(ground, two, 'A', 'B', { kind: 'unknown', reason });
      expect(intro).not.toContain('whole difference');
      expect(intro).not.toContain('one input only');
    }
    expect(planIntro(ground, two, 'A', 'B', { kind: 'unknown', reason: 'error' })).toBe(
      'The horizon model of A and B could not be read, so the difference is not tied to a single input.',
    );
    // Without a model answer (first render, before the request): the card waits instead of naming the mast.
    const waiting = renderToStaticMarkup(<WhyCards list={[ground, two]} response={answer} level="plan" focus={null} />);
    expect(waiting).toContain('Checking which horizon model A and B use');
    expect(waiting).not.toContain('one input only');
    const failed = renderToStaticMarkup(<WhyCards list={[ground, two]} response={answer} level="plan" focus={null} models={{ status: 'error' }} />);
    expect(failed).toContain('could not be read');
    expect(failed).not.toContain('one input only');
  });

  it('reads the model of every one-input copy and marks 2 m to 5 m, both SYNTHETIC (review 1)', async () => {
    const b = { ...five, start_utc: '2026-12-06T00:00:00Z', end_utc: '2027-01-05T00:00:00Z' };
    const copies = counterfactualScenarios(two, b);
    expect(copies.map((s) => s.mast_height_m)).toEqual([2, 5]);

    const seen: string[] = [];
    configureApi({ mode: 'live', fetch: liveHorizon(seen) });
    const state = (await fetchHorizonModels([two, b, ...copies])).state;
    if (state.status !== 'ready') throw new Error('models were not read');
    // 2 m and 5 m at Mons Mouton: two requests cover A, B and both copies.
    expect(seen).toHaveLength(2);

    const [date, mast] = copies as [Scenario, Scenario];
    const def = metricDef('sunlit_fraction');
    const rows = planRows(
      def,
      { name: 'A', scenario: two, value: 0.5 },
      { name: 'B', scenario: b, value: 0.62 },
      'B',
      [
        { input: 'date', scenario: date, result: response([[date, { sunlit_fraction: 0.52 }]]).scenarios[0] },
        { input: 'mast', scenario: mast, result: response([[mast, { sunlit_fraction: 0.6 }]]).scenarios[0] },
      ],
      state.models,
    );
    expect(rows.map((r) => [r.label, r.model, r.modelLabel])).toEqual([
      ['B: every input as in B', 'other', 'flat horizon'],
      ['A with the dates of B', 'same', null],
      ['A with the mast height of B', 'other', 'flat horizon'],
    ]);

    const html = renderToStaticMarkup(
      <PlanDetail
        def={def}
        a={two}
        b={b}
        bIndex={1}
        response={response([
          [two, { sunlit_fraction: 0.5 }],
          [b, { sunlit_fraction: 0.62 }],
        ])}
        counterfactuals={{
          status: 'ready',
          rows: [
            { input: 'date', scenario: date, result: response([[date, { sunlit_fraction: 0.52 }]]).scenarios[0] },
            { input: 'mast', scenario: mast, result: response([[mast, { sunlit_fraction: 0.6 }]]).scenarios[0] },
          ],
        }}
        mix={modelMix(sides(two, b), state)}
        models={state.models}
      />,
    );
    expect(html).toContain('other horizon model: flat horizon');
    expect(html).toContain('does not isolate that input');
    expect(html).not.toContain('whole difference');
  });

  it('a row whose model could not be read is marked, not trusted', () => {
    const b = { ...ten, start_utc: '2026-12-06T00:00:00Z', end_utc: '2027-01-05T00:00:00Z' };
    const mast = withInputFrom(two, b, 'mast');
    const rows = planRows(
      metricDef('sunlit_fraction'),
      { name: 'A', scenario: two, value: 0.5 },
      { name: 'B', scenario: b, value: 0.6 },
      'B',
      [{ input: 'mast', scenario: mast, result: undefined }],
      { [two.scenario_id]: 'terrain', [b.scenario_id]: 'terrain' },
    );
    expect(rows.map((r) => r.model)).toEqual(['same', 'unknown']);
  });
});

describe('mast height choice in the setup', () => {
  it('labels the heights by the chosen place, read from the server (review 3)', async () => {
    configureApi({ mode: 'live', fetch: liveHorizon() });
    const mons = (await fetchMastModels({ site_id: MONS.id }, MAST_HEIGHTS)).state;
    expect(MAST_HEIGHTS.map((h) => mastHorizonKind(mons, h))).toEqual(['flat', 'terrain', 'flat', 'terrain', 'flat']);
    expect(mastPlaceNote(mons, MAST_HEIGHTS)).toBe('This place has a terrain profile at 2 m and 10 m.');

    // Apollo 11 has no terrain profile: 2 m and 10 m are flat there too.
    const apollo = (await fetchMastModels({ site_id: APOLLO.id }, MAST_HEIGHTS)).state;
    expect(MAST_HEIGHTS.map((h) => mastHorizonKind(apollo, h))).toEqual(['flat', 'flat', 'flat', 'flat', 'flat']);
    expect(mastPlaceNote(apollo, MAST_HEIGHTS)).toBe('This place has no terrain profile: every mast height uses the flat horizon.');
    const html = renderToStaticMarkup(<MastOptions value={2} models={apollo} onChange={() => undefined} />);
    expect(html).toContain('aria-label="2 m, flat horizon"');
    expect(html).not.toContain('terrain');

    // A custom coordinate is flat at every height as well.
    const custom = (await fetchMastModels({ lat_deg: -84.78, lon_deg: 29.13 }, MAST_HEIGHTS)).state;
    expect(MAST_HEIGHTS.every((h) => mastHorizonKind(custom, h) === 'flat')).toBe(true);
  });

  it('shows no label while the model is not known, and never another place\'s answer', async () => {
    const unknown: MastModelsState[] = [{ status: 'loading' }, { status: 'error' }, { status: 'unavailable' }];
    for (const state of unknown) {
      expect(MAST_HEIGHTS.map((h) => mastHorizonKind(state, h))).toEqual([null, null, null, null, null]);
      expect(renderToStaticMarkup(<MastOptions value={2} models={state} onChange={() => undefined} />)).not.toContain('d-choice-note');
    }
    expect(mastPlaceNote({ status: 'error' }, MAST_HEIGHTS)).toBe('The horizon model for this place could not be read.');
    // Example data says nothing about the place.
    expect((await fetchMastModels({ site_id: MONS.id }, MAST_HEIGHTS)).state).toEqual({ status: 'unavailable' });

    configureApi({ mode: 'live', fetch: liveHorizon() });
    const mons = await fetchMastModels({ site_id: MONS.id }, MAST_HEIGHTS);
    expect(mastModelsState(mons, mastModelsKey({ site_id: APOLLO.id }, MAST_HEIGHTS))).toEqual({ status: 'loading' });
  });

  it('states the rule before a height is chosen', () => {
    const html = renderToStaticMarkup(<SetupPanel />);
    expect(html).toContain(TERRAIN_RULE_TEXT);
    expect(TERRAIN_RULE_TEXT).toContain('only at sites that have a terrain profile');
    // No place chosen yet: the options carry no model word.
    expect(html).not.toContain('d-choice-note');
  });
});
