import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { RailTabs, nextRailTab } from './RailTabs';
import { RAIL_TABS, uiStore, type RailTab } from './ui-state';

const ALL: readonly RailTab[] = RAIL_TABS;

describe('keyboard movement between the result tabs', () => {
  it('moves right and left by one tab', () => {
    expect(nextRailTab(ALL, 'sky', 'ArrowRight')).toBe('power');
    expect(nextRailTab(ALL, 'comms', 'ArrowLeft')).toBe('power');
  });

  it('wraps around at both ends', () => {
    expect(nextRailTab(ALL, 'compare', 'ArrowRight')).toBe('sky');
    expect(nextRailTab(ALL, 'sky', 'ArrowLeft')).toBe('compare');
  });

  it('goes to the first and last tab with Home and End', () => {
    expect(nextRailTab(ALL, 'comms', 'Home')).toBe('sky');
    expect(nextRailTab(ALL, 'power', 'End')).toBe('compare');
  });

  it('skips the tabs that are not enabled', () => {
    const enabled: RailTab[] = ['sky', 'compare'];
    expect(nextRailTab(enabled, 'sky', 'ArrowRight')).toBe('compare');
    expect(nextRailTab(enabled, 'compare', 'ArrowRight')).toBe('sky');
    expect(nextRailTab(enabled, 'sky', 'ArrowLeft')).toBe('compare');
  });

  it('ignores every other key and an empty tab list', () => {
    expect(nextRailTab(ALL, 'sky', 'Enter')).toBeNull();
    expect(nextRailTab(ALL, 'sky', 'ArrowDown')).toBeNull();
    expect(nextRailTab([], undefined, 'ArrowRight')).toBeNull();
  });
});

describe('result tab bar', () => {
  afterEach(() => {
    uiStore.setMode('plan');
    uiStore.setTab('sky');
  });

  it('points only the active tab to a panel, since only that panel is drawn', () => {
    uiStore.setMode('analyze');
    uiStore.setTab('power');
    const html = renderToStaticMarkup(<RailTabs />);
    const controls = html.match(/aria-controls="[^"]*"/g) ?? [];
    expect(controls).toEqual(['aria-controls="rail-panel-power"']);
    expect(html).toContain('id="rail-panel-power"');
  });
});
