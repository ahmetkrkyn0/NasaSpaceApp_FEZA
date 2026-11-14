/**
 * Eclipses seen from the Moon (docs/design/tutulmalar.md): Earth passes in front of the Sun.
 * They arrive as `eclipse_start` and `eclipse_end` events in the `/api/events` answer. The
 * interface pairs them into spans and shows the server's `max_obscured_fraction`; it never
 * computes how much of the Sun is covered.
 */

import type { SkyEvent } from '../../api/types';
import type { ScenarioWindow } from './data';
import { parseUtc } from './time';

/** Text of the eclipse mark (docs/design/tutulmalar.md, "Arayüzde nerede görünür"). */
export const ECLIPSE_EXPLANATION = 'Earth passes in front of the Sun. Seen from Earth, this is a lunar eclipse.';

export interface EclipseSpan {
  /** Start inside the window; the window start when the eclipse began before it. */
  startMs: number;
  endMs: number;
  /** The start or end event lies outside the answer, so that edge is the window edge. */
  openStart: boolean;
  openEnd: boolean;
  /** Largest covered share of the Sun's disk for this eclipse, as the server gives it. */
  maxObscured: number | null;
}

function obscuredOf(...events: (SkyEvent | null)[]): number | null {
  for (const event of events) {
    const value = event?.max_obscured_fraction;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

/**
 * Eclipse spans within the window, in time order. A start without an end runs to the window
 * end; an end without a start runs from the window start.
 */
export function eclipseSpans(events: readonly SkyEvent[], window: ScenarioWindow): EclipseSpan[] {
  const marks = events
    .filter((e) => e.type === 'eclipse_start' || e.type === 'eclipse_end')
    .map((event) => ({ event, ms: parseUtc(event.utc) }))
    .filter((m): m is { event: SkyEvent; ms: number } => m.ms !== null)
    .sort((a, b) => a.ms - b.ms);

  const spans: EclipseSpan[] = [];
  let open: { event: SkyEvent; ms: number } | null = null;
  for (const mark of marks) {
    if (mark.event.type === 'eclipse_start') {
      if (open) spans.push(span(open.ms, mark.ms, false, true, obscuredOf(open.event)));
      open = mark;
    } else {
      spans.push(
        open
          ? span(open.ms, mark.ms, false, false, obscuredOf(open.event, mark.event))
          : span(window.startMs, mark.ms, true, false, obscuredOf(mark.event)),
      );
      open = null;
    }
  }
  if (open) spans.push(span(open.ms, window.endMs, false, true, obscuredOf(open.event)));

  return spans
    .filter((s) => s.endMs >= window.startMs && s.startMs <= window.endMs && s.endMs >= s.startMs)
    .map((s) => ({
      ...s,
      openStart: s.openStart || s.startMs < window.startMs,
      openEnd: s.openEnd || s.endMs > window.endMs,
      startMs: Math.max(s.startMs, window.startMs),
      endMs: Math.min(s.endMs, window.endMs),
    }));
}

function span(startMs: number, endMs: number, openStart: boolean, openEnd: boolean, maxObscured: number | null): EclipseSpan {
  return { startMs, endMs, openStart, openEnd, maxObscured };
}

/** The eclipse under the selected moment, if any. */
export function activeEclipse(spans: readonly EclipseSpan[], ms: number): EclipseSpan | null {
  return spans.find((s) => ms >= s.startMs && ms <= s.endMs) ?? null;
}

/** `0.343` gives `up to 34.3 % of the Sun's disk covered`; a unit conversion of the server value. */
export function obscuredText(fraction: number | null): string {
  if (fraction === null) return 'covered share not available';
  return `up to ${(fraction * 100).toFixed(1)} % of the Sun's disk covered`;
}
