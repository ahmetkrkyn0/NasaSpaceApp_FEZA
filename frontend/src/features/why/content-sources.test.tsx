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
import { isCurrent } from '../setup/shared';
import { HOOK_FACTS, HookFacts, firstFact } from './hook-facts';

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

describe('S-03 card', () => {
  it('comes first at Mons Mouton with the scenario text and its verified numbers', () => {
    const i = firstFact('mons-mouton-im2-target');
    const fact = HOOK_FACTS[i]!;
    expect(fact.id).toBe('s03-sun-crawls');
    expect(fact.text).toContain('Here the Sun wanders just above the horizon');
    expect(fact.text).toContain('Even a small crater rim can leave a lander in shadow');
    expect(renderToStaticMarkup(<HookFacts siteId="mons-mouton-im2-target" />)).toContain('6.47 degrees');
    // Other sites start from the general list.
    expect(firstFact('apollo-11', 1)).toBe(1);
    expect(firstFact(null, 1)).toBe(1);
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

  it('takes the period status first and only from answers to the current scenario (PR #72 review)', () => {
    const answer = (relay_status: (typeof RELAY_STATUSES)[number] | undefined, current = true) => ({ current, state: { data: { relay_status } } });
    expect(relayStatus(answer('intermittent'), answer('required'))).toBe('intermittent');
    // The events answer still belongs to the previous scenario: it is not read.
    expect(relayStatus(answer('required', false), answer('not_required'))).toBe('not_required');
    expect(relayStatus(answer('required', false), answer('required', false))).toBeUndefined();
    expect(relayStatus(answer(undefined), { current: false, state: { data: undefined } })).toBeUndefined();
  });

  it('tells an answer to the current parameters from one to the previous parameters', () => {
    const old = { status: 'success', data: { key: 'scenario-A', data: 1 }, error: undefined } as const;
    expect(isCurrent(old, 'scenario-A')).toBe(true);
    // The scenario changed; until the new request answers, the kept data is the previous one's.
    expect(isCurrent(old, 'scenario-B')).toBe(false);
    expect(isCurrent({ status: 'loading', data: old.data, error: undefined }, 'scenario-A')).toBe(false);
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
