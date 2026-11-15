/**
 * Surface view illustrations (issue #80). Pre-rendered images show a terrain type, not the real
 * surface of a site, and nothing in them is computed. A site gets an illustration only when a
 * sourced record names its terrain type; custom coordinates never get one.
 */

import type { Scenario } from '../../api/types';
import content from '../../content/scene-media.json';

export type SceneId = 'moon-plains' | 'moon-craters' | 'moon-ridges';

export interface SceneView {
  id: string;
  label: string;
  /** Path under `frontend/public/media/`. */
  file: string;
}

export interface Scene {
  title: string;
  description: string;
  poster: string;
  loop: string;
  views: SceneView[];
}

export interface MappedSite {
  site_id: string;
  scene: SceneId;
  basis: string;
  source_label: string;
  /** An https address, or a repository path to the verification record. */
  source_url: string;
}

export interface UnmappedSite {
  site_id: string;
  scene: null;
  reason: string;
}

export type SiteScene = MappedSite | UnmappedSite;

export interface SceneMedia {
  scenes: Record<SceneId, Scene>;
  sites: SiteScene[];
}

export const SCENE_MEDIA = content as SceneMedia;

/** Base of the media files; Vite serves `frontend/public/` at the app root. */
export const MEDIA_BASE = `${import.meta.env.BASE_URL}media/`;

export function mediaUrl(file: string): string {
  return `${MEDIA_BASE}${file}`;
}

export type SceneChoice =
  | { kind: 'none' }
  | { kind: 'custom' }
  | { kind: 'unmapped'; reason: string }
  | { kind: 'scene'; scene: Scene; site: MappedSite };

/** What the panel shows for the active scenario. */
export function sceneFor(active: Scenario | null, media: SceneMedia = SCENE_MEDIA): SceneChoice {
  if (!active) return { kind: 'none' };
  if (!active.site_id) return { kind: 'custom' };
  const entry = media.sites.find((s) => s.site_id === active.site_id);
  if (!entry) return { kind: 'unmapped', reason: 'This site is not in the illustration list.' };
  if (entry.scene === null) return { kind: 'unmapped', reason: entry.reason };
  return { kind: 'scene', scene: media.scenes[entry.scene], site: entry };
}

/** Always shown next to an illustration (issue #80, item 5). */
export const ILLUSTRATION_NOTE =
  "Shows the terrain type, not this site's real surface. The Sun, shadows, stars and lander are not computed; computed positions are in the horizon strip.";

export const LANDER_NOTE =
  "The lander is the team's Athena model, shown upright for scale. It does not show how a mission here ended.";
