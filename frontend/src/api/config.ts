/**
 * Data source switch: example files (`examples`) or the live server (`live`).
 *
 * The default is `examples`, so the interface works before the server exists (docs/PLAN.md,
 * section 3.1, rule 5). The app shell can call `configureApi` at start-up, for example from a
 * Vite variable: `configureApi({ mode: import.meta.env.VITE_DATA_MODE })`. A `?data=live` or
 * `?data=examples` parameter in the address bar overrides both; it is meant for the phase
 * gates, where the team switches to the live server without a rebuild.
 */

export type DataMode = 'examples' | 'live';

export interface ApiConfig {
  mode: DataMode;
  /** Prefix of every live request. The dev server proxies `/api` to 127.0.0.1:8000. */
  baseUrl: string;
  /** Injected in tests; defaults to the global `fetch`. */
  fetch: typeof fetch | null;
}

/** Address-bar parameter that selects the data source. */
export const DATA_MODE_PARAM = 'data';

const DEFAULTS: ApiConfig = { mode: 'examples', baseUrl: '/api', fetch: null };

let current: ApiConfig = { ...DEFAULTS };

export function isDataMode(value: unknown): value is DataMode {
  return value === 'examples' || value === 'live';
}

/**
 * Changes the settings. Unknown or empty `mode` values are ignored, so an unset
 * environment variable leaves the default in place.
 */
export function configureApi(options: { mode?: string | null; baseUrl?: string; fetch?: typeof fetch | null }): void {
  current = {
    mode: isDataMode(options.mode) ? options.mode : current.mode,
    baseUrl: options.baseUrl ?? current.baseUrl,
    fetch: options.fetch === undefined ? current.fetch : options.fetch,
  };
}

/** Back to the defaults. Used by tests. */
export function resetApiConfig(): void {
  current = { ...DEFAULTS };
}

function modeFromAddressBar(): DataMode | null {
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  if (typeof search !== 'string') return null;
  const value = new URLSearchParams(search).get(DATA_MODE_PARAM);
  return isDataMode(value) ? value : null;
}

/** Settings in effect for the next request. */
export function getApiConfig(): ApiConfig {
  const fromUrl = modeFromAddressBar();
  return fromUrl ? { ...current, mode: fromUrl } : current;
}

export function getDataMode(): DataMode {
  return getApiConfig().mode;
}
