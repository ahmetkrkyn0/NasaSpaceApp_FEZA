import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi, resetApiConfig } from '../../api/config';
import { eventsExample, sitesExample } from '../../api/examples';
import { uiStore } from '../../shell/ui-state';
import { EMPTY_SCENARIO_STATE, scenarioStore } from '../../state/scenario-store';
import { scenarioDays } from '../../state/scenario-tools';
import { GameResult, LevelPicker, openInPlan, type Attempt } from './index';
import {
  GOALS_NOTE,
  LEVELS,
  MAST_HEIGHT_M,
  MISSION_DAYS,
  checkGoals,
  dateAt,
  dateCount,
  days,
  earthReason,
  land,
  levelMonths,
  missionScenario,
  monthOf,
  recordedAnswer,
  resultSentence,
  stars,
  type GameAnswer,
} from './game';

afterEach(() => {
  resetApiConfig();
  scenarioStore.replaceState(EMPTY_SCENARIO_STATE);
});

const REPO = new URL('../../../../', import.meta.url);
const level = (id: string) => LEVELS.find((l) => l.id === id)!;
const allDates = (id: string) => Array.from({ length: dateCount(level(id)) }, (_, i) => dateAt(level(id), i));

function rowCells(file: string, row: string): string[] | null {
  const text = readFileSync(fileURLToPath(new URL(file, REPO)), 'utf8');
  for (const line of text.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells[1] === row) return cells;
  }
  return null;
}

describe('levels', () => {
  it('are the first three of the design: Apollo 11, Mons Mouton in December 2026, Chang\'e 4', () => {
    expect(LEVELS.map((l) => [l.id, l.site_id])).toEqual([
      ['equator', 'apollo-11'],
      ['polar-december', 'mons-mouton-im2-target'],
      ['far-side', 'change-4'],
    ]);
    expect(level('polar-december')).toMatchObject({ date_min: '2026-12-01', date_max: '2026-12-20' });
    expect(MISSION_DAYS).toBe(14);
    for (const l of LEVELS) {
      expect(sitesExample.some((s) => s.id === l.site_id)).toBe(true);
      expect(l.calibration).toContain('Live server');
    }
  });

  it('write no numbers in player texts, and back their claims with rows marked "doğrulandı"', () => {
    const names = ['Apollo 11', "Chang'e 4"];
    for (const l of LEVELS) {
      for (const text of [l.intro, l.never_earth?.text ?? '']) {
        expect(names.reduce((t, n) => t.replaceAll(n, ''), text), `${l.id}: ${text}`).not.toMatch(/\d/);
      }
      for (const source of [l.intro_source, l.never_earth?.source].filter((s) => s !== undefined)) {
        expect(rowCells(source.file, source.row), `${l.id}: ${source.file} ${source.row}`).toContain('doğrulandı');
      }
    }
  });

  it('a landing opens a two-week mission at the level site from that date', () => {
    const s = missionScenario(level('polar-december'), '2026-12-05', sitesExample);
    expect(s.site_id).toBe('mons-mouton-im2-target');
    expect(s.start_utc).toBe('2026-12-05T00:00:00Z');
    expect(scenarioDays(s)).toBe(14);
    expect(s.mast_height_m).toBe(MAST_HEIGHT_M);
    expect(dateAt(level('polar-december'), 99)).toBe('2026-12-20');
    expect(dateAt(level('polar-december'), -3)).toBe('2026-12-01');
  });
});

