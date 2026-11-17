import { DATA_MODE_PARAM, isDataMode } from '../api/config';
import type { Door } from '../shell/ui-state';

/**
 * Role pages: a start page with three role cards and one overview page per role. They live at
 * their own addresses (`#/start`, `#/public`, `#/educator`, `#/engineer`) and leave the console
 * and its doors untouched; each role page links to the door of the live console.
 */
export const ROLE_ROUTES = ['start', 'public', 'educator', 'engineer'] as const;
export type RoleRoute = (typeof ROLE_ROUTES)[number];
export type Role = Exclude<RoleRoute, 'start'>;

export const ROLES: readonly Role[] = ['public', 'educator', 'engineer'];

/** The console door each role opens. */
export const ROLE_DOOR: Record<Role, Door> = {
  public: 'explore',
  educator: 'classroom',
  engineer: 'plan',
};

export const ROLE_LABEL: Record<Role, string> = {
  public: 'Public',
  educator: 'Educator',
  engineer: 'Engineer',
};

/** Route of an address fragment, or `null` when the fragment is not a role page. */
export function parseRoleRoute(hash: string): RoleRoute | null {
  const match = /^#\/([a-z]+)\/?$/.exec(hash);
  const name = match?.[1];
  return ROLE_ROUTES.find((route) => route === name) ?? null;
}

export function roleHref(route: RoleRoute): string {
  return `#/${route}`;
}

function currentSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search;
}

/**
 * Address of the live console opened at the role's door. A data mode chosen in the address bar
 * (`?data=live` or `?data=examples`) is carried over, so the console keeps the source the visitor
 * opened the page with; no other parameter is copied.
 */
export function liveHref(role: Role, base: string = import.meta.env.BASE_URL, search: string = currentSearch()): string {
  const params = new URLSearchParams({ door: ROLE_DOOR[role] });
  const mode = new URLSearchParams(search).get(DATA_MODE_PARAM);
  if (isDataMode(mode)) params.set(DATA_MODE_PARAM, mode);
  return `${base}?${params.toString()}`;
}
