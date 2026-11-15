import { getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { Scenario, Site } from '../../api/types';
import { groupSites } from '../../features/setup/form';
import { describeError } from '../../features/timeline/describe-error';
import { formatDate, parseUtc } from '../../features/timeline/time';
import { useEffect } from 'react';
import { useAsync, useStore } from '../../lib/hooks';
import { recommendStore } from '../../state/recommend-store';
import { scenarioStore } from '../../state/scenario-store';
import { DEFAULT_DURATION_DAYS } from '../../state/scenario-tools';
import { CUSTOM_POINT, applyPick, candidateOptions, pickerValue, unlistedOption, type PickPlace } from './site-pick';

export interface SitePickerViewProps {
  sites: readonly Site[];
  /** Loaded candidate regions not in the catalogue (`candidateOptions`). */
  candidates?: readonly PickPlace[];
  active: Scenario | null;
  onPick: (site: PickPlace) => void;
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
export function SitePickerView({ sites, candidates = [], active, onPick, note }: SitePickerViewProps) {
  const value = pickerValue(active);
  const unlisted = unlistedOption(active, sites, candidates);
  return (
    <div className="door-site">
      <label className="door-site-label">
        <span>Site</span>
        <select
          className="door-site-select"
          value={value}
          disabled={sites.length === 0}
          onChange={(e) => {
            const id = e.currentTarget.value;
            const place = sites.find((s) => s.id === id) ?? candidates.find((c) => c.id === id);
            if (place) onPick(place);
          }}
        >
          {value === '' ? <option value="">Choose a site…</option> : null}
          {value === CUSTOM_POINT ? <option value={CUSTOM_POINT}>Custom point (set in the Plan door)</option> : null}
          {unlisted ? <option value={unlisted.id}>{unlisted.name}</option> : null}
          {groupSites(sites).map((group) => (
            <optgroup key={group.category} label={group.label}>
              {group.sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
          {candidates.length > 0 ? (
            <optgroup label="Candidate regions">
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ) : null}
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
  // Only a list from a finished request can be picked from; a reload or a failed request
  // never leaves the previous list selectable.
  const list = sites.status === 'success' ? sites.data : [];
  const loaded = useStore(recommendStore, (s) => s.candidates);
  useEffect(() => {
    if (recommendStore.getState().candidatesStatus === 'idle') void recommendStore.loadCandidates();
  }, []);
  const candidates = candidateOptions(list, loaded?.candidates ?? []);
  const note =
    sites.status === 'error'
      ? `Sites could not be loaded: ${describeError(sites.error)}`
      : sites.status !== 'success'
        ? 'Loading sites…'
        : list.length === 0
          ? 'No sites in the catalogue.'
          : null;
  return (
    <SitePickerView
      sites={list}
      candidates={candidates}
      active={active}
      note={note}
      onPick={(site) => applyPick(scenarioStore, site, [...list, ...candidates], Date.now())}
    />
  );
}
