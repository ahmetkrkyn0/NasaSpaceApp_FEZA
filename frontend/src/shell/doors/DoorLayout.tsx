import type { ReactNode } from 'react';
import { PanelSlot } from '../PanelSlot';
import type { Door, Mode } from '../ui-state';
import { arrangeDoor } from './arrange';
import { DoorSummary } from './DoorSummary';
import { SitePicker } from './SitePicker';
import './doors.css';

const LEFT_LABEL: Record<Door, string> = {
  explore: 'Activities',
  classroom: 'Guided tasks',
  plan: 'Setup',
};

export interface DoorLayoutProps {
  door: Exclude<Door, 'plan'>;
  mode: Mode;
  /** Status strip of the shell, kept under the stage as in the Plan door. */
  footer?: ReactNode;
}

/**
 * Explore and Classroom layout (docs/PLAN.md, F3-C1 items 1 and 2): the horizon strip and the
 * timeline are the main screen. Explore adds the one-sentence result; Classroom keeps the
 * guided tasks column next to them, which also works while that panel is empty. Both doors have
 * a site picker, since they have no setup panel. Changing the door never writes the scenario,
 * so site, dates and the selected moment stay; only a site pick changes it.
 */
export function DoorLayout({ door, mode, footer }: DoorLayoutProps) {
  const a = arrangeDoor({ door, mode });
  const gridClass = [
    'content-grid',
    'door-grid',
    a.left.length > 0 ? 'has-left-rail' : 'no-left-rail',
    a.side.length > 0 ? 'has-right-rail' : 'no-right-rail',
  ].join(' ');
  const hasSummary = door === 'explore';
  const column = [...a.head, ...a.aside];
  const stageClass = column.length > 0 ? 'door-stage' : 'door-stage no-hud';

  return (
    <main className={gridClass} data-door-layout={door}>
      {a.left.length > 0 ? (
        <aside className="left-rail" aria-label={LEFT_LABEL[door]}>
          <PanelSlot panels={a.left} />
        </aside>
      ) : null}
      <section className="center-stage" aria-label="Main view">
        <div className={stageClass}>
          <div className="door-stage-lead">
            {/* These doors have no setup panel; the site is picked here (S-03, step 1). */}
            <SitePicker />
            {hasSummary ? <DoorSummary /> : null}
          </div>
          <div className="door-stage-main">
            <PanelSlot panels={a.stage} />
          </div>
          {column.length > 0 ? (
            <div className="door-stage-hud">
              <PanelSlot panels={column} />
            </div>
          ) : null}
        </div>
        <div className="bottom-dock" aria-label="Timeline">
          <PanelSlot panels={a.bottom} />
        </div>
        {footer}
      </section>
      {a.side.length > 0 ? (
        <aside className="right-rail" aria-label="More">
          <PanelSlot panels={a.side} />
        </aside>
      ) : null}
    </main>
  );
}
