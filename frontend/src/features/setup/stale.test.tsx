import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AsyncBlock, UPDATING_NOTE } from './shared';

const show = (n: number) => <p className="value">{n} %</p>;
const reload = () => undefined;

describe('previous answer while a new one loads (PR #135 review, item 1)', () => {
  it('shows a settled answer for the current settings as it is', () => {
    const html = renderToStaticMarkup(<AsyncBlock result={{ state: { status: 'success', data: 72, error: undefined }, reload, current: true }}>{show}</AsyncBlock>);
    expect(html).toContain('72 %');
    expect(html).not.toContain(UPDATING_NOTE);
    expect(html).not.toContain('d-stale');
  });

  it('dims and labels the previous answer while loading', () => {
    const html = renderToStaticMarkup(<AsyncBlock result={{ state: { status: 'loading', data: 72, error: undefined }, reload, current: false }}>{show}</AsyncBlock>);
    expect(html).toContain(UPDATING_NOTE);
    expect(html).toMatch(/class="d-stale"><p class="value">72 %/);
    expect(html).toContain('aria-busy="true"');
  });

  it('dims it too in the render before the new request starts, when the answer is for old settings', () => {
    const html = renderToStaticMarkup(<AsyncBlock result={{ state: { status: 'success', data: 72, error: undefined }, reload, current: false }}>{show}</AsyncBlock>);
    expect(html).toContain(UPDATING_NOTE);
    expect(html).toContain('d-stale');
  });

  it('says loading when there is no answer yet', () => {
    const html = renderToStaticMarkup(<AsyncBlock result={{ state: { status: 'loading', data: undefined, error: undefined }, reload }}>{show}</AsyncBlock>);
    expect(html).toContain('Loading…');
    expect(html).not.toContain('%');
  });
});
