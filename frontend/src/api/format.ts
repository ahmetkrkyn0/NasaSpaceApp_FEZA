/**
 * Display formatting for contract values. Unit conversion and rounding only; no sky arithmetic
 * (docs/PLAN.md, section 4.1, rule 2).
 */

import type { UtcString } from './types';

export const DASH = '—';

/** `2026-12-03T10:03:00Z` -> `2026-12-03 10:03 UTC`. */
export function formatUtc(utc: UtcString | null | undefined): string {
  if (!utc) return DASH;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(utc);
  return match ? `${match[1]} ${match[2]} UTC` : utc;
}

/** `2026-12-03T10:03:00Z` -> `2026-12-03`. */
export function formatDate(utc: UtcString | null | undefined): string {
  if (!utc) return DASH;
  return utc.slice(0, 10);
}

export function formatDeg(value: number | null | undefined, decimals = 2): string {
  return value === null || value === undefined ? DASH : `${value.toFixed(decimals)}°`;
}

export function formatPercent(fraction: number | null | undefined, decimals = 1): string {
  return fraction === null || fraction === undefined ? DASH : `${(fraction * 100).toFixed(decimals)} %`;
}

export function formatNumber(value: number | null | undefined, unit: string, decimals = 1): string {
  return value === null || value === undefined ? DASH : `${value.toFixed(decimals)} ${unit}`;
}

/** Hours with a day equivalent from two days on: `186.6 h (7.8 d)`. */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return DASH;
  const base = `${hours.toFixed(1)} h`;
  return hours >= 48 ? `${base} (${(hours / 24).toFixed(1)} d)` : base;
}

/** Minutes as days, hours and minutes: `8921` -> `6 d 4 h 41 min`. */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return DASH;
  const total = Math.round(minutes);
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0 || days > 0) parts.push(`${hours} h`);
  parts.push(`${mins} min`);
  return parts.join(' ');
}

/** Latitude and longitude as `84.7800° S, 29.1300° E`. */
export function formatLatLon(lat: number | null | undefined, lon: number | null | undefined): string {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return DASH;
  const ns = lat < 0 ? 'S' : 'N';
  const ew = lon < 0 ? 'W' : 'E';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}
