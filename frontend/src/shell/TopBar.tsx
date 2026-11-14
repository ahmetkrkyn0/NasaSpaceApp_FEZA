import { doorHasModes } from '../features/registry';
import { useStore } from '../lib/hooks';
import { BrandMark, PRODUCT_NAME } from './BrandMark';
import { DOORS, MODES, uiStore, type Door, type Mode } from './ui-state';

const DOOR_LABEL: Record<Door, string> = {
  explore: 'Explore',
  classroom: 'Classroom',
  plan: 'Plan',
};

const DOOR_HINT: Record<Door, string> = {
  explore: 'For everyone: the sky above a landing site',
  classroom: 'For teachers: guided tasks on the same data',
  plan: 'For engineers: set up and compare scenarios',
};

const MODE_LABEL: Record<Mode, string> = {
  plan: 'PLAN',
  analyze: 'ANALYZE',
};

const MODE_HINT: Record<Mode, string> = {
  plan: 'Set up the scenario',
  analyze: 'Inspect the results',
};

export function TopBar() {
  const door = useStore(uiStore, (s) => s.door);
  const mode = useStore(uiStore, (s) => s.mode);

  return (
    <header className="lp-topbar">
      <div className="lp-topbar-left">
        <span className="lp-brand">
          <BrandMark size={24} />
          <span className="lp-brand-name">{PRODUCT_NAME}</span>
        </span>
        {doorHasModes(door) ? (
          <div className="lp-mode-switch" role="group" aria-label="Mode">
            {MODES.map((value) => (
              <button
                key={value}
                type="button"
                className="lp-mode-button"
                aria-pressed={mode === value}
                title={MODE_HINT[value]}
                onClick={() => uiStore.setMode(value)}
              >
                {MODE_LABEL[value]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="lp-door-switch" role="group" aria-label="Audience">
        {DOORS.map((value) => (
          <button
            key={value}
            type="button"
            className="lp-door-button"
            aria-pressed={door === value}
            title={DOOR_HINT[value]}
            onClick={() => uiStore.setDoor(value)}
          >
            {DOOR_LABEL[value]}
          </button>
        ))}
      </div>
    </header>
  );
}

export { DOOR_LABEL, MODE_LABEL };
