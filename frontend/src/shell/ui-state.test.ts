import { describe, expect, it } from 'vitest';
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
