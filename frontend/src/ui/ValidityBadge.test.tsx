import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SourcePopover } from './SourcePopover';
import { VALIDITY_ORDER, ValidityBadge, lowestValidity, type Validity } from './ValidityBadge';

describe('ValidityBadge', () => {
  const expected: Record<Validity, string> = {
    MEASURED: 'Measured',
    MODEL: 'Model',
    DERIVED: 'Derived',
    SYNTHETIC: 'Assumed',
  };

  it('shows a distinct text for each of the four values', () => {
    const texts = VALIDITY_ORDER.map((v) => {
      const html = renderToStaticMarkup(<ValidityBadge validity={v} />);
      expect(html).toContain(`>${expected[v]}<`);
      return expected[v];
    });
    expect(new Set(texts).size).toBe(4);
  });

  it('shows the note next to the label', () => {
    const html = renderToStaticMarkup(<ValidityBadge validity="SYNTHETIC" note="terrain not included" />);
    expect(html).toContain('Assumed');
    expect(html).toContain('terrain not included');
  });
});

describe('lowestValidity', () => {
  it('takes the lowest label among the inputs', () => {
    expect(lowestValidity(['MEASURED', 'MODEL'])).toBe('MODEL');
    expect(lowestValidity(['MODEL', 'DERIVED', 'MEASURED'])).toBe('DERIVED');
    expect(lowestValidity(['DERIVED', 'SYNTHETIC'])).toBe('SYNTHETIC');
    expect(lowestValidity(['MEASURED'])).toBe('MEASURED');
  });

  it('rejects an empty list', () => {
    expect(() => lowestValidity([])).toThrow();
  });
});

describe('SourcePopover', () => {
  it('renders the badge and keeps the source list closed at first', () => {
    const html = renderToStaticMarkup(
      <SourcePopover validity="MODEL" sources={[{ label: 'SPICE DE440' }]} />,
    );
    expect(html).toContain('Model');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('hidden=""');
    expect(html).toContain('SPICE DE440');
  });
});