describe('result', () => {
  it('is decided by sunlit_fraction, longest_dark_hours and earth_visible_fraction only', async () => {
    // Live answer whose other fields are extreme: the result must not change.
    const body = {
      ...eventsExample,
      metrics: { sunlit_fraction: 0.6, longest_dark_hours: 50, earth_visible_fraction: 0.8, max_sun_elevation_deg: -90, longest_earth_hidden_hours: 9999 },
      validity: 'DERIVED',
    };
    const seen: string[] = [];
    configureApi({
      mode: 'live',
      fetch: (async (input: RequestInfo | URL) => {
        seen.push(String(input));
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }) as typeof fetch,
    });
    const answer = await land(level('polar-december'), '2026-12-12', sitesExample);
    expect(answer.metrics).toEqual({ sunlit_fraction: 0.6, longest_dark_hours: 50, earth_visible_fraction: 0.8 });
    expect(answer.origin).toBe('live');
    expect(stars(checkGoals(level('polar-december').goals, answer.metrics))).toBe(3);
    // One /api/events call for the 14-day mission.
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('/api/events?');
    expect(seen[0]).toContain('site_id=mons-mouton-im2-target');
    expect(seen[0]).toContain('start_utc=2026-12-12T00%3A00%3A00Z');
    expect(seen[0]).toContain('end_utc=2026-12-26T00%3A00%3A00Z');
  });

  it('turns fractions into days as its only arithmetic', () => {
    expect(days(0.5)).toBe('7.0');
    expect(days(0.6768)).toBe('9.5');
    expect(days(null)).toBe('—');
    expect(resultSentence({ sunlit_fraction: 0.5, longest_dark_hours: 110, earth_visible_fraction: 0.25 })).toBe(
      'Your lander saw the Sun on 7.0 of 14 days. The longest darkness lasted 110.0 hours. It could talk to Earth on 3.5 of 14 days.',
    );
    // A missing metric never counts as a met goal.
    expect(checkGoals(level('equator').goals, { sunlit_fraction: null, longest_dark_hours: null, earth_visible_fraction: null }).map((c) => c.met)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('has no battery, heat or survival gauge (UC-17)', () => {
    const files = ['game.ts', 'index.tsx', 'game.css', '../../content/game-levels.json'];
    for (const f of files) {
      const text = readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8').replace('There is no battery, heat or survival model', '').replace('No battery or survival model', '');
      expect(text, f).not.toMatch(/battery|thermal|temperature|heat|survive|survival/i);
    }
  });
});

describe('recorded server answers (example mode)', () => {
  it('cover every date of every level, and example mode lands with them', async () => {
    for (const l of LEVELS) for (const d of allDates(l.id)) expect(recordedAnswer(l.id, d), `${l.id} ${d}`).not.toBeNull();
    const answer = await land(level('polar-december'), '2026-12-05', sitesExample);
    expect(answer.origin).toBe('recorded');
    expect(answer).toEqual(recordedAnswer('polar-december', '2026-12-05'));
  });

  it('Mons Mouton: different dates between 1 and 20 December give different contact results', () => {
    const goals = level('polar-december').goals;
    const earth = allDates('polar-december').map((d) => checkGoals(goals, recordedAnswer('polar-december', d)!.metrics)[2]!.met);
    expect(earth.slice(0, 5)).toEqual([false, false, false, false, false]);
    expect(earth.slice(5).every((met) => met === true)).toBe(true);
    // And at least one date meets all three goals.
    expect(allDates('polar-december').some((d) => stars(checkGoals(goals, recordedAnswer('polar-december', d)!.metrics)) === 3)).toBe(true);
  });

  it("Chang'e 4: the contact goal holds on no date, and the result says why", () => {
    const l = level('far-side');
    for (const d of allDates('far-side')) {
      const m = recordedAnswer('far-side', d)!.metrics;
      expect(checkGoals(l.goals, m)[2]!.met, d).toBe(false);
      expect(earthReason(l, m)).toContain('Earth never rose above the horizon');
    }
    expect(earthReason(level('polar-december'), recordedAnswer('polar-december', '2026-12-01')!.metrics)).toBeNull();
  });

  it('Apollo 11: every month of the year has dates that meet all three goals (PR #78 review)', () => {
    const l = level('equator');
    for (const m of levelMonths(l)) {
      const dates = allDates('equator').slice(m.first, m.last + 1);
      expect(dates.some((d) => stars(checkGoals(l.goals, recordedAnswer('equator', d)!.metrics)) === 3), m.label).toBe(true);
    }
  });
});

describe('wider date range and month choice (PR #78 review)', () => {
  it("offers a year at Apollo 11 and Chang'e 4, and December 2026 at Mons Mouton", () => {
    expect(dateCount(level('equator'))).toBe(365);
    expect(dateCount(level('far-side'))).toBe(365);
    expect(levelMonths(level('equator')).map((m) => m.label)).toEqual([
      'December 2026',
      'January 2027',
      'February 2027',
      'March 2027',
      'April 2027',
      'May 2027',
      'June 2027',
      'July 2027',
      'August 2027',
      'September 2027',
      'October 2027',
      'November 2027',
    ]);
    expect(levelMonths(level('polar-december')).map((m) => [m.label, m.first, m.last])).toEqual([['December 2026', 0, 19]]);
  });

  it('a month covers its own dates, so the slider moves within one month', () => {
    const l = level('equator');
    const feb = levelMonths(l).find((m) => m.key === '2027-02')!;
    expect([dateAt(l, feb.first), dateAt(l, feb.last)]).toEqual(['2027-02-01', '2027-02-28']);
    expect(monthOf(l, feb.first + 10).key).toBe('2027-02');
  });

  it('the level buttons are off while a landing is computed', () => {
    const idle = renderToStaticMarkup(<LevelPicker levelId="equator" landing={false} onChoose={() => undefined} />);
    expect(idle).not.toContain('disabled');
    const busy = renderToStaticMarkup(<LevelPicker levelId="equator" landing onChoose={() => undefined} />);
    expect(busy.match(/disabled=""/g)).toHaveLength(LEVELS.length);
  });
});

describe('result screen', () => {
  const attempt = (id: string, date: string, answer?: GameAnswer): Attempt => ({
    level: level(id),
    date,
    answer: answer ?? recordedAnswer(id, date)!,
  });

  it('shows stars, each goal, the reliability label and that goals are not mission requirements', () => {
    const html = renderToStaticMarkup(<GameResult attempt={attempt('polar-december', '2026-12-12')} onRetry={() => undefined} onOpenPlan={() => undefined} />);
    expect(html).toContain('aria-label="3 of 3 goals met"');
    expect(html).toContain('Talk to Earth:');
    expect(html).toContain('validity-badge');
    expect(html).toContain('Derived');
    expect(html).toContain(GOALS_NOTE);
    expect(html).toContain('Try another date');
    expect(html).toContain('Open in Plan');
    expect(html).toContain('answer recorded from the server');
  });

  it("explains the failed contact goal at Chang'e 4 with its source", () => {
    const html = renderToStaticMarkup(<GameResult attempt={attempt('far-side', '2026-12-02')} onRetry={() => undefined} onOpenPlan={() => undefined} />);
    expect(html).toContain('Earth never rose above the horizon during your mission');
    expect(html).toContain('needs a relay satellite');
    expect(html).toContain('JPL Horizons, Chang&#x27;e 4 site');
    expect(html).toContain('aria-label="2 of 3 goals met"');
  });

  it('opens the same mission in the Plan door', () => {
    openInPlan(attempt('polar-december', '2026-12-12'), sitesExample);
    const state = scenarioStore.getState();
    expect(state.active?.site_id).toBe('mons-mouton-im2-target');
    expect(state.active?.start_utc).toBe('2026-12-12T00:00:00Z');
    expect(state.selected_utc).toBe('2026-12-12T00:00:00Z');
    expect(uiStore.getState()).toMatchObject({ door: 'plan', mode: 'analyze' });
  });
});
