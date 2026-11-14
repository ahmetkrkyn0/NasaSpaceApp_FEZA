import { RAIL_TAB_META, enabledTabs, selectPanels } from '../features/registry';
import { useStore } from '../lib/hooks';
import { Icon } from '../ui/Icon';
import { PanelSlot } from './PanelSlot';
import { uiStore, type RailTab } from './ui-state';

/** Tab bar and panel area of the right rail. */
export function RailTabs() {
  const { door, mode, tab } = useStore(uiStore, (s) => s);
  const filter = { door, mode };
  const enabled = enabledTabs(filter);
  // A tab with no panels in this door cannot stay active.
  const active: RailTab | undefined = enabled.includes(tab) ? tab : enabled[0];

  return (
    <div className="lp-rail-tabs-host">
      <div className="lp-rail-tabs" role="tablist" aria-label="Results">
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
              aria-controls={`rail-panel-${meta.id}`}
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
