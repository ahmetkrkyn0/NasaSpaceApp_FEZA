/**
 * Where each registered panel sits in the Explore and Classroom doors. The panel registry
 * decides which panels a door shows (features/registry.ts); this module only decides where
 * they go. Nothing outside the registry's list for the door is ever placed.
 */

import { selectPanels, type PanelEntry, type PanelFilter } from '../../features/registry';

/**
 * Panels that become the main stage in these doors: the horizon strip is the main screen of
 * the public door (docs/design/gosterim-ve-arayuz.md, "Üç giriş kapısı").
 */
export const STAGE_PANEL_IDS: readonly string[] = ['sky'];

export interface DoorArrangement {
  /** Side column: guided tasks, past missions, the game. */
  left: PanelEntry[];
  /** Main stage, wide: the horizon strip. */
  stage: PanelEntry[];
  /** Column beside the stage: the countdown. */
  head: PanelEntry[];
  /**
   * Centre panels of the door (the Surface view illustration), placed in the column beside the
   * stage under the countdown, so their height never pushes the horizon strip off screen.
   */
  aside: PanelEntry[];
  /** Strip under the stage: the timeline. */
  bottom: PanelEntry[];
  /** Right column: result panels that are not on the stage. */
  side: PanelEntry[];
}

export function arrangeDoor(filter: PanelFilter): DoorArrangement {
  const rail = selectPanels('rightRail', filter);
  const onStage = (entry: PanelEntry) => STAGE_PANEL_IDS.includes(entry.id);
  return {
    left: selectPanels('leftRail', filter),
    stage: rail.filter(onStage),
    head: selectPanels('canvasOverlay', filter),
    aside: selectPanels('center', filter),
    bottom: selectPanels('bottomDock', filter),
    side: rail.filter((entry) => !onStage(entry)),
  };
}
