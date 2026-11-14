import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import content from '../../content/why-cards.json';
import { COMPARE_METRICS } from '../../api/compare-metrics';
import { sitesExample } from '../../api/examples';
import type { CompareMetrics, CompareResponse, Scenario } from '../../api/types';
import { buildScenario, sameDateAnotherSite, sameSiteAnotherDate } from '../../state/scenario-tools';
import { ResultTable } from '../compare';
import {
  counterfactualRequests,
  differingInputs,
  fetchCounterfactuals,
  headline,
  metricDef,
  planIntro,
  planRows,
  withInputFrom,
  type Named,
} from './explain';
import { WhyCards, cardOrder, pairIndex } from './index';

/*
 * The metric values below are test fixtures, not product numbers: they only check that the
 * cards put the server's values in the right place.
 */

const MONS = sitesExample.find((s) => s.id === 'mons-mouton-im2-target')!;
const SLIM = sitesExample.find((s) => s.id === 'slim')!;

function base(): Scenario {
  return buildScenario({
    place: { kind: 'site', site: MONS },
    start_utc: '2026-12-01T00:00:00Z',
    days: 30,
    mast_height_m: 2,
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

function response(entries: [Scenario, Partial<CompareMetrics>][]): CompareResponse {
  return {
    scenarios: entries.map(([scenario, metrics]) => ({ scenario, metrics: { ...EMPTY, ...metrics }, now: null, validity: 'MODEL' })),
    deltas: [],
  };
}

function n(name: string, scenario: Scenario, value: number | null): Named {
  return { name, scenario, value };
}

describe('inputs of a pair', () => {
  it('finds the inputs that differ, with contract defaults applied', () => {
    const a = base();
    expect(differingInputs(a, a)).toEqual([]);
    expect(differingInputs(a, sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample))).toEqual(['date']);
    expect(differingInputs(a, sameDateAnotherSite(a, SLIM, sitesExample))).toEqual(['place']);
    expect(differingInputs(a, { ...a, earth_criterion: 'center' })).toEqual([]);
    expect(differingInputs(a, { ...a, mast_height_m: 10, panel_profile_id: 'two_axis', earth_criterion: 'full_disk' })).toEqual([
      'mast',
      'panel',
      'criterion',
    ]);
  });

  it('a counterfactual copies A and takes exactly one input from B', () => {
    const a = base();
    const b = { ...sameDateAnotherSite(sameSiteAnotherDate(a, '2027-01-10T00:00:00Z', sitesExample), SLIM, sitesExample), mast_height_m: 10 };
    const copy = withInputFrom(a, b, 'date', 'C');
    expect(differingInputs(a, copy)).toEqual(['date']);
    expect(copy.start_utc).toBe(b.start_utc);
    expect(copy.end_utc).toBe(b.end_utc);
    expect(copy.site_id).toBe(a.site_id);
    expect(copy.scenario_id).not.toBe(a.scenario_id);
    expect(copy.label).toContain('dates of C');
    // An optional field missing in B is removed, not copied as undefined.
    const fixed = { ...a, panel_profile_id: 'vertical_fixed', fixed_azimuth_deg: 270 };
    expect(withInputFrom(fixed, a, 'panel')).not.toHaveProperty('fixed_azimuth_deg');
  });

  it('sends no extra request when one input differs, and 2 to 4 scenarios per request otherwise', () => {
    const a = base();
    expect(counterfactualRequests(a, sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample))).toEqual([]);

    const two = { ...sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample), mast_height_m: 10 };
    const twoRequests = counterfactualRequests(a, two);
    expect(twoRequests).toHaveLength(1);
    expect(twoRequests[0]!.map((s) => s.scenario_id)).toEqual([a.scenario_id, `${a.scenario_id}-with-date`, `${a.scenario_id}-with-mast`]);

    const all: Scenario = {
      ...sameDateAnotherSite(sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample), SLIM, sitesExample),
      mast_height_m: 10,
      panel_profile_id: 'two_axis',
      earth_criterion: 'full_disk',
    };
    const requests = counterfactualRequests(a, all);
    expect(requests.map((r) => r.length)).toEqual([4, 3]);
    for (const r of requests) {
      expect(r[0]).toBe(a);
      expect(new Set(r.map((s) => s.scenario_id)).size).toBe(r.length);
    }
  });

  it('collects the server answer of every copy', async () => {
    const a = base();
    const b = { ...sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample), mast_height_m: 10 };
    const sent: Scenario[][] = [];
    const post = async (body: { scenarios: Scenario[] }) => {
      sent.push(body.scenarios);
      return response(body.scenarios.map((s, i) => [s, { max_sun_elevation_deg: i }]));
    };
    const result = await fetchCounterfactuals(a, b, 'B', post);
    expect(sent).toHaveLength(1);
    expect(result.map((r) => [r.input, r.result?.metrics.max_sun_elevation_deg])).toEqual([
      ['date', 1],
      ['mast', 2],
    ]);
  });
});

