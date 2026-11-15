import { doorHasModes } from '../features/registry';
import { useStore } from '../lib/hooks';
import { BrandMark, PRODUCT_NAME } from './BrandMark';
import { themeStore } from './theme';
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

/** Light theme on or off (issue #92). A toggle button: `aria-pressed` says whether the light theme is on. */
export function ThemeSwitch() {
  const theme = useStore(themeStore, (s) => s.theme);
  const light = theme === 'light';
  return (
    <div className="lp-door-switch" role="group" aria-label="Theme">
      <button
        type="button"
        className="lp-door-button"
        aria-pressed={light}
        title={light ? 'Switch to the dark theme' : 'Switch to the light theme'}
        onClick={() => themeStore.toggle()}
      >
        Light theme
      </button>
    </div>
  );
}

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
      {/* Right side: the audience switch, then the theme switch. Same flex row as the left side. */}
      <div className="lp-topbar-left">
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
        <ThemeSwitch />
      </div>
    </header>
  );
}

export { DOOR_LABEL, MODE_LABEL };
