import type { ComponentType } from 'react';
import type { Door, Mode, RailTab } from '../shell/ui-state';
import CommsPanel from './comms';
import ComparePanel from './compare';
import GamePanel from './game';
import HudPanel from './hud';
import MapPanel from './map';
import MissionsPanel from './missions';
import PowerPanel from './power';
import ScenePanel from './scene';
import SetupPanel from './setup';
import SkyPanel from './sky';
import TasksPanel from './tasks';
import TimelinePanel from './timeline';
import ValidationPanel from './validation';
import WhyPanel from './why';

/**
 * Where a panel mounts in the shell.
 * - leftRail: the setup column, next to the map
 * - center: the main stage (the map)
 * - canvasOverlay: floating over the main stage (the countdown)
 * - rightRail: the tabbed result column; `tab` picks the tab
 * - bottomDock: the strip under the main stage (the timeline)
 */
export type PanelSlot = 'leftRail' | 'center' | 'canvasOverlay' | 'rightRail' | 'bottomDock';

export interface PanelEntry {
  /** Folder name under src/features/. */
  id: string;
  title: string;
  slot: PanelSlot;
  /** Required for rightRail panels, absent otherwise. */
  tab?: RailTab;
  /**
   * Modes in which the panel shows. `null` means every mode. Only the Plan
   * door splits into PLAN and ANALYZE; Explore and Classroom ignore this.
   */
  modes: readonly Mode[] | null;
  /** Doors in which the panel shows. Every panel belongs to at least one. */
  doors: readonly Door[];
  component: ComponentType;
}

const ALL_DOORS: readonly Door[] = ['explore', 'classroom', 'plan'];

/**
 * Every panel of the product, in mount order within its slot. Owners fill a
 * panel by editing only its own folder (docs/PLAN.md, 3.1 rule 4 and 3.2).
 */
export const PANELS: readonly PanelEntry[] = [
  { id: 'setup', title: 'Scenario setup', slot: 'leftRail', modes: ['plan'], doors: ['plan'], component: SetupPanel },
  { id: 'missions', title: 'Past missions', slot: 'leftRail', modes: ['plan'], doors: ['plan', 'classroom'], component: MissionsPanel },
  { id: 'tasks', title: 'Guided tasks', slot: 'leftRail', modes: null, doors: ['classroom'], component: TasksPanel },
  { id: 'game', title: 'Landing window game', slot: 'leftRail', modes: null, doors: ['explore'], component: GamePanel },
  { id: 'map', title: 'Map', slot: 'center', modes: null, doors: ['plan'], component: MapPanel },
  { id: 'scene', title: 'Surface view', slot: 'center', modes: null, doors: ['explore', 'classroom'], component: ScenePanel },
  { id: 'hud', title: 'Countdown', slot: 'canvasOverlay', modes: null, doors: ALL_DOORS, component: HudPanel },
  { id: 'sky', title: 'Sky view', slot: 'rightRail', tab: 'sky', modes: ['analyze'], doors: ALL_DOORS, component: SkyPanel },
  { id: 'power', title: 'Power', slot: 'rightRail', tab: 'power', modes: ['analyze'], doors: ['plan'], component: PowerPanel },
  { id: 'comms', title: 'Earth link', slot: 'rightRail', tab: 'comms', modes: ['analyze'], doors: ['plan'], component: CommsPanel },
  { id: 'compare', title: 'Compare scenarios', slot: 'rightRail', tab: 'compare', modes: ['analyze'], doors: ['plan'], component: ComparePanel },
  { id: 'why', title: 'Why they differ', slot: 'rightRail', tab: 'compare', modes: ['analyze'], doors: ALL_DOORS, component: WhyPanel },
  { id: 'validation', title: 'Validation', slot: 'rightRail', tab: 'compare', modes: ['analyze'], doors: ['plan'], component: ValidationPanel },
  { id: 'timeline', title: 'Timeline', slot: 'bottomDock', modes: null, doors: ALL_DOORS, component: TimelinePanel },
];

export interface RailTabMeta {
  id: RailTab;
  label: string;
  /** Icon name from frontend-migrate/design-export/icons/. */
  icon: string;
}

export const RAIL_TAB_META: readonly RailTabMeta[] = [
  { id: 'sky', label: 'Sky', icon: 'terrain' },
  { id: 'power', label: 'Power', icon: 'energy' },
  { id: 'comms', label: 'Comms', icon: 'nodes' },
  { id: 'compare', label: 'Compare', icon: 'balance' },
];

export interface PanelFilter {
  door: Door;
  mode: Mode;
}

/** Only the Plan door has the PLAN and ANALYZE split. */
export function doorHasModes(door: Door): boolean {
  return door === 'plan';
}

export function isVisible(entry: PanelEntry, { door, mode }: PanelFilter): boolean {
  if (!entry.doors.includes(door)) return false;
  return !doorHasModes(door) || entry.modes === null || entry.modes.includes(mode);
}

/** Panels of one slot (and one tab, for the right rail) visible in a door and mode. */
export function selectPanels(slot: PanelSlot, filter: PanelFilter, tab?: RailTab): PanelEntry[] {
  return PANELS.filter(
    (entry) => entry.slot === slot && isVisible(entry, filter) && (tab === undefined || entry.tab === tab),
  );
}

/** Tabs that have at least one visible panel in a door and mode. */
export function enabledTabs(filter: PanelFilter): RailTab[] {
  return RAIL_TAB_META.map((meta) => meta.id).filter(
    (tab) => selectPanels('rightRail', filter, tab).length > 0,
  );
}
