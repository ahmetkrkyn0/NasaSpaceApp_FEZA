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
  text: string;
  sources: HookFactSource[];
}

export const HOOK_FACTS = content.facts as HookFact[];

export function HookFacts({ start = 0 }: { start?: number }) {
  const [index, setIndex] = useState(start % HOOK_FACTS.length);
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
