import type { Store } from '../lib/hooks';

/**
 * Colour theme (issue #92). Dark is the default and stays exactly as before: the light theme is
 * the set of variables in styles/theme-light.css, switched on by `data-theme="light"` on <html>.
 *
 * The choice is kept in localStorage. The operating system preference is not applied on its own,
 * so demos and screenshots stay the same on every machine. Any storage failure (private mode,
 * blocked site data) falls back to the dark theme and never breaks the page.
 */

export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'dark';
export const THEME_STORAGE_KEY = 'feza-theme';

/** The subset of `Storage` used here, so tests can pass their own. */
export interface ThemeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** `window.localStorage`, or `null` when there is none or reading it throws. */
export function browserStorage(): ThemeStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** The saved theme, or dark when nothing valid is saved or storage cannot be read. */
export function readTheme(storage: ThemeStorage | null = browserStorage()): Theme {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Saves the theme; a storage failure only means the choice is not remembered. */
export function saveTheme(theme: Theme, storage: ThemeStorage | null = browserStorage()): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Not remembered; the page keeps working.
  }
}

/** The element that carries the theme attribute; `null` outside a browser. */
function rootElement(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}

/**
 * Applies the theme to <html>. Dark removes the attribute, so the dark theme is the page exactly
 * as it was before the light theme existed.
 */
export function applyTheme(theme: Theme, root: Pick<HTMLElement, 'setAttribute' | 'removeAttribute'> | null = rootElement()): void {
  if (!root) return;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
}

export interface ThemeState {
  theme: Theme;
}

export interface ThemeStore extends Store<ThemeState> {
  setTheme(theme: Theme): void;
  toggle(): void;
}

/** Theme store: applies and saves every change. The scenario, moment and address bar are not touched. */
export function createThemeStore(
  storage: ThemeStorage | null = browserStorage(),
  root: Pick<HTMLElement, 'setAttribute' | 'removeAttribute'> | null = rootElement(),
): ThemeStore {
  let state: ThemeState = { theme: readTheme(storage) };
  const listeners = new Set<() => void>();
  const store: ThemeStore = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setTheme(theme) {
      if (theme === state.theme) return;
      state = { theme };
      applyTheme(theme, root);
      saveTheme(theme, storage);
      listeners.forEach((listener) => listener());
    },
    toggle() {
      store.setTheme(state.theme === 'dark' ? 'light' : 'dark');
    },
  };
  return store;
}

/** The application-wide theme. `main.tsx` applies it before the first render. */
export const themeStore: ThemeStore = createThemeStore();
