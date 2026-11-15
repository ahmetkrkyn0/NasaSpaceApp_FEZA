/**
 * Labels, notes and asset paths of the space scene (issue #123), kept free of three.js so the
 * panel and tests can use them without loading the 3D code.
 */

import type { EarthLink, LinkMode, UtcString } from '../../api/types';
import { stationsAt, windowAt } from '../link/link';

export const EARTH_TEXTURE_URL = `${import.meta.env.BASE_URL}media/textures/earth-blue-marble-200404.jpg`;
export const LANDER_MODEL_URL = `${import.meta.env.BASE_URL}media/models/athena_lander.glb`;

export type CameraPreset = 'moon' | 'earth' | 'link';
export const CAMERA_LABELS: Record<CameraPreset, string> = { moon: 'Moon', earth: 'Earth', link: 'Link' };

export const NOT_TO_SCALE =
  'Not to scale: the Earth–Moon distance and the sizes of Earth, the stations and the lander are compressed so everything fits in one view.';
export const DIRECTIONS_NOTE =
  "Sun direction, Earth's direction and Earth's turn come from the server's points for the nearest hourly sample; nothing is computed in the browser.";
export const STARS_NOTE = 'Stars: decorative random points, not a star catalogue.';
export const LANDER_NOTE =
  "Illustration: team FEZA's Athena model, upright and enlarged; it does not show how a mission here ended.";
export const ANTENNA_NOTE = 'Antenna marks: simple shapes at the stations’ real latitude and longitude.';
export const RELAY_NOTE = 'Illustration: a relay satellite is not modelled. The dashed path only shows that a relay would be needed.';
export const NO_STATION_NOTE = 'No line: Earth is above the horizon at the site, but none of the three stations can see the Moon.';
export const EARTH_TURN_UNAVAILABLE =
  "Earth's turn is not available for this moment: the Sun, Earth and Moon are nearly in line, so Earth is drawn plain and the stations are not shown.";
export const NO_EARTH_NOTE = "Earth is not drawn: the server's Earth direction for this moment is not loaded.";

/** What the scene draws for the link at a moment, from the server's windows only. */
export interface LinkDrawing {
  mode: LinkMode | null;
  /** Stations that see the Moon at the moment (only used for `direct`). */
  stationIds: readonly string[];
}

export const NO_LINK: LinkDrawing = { mode: null, stationIds: [] };

export function linkDrawingAt(link: EarthLink | null, utc: UtcString | null): LinkDrawing {
  if (!link || !utc) return NO_LINK;
  const w = windowAt(link, utc);
  if (!w) return NO_LINK;
  if (w.mode !== 'direct') return { mode: w.mode, stationIds: [] };
  const now = stationsAt(link, utc).map((s) => s.id);
  return { mode: 'direct', stationIds: now.length > 0 ? now : w.station_ids };
}
