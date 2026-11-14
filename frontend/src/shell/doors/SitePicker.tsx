import { getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { Scenario, Site } from '../../api/types';
import { groupSites } from '../../features/setup/form';
import { describeError } from '../../features/timeline/describe-error';
import { formatDate, parseUtc } from '../../features/timeline/time';
import { useAsync, useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { DEFAULT_DURATION_DAYS } from '../../state/scenario-tools';
import { CUSTOM_POINT, pickerValue, scenarioForPick } from './site-pick';

export interface SitePickerViewProps {
  sites: readonly Site[];
  active: Scenario | null;
  onPick: (site: Site) => void;
  /** Loading or error text for the site list. */
  note?: string | null;
}

function datesText(active: Scenario): string {
  const start = parseUtc(active.start_utc);
  const end = parseUtc(active.end_utc);
  if (start === null || end === null) return 'Dates not available.';
  return `${formatDate(start)} to ${formatDate(end)} UTC. Change dates, mast or panel in the Plan door.`;
}

/** Site list of the Explore and Classroom doors, with the dates the scenario covers. */
export function SitePickerView({ sites, active, onPick, note }: SitePickerViewProps) {
  const value = pickerValue(active);
  return (
    <div className="door-site">
      <label className="door-site-label">
        <span>Site</span>
        <select
          className="door-site-select"
          value={value}
          disabled={sites.length === 0}
          onChange={(e) => {
            const site = sites.find((s) => s.id === e.currentTarget.value);
            if (site) onPick(site);
          }}
        >
          {value === '' ? <option value="">Choose a site…</option> : null}
          {value === CUSTOM_POINT ? <option value={CUSTOM_POINT}>Custom point (set in the Plan door)</option> : null}
          {groupSites(sites).map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p className="door-site-note">
        {note ?? (active ? datesText(active) : `Pick a site to see its sky for ${DEFAULT_DURATION_DAYS} days from today.`)}
      </p>
    </div>
  );
}

/** Container: catalogue from `/api/sites`; a pick replaces the active scenario. */
export function SitePicker() {
  const active = useStore(scenarioStore, (s) => s.active);
  const sites = useAsync((signal) => getSites({}, { signal }), [getDataMode()]).state;
  const list = sites.data ?? [];
  const note =
    sites.status === 'error'
      ? `Sites could not be loaded: ${describeError(sites.error)}`
      : list.length === 0
        ? 'Loading sites…'
        : null;
  return (
    <SitePickerView
      sites={list}
      active={active}
      note={note}
      onPick={(site) => scenarioStore.setScenario(scenarioForPick(active, site, list, Date.now()))}
    />
  );
}
