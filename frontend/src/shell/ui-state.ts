import type { Store } from '../lib/hooks';
import { hasComparisonParams } from '../state/url-sync';

export const DOORS = ['explore', 'classroom', 'plan'] as const;
export type Door = (typeof DOORS)[number];

export const MODES = ['plan', 'analyze'] as const;
export type Mode = (typeof MODES)[number];

export const RAIL_TABS = ['sky', 'power', 'comms', 'compare'] as const;
export type RailTab = (typeof RAIL_TABS)[number];

export interface UiState {
  door: Door;
  mode: Mode;
  tab: RailTab;
}

export const DEFAULT_DOOR: Door = 'plan';
const DOOR_PARAM = 'door';

export function isDoor(value: unknown): value is Door {
  return typeof value === 'string' && (DOORS as readonly string[]).includes(value);
}

/** Reads the door from a query string. Missing or unknown values give the default. */
export function parseDoor(search: string): Door {
  const value = new URLSearchParams(search).get(DOOR_PARAM);
  return isDoor(value) ? value : DEFAULT_DOOR;
}

/**
 * Returns the query string with the door set. Every other parameter is kept
 * as it was, so the scenario parameters written by the data layer survive.
 */
export function writeDoor(search: string, door: Door): string {
  const params = new URLSearchParams(search);
  params.set(DOOR_PARAM, door);
  const text = params.toString();
  return text ? `?${text}` : '';
}

type Listener = () => void;

export interface UiStore extends Store<UiState> {
  setDoor(door: Door): void;
  setMode(mode: Mode): void;
  setTab(tab: RailTab): void;
}

interface Location {
  search: string;
}

interface UrlAdapter {
  read(): Location;
  replace(search: string): void;
}

const browserUrl: UrlAdapter = {
  read: () => ({ search: typeof window === 'undefined' ? '' : window.location.search }),
  replace: (search) => {
    if (typeof window === 'undefined') return;
    const { pathname, hash } = window.location;
    window.history.replaceState(window.history.state, '', `${pathname}${search}${hash}`);
  },
};

/**
 * Creates the UI state store. The door is mirrored in the address bar as
 * `?door=`; mode and tab live in memory only. A link that opens the Plan door
 * with a comparison starts in ANALYZE mode on the Compare tab, so a shared
 * comparison is visible on arrival; every other link starts in PLAN mode on
 * the Sky tab.
 */
export function createUiStore(url: UrlAdapter = browserUrl): UiStore {
  const search = url.read().search;
  const door = parseDoor(search);
  const opensComparison = door === 'plan' && hasComparisonParams(search);
  let state: UiState = opensComparison
    ? { door, mode: 'analyze', tab: 'compare' }
    : { door, mode: 'plan', tab: 'sky' };
  const listeners = new Set<Listener>();

  const update = (next: Partial<UiState>) => {
    const merged = { ...state, ...next };
    if (merged.door === state.door && merged.mode === state.mode && merged.tab === state.tab) {
      return;
    }
    state = merged;
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setDoor(door) {
      url.replace(writeDoor(url.read().search, door));
      update({ door });
    },
    setMode(mode) {
      update({ mode });
    },
    setTab(tab) {
      update({ tab });
    },
  };
}

/** The application-wide UI state. */
export const uiStore: UiStore = createUiStore();
