/**
 * Lunar-day and calendar-month jumps. Inside the scenario window the selected moment moves;
 * past an edge the whole window shifts with it, keeping its length, so the cursor stays on the
 * new moment. A jump outside the server's ephemeris range is refused.
 */

import type { Health, Scenario } from '../../api/types';
import type { ScenarioWindow } from './data';
import { LUNAR_DAY_MS, addCalendarMonths, parseUtc, toUtc } from './time';

export type JumpKind = 'lunar_day' | 'month';

export function jumpTarget(selectedMs: number, kind: JumpKind, direction: 1 | -1): number {
  return kind === 'lunar_day' ? selectedMs + direction * LUNAR_DAY_MS : addCalendarMonths(selectedMs, direction);
}

export interface JumpResult {
  selectedMs: number;
  /** New scenario when the window has to shift; `null` when the target is inside it. */
  scenario: Scenario | null;
}

export function planJump(
  scenario: Scenario,
  window: ScenarioWindow,
  selectedMs: number,
  kind: JumpKind,
  direction: 1 | -1,
): JumpResult {
  const target = Math.round(jumpTarget(selectedMs, kind, direction) / 1000) * 1000;
  if (target >= window.startMs && target <= window.endMs) return { selectedMs: target, scenario: null };
  const delta = target - selectedMs;
  return {
    selectedMs: target,
    scenario: { ...scenario, start_utc: toUtc(window.startMs + delta), end_utc: toUtc(window.endMs + delta) },
  };
}

/** `true` when the resulting window stays inside the ephemeris range (unknown bounds allow it). */
export function jumpAllowed(result: JumpResult, window: ScenarioWindow, health: Health | null): boolean {
  if (!health) return true;
  const low = parseUtc(health.ephemeris_range.start_utc);
  const high = parseUtc(health.ephemeris_range.end_utc);
  const start = result.scenario ? parseUtc(result.scenario.start_utc) ?? window.startMs : window.startMs;
  const end = result.scenario ? parseUtc(result.scenario.end_utc) ?? window.endMs : window.endMs;
  return (low === null || start >= low) && (high === null || end <= high);
}
