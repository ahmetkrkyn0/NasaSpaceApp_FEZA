/**
 * Issue #71: a comparison across horizon models (terrain at 2 m and 10 m, flat at any other mast
 * height) must say so and must not tie the difference to one input. The metric values below are
 * test fixtures shaped like the #48 walkthrough, not product numbers.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi, resetApiConfig } from '../../api/config';
import { horizonExample, sitesExample } from '../../api/examples';
import type { CompareMetrics, CompareResponse, Scenario, Validity } from '../../api/types';
import { MAST_HEIGHTS, buildScenario } from '../../state/scenario-tools';
import SetupPanel, { mastHorizonKind } from '../setup';
import { metricDef, planIntro, planRows, withInputFrom } from '../why/explain';
import { PlanDetail, WhyCards } from '../why';
import { ResultTable } from './index';
import {
  TERRAIN_HEIGHTS_TEXT,
  TERRAIN_RULE_TEXT,
  clearHorizonModelCache,
  fetchHorizonModels,
  mixWarning,
  modelMix,
  type HorizonModels,
} from './horizon-models';

afterEach(() => {
  resetApiConfig();
  clearHorizonModelCache();
});

const MONS = sitesExample.find((s) => s.id === 'mons-mouton-im2-target')!;

function atMast(mast: number): Scenario {
  return buildScenario({
    place: { kind: 'site', site: MONS },
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

function response(entries: [Scenario, Partial<CompareMetrics>, Validity][]): CompareResponse {
  return { scenarios: entries.map(([scenario, metrics, validity]) => ({ scenario, metrics: { ...EMPTY, ...metrics }, now: null, validity })), deltas: [] };
}

const ground = atMast(0);
const two = atMast(2);
const ten = atMast(10);
const TERRAIN = { method: 'terrain', validity: 'DERIVED' } as const;
const FLAT = { method: 'sphere', validity: 'SYNTHETIC' } as const;

describe('horizon model of compared scenarios', () => {
  it('reads the model from /api/horizon in live mode and reports none in example mode', async () => {
    expect(await fetchHorizonModels([ground, two])).toEqual({});

    const seen: string[] = [];
    configureApi({
      mode: 'live',
      fetch: (async (input: RequestInfo | URL) => {
        const url = String(input);
        seen.push(url);
        const terrain = url.includes('mast_height_m=2');
        const body = { ...horizonExample, method: terrain ? 'terrain' : 'sphere', validity: terrain ? 'DERIVED' : 'SYNTHETIC' };
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }) as typeof fetch,
    });
    expect(await fetchHorizonModels([ground, two])).toEqual({ [ground.scenario_id]: FLAT, [two.scenario_id]: TERRAIN });
    expect(seen).toHaveLength(2);
    // The same location and mast is asked once.
    await fetchHorizonModels([two]);
    expect(seen).toHaveLength(2);
  });

  it('tells different horizon models, then different reliability labels, from a like-for-like pair', () => {
    expect(modelMix([{ name: 'A', model: FLAT, validity: 'SYNTHETIC' }, { name: 'B', model: TERRAIN, validity: 'DERIVED' }])).toEqual({
      kind: 'horizon',
      text: 'A: flat horizon, B: terrain horizon',
    });
    expect(modelMix([{ name: 'A', model: undefined, validity: 'SYNTHETIC' }, { name: 'B', model: undefined, validity: 'DERIVED' }])).toEqual({
      kind: 'validity',
      text: 'A: Assumed, B: Derived',
    });
    expect(modelMix([{ name: 'A', model: TERRAIN, validity: 'DERIVED' }, { name: 'B', model: TERRAIN, validity: 'DERIVED' }])).toEqual({ kind: 'same' });
    expect(mixWarning({ kind: 'same' })).toBeNull();
    expect(TERRAIN_HEIGHTS_TEXT).toBe('2 m and 10 m');
  });
});

describe('Compare table across horizon models', () => {
  const answer = response([
    [ground, { sunlit_fraction: 0.6, mean_power_w: 210 }, 'SYNTHETIC'],
    [two, { sunlit_fraction: 0.5, mean_power_w: 190 }, 'DERIVED'],
  ]);
  const models: HorizonModels = { [ground.scenario_id]: FLAT, [two.scenario_id]: TERRAIN };

  it('names each model and says the difference is not the mast height alone', () => {
    const html = renderToStaticMarkup(<ResultTable response={answer} models={models} />);
    expect(html).toContain('different horizon models (A: flat horizon, B: terrain horizon)');
    expect(html).toContain('does not show the effect of the mast height, the date or the site alone');
    expect(html).toContain(TERRAIN_RULE_TEXT);
    expect(html).toContain('>flat horizon</span>');
    expect(html).toContain('>terrain horizon</span>');
  });

  it('stays quiet for 2 m against 10 m, both on the terrain horizon (S-05)', () => {
    const likeForLike = response([
      [two, { sunlit_fraction: 0.5 }, 'DERIVED'],
      [ten, { sunlit_fraction: 0.52 }, 'DERIVED'],
    ]);
    const html = renderToStaticMarkup(<ResultTable response={likeForLike} models={{ [two.scenario_id]: TERRAIN, [ten.scenario_id]: TERRAIN }} />);
    expect(html).not.toContain('different horizon models');
    expect(html).not.toContain('different reliability labels');
  });
});

describe('Why cards across horizon models', () => {
  const answer = response([
    [ground, { sunlit_fraction: 0.6 }, 'SYNTHETIC'],
    [two, { sunlit_fraction: 0.5 }, 'DERIVED'],
  ]);
  const mix = modelMix([
    { name: 'A', model: FLAT, validity: 'SYNTHETIC' },
    { name: 'B', model: TERRAIN, validity: 'DERIVED' },
  ]);

  it('does not tie the difference to the mast height, although it is the only input that differs', () => {
    expect(planIntro(ground, two, 'A', 'B')).toContain('so the whole difference comes from it');
    const intro = planIntro(ground, two, 'A', 'B', mix);
    expect(intro).toContain('different horizon models (A: flat horizon, B: terrain horizon)');
    expect(intro).toContain('cannot be tied to a single input');
    expect(intro).not.toContain('whole difference');

    const props = { def: metricDef('sunlit_fraction'), a: ground, b: two, bIndex: 1, response: answer };
    const html = renderToStaticMarkup(<PlanDetail {...props} counterfactuals={{ status: 'ready', rows: [] }} mix={mix} />);
    expect(html).toContain('cannot be tied to a single input');
    expect(html).not.toContain('whole difference');
  });

  it('falls back to the reliability labels when the model is not known, and warns on every level', () => {
    // No models passed (example mode, or /api/horizon failed): the labels differ, so the cards still say so.
    for (const level of ['explore', 'classroom', 'plan'] as const) {
      const html = renderToStaticMarkup(<WhyCards list={[ground, two]} response={answer} level={level} focus={null} />);
      expect(html).toContain('different reliability labels (A: Assumed, B: Derived)');
      expect(html).toContain('Not a like-for-like difference');
      expect(html).not.toContain('whole difference');
    }
  });

  it('marks a one-input row whose result was computed another way than A', () => {
    const b = { ...atMast(5), start_utc: '2026-12-06T00:00:00Z', end_utc: '2027-01-05T00:00:00Z' };
    const date = withInputFrom(two, b, 'date');
    const mast = withInputFrom(two, b, 'mast');
    const def = metricDef('sunlit_fraction');
    const rows = planRows(
      def,
      { name: 'A', scenario: two, value: 0.5 },
      { name: 'B', scenario: b, value: 0.62 },
      'B',
      [
        { input: 'date', scenario: date, result: response([[date, { sunlit_fraction: 0.52 }, 'DERIVED']]).scenarios[0] },
        { input: 'mast', scenario: mast, result: response([[mast, { sunlit_fraction: 0.6 }, 'SYNTHETIC']]).scenarios[0] },
      ],
      'DERIVED',
    );
    expect(rows.map((r) => [r.label, r.otherModel])).toEqual([
      ['B: every input as in B', false],
      ['A with the dates of B', false],
      ['A with the mast height of B', true],
    ]);
  });
});

describe('mast height choice in the setup', () => {
  it('shows which heights have a terrain horizon before one is chosen', () => {
    expect(MAST_HEIGHTS.map((h) => [h, mastHorizonKind(h)])).toEqual([
      [0, 'flat'],
      [2, 'terrain'],
      [5, 'flat'],
      [10, 'terrain'],
      [20, 'flat'],
    ]);
    const html = renderToStaticMarkup(<SetupPanel />);
    expect(html).toContain(TERRAIN_RULE_TEXT);
    expect(html).toContain('aria-label="0 m, flat horizon"');
    expect(html).toContain('aria-label="2 m, terrain horizon"');
    expect(html.match(/class="d-choice-note">flat</g)).toHaveLength(3);
    expect(html.match(/class="d-choice-note">terrain</g)).toHaveLength(2);
  });
});
