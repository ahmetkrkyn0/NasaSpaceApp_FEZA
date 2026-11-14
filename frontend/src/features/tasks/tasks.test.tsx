import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sitesExample } from '../../api/examples';
import { scenarioDays } from '../../state/scenario-tools';
import { MAX_DURATION_DAYS } from '../../state/scenario-tools';
import TasksPanel, { AnswerTable, TaskExplanation } from './index';
import { GUIDED_TASKS, fetchTaskAnswers, taskScenarios, taskState } from './tasks';

const REPO = new URL('../../../../', import.meta.url);

/** Cells of the table row whose first cell is `row` in a validation file. */
function rowCells(file: string, row: string): string[] | null {
  const text = readFileSync(fileURLToPath(new URL(file, REPO)), 'utf8');
  for (const line of text.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells[1] === row) return cells;
  }
  return null;
}

/** Mission names that contain digits are names, not numbers. */
const NAMES = ["Chang'e 4"];

describe('guided tasks content', () => {
  it('has the four tasks of the audience strategy', () => {
    expect(GUIDED_TASKS.map((t) => t.id)).toEqual(['why-poles', 'never-sunlit', 'earth-stays', 'no-air']);
  });

  it('writes no numbers in titles, questions or explanations', () => {
    for (const t of GUIDED_TASKS) {
      for (const text of [t.title, t.question, t.explanation, t.table_note ?? '', ...t.sources.map((s) => s.label)]) {
        const stripped = NAMES.reduce((acc, name) => acc.replaceAll(name, ''), text);
        expect(stripped, `${t.id}: ${text}`).not.toMatch(/\d/);
      }
    }
  });

  it('backs every explanation with rows marked "doğrulandı" in the validation tables', () => {
    for (const t of GUIDED_TASKS) {
      expect(t.sources.length).toBeGreaterThan(0);
      for (const s of t.sources) {
        const cells = rowCells(s.file, s.row);
        expect(cells, `${t.id}: ${s.file} row ${s.row}`).not.toBeNull();
        expect(cells, `${t.id}: ${s.file} row ${s.row}`).toContain('doğrulandı');
      }
    }
  });

  it('presets catalogue sites and periods the server accepts', () => {
    for (const t of GUIDED_TASKS) {
      for (const id of t.sites) expect(sitesExample.some((s) => s.id === id), `${t.id}: ${id}`).toBe(true);
      const scenarios = taskScenarios(t, sitesExample);
      expect(scenarios).toHaveLength(t.sites.length);
      for (const s of scenarios) {
        expect(scenarioDays(s)).toBe(t.days);
        expect(t.days).toBeLessThanOrEqual(MAX_DURATION_DAYS);
        expect(s.mast_height_m).toBe(0);
      }
    }
  });
});

describe('guided task review fixes (PR #66)', () => {
  it('says the crater task numbers are for the ridge site, not a crater floor', async () => {
    const crater = GUIDED_TASKS.find((t) => t.id === 'never-sunlit')!;
    const answers = await fetchTaskAnswers(taskScenarios(crater, sitesExample));
    const html = renderToStaticMarkup(<AnswerTable task={crater} answers={answers} sites={sitesExample} />);
    expect(html).toContain('These values are for the ridge site, Mons Mouton');
    const poles = GUIDED_TASKS.find((t) => t.id === 'why-poles')!;
    expect(renderToStaticMarkup(<AnswerTable task={poles} answers={[]} sites={sitesExample} />)).not.toContain('ridge site');
  });

  it('keeps the task buttons off until the site list has loaded', () => {
    const html = renderToStaticMarkup(<TasksPanel />);
    expect(html.match(/disabled=""/g)).toHaveLength(GUIDED_TASKS.length);
    expect(html).toContain('Loading the site list');
  });
});

describe('guided task state and answer', () => {
  it('opening a task sets its first site and start; two sites go to the comparison', () => {
    const poles = GUIDED_TASKS.find((t) => t.id === 'why-poles')!;
    const scenarios = taskScenarios(poles, sitesExample);
    const state = taskState(scenarios);
    expect(state.active?.site_id).toBe('mons-mouton-im2-target');
    expect(state.selected_utc).toBe('2026-12-01T00:00:00Z');
    expect(state.compare.map((s) => s.site_id)).toEqual(['mons-mouton-im2-target', 'apollo-11']);
    const air = GUIDED_TASKS.find((t) => t.id === 'no-air')!;
    expect(taskState(taskScenarios(air, sitesExample)).compare).toEqual([]);
  });

  it('shows the server numbers for the preset, with their reliability label, and the sources', async () => {
    const earth = GUIDED_TASKS.find((t) => t.id === 'earth-stays')!;
    const answers = await fetchTaskAnswers(taskScenarios(earth, sitesExample));
    const html = renderToStaticMarkup(<AnswerTable task={earth} answers={answers} sites={sitesExample} />);
    // Example mode answers with data/examples/events.json: Mons Mouton, December 2026 (T2b).
    expect(html).toContain('72.3 %');
    expect(html).toContain('Earth in view');
    // The example file is Mons Mouton only: Chang'e 4 gets no number under its name.
    expect(answers.map((a) => a.events !== null)).toEqual([true, false]);
    expect(html.match(/72\.3 %/g)).toHaveLength(1);
    expect(html).toContain('the example files have no answer for this site');
    expect(html).toContain('Assumed');
    const text = renderToStaticMarkup(<TaskExplanation task={earth} />);
    for (const s of earth.sources) expect(text).toContain(s.label.replaceAll("'", '&#x27;'));
  });
});
