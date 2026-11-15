/**
 * Landing window game (UC-17; docs/design/mini-oyun.md).
 *
 * The player picks a landing date for a two-week mission; the server computes the mission
 * period and the result is decided by three of its metrics only: `sunlit_fraction`,
 * `longest_dark_hours` and `earth_visible_fraction`. There is no battery, heat or survival model
 * (ANALIZ-OZETI 7.5). The only arithmetic here is turning a fraction of the mission into days.
 */

import content from '../../content/game-levels.json';
import recorded from './recorded-answers.json';
import { getEvents, type RequestOptions } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { EventMetrics, RelayStatus, Scenario, Site, Validity } from '../../api/types';
import { DEFAULT_PANEL_PROFILE_ID, buildScenario, eventsRequest } from '../../state/scenario-tools';

export interface GameSource {
  label: string;
  file: string;
  row: string;
}

export interface GameGoals {
  sunlit_fraction_min: number;
  longest_dark_hours_max: number;
  earth_visible_fraction_min: number;
}

export interface GameLevel {
  id: string;
  title: string;
  site_id: string;
  /** First and last landing date the slider offers, `YYYY-MM-DD` (UTC). */
  date_min: string;
  date_max: string;
  intro: string;
  intro_source?: GameSource;
  goals: GameGoals;
  /** How the goals were checked against the product's own computation. */
  calibration: string;
  /** Said when Earth never rose during the mission, with the reason. */
  never_earth?: { text: string; source: GameSource };
}

export const MISSION_DAYS: number = content.mission_days;
export const MAST_HEIGHT_M: number = content.mast_height_m;
export const LEVELS = content.levels as GameLevel[];

const DAY_MS = 86_400_000;

/** Number of landing dates a level offers. */
export function dateCount(level: GameLevel): number {
  return Math.round((Date.parse(`${level.date_max}T00:00:00Z`) - Date.parse(`${level.date_min}T00:00:00Z`)) / DAY_MS) + 1;
}

/** Landing date `index` days after the level's first date, `YYYY-MM-DD`. */
export function dateAt(level: GameLevel, index: number): string {
  const clamped = Math.min(Math.max(Math.round(index), 0), dateCount(level) - 1);
  return new Date(Date.parse(`${level.date_min}T00:00:00Z`) + clamped * DAY_MS).toISOString().slice(0, 10);
}

