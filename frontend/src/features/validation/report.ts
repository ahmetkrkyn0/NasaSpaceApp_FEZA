/**
 * Summary of the validation report (UC-10; docs/design/dogrulama-plani.md, ADR-0004
 * "/api/validation"). Rows are shown as the report states them; nothing is recomputed here.
 */

import type { ValidationReport, ValidationRow, ValidationStatus } from '../../api/types';

/** Test names from docs/design/dogrulama-plani.md, section 4. */
export const TEST_NAME: Record<string, string> = {
  T1: 'Angles at past landings',
  T2a: 'Test site over a month: Sun',
  T2b: 'Test site over a month: Earth',
  T3: 'Panel power',
  T4: 'Horizon distance',
  T5: 'An eclipse',
  T6: 'NASA map comparison',
  T7: 'Event time sensitivity to the horizon',
};

export const STATUS_LABEL: Record<ValidationStatus, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'Fail',
  skipped: 'Skipped',
  info: 'Approximate',
};

/** Rows that need a reader's attention come first. */
const STATUS_ORDER: readonly ValidationStatus[] = ['fail', 'warn', 'skipped', 'info', 'pass'];

export const ATTENTION: readonly ValidationStatus[] = ['fail', 'warn', 'skipped'];

export function sortRows(rows: readonly ValidationRow[]): ValidationRow[] {
  return [...rows].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
}

/** Rows that failed, warned or were skipped, worst first. */
export function attentionRows(report: ValidationReport): ValidationRow[] {
  return sortRows(report.rows.filter((r) => ATTENTION.includes(r.status)));
}

export interface TestGroup {
  test: string;
  name: string;
  rows: ValidationRow[];
  counts: Partial<Record<ValidationStatus, number>>;
}

/** Rows grouped by test, in report order, each group's rows worst first. */
export function groupByTest(report: ValidationReport): TestGroup[] {
  const groups = new Map<string, ValidationRow[]>();
  for (const row of report.rows) groups.set(row.test, [...(groups.get(row.test) ?? []), row]);
  return [...groups.entries()].map(([test, rows]) => {
    const counts: Partial<Record<ValidationStatus, number>> = {};
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return { test, name: TEST_NAME[test] ?? test, rows: sortRows(rows), counts };
  });
}

/** Counts in a fixed order, for a group heading, e.g. "3 pass, 1 fail". */
export function countsText(counts: Partial<Record<ValidationStatus, number>>): string {
  return STATUS_ORDER.filter((s) => counts[s])
    .map((s) => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`)
    .join(', ');
}

function withUnit(value: number, unit: string): string {
  return unit === 'deg' ? `${value}°` : `${value} ${unit}`;
}

/** A report value as text: a number with its unit, a UTC time, or an em dash. */
export function valueText(value: number | string | null, unit: string): string {
  if (value === null) return '—';
  // Seconds are kept: event rows differ by seconds.
  if (typeof value === 'string') return value.replace('T', ' ').replace(/Z$/, ' UTC');
  return withUnit(value, unit);
}

/** Expected value, or the expected range when the row gives one. */
export function expectedText(row: ValidationRow): string {
  if (row.expected === null && row.expected_range) {
    const [low, high] = row.expected_range;
    if (low !== null && high !== null) return `${low} to ${withUnit(high, row.unit)}`;
    if (low !== null) return `at least ${withUnit(low, row.unit)}`;
    if (high !== null) return `at most ${withUnit(high, row.unit)}`;
  }
  return valueText(row.expected, row.unit);
}

/** Difference and the threshold it is held to, e.g. "0.0047 deg (limit 0.01)". */
export function diffText(row: ValidationRow): string {
  if (row.diff === null) return '—';
  const limit = row.threshold === null ? '' : ` (limit ${row.threshold})`;
  return `${withUnit(row.diff, row.unit)}${limit}`;
}
