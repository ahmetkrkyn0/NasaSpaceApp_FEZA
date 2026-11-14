import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getValidation } from '../../api/client';
import { findExampleProblems, validationExample } from '../../api/examples';
import type { ValidationReport, ValidationRow } from '../../api/types';
import { ValidationSummary } from './index';
import { attentionRows, countsText, diffText, expectedText, groupByTest, valueText } from './report';

/** Example rows with every status; the values are test fixtures, not product numbers. */
function row(id: string, status: ValidationRow['status'], extra: Partial<ValidationRow> = {}): ValidationRow {
  return {
    id,
    test: id.split('-')[0]!,
    title: `Row ${id}`,
    condition: 'Fixture',
    kind: status === 'info' ? 'approximate' : 'reference',
    expected: 1,
    measured: 1.5,
    diff: 0.5,
    threshold: status === 'info' ? null : 0.1,
    unit: 'deg',
    status,
    source: 'fixture',
    endpoint: null,
    note: null,
    ...extra,
  };
}

const MIXED: ValidationReport = {
  generated_utc: '2026-11-14T21:06:40Z',
  target: 'in-process',
  summary: { pass: 1, warn: 1, fail: 1, skipped: 1, info: 1 },
  rows: [row('T1-a', 'pass'), row('T1-b', 'fail'), row('T2b-c', 'warn'), row('T5-d', 'skipped'), row('T6-e', 'info')],
};

describe('validation report', () => {
  it('example mode returns the stored report, which passes the example checks', async () => {
    const report = await getValidation();
    expect(report).toEqual(validationExample);
    expect(report.rows.length).toBeGreaterThan(0);
    expect(findExampleProblems().filter((p) => p.startsWith('validation.json'))).toEqual([]);
  });

  it('lists failed, warning and skipped rows first, worst first', () => {
    expect(attentionRows(MIXED).map((r) => r.status)).toEqual(['fail', 'warn', 'skipped']);
    const t1 = groupByTest(MIXED).find((g) => g.test === 'T1')!;
    expect(t1.rows.map((r) => r.status)).toEqual(['fail', 'pass']);
    expect(countsText(t1.counts)).toBe('1 fail, 1 pass');
  });

  it('shows fail and warn rows, and marks approximate rows as not a validation', () => {
    const html = renderToStaticMarkup(<ValidationSummary report={MIXED} />);
    expect(html).toContain('Needs attention');
    expect(html).toContain('Row T1-b');
    expect(html).toContain('>Fail<');
    expect(html).toContain('>Warning<');
    expect(html).toContain('>Skipped<');
    expect(html).toContain('Approximate comparison, not a validation');
    // The test holding a failed row opens by itself.
    expect(html).toMatch(/<details class="d-details" open="">\s*<summary><span class="data">T1<\/span>/);
  });

  it('says so when nothing needs attention', () => {
    const clean = { ...MIXED, rows: [row('T1-a', 'pass')], summary: { pass: 1, warn: 0, fail: 0, skipped: 0, info: 0 } };
    expect(renderToStaticMarkup(<ValidationSummary report={clean} />)).toContain('No row failed, gave a warning or was skipped.');
  });

  it('writes values as the report gives them: times with seconds, ranges, limits', () => {
    expect(valueText('2026-12-03T10:03:14Z', 'min')).toBe('2026-12-03 10:03:14 UTC');
    expect(valueText(65.670467, 'deg')).toBe('65.670467°');
    expect(valueText(null, 'deg')).toBe('—');
    expect(expectedText(row('T7-a', 'pass', { expected: null, expected_range: [1.5, 3], unit: 'min' }))).toBe('1.5 to 3 min');
    expect(expectedText(row('T7-b', 'pass', { expected: null, expected_range: [21, null], unit: 'min' }))).toBe('at least 21 min');
    expect(diffText(row('T1-c', 'pass', { diff: -0.004569, threshold: 0.01 }))).toBe('-0.004569° (limit 0.01)');
    expect(diffText(row('T6-f', 'info', { diff: -1.481, unit: '%' }))).toBe('-1.481 %');
  });
});
