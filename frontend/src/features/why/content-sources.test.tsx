/**
 * F3-D1 content rules: a hook fact or card number without a source row marked "doğrulandı" is
 * not added (PLAN 4.1, rule 7). The rows are read from the validation tables themselves.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getCommWindow, getSites } from '../../api/client';
import { RELAY_STATUSES } from '../../api/types';
import { relayStatus } from '../comms';
import { RELAY_EXAMPLE, RELAY_LABEL, RelayLabel } from '../comms/relay';
import { InfoCards } from '../setup';
import { HOOK_FACTS, HookFacts } from './hook-facts';

const REPO = new URL('../../../../', import.meta.url);

function rowCells(file: string, row: string): string[] | null {
  const text = readFileSync(fileURLToPath(new URL(file, REPO)), 'utf8');
  for (const line of text.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells[1] === row) return cells;
  }
  return null;
}

function expectVerified(file: string, row: string, what: string) {
  const cells = rowCells(file, row);
  expect(cells, `${what}: ${file} row ${row}`).not.toBeNull();
  expect(cells, `${what}: ${file} row ${row}`).toContain('doğrulandı');
}

describe('hook facts', () => {
  it('every fact cites at least one row marked "doğrulandı"', () => {
    expect(HOOK_FACTS.length).toBeGreaterThan(0);
    for (const fact of HOOK_FACTS) {
      expect(fact.sources.length, fact.id).toBeGreaterThan(0);
      for (const s of fact.sources) expectVerified(s.file, s.row, fact.id);
    }
  });

  it('ids are unique and the card shows the fact with its source', () => {
    expect(new Set(HOOK_FACTS.map((f) => f.id)).size).toBe(HOOK_FACTS.length);
    const html = renderToStaticMarkup(<HookFacts start={1} />);
    expect(html).toContain('Did you know?');
    expect(html).toContain(HOOK_FACTS[1]!.text.replaceAll("'", '&#x27;'));
    expect(html).toContain('Source: ');
  });
});

describe('relay label', () => {
  it('names every status the contract allows, and hides when the answer has none', () => {
    for (const status of RELAY_STATUSES) expect(renderToStaticMarkup(<RelayLabel status={status} />)).toContain(RELAY_LABEL[status]);
    expect(renderToStaticMarkup(<RelayLabel status={undefined} />)).toBe('');
  });

  it('shows "Relay required" with the design text and the verified Queqiao example', async () => {
    const relay = await getCommWindow({ site_id: 'change-4', utc: '2019-01-03T02:26:00Z' });
    expect(relay.relay_status).toBe('required');
    const html = renderToStaticMarkup(<RelayLabel status={relay.relay_status} />);
    expect(html).toContain('Relay required');
    expect(html).toContain('a relay satellite is needed');
    expect(html).toContain('Queqiao');
    expectVerified(RELAY_EXAMPLE.source.file, RELAY_EXAMPLE.source.row, 'Queqiao');
    expect(renderToStaticMarkup(<RelayLabel status="intermittent" />)).not.toContain('Queqiao');
  });

  it('takes the period status first and ignores answers that are still loading', () => {
    const settled = (relay_status: (typeof RELAY_STATUSES)[number]) => ({ status: 'success', data: { relay_status } });
    expect(relayStatus(settled('intermittent'), settled('required'))).toBe('intermittent');
    expect(relayStatus({ status: 'loading', data: { relay_status: 'required' } }, settled('not_required'))).toBe('not_required');
    expect(relayStatus({ status: 'success', data: {} }, { status: 'loading', data: undefined })).toBeUndefined();
  });
});

describe('CSA info cards', () => {
  it('show on the sites whose record carries them, with agency and source', async () => {
    const sites = await getSites();
    const withCards = sites.filter((s) => s.cards && s.cards.length > 0);
    expect(withCards.map((s) => s.id)).toEqual(['apollo-11', 'blue-ghost-1']);
    for (const site of withCards) {
      const html = renderToStaticMarkup(<InfoCards cards={site.cards} />);
      for (const card of site.cards!) {
        expect(html).toContain(`>${card.agency}</span>`);
        expect(html).toContain(card.source.label);
      }
    }
    expect(renderToStaticMarkup(<InfoCards cards={undefined} />)).toBe('');
  });
});
