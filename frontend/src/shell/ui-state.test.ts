import { describe, expect, it } from 'vitest';
import type { Scenario } from '../api/types';
import { writeScenarioParams } from '../state/url-sync';
import { createUiStore, parseDoor, writeDoor } from './ui-state';

function memoryUrl(initial: string) {
  let search = initial;
  return {
    read: () => ({ search }),
    replace: (next: string) => {
      search = next;
    },
    current: () => search,
  };
}

describe('door in the address bar', () => {
  it('reads each of the three doors', () => {
    expect(parseDoor('?door=explore')).toBe('explore');
    expect(parseDoor('?door=classroom')).toBe('classroom');
    expect(parseDoor('?door=plan')).toBe('plan');
  });

  it('falls back to the Plan door when the parameter is missing or unknown', () => {
    expect(parseDoor('')).toBe('plan');
    expect(parseDoor('?door=lab')).toBe('plan');
  });

  it('keeps the other parameters when writing the door', () => {
    const next = writeDoor('?site=im2-athena&start=2025-03-06T17:30:00Z', 'classroom');
    const params = new URLSearchParams(next);
    expect(params.get('door')).toBe('classroom');
    expect(params.get('site')).toBe('im2-athena');
    expect(params.get('start')).toBe('2025-03-06T17:30:00Z');
  });
});

describe('UI state store', () => {
  it('starts from the door in the address bar, as after a reload', () => {
    const store = createUiStore(memoryUrl('?door=explore'));
    expect(store.getState()).toEqual({ door: 'explore', mode: 'plan', tab: 'sky' });
  });

  it('writes the door to the address bar and survives a new store on the same URL', () => {
    const url = memoryUrl('?site=im2-athena');
    const store = createUiStore(url);
    store.setDoor('classroom');
    expect(new URLSearchParams(url.current()).get('site')).toBe('im2-athena');
    expect(createUiStore(url).getState().door).toBe('classroom');
  });

  it('switches mode and tab and notifies subscribers once per change', () => {
    const store = createUiStore(memoryUrl(''));
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.setMode('analyze');
    store.setTab('comms');
    store.setTab('comms');
    unsubscribe();
    store.setMode('plan');
    expect(calls).toBe(2);
    expect(store.getState()).toEqual({ door: 'plan', mode: 'plan', tab: 'comms' });
  });
});

describe('opening a shared comparison link', () => {
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

  /** The query string the Compare panel's "Copy link" carries, with any leading parameters. */
  function comparisonLink(leading: string): string {
    const state = { active: scenario('a'), selected_utc: null, compare: [scenario('a'), scenario('b')] };
    return `?${writeScenarioParams(state, new URLSearchParams(leading)).toString()}`;
  }

  it('starts in ANALYZE mode on the Compare tab in the Plan door', () => {
    const store = createUiStore(memoryUrl(comparisonLink('door=plan')));
    expect(store.getState()).toEqual({ door: 'plan', mode: 'analyze', tab: 'compare' });
  });

  it('does the same when the link has no door, since the Plan door is the default', () => {
    const store = createUiStore(memoryUrl(comparisonLink('')));
    expect(store.getState()).toEqual({ door: 'plan', mode: 'analyze', tab: 'compare' });
  });

  it('keeps PLAN mode on the Sky tab when the link has no comparison', () => {
    const link = `?${writeScenarioParams({ active: scenario('a'), selected_utc: null, compare: [] }, new URLSearchParams('door=plan'))}`;
    expect(createUiStore(memoryUrl(link)).getState()).toEqual({ door: 'plan', mode: 'plan', tab: 'sky' });
  });

  it('keeps the default in the Classroom and Explore doors', () => {
    expect(createUiStore(memoryUrl(comparisonLink('door=classroom'))).getState()).toEqual({
      door: 'classroom',
      mode: 'plan',
      tab: 'sky',
    });
    expect(createUiStore(memoryUrl(comparisonLink('door=explore'))).getState()).toEqual({
      door: 'explore',
      mode: 'plan',
      tab: 'sky',
    });
  });

  it('leaves later mode and tab changes to the user', () => {
    const store = createUiStore(memoryUrl(comparisonLink('door=plan')));
    store.setMode('plan');
    store.setTab('power');
    expect(store.getState()).toEqual({ door: 'plan', mode: 'plan', tab: 'power' });
  });
});