describe('card texts', () => {
  it('hold no numbers: every number comes from the server answer', () => {
    expect(JSON.stringify(content)).not.toMatch(/\d/);
  });

  it('cover all six metrics at the three levels', () => {
    for (const m of COMPARE_METRICS) {
      const text = (content.metrics as Record<string, { explore: string; classroom: string; related: string }>)[m.key]!;
      expect(text.explore).toContain('{better}');
      expect(text.classroom.length).toBeGreaterThan(0);
      expect(COMPARE_METRICS.some((r) => r.key === text.related)).toBe(true);
    }
  });

  it('turns a sunlit fraction into hours when both periods have the same length', () => {
    const a = base();
    const b = sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample);
    const def = metricDef('sunlit_fraction');
    // 30 days x 24 h x 0.05 = 36 hours.
    expect(headline(def, n('A', a, 0.5), n('B', b, 0.55))).toBe('B gets 36 hours more sunlight than A in this period.');
    expect(headline(def, n('A', a, 0.55), n('B', b, 0.5))).toBe('A gets 36 hours more sunlight than B in this period.');
    const longer = { ...b, end_utc: '2027-01-20T00:00:00Z' as const };
    expect(headline(def, n('A', a, 0.5), n('B', longer, 0.55))).toBe('B gets 5.0 percentage points of the time more sunlight than A in this period.');
  });

  it('uses the better direction of each metric, and says so when values are equal or unknown', () => {
    const a = base();
    const b = sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample);
    expect(headline(metricDef('longest_dark_hours'), n('A', a, 100), n('B', b, 80))).toBe('The longest dark spell at B is 20.0 h shorter than at A.');
    expect(headline(metricDef('max_sun_elevation_deg'), n('A', a, 6.47), n('B', b, 6.47))).toBe('A and B have the same value for Highest Sun.');
    expect(headline(metricDef('mean_power_w'), n('A', a, null), n('B', b, 3))).toBe('Mean panel power has no computed value in at least one of these scenarios, so there is nothing to explain yet.');
  });

  it('plan rows: the total, then one row per input changed alone', () => {
    const a = base();
    const b = { ...sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample), mast_height_m: 10 };
    const def = metricDef('max_sun_elevation_deg');
    const date = withInputFrom(a, b, 'date');
    const mast = withInputFrom(a, b, 'mast');
    const rows = planRows(def, n('A', a, 6), n('B', b, 7.5), 'B', [
      { input: 'date', scenario: date, result: response([[date, { max_sun_elevation_deg: 7.25 }]]).scenarios[0] },
      { input: 'mast', scenario: mast, result: undefined },
    ]);
    expect(rows.map((r) => [r.label, r.value, r.diff])).toEqual([
      ['B: every input as in B', '7.50°', 1.5],
      ['A with the dates of B', '7.25°', 1.25],
      ['A with the mast height of B', '—', null],
    ]);
    expect(planIntro(a, b, 'A', 'B')).toContain('changes one input');
    expect(planIntro(a, date, 'A', 'B')).toBe('A and B differ in one input only, the dates, so the whole difference comes from it.');
  });
});

describe('Why panel', () => {
  const a = base();
  const b = sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample);
  const c = sameDateAnotherSite(a, SLIM, sitesExample);
  const list = [a, b, c];
  const answer = response([
    [a, { max_sun_elevation_deg: 6, sunlit_fraction: 0.5 }],
    [b, { max_sun_elevation_deg: 7, sunlit_fraction: 0.6 }],
    [c, { max_sun_elevation_deg: 40, sunlit_fraction: 0.5 }],
  ]);

  it('compares A with the focused scenario, else the chosen one, else B', () => {
    expect(pairIndex(list, null, null)).toBe(1);
    expect(pairIndex(list, null, c.scenario_id)).toBe(2);
    expect(pairIndex(list, { metric: 'sunlit_fraction', scenarioId: c.scenario_id }, b.scenario_id)).toBe(2);
    expect(pairIndex(list, { metric: 'sunlit_fraction', scenarioId: a.scenario_id }, null)).toBe(1);
    expect(cardOrder({ metric: 'mean_power_w', scenarioId: b.scenario_id })[0]!.key).toBe('mean_power_w');
  });

  it('shows one sentence in Explore, what the number measures in Classroom, one input at a time in Plan', () => {
    const focus = { metric: 'max_sun_elevation_deg' as const, scenarioId: c.scenario_id };
    const explore = renderToStaticMarkup(<WhyCards list={list} response={answer} level="explore" focus={focus} />);
    expect(explore).toContain('At C (');
    expect(explore).toContain('the Sun climbs 34.00° higher than at A (');
    expect(explore).not.toContain('Related computed value');

    const classroom = renderToStaticMarkup(<WhyCards list={list} response={answer} level="classroom" focus={focus} />);
    expect(classroom).toContain('highest angle of the Sun');
    expect(classroom).toContain('Related computed value, Sunlit time');

    const plan = renderToStaticMarkup(<WhyCards list={list} response={answer} level="plan" focus={null} />);
    expect(plan).toContain('A and B differ in one input only, the dates');
  });

  it('shows one note instead of six cards when no metric is known in both scenarios', () => {
    const unknown = response([[a, { max_sun_elevation_deg: 6 }], [b, {}], [c, {}]]);
    const html = renderToStaticMarkup(<WhyCards list={list} response={unknown} level="plan" focus={null} />);
    expect(html).toContain('None of the six metrics has a computed value in both scenarios yet');
    expect(html).not.toContain('Why: Highest Sun');
    expect(html).not.toContain('whole difference');
  });

  it('the Compare table has a "Why?" link next to every non-zero difference', () => {
    const html = renderToStaticMarkup(<ResultTable response={answer} />);
    // B differs from A in two metrics, C in one.
    expect(html.match(/>Why\?</g)).toHaveLength(3);
  });
});
