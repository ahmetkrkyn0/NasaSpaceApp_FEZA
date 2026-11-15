import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { hasIcon } from '../ui/Icon';
import { DOORS, MODES } from '../shell/ui-state';
import { PANELS, RAIL_TAB_META, enabledTabs, selectPanels } from './registry';

// The thirteen panel folders of docs/PLAN.md, section 3.2, plus the Surface view of issue #80
// and the site recommendation of issue #109.
const PLAN_PANELS = [
  'sky', 'timeline', 'hud', 'map',
  'setup', 'power', 'comms', 'compare',
  'why', 'missions', 'tasks', 'validation', 'game',
  'scene',
  'recommend',
];

describe('panel registry', () => {
  it('lists the panels of the plan and issue #80, once each', () => {
    const ids = PANELS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...PLAN_PANELS].sort());
  });

  it('has a placeholder folder for every panel', () => {
    for (const id of PLAN_PANELS) {
      const file = fileURLToPath(new URL(`./${id}/index.tsx`, import.meta.url));
      expect(existsSync(file), file).toBe(true);
    }
  });

  it('gives every right rail panel a tab and no other panel one', () => {
    for (const panel of PANELS) {
      expect(panel.tab !== undefined, panel.id).toBe(panel.slot === 'rightRail');
    }
  });

  it('puts every panel in at least one door', () => {
    for (const panel of PANELS) {
      expect(panel.doors.length, panel.id).toBeGreaterThan(0);
    }
  });

  it('registers the mini game to Explore and the guided tasks to Classroom only', () => {
    const game = PANELS.find((p) => p.id === 'game');
    const tasks = PANELS.find((p) => p.id === 'tasks');
    expect(game?.doors).toEqual(['explore']);
    expect(tasks?.doors).toEqual(['classroom']);
  });

  it('shows in each door only the panels registered to it', () => {
    const slots = ['leftRail', 'center', 'canvasOverlay', 'rightRail', 'bottomDock'] as const;
    for (const door of DOORS) {
      for (const mode of MODES) {
        const shown = slots.flatMap((slot) => selectPanels(slot, { door, mode }));
        for (const panel of shown) {
          expect(panel.doors, `${panel.id} in ${door}`).toContain(door);
        }
      }
    }
  });

  it('keeps the game out of Plan and Classroom, and tasks out of Plan and Explore', () => {
    for (const mode of MODES) {
      const ids = (door: (typeof DOORS)[number]) =>
        selectPanels('leftRail', { door, mode }).map((p) => p.id);
      expect(ids('plan')).not.toContain('game');
      expect(ids('classroom')).not.toContain('game');
      expect(ids('plan')).not.toContain('tasks');
      expect(ids('explore')).not.toContain('tasks');
    }
  });

  it('shows the sky view and timeline in Explore and Classroom whatever the mode', () => {
    for (const door of ['explore', 'classroom'] as const) {
      for (const mode of MODES) {
        expect(selectPanels('rightRail', { door, mode }, 'sky').map((p) => p.id)).toEqual(['sky']);
        expect(selectPanels('bottomDock', { door, mode }).map((p) => p.id)).toEqual(['timeline']);
      }
    }
  });

  it('offers the why cards in all three doors', () => {
    expect(PANELS.find((p) => p.id === 'why')?.doors).toEqual(['explore', 'classroom', 'plan']);
  });

  it('keeps the Plan door split: no right rail in PLAN, no setup in ANALYZE', () => {
    expect(selectPanels('rightRail', { door: 'plan', mode: 'plan' })).toEqual([]);
    expect(selectPanels('leftRail', { door: 'plan', mode: 'analyze' })).toEqual([]);
  });

  it('enables all four tabs in the Plan door in Analyze mode', () => {
    expect(enabledTabs({ door: 'plan', mode: 'analyze' })).toEqual(['sky', 'power', 'comms', 'compare']);
  });

  it('uses icons that exist in the design export', () => {
    for (const tab of RAIL_TAB_META) {
      expect(hasIcon(tab.icon), tab.icon).toBe(true);
    }
  });
});
