import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { uiStore } from '../../shell/ui-state';
import { NeedsScenario } from './shared';

afterEach(() => {
  uiStore.setDoor('plan');
  uiStore.setMode('plan');
});

describe('prompt before a scenario exists', () => {
  it('points Explore and Classroom to the site picker, with no button that does nothing there', () => {
    for (const door of ['explore', 'classroom'] as const) {
      uiStore.setDoor(door);
      const html = renderToStaticMarkup(<NeedsScenario />);
      expect(html).toContain('No scenario yet. Pick a site at the top of the main view.');
      expect(html).not.toContain('<button');
    }
  });

  it('shows no button in the Plan door in PLAN mode, where the setup panel is already open', () => {
    const html = renderToStaticMarkup(<NeedsScenario />);
    expect(html).toContain('No scenario yet. Choose a site and dates in the scenario setup.');
    expect(html).not.toContain('<button');
  });

  it('offers to open the setup from ANALYZE mode in the Plan door', () => {
    uiStore.setMode('analyze');
    const html = renderToStaticMarkup(<NeedsScenario />);
    expect(html).toContain('No scenario yet. Choose a site and dates in the scenario setup.');
    expect(html).toContain('Open scenario setup</button>');
  });
});
