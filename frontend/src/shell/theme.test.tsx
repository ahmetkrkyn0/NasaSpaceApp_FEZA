import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { scenarioStore, EMPTY_SCENARIO_STATE } from '../state/scenario-store';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  browserStorage,
  createThemeStore,
  readTheme,
  saveTheme,
  type ThemeStorage,
} from './theme';
import { ThemeSwitch } from './TopBar';
import { uiStore } from './ui-state';

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  scenarioStore.replaceState(EMPTY_SCENARIO_STATE);
});

function memoryStorage(initial: Record<string, string> = {}): ThemeStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const broken: ThemeStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

function fakeRoot() {
  const attributes = new Map<string, string>();
  return {
    attributes,
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
  };
}

describe('theme choice', () => {
  it('is dark when nothing is saved', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(readTheme(memoryStorage())).toBe('dark');
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'sepia' }))).toBe('dark');
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });

  it('opens dark and without errors when localStorage is closed', () => {
    expect(readTheme(broken)).toBe('dark');
    expect(readTheme(null)).toBe('dark');
    expect(() => saveTheme('light', broken)).not.toThrow();
    // The localStorage getter itself throws in some private modes.
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: Object.defineProperty({}, 'localStorage', {
        get: () => {
          throw new Error('SecurityError');
        },
      }),
    });
    expect(browserStorage()).toBeNull();
    expect(readTheme()).toBe('dark');
    const store = createThemeStore(broken, fakeRoot());
    expect(store.getState().theme).toBe('dark');
    expect(() => store.toggle()).not.toThrow();
    expect(store.getState().theme).toBe('light');
  });

  it('sets data-theme only for light, so the dark theme is the page as before', () => {
    const root = fakeRoot();
    applyTheme('light', root);
    expect(root.attributes.get('data-theme')).toBe('light');
    applyTheme('dark', root);
    expect(root.attributes.has('data-theme')).toBe(false);
  });

  it('a switch applies and remembers the theme, and leaves scenario, moment and address alone', () => {
    const storage = memoryStorage();
    const root = fakeRoot();
    const store = createThemeStore(storage, root);
    scenarioStore.setScenario({
      scenario_id: 's',
      label: 'Mons Mouton',
      site_id: 'mons-mouton-im2-target',
      lat_deg: null,
      lon_deg: null,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      mast_height_m: 2,
      panel_profile_id: 'vertical_tracking',
    });
    scenarioStore.setSelectedUtc('2026-12-05T00:00:00Z');
    const scenarioBefore = scenarioStore.getState();
    const uiBefore = uiStore.getState();

    store.toggle();
    expect(store.getState().theme).toBe('light');
    expect(root.attributes.get('data-theme')).toBe('light');
    expect(storage.data[THEME_STORAGE_KEY]).toBe('light');
    expect(scenarioStore.getState()).toBe(scenarioBefore);
    expect(uiStore.getState()).toBe(uiBefore);

    store.toggle();
    expect(root.attributes.has('data-theme')).toBe(false);
    expect(storage.data[THEME_STORAGE_KEY]).toBe('dark');
    // A new session reads the saved choice.
    expect(createThemeStore(memoryStorage({ [THEME_STORAGE_KEY]: 'light' }), fakeRoot()).getState().theme).toBe('light');
  });
});

describe('top bar theme switch', () => {
  it('is a button with a visible label and a pressed state', () => {
    const html = renderToStaticMarkup(<ThemeSwitch />);
    expect(html).toContain('<button type="button"');
    expect(html).toContain('>Light theme</button>');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Theme"');
  });
});
