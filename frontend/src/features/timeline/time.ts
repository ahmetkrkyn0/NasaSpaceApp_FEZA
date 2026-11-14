/**
 * Time helpers shared by the sky view, timeline, countdown and map. They only parse,
 * format and convert units; no sky computation happens here (docs/PLAN.md, 4.1, rule 2).
 */

import type { UtcString } from '../../api/types';

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

/**
 * One lunar day, the synodic month of 29.53 days. Used only as the jump size of the
 * timeline's lunar-day buttons, never shown as a result. Verified value:
 * docs/research/dogrulama/ufuk-ve-isik-isi.md, No A-34 ("12 synodic periods (~29.53 days)").
 */
export const LUNAR_DAY_MS = 29.53 * MS_PER_DAY;

/** Milliseconds since the epoch, or `null` for a missing or unreadable time. */
export function parseUtc(utc: UtcString | null | undefined): number | null {
  if (typeof utc !== 'string') return null;
  const ms = Date.parse(utc);
  return Number.isFinite(ms) ? ms : null;
}

/** ISO 8601 UTC with seconds and a trailing `Z`, the contract's time format. */
export function toUtc(ms: number): UtcString {
  return new Date(Math.round(ms / 1000) * 1000).toISOString().replace('.000Z', 'Z');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `2026-12-05` */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** `00:00` */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** `2026-12-05 00:00 UTC`: every time on screen carries its date and the UTC label. */
export function formatUtc(utc: UtcString | number | null | undefined): string {
  const ms = typeof utc === 'number' ? utc : parseUtc(utc);
  if (ms === null) return 'not available';
  return `${formatDate(ms)} ${formatClock(ms)} UTC`;
}

/**
 * A time range. Same day: `2026-12-03 09:40 – 10:26 UTC`; different days: both dates.
 */
export function formatUtcRange(startMs: number, endMs: number): string {
  if (formatDate(startMs) === formatDate(endMs)) {
    return `${formatDate(startMs)} ${formatClock(startMs)} – ${formatClock(endMs)} UTC`;
  }
  return `${formatDate(startMs)} ${formatClock(startMs)} – ${formatDate(endMs)} ${formatClock(endMs)} UTC`;
}

/**
 * Unit conversion of a server duration in hours: `148.68` gives `6 d 4.7 h`, `5.5` gives
 * `5.5 h`, `0.25` gives `15 min`.
 */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return 'not available';
  const sign = hours < 0 ? '−' : '';
  const abs = Math.abs(hours);
  if (abs < 1) return `${sign}${Math.round(abs * 60)} min`;
  if (abs < 24) return `${sign}${abs.toFixed(1)} h`;
  const days = Math.floor(abs / 24);
  const rest = abs - days * 24;
  return `${sign}${days} d ${rest.toFixed(1)} h`;
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Calendar month step in UTC; the day is kept, or the month's last day when it is shorter. */
export function addCalendarMonths(ms: number, months: number): number {
  const d = new Date(ms);
  const day = d.getUTCDate();
  const target = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()),
  );
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.getTime();
}
