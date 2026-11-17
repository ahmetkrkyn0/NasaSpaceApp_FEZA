import { RAIL_TAB_META, enabledTabs, selectPanels } from '../features/registry';
import { useStore } from '../lib/hooks';
import { Icon } from '../ui/Icon';
import { PanelSlot } from './PanelSlot';
import { uiStore, type RailTab } from './ui-state';

/**
 * Tab a key moves to, among the enabled tabs only (WAI-ARIA tabs pattern): the arrow keys wrap
 * around, Home and End go to the ends. Any other key, or no enabled tab, gives `null`.
 */
export function nextRailTab(enabled: readonly RailTab[], active: RailTab | undefined, key: string): RailTab | null {
  const last = enabled.length - 1;
  if (last < 0) return null;
  const index = active === undefined ? -1 : enabled.indexOf(active);
  switch (key) {
    case 'ArrowRight':
      return enabled[index < 0 || index === last ? 0 : index + 1] ?? null;
    case 'ArrowLeft':
      return enabled[index <= 0 ? last : index - 1] ?? null;
    case 'Home':
      return enabled[0] ?? null;
    case 'End':
      return enabled[last] ?? null;
    default:
      return null;
  }
}

/** Tab bar and panel area of the right rail. */
export function RailTabs() {
  const { door, mode, tab } = useStore(uiStore, (s) => s);
  const filter = { door, mode };
  const enabled = enabledTabs(filter);
  // A tab with no panels in this door cannot stay active.
  const active: RailTab | undefined = enabled.includes(tab) ? tab : enabled[0];

  return (
    <div className="lp-rail-tabs-host">
      <div
        className="lp-rail-tabs"
        role="tablist"
        aria-label="Results"
        onKeyDown={(event) => {
          const next = nextRailTab(enabled, active, event.key);
          if (next === null) return;
          event.preventDefault();
          uiStore.setTab(next);
          document.getElementById(`rail-tab-${next}`)?.focus();
        }}
      >
        {RAIL_TAB_META.map((meta) => {
          const isEnabled = enabled.includes(meta.id);
          const isActive = meta.id === active;
          return (
            <button
              key={meta.id}
              id={`rail-tab-${meta.id}`}
              type="button"
              role="tab"
              className="lp-rail-tab"
              aria-selected={isActive}
              // Only the active tab's panel is rendered, so only that tab points to one.
              aria-controls={isActive ? `rail-panel-${meta.id}` : undefined}
              tabIndex={isActive ? 0 : -1}
              disabled={!isEnabled}
              onClick={() => uiStore.setTab(meta.id)}
            >
              <Icon name={meta.icon} className="lp-rail-tab-icon" />
              <span className="lp-rail-tab-label">{meta.label}</span>
            </button>
          );
        })}
      </div>
      {active ? (
        <div
          id={`rail-panel-${active}`}
          className="lp-rail-panels"
          role="tabpanel"
          aria-labelledby={`rail-tab-${active}`}
        >
          <PanelSlot panels={selectPanels('rightRail', filter, active)} />
        </div>
      ) : null}
    </div>
  );
}
