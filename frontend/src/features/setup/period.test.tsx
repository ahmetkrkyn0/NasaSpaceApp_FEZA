import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScenarioPeriod } from './shared';

describe('scenario period line (#107, item 3)', () => {
  it('shows the name, then the period', () => {
    const html = renderToStaticMarkup(<ScenarioPeriod label="Mons Mouton" start_utc="2026-12-01T00:00:00Z" end_utc="2026-12-31T00:00:00Z" />);
    expect(html).toContain('<span class="data">Mons Mouton</span>, ');
    expect(html).toContain(' to ');
  });

  it('never starts with a comma when the name is empty or blank', () => {
    for (const label of ['', '   ']) {
      const html = renderToStaticMarkup(<ScenarioPeriod label={label} start_utc="2026-12-01T00:00:00Z" end_utc="2026-12-31T00:00:00Z" />);
      const text = html.replace(/<[^>]+>/g, '');
      expect(text.startsWith('From ')).toBe(true);
      expect(text).not.toMatch(/^\s*,/);
    }
  });
});
