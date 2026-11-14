/**
 * Scenario S-01 (docs/product/use-cases-and-scenarios.md, section 7.2) walked through in example
 * mode with the same functions the panels call, plus the acceptance checks of the Compare, Power
 * and Comms tabs that do not need a browser.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { getCommWindow, getHorizon, postCompare } from '../../api/client';
import { COMPARE_METRICS, displayText, displayWithUnit } from '../../api/compare-metrics';
import { configureApi, resetApiConfig } from '../../api/config';
import { panelProfilesExample, powerExample, sitesExample } from '../../api/examples';
import { createScenarioStore } from '../../state/scenario-store';
import { sameSiteAnotherDate } from '../../state/scenario-tools';
import { readScenarioParams, writeScenarioParams } from '../../state/url-sync';
import { CriterionUsed } from '../comms';
import { PowerResults } from '../power';
import { EMPTY_FORM, checkForm } from '../setup/form';
import { compareCsv, metricColumn } from './export';
import { ResultTable, addBlockedReason, compareWaitingReason } from './index';

afterEach(() => resetApiConfig());

/** Splits one CSV line, honouring double-quoted cells. */
function csvCells(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      cells.push(cell);
      cell = '';
    } else cell += ch;
  }
  cells.push(cell);
  return cells;
}

async function walkS01() {
  const store = createScenarioStore();
  // 1. Site and 1 December 2026 in the setup; ground-level flat horizon as in the reference values.
  const setup = checkForm(
    { ...EMPTY_FORM, siteId: 'mons-mouton-im2-target', startDate: '2026-12-01', mastHeight: 0 },
    sitesExample,
    panelProfilesExample,
    null,
  );
  const a = setup.scenario!;
  store.setScenario(a);
  // 2. Added to the comparison.
  expect(store.addToCompare(a)).toBe('added');
  // 3. "Same site, another date": 6 and 12 December.
  const b = sameSiteAnotherDate(a, '2026-12-06T00:00:00Z', sitesExample);
  const c = sameSiteAnotherDate(a, '2026-12-12T00:00:00Z', sitesExample);
  expect(store.addToCompare(b)).toBe('added');
  expect(store.addToCompare(c)).toBe('added');
  // 4. The three are compared.
  const response = await postCompare({ scenarios: store.getState().compare });
  return { store, a, b, c, response };
}

describe('S-01 in example mode', () => {
  it('runs from setup to three scenarios side by side', async () => {
    const { response, a, b, c } = await walkS01();
    expect(response.scenarios.map((r) => r.scenario.scenario_id)).toEqual([a.scenario_id, b.scenario_id, c.scenario_id]);
    expect(response.scenarios.map((r) => r.scenario.start_utc)).toEqual([
      '2026-12-01T00:00:00Z',
      '2026-12-06T00:00:00Z',
      '2026-12-12T00:00:00Z',
    ]);
    // 1 December matches the verified example (T2a, T2b); the other dates have no verified values.
    expect(response.scenarios[0]!.metrics).toMatchObject({ max_sun_elevation_deg: 6.47, earth_visible_fraction: 0.723 });
    expect(Object.values(response.scenarios[1]!.metrics).every((v) => v === null)).toBe(true);

    const html = renderToStaticMarkup(<ResultTable response={response} />);
    for (const m of COMPARE_METRICS) expect(html).toContain(m.label);
    expect(html).toContain('6.47°');
    expect(html).toContain('72.3 %');
  });

  it('the copied link reopens the same scenario and the same comparison list', async () => {
    const { store } = await walkS01();
    const link = writeScenarioParams(store.getState(), new URLSearchParams('door=plan'));
    const reopened = createScenarioStore();
    reopened.replaceState(readScenarioParams(new URLSearchParams(link.toString())));
    expect(reopened.getState().active).toEqual(store.getState().active);
    expect(reopened.getState().compare).toEqual(store.getState().compare);
  });
});

