import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { postRecommend } from '../../api/client';
import { ApiError } from '../../api/errors';
import { recommendExample } from '../../api/examples';
import type { RecommendResponse, Scenario } from '../../api/types';
import { createRecommendStore } from '../../state/recommend-store';
import { EMPTY_SCENARIO_STATE, createScenarioStore, scenarioStore } from '../../state/scenario-store';
import { writeScenarioParams } from '../../state/url-sync';
import { ErrorNote } from '../setup/shared';
import RecommendPanel, { RecommendForm, RecommendResults } from './index';
import {
  ALWAYS_NOTES,
  DEFAULT_FORM,
  DEFAULT_LIMITS,
  buildRequest,
  componentText,
  eliminatedReason,
  runRanking,
  siteScenario,
  splitRanked,
  topThree,
} from './recommend';

afterEach(() => scenarioStore.replaceState(EMPTY_SCENARIO_STATE));

const ACTIVE: Scenario = {
  scenario_id: 'a',
  label: 'Mons Mouton, 2026-12-01',
  site_id: 'mons-mouton-im2-target',
  lat_deg: null,
  lon_deg: null,
  start_utc: '2026-12-01T00:00:00Z',
  end_utc: '2026-12-31T00:00:00Z',
  mast_height_m: 10,
  panel_profile_id: 'vertical_tracking',
};

describe('request', () => {
  it('takes the period and mast from the active scenario, and the weights and limits from the form', () => {
    const req = buildRequest(ACTIVE, DEFAULT_FORM);
    expect(req).toMatchObject({ region: 'mons-mouton', start_utc: ACTIVE.start_utc, end_utc: ACTIVE.end_utc, mast_height_m: 10 });
    expect(req.limits).toEqual({ max_slope_deg: 12 });
    expect(req.weights).toEqual(DEFAULT_FORM.weights);
    expect(DEFAULT_LIMITS.max_slope_deg).toBe(12);
  });
});

describe('ranking as the server gave it', () => {
  it('keeps the server order; an eliminated site has no score and says why', () => {
    const { kept, eliminated } = splitRanked(recommendExample);
    expect(kept.map((r) => r.site_id)).toEqual(recommendExample.ranked.filter((r) => !r.eliminated).map((r) => r.site_id));
    expect(eliminated.map((r) => r.site_id)).toEqual(['cand-03']);
    expect(eliminatedReason(eliminated[0]!, recommendExample.limits)).toBe('Eliminated: slope above the 12° limit.');

    // A server order that is not by score stays as it is.
    const odd: RecommendResponse = { ...recommendExample, ranked: [...recommendExample.ranked].reverse() };
    expect(splitRanked(odd).kept.map((r) => r.site_id)).toEqual(['cand-02', 'mons-mouton-im2-target', 'cand-01']);

    const html = renderToStaticMarkup(<RecommendResults response={recommendExample} active={ACTIVE} />);
    const positions = ['Candidate 1', 'Mons Mouton (IM-2 target point)', 'Candidate 2'].map((n) => html.indexOf(`${n}`));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain('Eliminated: slope above the 12° limit.');
    // The eliminated site is not among the ranked rows, so it shows no score.
    expect(html).not.toContain('aria-label="4. Candidate 3"');
    for (const a of recommendExample.assumptions) expect(html).toContain(a.replaceAll("'", '&#x27;'));
  });

  it('shows every component with its reliability label; an assumed one says Assumed', () => {
    const html = renderToStaticMarkup(<RecommendResults response={recommendExample} active={ACTIVE} />);
    const kept = splitRanked(recommendExample).kept;
    const components = kept.reduce((n, r) => n + r.components.length, 0);
    // One badge per component plus one per ranked site.
    expect(html.match(/class="validity-badge/g)).toHaveLength(components + kept.length);
    expect(html).toContain('Assumed');
    expect(componentText({ metric: 'sunlit_fraction', value: 0.57, unit: '1', normalized: 0.57, weight: 1, validity: 'DERIVED' })).toBe('57.0 %');
    expect(componentText({ metric: 'mean_slope_deg', value: 4.2, unit: 'deg', normalized: 0.65, weight: 1, validity: 'MEASURED' })).toBe('4.2°');
    expect(componentText({ metric: 'distance_to_psr_km', value: null, unit: 'km', normalized: null, weight: 0, validity: 'SYNTHETIC' })).toBe('—');
  });
});

describe('using a ranked site', () => {
  it('"Use this site" changes the place only; period and mast stay; the address carries the new site', () => {
    const site = recommendExample.ranked[0]!;
    const next = siteScenario(ACTIVE, site);
    expect(next.site_id).toBe('cand-01');
    expect([next.start_utc, next.end_utc, next.mast_height_m, next.panel_profile_id]).toEqual([
      ACTIVE.start_utc,
      ACTIVE.end_utc,
      ACTIVE.mast_height_m,
      ACTIVE.panel_profile_id,
    ]);
    expect(next.scenario_id).not.toBe(ACTIVE.scenario_id);
    const store = createScenarioStore();
    store.setScenario(ACTIVE);
    store.setScenario(next);
    const params = writeScenarioParams(store.getState(), new URLSearchParams());
    expect(params.get('site')).toBe('cand-01');
    expect(params.get('mast')).toBe('10');
    expect(params.get('start')).toBe(ACTIVE.start_utc);
  });

  it('the top three are the first three not eliminated', () => {
    expect(topThree(recommendExample).map((r) => r.site_id)).toEqual(['cand-01', 'mons-mouton-im2-target', 'cand-02']);
  });
});

describe('server errors', () => {
  it('a refused request (every weight zero) is shown, nothing crashes, the old ranking stays', async () => {
    const store = createRecommendStore();
    store.setRanked(recommendExample, null);
    const zero = { ...DEFAULT_FORM, weights: { sunlit: 0, dark: 0, earth: 0, slope: 0, roughness: 0, psr_distance: 0 } };
    const refuse = () => Promise.reject(new ApiError('invalid_parameter', 'At least one weight must be above zero.', 422));
    const result = await runRanking(ACTIVE, zero, refuse, store);
    expect(result.ok).toBe(false);
    expect(store.getState().ranked).toBe(recommendExample);
    if (!result.ok) expect(renderToStaticMarkup(<ErrorNote error={result.error} />)).toContain('At least one weight must be above zero.');
  });

  it('a good answer is stored with its request (example mode)', async () => {
    const store = createRecommendStore();
    const result = await runRanking(ACTIVE, DEFAULT_FORM, (body) => postRecommend(body), store);
    expect(result).toEqual({ ok: true });
    expect(store.getState().ranked).toEqual(recommendExample);
    expect(store.getState().rankedRequest?.mast_height_m).toBe(10);
  });
});

describe('panel', () => {
  it('always shows that the score ranks and does not certify, and works with the keyboard', () => {
    scenarioStore.setScenario(ACTIVE);
    const html = renderToStaticMarkup(<RecommendPanel />);
    for (const note of ALWAYS_NOTES) expect(html).toContain(note);
    expect(html).toContain('Rank sites</button>');
    const form = renderToStaticMarkup(<RecommendForm form={DEFAULT_FORM} onChange={() => undefined} />);
    // Native controls only: range inputs, a text input, buttons and a checkbox.
    expect(form.match(/type="range"/g)).toHaveLength(6);
    expect(form).toContain('type="checkbox"');
    expect(form).not.toContain('tabindex="-1"');
  });

  it('asks for a scenario first when there is none', () => {
    expect(renderToStaticMarkup(<RecommendPanel />)).toContain('No scenario yet');
  });
});
