import { useState } from 'react';
import content from '../../content/hook-facts.json';

/**
 * One-sentence hook facts of the Explore door (docs/product/audience-strategy.md, section 1).
 * Each fact cites validation rows marked "doğrulandı"; the content test checks them.
 */

export interface HookFactSource {
  label: string;
  file: string;
  row: string;
}

export interface HookFact {
  id: string;
  /** Sites the fact is about; it comes first when the active scenario is at one of them. */
  sites?: string[];
  text: string;
  sources: HookFactSource[];
}

export const HOOK_FACTS = content.facts as HookFact[];

/** First fact to show: one about the active site if there is one (S-03), else `fallback`. */
export function firstFact(siteId: string | null | undefined, fallback = 0): number {
  const bySite = siteId ? HOOK_FACTS.findIndex((f) => f.sites?.includes(siteId)) : -1;
  return bySite >= 0 ? bySite : fallback % HOOK_FACTS.length;
}

export function HookFacts({ start = 0, siteId = null }: { start?: number; siteId?: string | null }) {
  const [index, setIndex] = useState(() => firstFact(siteId, start));
  const fact = HOOK_FACTS[index]!;
  return (
    <div className="d-card" aria-label="Did you know">
      <p className="d-card-title">Did you know?</p>
      <p>{fact.text}</p>
      <p className="d-muted">Source: {fact.sources.map((s) => s.label).join('; ')}</p>
      <button type="button" className="d-button" onClick={() => setIndex((i) => (i + 1) % HOOK_FACTS.length)}>
        Another fact
      </button>
    </div>
  );
}
