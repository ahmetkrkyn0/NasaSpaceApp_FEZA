import { doorHasModes, selectPanels } from '../features/registry';
import { useStore } from '../lib/hooks';
import { DoorLayout } from './doors/DoorLayout';
import { PanelSlot } from './PanelSlot';
import { RailTabs } from './RailTabs';
import { DOOR_LABEL, TopBar } from './TopBar';
import { uiStore } from './ui-state';

/**
 * Screen frame: top bar, optional left rail, main stage with overlay,
 * bottom dock and status strip, optional right rail
 * (docs/design/gosterim-ve-arayuz.md, "Ekran iskeleti").
 */
export function Shell() {
  const door = useStore(uiStore, (s) => s.door);
  const mode = useStore(uiStore, (s) => s.mode);
  const filter = { door, mode };

  const statusBar = (
    <footer className="lp-status-bar">
      <span className="lp-status-item">{DOOR_LABEL[door]} door</span>
      {doorHasModes(door) ? (
        <span className="lp-status-item">{mode === 'plan' ? 'Plan' : 'Analyze'} mode</span>
      ) : null}
    </footer>
  );

  // Explore and Classroom have their own layout (shell/doors/); the grid below is the Plan door.
  if (door !== 'plan') {
    return (
      <div className="app-shell" data-door={door} data-mode={mode}>
        <TopBar />
        <DoorLayout door={door} mode={mode} footer={statusBar} />
      </div>
    );
  }

  const left = selectPanels('leftRail', filter);
  const center = selectPanels('center', filter);
  const overlay = selectPanels('canvasOverlay', filter);
  const bottom = selectPanels('bottomDock', filter);
  const hasRight = selectPanels('rightRail', filter).length > 0;

  const gridClass = [
    'content-grid',
    left.length > 0 ? 'has-left-rail' : 'no-left-rail',
    hasRight ? 'has-right-rail' : 'no-right-rail',
  ].join(' ');

  return (
    <div className="app-shell" data-door={door} data-mode={mode}>
      <TopBar />
      <main className={gridClass}>
        {left.length > 0 ? (
          <aside className="left-rail" aria-label="Setup">
            <PanelSlot panels={left} />
          </aside>
        ) : null}
        <section className="center-stage" aria-label="Main view">
          <div className="map-stage">
            <div className="map-overlay">
              <PanelSlot panels={overlay} />
            </div>
            <div className="map-canvas-shell">
              <PanelSlot panels={center} />
            </div>
          </div>
          <div className="bottom-dock" aria-label="Timeline">
            <PanelSlot panels={bottom} />
          </div>
          {statusBar}
        </section>
        {hasRight ? (
          <aside className="right-rail" aria-label="Results">
            <RailTabs />
          </aside>
        ) : null}
      </main>
    </div>
  );
}
