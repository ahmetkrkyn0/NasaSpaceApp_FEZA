import raw from './data.json';

/**
 * Static data of the role pages. Every number is copied from the recorded example answers in
 * `data/examples/recorded/` (answers of the product's own server for December 2026); nothing is
 * computed or invented here. The pages show it as a recorded example, not as a live result.
 */
export interface RoleSite {
  id: string;
  name: string;
  place: string;
  lat_deg: number;
  lon_deg: number;
  start_utc: string;
  end_utc: string;
  mast_height_m: number;
  recorded_utc: string;
  main_sha: string;
  /** `terrain` (LOLA height map) or `sphere` (flat horizon, an assumption). */
  horizon: string;
  validity: { events: string; power: string; horizon: string; link: string };
  relay_status: string;
  metrics: {
    earth_visible_fraction: number;
    longest_dark_hours: number;
    longest_earth_hidden_hours: number;
    max_sun_elevation_deg: number;
    sunlit_fraction: number;
  };
  power: { profile: string; energy_kwh: number; longest_dark_hours: number; mean_power_w: number; sunlit_fraction: number };
  /** Share of the period per link mode: `direct`, `no_station`, `relay_needed`. */
  link_share: Record<string, number>;
  step_minutes: number;
  /** Per sample: Sun elevation, horizon, visible fraction, azimuth; then the same for Earth. */
  samples: number[][];
}

export const ROLE_SITES: readonly RoleSite[] = (raw as unknown as { sites: RoleSite[] }).sites;

export interface SkySample {
  sunElevation: number;
  sunHorizon: number;
  sunVisible: number;
  sunAzimuth: number;
  earthElevation: number;
  earthHorizon: number;
  earthVisible: number;
  earthAzimuth: number;
}

export function sampleAt(site: RoleSite, index: number): SkySample {
  const row = site.samples[Math.max(0, Math.min(site.samples.length - 1, index))] ?? [];
  const at = (i: number) => row[i] ?? 0;
  return {
    sunElevation: at(0),
    sunHorizon: at(1),
    sunVisible: at(2),
    sunAzimuth: at(3),
    earthElevation: at(4),
    earthHorizon: at(5),
    earthVisible: at(6),
    earthAzimuth: at(7),
  };
}

/** "Day 12, 06:00 UTC" for a sample of the series. */
export function sampleLabel(site: RoleSite, index: number): string {
  const start = Date.parse(site.start_utc);
  const time = new Date(start + index * site.step_minutes * 60_000);
  const day = Math.floor((time.getTime() - start) / 86_400_000) + 1;
  const hour = String(time.getUTCHours()).padStart(2, '0');
  return `Day ${day}, ${hour}:00 UTC`;
}

export function percent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)} %`;
}

export function daysText(hours: number): string {
  return `${(hours / 24).toFixed(1)} days`;
}

export function siteById(id: string): RoleSite {
  const site = ROLE_SITES.find((s) => s.id === id) ?? ROLE_SITES[0];
  if (!site) throw new Error('Role page data has no sites.');
  return site;
}

/** Month and year of the recorded period, for the note under every page. */
export function periodText(site: RoleSite): string {
  return new Date(Date.parse(site.start_utc)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