describe('Compare tab', () => {
  it('a fifth scenario cannot be added and the reason is given', async () => {
    const { store, a } = await walkS01();
    store.addToCompare(sameSiteAnotherDate(a, '2026-12-20T00:00:00Z', sitesExample));
    const fifth = sameSiteAnotherDate(a, '2026-12-25T00:00:00Z', sitesExample);
    expect(addBlockedReason(store.getState().compare, fifth)).toBe(
      'The comparison holds at most 4 scenarios. Remove one to add another.',
    );
    expect(store.addToCompare(fifth)).toBe('full');
    expect(addBlockedReason([], null)).toBe('Set up a scenario first.');
  });

  it('is not sent to /api/compare until it holds at least two scenarios (ADR-0004)', async () => {
    const { a, b, c } = await walkS01();
    expect(compareWaitingReason([])).toBe('Nothing to compare yet. Add the active scenario first.');
    expect(compareWaitingReason([a])).toBe(
      'Add one more scenario to see the comparison. It needs 2 to 4 scenarios.',
    );
    expect(compareWaitingReason([a, b])).toBeNull();
    expect(compareWaitingReason([a, b, c])).toBeNull();
  });

  it('says so when the scenarios carry different reliability labels', async () => {
    const { response } = await walkS01();
    const mixed = { ...response, scenarios: response.scenarios.map((r, i) => (i === 1 ? { ...r, validity: 'DERIVED' as const } : r)) };
    expect(renderToStaticMarkup(<ResultTable response={mixed} />)).toContain('different reliability labels (Assumed, Derived)');
    expect(renderToStaticMarkup(<ResultTable response={response} />)).not.toContain('different reliability labels');
  });

  it('CSV numbers are the numbers on screen; each row has place, dates and reliability label', async () => {
    const { response } = await walkS01();
    const csv = compareCsv(response, sitesExample);
    const [header, ...rows] = csv.trim().split('\r\n');
    const columns = csvCells(header!);
    const html = renderToStaticMarkup(<ResultTable response={response} />);
    response.scenarios.forEach((r, i) => {
      const cells = csvCells(rows[i]!);
      expect(cells).toHaveLength(columns.length);
      expect(cells[columns.indexOf('label')]).toBe(r.scenario.label);
      const cell = (name: string) => cells[columns.indexOf(name)];
      expect(cell('site')).toBe('Mons Mouton (IM-2 target point)');
      expect(cell('start_utc')).toBe(r.scenario.start_utc);
      expect(cell('end_utc')).toBe(r.scenario.end_utc);
      expect(cell('validity')).toBe(r.validity);
      for (const m of COMPARE_METRICS) {
        const text = displayText(m, r.metrics[m.key]);
        expect(cell(metricColumn(m.label, m.unit))).toBe(text);
        if (text !== '') expect(html).toContain(displayWithUnit(m, r.metrics[m.key]));
      }
    });
  });
});

describe('Power tab', () => {
  it('labels power results "Assumed" and shows no battery or night-survival figure', async () => {
    const { a } = await walkS01();
    const html = renderToStaticMarkup(<PowerResults scenario={a} power={powerExample} />);
    expect(html).toContain('Assumed');
    expect(html).toContain('207.6 W');
    expect(html).toContain('280.0 h');
    expect(html.toLowerCase()).not.toMatch(/battery|state of charge|survive|survival/);
  });
});

describe('Comms tab', () => {
  it('sends the chosen criterion with the request', async () => {
    const seen: string[] = [];
    configureApi({
      mode: 'live',
      fetch: (async (input: RequestInfo | URL) => {
        seen.push(String(input));
        return new Response('{}', { status: 200 });
      }) as typeof fetch,
    });
    await getCommWindow({ site_id: 'mons-mouton-im2-target', utc: '2026-12-05T00:00:00Z', earth_criterion: 'first_limb' });
    expect(seen[0]).toContain('earth_criterion=first_limb');
  });

  it('shows the criterion the answer used and flags a mismatch', () => {
    expect(renderToStaticMarkup(<CriterionUsed requested="center" used="center" />)).toContain('Centre above horizon');
    const mismatch = renderToStaticMarkup(<CriterionUsed requested="full_disk" used="center" />);
    expect(mismatch).toContain('Criterion used: <span class="data">Centre above horizon</span>');
    expect(mismatch).toContain('requested: Whole disk above horizon');
  });
});

describe('Horizon for a 5 m or 20 m mast', () => {
  it('comes back as a flat sphere horizon labelled Assumed', async () => {
    const horizon = await getHorizon({ site_id: 'mons-mouton-im2-target', mast_height_m: 20 });
    expect(horizon.method).toBe('sphere');
    expect(horizon.validity).toBe('SYNTHETIC');
  });
});
