/** Placement of event windows and events on the timeline, as fractions of the scenario window. */

import type { EventWindow, SkyEvent, WindowKind } from '../../api/types';
import type { ScenarioWindow } from './data';
import { clamp, parseUtc } from './time';

export interface BandSegment {
  kind: WindowKind;
  /** 0 at the scenario start, 1 at its end. */
  from: number;
  to: number;
  window: EventWindow;
}

export function fractionOf(ms: number, window: ScenarioWindow): number {
  const span = window.endMs - window.startMs;
  return span > 0 ? clamp((ms - window.startMs) / span, 0, 1) : 0;
}

export function msAt(fraction: number, window: ScenarioWindow): number {
  return window.startMs + clamp(fraction, 0, 1) * (window.endMs - window.startMs);
}

/** Windows of the given kinds that overlap the scenario window, clipped to it. */
export function bandSegments(
  windows: readonly EventWindow[],
  kinds: readonly WindowKind[],
  window: ScenarioWindow,
): BandSegment[] {
  const out: BandSegment[] = [];
  for (const w of windows) {
    if (!kinds.includes(w.kind)) continue;
    const start = parseUtc(w.start_utc);
    const end = parseUtc(w.end_utc);
    if (start === null || end === null || end <= window.startMs || start >= window.endMs) continue;
    const from = fractionOf(start, window);
    const to = fractionOf(end, window);
    if (to > from) out.push({ kind: w.kind, from, to, window: w });
  }
  return out.sort((a, b) => a.from - b.from);
}

export interface EventMark {
  event: SkyEvent;
  at: number;
}

/** Events inside the scenario window with their position. */
export function eventMarks(events: readonly SkyEvent[], window: ScenarioWindow): EventMark[] {
  const out: EventMark[] = [];
  for (const event of events) {
    const t = parseUtc(event.utc);
    if (t === null || t < window.startMs || t > window.endMs) continue;
    out.push({ event, at: fractionOf(t, window) });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Day ticks for the scale: about `count` evenly spaced whole UTC days. */
export function dayTicks(window: ScenarioWindow, count = 6): number[] {
  const day = 86_400_000;
  const spanDays = (window.endMs - window.startMs) / day;
  if (!(spanDays > 0)) return [];
  const stepDays = Math.max(1, Math.ceil(spanDays / count));
  const first = Math.ceil(window.startMs / day) * day;
  const ticks: number[] = [];
  for (let t = first; t <= window.endMs; t += stepDays * day) ticks.push(t);
  return ticks;
}