export interface LevelMonth {
  /** `YYYY-MM`. */
  key: string;
  /** For example "December 2026". */
  label: string;
  /** Date indexes of the month's first and last landing date within the level. */
  first: number;
  last: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The calendar months a level's landing dates fall in, in order. */
export function levelMonths(level: GameLevel): LevelMonth[] {
  const months: LevelMonth[] = [];
  for (let i = 0; i < dateCount(level); i += 1) {
    const key = dateAt(level, i).slice(0, 7);
    const last = months[months.length - 1];
    if (last && last.key === key) last.last = i;
    else months.push({ key, label: `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`, first: i, last: i });
  }
  return months;
}

/** The month a date index falls in. */
export function monthOf(level: GameLevel, index: number): LevelMonth {
  const months = levelMonths(level);
  return months.find((m) => index >= m.first && index <= m.last) ?? months[0]!;
}

/** The mission a landing date opens: the level's site, two weeks from the landing, mast as in the level file. */
export function missionScenario(level: GameLevel, date: string, sites: readonly Pick<Site, 'id' | 'name'>[]): Scenario {
  const site = sites.find((s) => s.id === level.site_id) ?? { id: level.site_id, name: level.site_id };
  return buildScenario({
    place: { kind: 'site', site },
    start_utc: `${date}T00:00:00Z`,
    days: MISSION_DAYS,
    mast_height_m: MAST_HEIGHT_M,
    panel_profile_id: DEFAULT_PANEL_PROFILE_ID,
  });
}

/** The three metrics the result depends on. */
export type GameMetrics = Pick<EventMetrics, 'sunlit_fraction' | 'longest_dark_hours' | 'earth_visible_fraction'>;

export interface GameAnswer {
  metrics: GameMetrics;
  validity: Validity;
  relay_status: RelayStatus | null;
  /** `recorded`: the stored server answer used in example mode; `live`: asked now. */
  origin: 'live' | 'recorded';
}

/**
 * One recorded answer, kept compact because two levels span a year:
 * `[sunlit_fraction, longest_dark_hours, earth_visible_fraction, validity, relay_status]`.
 */
export type RecordedRow = [number | null, number | null, number | null, Validity, RelayStatus | null];

interface RecordedFile {
  recorded_utc: string;
  server_commit: string | null;
  /** Level id, then landing date `YYYY-MM-DD`. */
  answers: Record<string, Record<string, RecordedRow>>;
}

const RECORDED = recorded as unknown as RecordedFile;
export const RECORDED_UTC = RECORDED.recorded_utc;

/** The stored server answer for a level and date, or `null` when none was recorded. */
export function recordedAnswer(levelId: string, date: string): GameAnswer | null {
  const row = RECORDED.answers[levelId]?.[date];
  if (!row) return null;
  const [sunlit_fraction, longest_dark_hours, earth_visible_fraction, validity, relay_status] = row;
  return { metrics: { sunlit_fraction, longest_dark_hours, earth_visible_fraction }, validity, relay_status, origin: 'recorded' };
}

/**
 * The server's answer for a landing. Live mode asks `/api/events`; example mode, which has one
 * example file for every site, uses the answer recorded from the server for this level and date.
 */
export async function land(
  level: GameLevel,
  date: string,
  sites: readonly Pick<Site, 'id' | 'name'>[],
  options?: RequestOptions,
): Promise<GameAnswer> {
  if (getDataMode() === 'examples') {
    const answer = recordedAnswer(level.id, date);
    if (!answer) throw new Error(`No recorded answer for ${level.title} on ${date}. Add ?data=live to the address to ask the server.`);
    return answer;
  }
  const events = await getEvents(eventsRequest(missionScenario(level, date, sites)), options);
  const { sunlit_fraction, longest_dark_hours, earth_visible_fraction } = events.metrics;
  return {
    metrics: { sunlit_fraction, longest_dark_hours, earth_visible_fraction },
    validity: events.validity,
    relay_status: events.relay_status ?? null,
    origin: 'live',
  };
}

export type GoalKey = 'sun' | 'dark' | 'earth';

export interface GoalCheck {
  key: GoalKey;
  /** `null` when the server did not give the metric; the goal then does not count as met. */
  met: boolean | null;
}

/** Whether each goal holds. Only the three metrics are read. */
export function checkGoals(goals: GameGoals, m: GameMetrics): GoalCheck[] {
  const atLeast = (v: number | null, min: number) => (v === null ? null : v >= min);
  const atMost = (v: number | null, max: number) => (v === null ? null : v <= max);
  return [
    { key: 'sun', met: atLeast(m.sunlit_fraction, goals.sunlit_fraction_min) },
    { key: 'dark', met: atMost(m.longest_dark_hours, goals.longest_dark_hours_max) },
    { key: 'earth', met: atLeast(m.earth_visible_fraction, goals.earth_visible_fraction_min) },
  ];
}

export function stars(checks: readonly GoalCheck[]): number {
  return checks.filter((c) => c.met === true).length;
}

/** A fraction of the mission in days, one decimal (the game's only arithmetic). */
export function days(fraction: number | null): string {
  return fraction === null ? '—' : (fraction * MISSION_DAYS).toFixed(1);
}

function hours(value: number | null): string {
  return value === null ? '—' : value.toFixed(1);
}

/** The result in words (docs/design/mini-oyun.md, section 5). */
export function resultSentence(m: GameMetrics): string {
  return [
    `Your lander saw the Sun on ${days(m.sunlit_fraction)} of ${MISSION_DAYS} days.`,
    `The longest darkness lasted ${hours(m.longest_dark_hours)} hours.`,
    `It could talk to Earth on ${days(m.earth_visible_fraction)} of ${MISSION_DAYS} days.`,
  ].join(' ');
}

/** One line per goal: what was asked and what the server gave. */
export function goalLines(goals: GameGoals, m: GameMetrics): Record<GoalKey, string> {
  return {
    sun: `Sunlight: ${days(m.sunlit_fraction)} days (goal: at least ${days(goals.sunlit_fraction_min)})`,
    dark: `Longest darkness: ${hours(m.longest_dark_hours)} h (goal: at most ${goals.longest_dark_hours_max} h)`,
    earth: `Talk to Earth: ${days(m.earth_visible_fraction)} days (goal: at least ${days(goals.earth_visible_fraction_min)})`,
  };
}

/** Why the Earth goal failed, when the level knows a reason and Earth never rose. */
export function earthReason(level: GameLevel, m: GameMetrics): string | null {
  return level.never_earth && m.earth_visible_fraction === 0 ? level.never_earth.text : null;
}

export const GOALS_NOTE = 'The goals are game targets chosen to make the game playable. They are not mission requirements.';
