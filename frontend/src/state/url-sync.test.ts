import { describe, expect, it } from 'vitest';
import type { Scenario } from '../api/types';
import { createScenarioStore, normalizeScenario, type ScenarioState } from './scenario-store';
import {
  bindScenarioUrl,
  hasComparisonParams,
  hasUnreadableActiveScenario,
  readScenarioDraft,
  readScenarioParams,
  writeScenarioParams,
  type UrlEnvironment,
} from './url-sync';

function scenario(id: string, overrides: Partial<Scenario> = {}): Scenario {
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
    ...overrides,
  };
}

function normalized(state: ScenarioState): ScenarioState {
  return {
    active: state.active ? normalizeScenario(state.active) : null,
    selected_utc: state.selected_utc,
    compare: state.compare.map(normalizeScenario),
  };
}

/** An address bar in memory, with a popstate trigger. */
function memoryBrowser(search: string, hash = '') {
  const listeners = new Set<() => void>();
  const writes: string[] = [];
  const env: UrlEnvironment = {
    location: { pathname: '/', search, hash },
    history: {
      state: null,
      replaceState(_data, _unused, url) {
        const text = String(url);
        writes.push(text);
        const query = text.indexOf('?');
        const hashAt = text.indexOf('#');
        env.location.search = query < 0 ? '' : text.slice(query, hashAt < 0 ? undefined : hashAt);
      },
    },
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  return {
    env,
    writes,
    params: () => new URLSearchParams(env.location.search),
    navigate(next: string) {
      env.location.search = next;
      for (const listener of listeners) listener();
    },
  };
}

const FULL_STATE: ScenarioState = {
  active: scenario('a', { label: 'Mons Mouton, Dec 2026 & more', site_id: 'mons-mouton-im2-target', earth_criterion: 'first_limb' }),
  selected_utc: '2026-12-05T00:00:00Z',
  compare: [
    scenario('b', {
      site_id: null,
      lat_deg: -84.7906,
      lon_deg: 29.1957,
      mast_height_m: null,
      panel_profile_id: 'vertical_fixed',
      fixed_azimuth_deg: 270,
    }),
    scenario('c'),
  ],
};

describe('address bar round trip', () => {
  it('reads back the same scenario state it wrote', () => {
    const written = writeScenarioParams(FULL_STATE, new URLSearchParams());
    expect(readScenarioParams(written)).toEqual(normalized(FULL_STATE));
  });

  it('round-trips custom coordinates, a mast height and longitudes up to 360', () => {
    const state: ScenarioState = {
      active: scenario('x', { site_id: null, lat_deg: -0.1, lon_deg: 359.9, mast_height_m: 10 }),
      selected_utc: null,
      compare: [],
    };
    expect(readScenarioParams(writeScenarioParams(state, new URLSearchParams()))).toEqual(state);
  });

  it('keeps parameters it does not own, in place, including an unrecognised door value', () => {
    const written = writeScenarioParams(FULL_STATE, new URLSearchParams('door=nonsense&data=live&foo=1&sid=old'));
    expect([...written.keys()].slice(0, 3)).toEqual(['door', 'data', 'foo']);
    expect(written.get('door')).toBe('nonsense');
    expect(written.get('data')).toBe('live');
    expect(written.get('foo')).toBe('1');
    expect(written.getAll('sid')).toEqual(['a']);
  });

  it('drops invalid values instead of guessing', () => {
    const base = 'end=2026-12-31T00:00:00Z&panel=vertical_tracking';
    expect(readScenarioParams(new URLSearchParams(`site=apollo-11&start=bad&${base}`)).active).toBeNull();
    expect(readScenarioParams(new URLSearchParams(`lat=95&lon=0&start=2026-12-01T00:00:00Z&${base}`)).active).toBeNull();
    expect(readScenarioParams(new URLSearchParams(`site=apollo-11&start=2026-12-01T00:00:00Z&mast=-1&${base}`)).active).toBeNull();
    expect(readScenarioParams(new URLSearchParams('t=yesterday')).selected_utc).toBeNull();
  });

  it('loads at most four comparison scenarios from a link', () => {
    const params = new URLSearchParams(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ['cmp', JSON.stringify(scenario(id))]));
    expect(readScenarioParams(params).compare.map((s) => s.scenario_id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('comparison in a link', () => {
  it('is recognised in a shared comparison link', () => {
    const link = writeScenarioParams(FULL_STATE, new URLSearchParams('door=plan'));
    expect(hasComparisonParams(`?${link.toString()}`)).toBe(true);
  });

  it('is absent when the link has no comparison parameter', () => {
    const link = writeScenarioParams({ ...FULL_STATE, compare: [] }, new URLSearchParams('door=plan'));
    expect(hasComparisonParams(`?${link.toString()}`)).toBe(false);
    expect(hasComparisonParams('')).toBe(false);
  });

  it('is absent when every comparison entry is unreadable', () => {
    const unreadable = JSON.stringify({ ...scenario('b'), panel_profile_id: '' });
    expect(hasComparisonParams(`?cmp=not-json&cmp=${encodeURIComponent(unreadable)}`)).toBe(false);
  });
});

describe('incomplete links', () => {
  const PARTIAL = 'door=plan&site=mons-mouton-im2-target&start=2026-12-01T00:00:00Z&end=2026-12-31T00:00:00Z';

  it('are recognised and not loaded as a scenario', () => {
    const params = new URLSearchParams(PARTIAL);
    expect(hasUnreadableActiveScenario(params)).toBe(true);
    expect(readScenarioParams(params).active).toBeNull();
    expect(hasUnreadableActiveScenario(writeScenarioParams(FULL_STATE, new URLSearchParams()))).toBe(false);
  });

  it('expose their valid fields as a draft for the setup form', () => {
    expect(readScenarioDraft(new URLSearchParams(`${PARTIAL}&mast=abc&crit=centre&label=Draft`))).toEqual({
      label: 'Draft',
      site_id: 'mons-mouton-im2-target',
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
    });
  });

  it('stay in the address bar when other state changes', () => {
    const browser = memoryBrowser(`?${PARTIAL}`);
    const store = createScenarioStore();
    bindScenarioUrl(store, browser.env);
    store.setSelectedUtc('2026-12-05T00:00:00Z');
    store.addToCompare(scenario('b'));
    const params = browser.params();
    expect(params.get('site')).toBe('mons-mouton-im2-target');
    expect(params.get('start')).toBe('2026-12-01T00:00:00Z');
    expect(params.get('end')).toBe('2026-12-31T00:00:00Z');
    expect(params.get('t')).toBe('2026-12-05T00:00:00Z');
    expect(params.getAll('cmp')).toHaveLength(1);
  });

  it('are replaced once the user sets a scenario', () => {
    const browser = memoryBrowser(`?${PARTIAL}`);
    const store = createScenarioStore();
    bindScenarioUrl(store, browser.env);
    store.setScenario(scenario('a'));
    const params = browser.params();
    expect(params.get('site')).toBe('apollo-11');
    expect(params.get('panel')).toBe('vertical_tracking');
    expect(params.get('door')).toBe('plan');
  });

  it('survive navigating back to them', () => {
    const browser = memoryBrowser('');
    const store = createScenarioStore();
    bindScenarioUrl(store, browser.env);
    store.setScenario(scenario('a'));
    browser.navigate(`?${PARTIAL}`);
    expect(store.getState().active).toBeNull();
    store.setSelectedUtc('2026-12-05T00:00:00Z');
    expect(browser.params().get('site')).toBe('mons-mouton-im2-target');
  });
});

describe('binding to the address bar', () => {
  it('reads the link at start and writes changes with replaceState, keeping door and the hash', () => {
    const link = writeScenarioParams({ active: scenario('a'), selected_utc: null, compare: [] }, new URLSearchParams('door=explore'));
    const browser = memoryBrowser(`?${link.toString()}`, '#top');
    const store = createScenarioStore();
    const unbind = bindScenarioUrl(store, browser.env);
    expect(store.getState().active?.scenario_id).toBe('a');

    store.setSelectedUtc('2026-12-06T00:00:00Z');
    expect(browser.writes).toHaveLength(1);
    expect(browser.writes[0]).toMatch(/^\/\?door=explore&.*#top$/);
    expect(browser.params().get('t')).toBe('2026-12-06T00:00:00Z');

    unbind();
    store.setSelectedUtc('2026-12-07T00:00:00Z');
    expect(browser.writes).toHaveLength(1);
  });

  it('leaves the store alone when the link has no scenario keys', () => {
    const store = createScenarioStore();
    store.setScenario(scenario('kept'));
    bindScenarioUrl(store, memoryBrowser('?door=plan').env);
    expect(store.getState().active?.scenario_id).toBe('kept');
  });

  it('re-reads the address bar on back and forward', () => {
    const browser = memoryBrowser('');
    const store = createScenarioStore();
    bindScenarioUrl(store, browser.env);
    const link = writeScenarioParams({ active: scenario('z'), selected_utc: null, compare: [] }, new URLSearchParams());
    browser.navigate(`?${link.toString()}`);
    expect(store.getState().active?.scenario_id).toBe('z');
    browser.navigate('');
    expect(store.getState().active).toBeNull();
  });

  it('does nothing outside a browser', () => {
    const store = createScenarioStore();
    const unbind = bindScenarioUrl(store, null);
    store.setSelectedUtc('2026-12-05T00:00:00Z');
    expect(() => unbind()).not.toThrow();
  });
});
