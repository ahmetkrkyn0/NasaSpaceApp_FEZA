import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { getBodySeries, getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { BodySeries, Scenario, Site, Validity } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { recommendStore, type RecommendState } from '../../state/recommend-store';
import { scenarioStore } from '../../state/scenario-store';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { describeError } from '../timeline/describe-error';
import { currentOnly, useScenario } from '../timeline/data';
import { formatUtc } from '../timeline/time';
import { sunDirection, type LatLon } from './coords';
import type { GlobePlace } from './GlobeView';
import { bodySeriesRequest, lightAt } from './light';
import './globe.css';

/** three.js lives in this chunk and is only fetched when a 3D view opens (issue #105, item 4). */
const GlobeView = lazy(() => import('./GlobeView'));

/** `true` when the browser can create a WebGL context. */
export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export const LIGHTING_NOTE = 'Lighting from the computed Sun direction; no cast shadows.';
export const NO_LIGHTING_NOTE = 'Even lighting: the computed Sun direction is not loaded, so day and night are not shown.';

export interface GlobeLight {
  subSolar: LatLon | null;
  subEarth: LatLon | null;
  /** Time of the sample the light comes from. */
  utc?: string;
  /** The selected moment lies outside the series; the nearest sample is shown. */
  outside?: boolean;
  validity?: Validity;
}

export const NO_LIGHT: GlobeLight = { subSolar: null, subEarth: null };

/** Catalogue sites and loaded candidate regions as globe places, ranks from the last recommendation. */
export function globePlaces(sites: readonly Site[], recommend: RecommendState): GlobePlace[] {
  const rank = new Map<string, number>();
  recommend.ranked?.ranked.filter((r) => !r.eliminated).forEach((r, i) => rank.set(r.site_id, i + 1));
  const withRank = <T extends GlobePlace>(p: T): T => (rank.has(p.id) ? { ...p, rank: rank.get(p.id) } : p);
  return [
    ...sites.map((s) => withRank<GlobePlace>({ id: s.id, name: s.name, lat_deg: s.lat_deg, lon_deg: s.lon_deg, kind: 'site' })),
    // `catalogue` entries are the catalogue sites, already drawn as sites (#97, 4.3).
    ...(recommend.candidates?.candidates ?? [])
      .filter((c) => c.kind === 'candidate' && !sites.some((s) => s.id === c.id))
      .map((c) => withRank<GlobePlace>({ id: c.id, name: c.name, lat_deg: c.lat_deg, lon_deg: c.lon_deg, kind: 'candidate' })),
  ];
}

export interface MoonGlobeProps {
  places: readonly GlobePlace[];
  selectedId: string | null;
  onPick: (place: GlobePlace) => void;
  light: GlobeLight;
  /** Text shown above the globe, e.g. when a list failed to load. */
  note?: string | null;
}

/** Globe with its legend, notes and a keyboard place list. */
export function MoonGlobe({ places, selectedId, onPick, light, note }: MoonGlobeProps) {
  const webgl = useMemo(hasWebGL, []);
  const sun = useMemo(() => sunDirection(light.subSolar), [light.subSolar]);
  const selected = places.find((p) => p.id === selectedId) ?? null;
  // Refocus only when the selected place changes, not on every new list object.
  const focusLat = selected?.lat_deg;
  const focusLon = selected?.lon_deg;
  const focus = useMemo(
    () => (focusLat !== undefined && focusLon !== undefined ? { lat_deg: focusLat, lon_deg: focusLon } : null),
    [focusLat, focusLon],
  );
  const pick = (id: string) => {
    const place = places.find((p) => p.id === id);
    if (place) onPick(place);
  };
  const ordered = [...places].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  const hasCandidates = places.some((p) => p.kind === 'candidate');

  return (
    <div className="globe-panel">
      {!webgl ? (
        <p className="globe-note" role="alert">
          3D view needs WebGL, which this browser does not provide. The 2D map shows the same sites.
        </p>
      ) : (
        <Suspense fallback={<p className="globe-note">Loading the 3D view…</p>}>
          <GlobeView places={places} selectedId={selectedId} onPick={pick} sun={sun} subEarth={light.subEarth} focus={focus} />
        </Suspense>
      )}
      {/* Below the globe, so the countdown overlay of the Plan door never covers it. */}
      {note ? <p className="globe-note" role="status">{note}</p> : null}
      <ul className="globe-legend">
        <li>Dot: landing site · large mark: selected place</li>
        {hasCandidates ? <li>Square: candidate region (larger: top three of the last recommendation)</li> : null}
        {light.subEarth ? <li>Ring: sub-Earth point (Earth overhead)</li> : null}
        <li>Lines every 30° of latitude and longitude; drag to turn</li>
      </ul>
      <div className="globe-light">
        <p className="globe-note">{sun ? LIGHTING_NOTE : NO_LIGHTING_NOTE}</p>
        {sun && light.utc ? (
          <p className="globe-note">
            {light.outside ? 'Nearest sample: ' : 'Sample: '}
            <span className="globe-data">{formatUtc(light.utc)}</span>
          </p>
        ) : null}
        {light.validity ? <ValidityBadge validity={light.validity} /> : null}
      </div>
      <label className="globe-site">
        <span>Place</span>
        <select value={selectedId ?? ''} onChange={(e) => pick(e.currentTarget.value)} disabled={places.length === 0}>
          {selectedId === null || !selected ? <option value="">Choose a place…</option> : null}
          {ordered.map((p) => (
            <option key={p.id} value={p.id}>
              {p.rank !== undefined ? `${p.rank}. ` : ''}
              {p.name}
              {p.kind === 'candidate' ? ' (candidate)' : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const NO_SITES: readonly Site[] = [];

/** The active scenario moved to a place; a candidate id is a valid `site_id` (#97, 4.3). */
export function withPlace(active: Scenario, place: GlobePlace): Scenario {
  return { ...active, site_id: place.id, lat_deg: null, lon_deg: null, label: place.name };
}

function scenarioKey(s: Scenario | null): string {
  return s ? JSON.stringify([s.site_id, s.lat_deg, s.lon_deg, s.start_utc, s.end_utc]) : '';
}

/** Container: places from `/api/sites` and the candidate store, light from `/api/body-series`. */
export function MoonGlobeContainer() {
  const { active, window, selectedMs } = useScenario();
  const mode = getDataMode();
  const sites = useAsync((signal) => getSites({}, { signal }), [mode]).state;
  const recommend = useStore(recommendStore, (s) => s);
  useEffect(() => {
    if (recommendStore.getState().candidatesStatus === 'idle') void recommendStore.loadCandidates();
  }, []);

  // One request per scenario window; the timeline then only picks the nearest sample.
  const request = window ? bodySeriesRequest(window) : null;
  const series = currentOnly(
    useAsync<BodySeries | null>(
      (signal) => (request ? getBodySeries(request, { signal }) : Promise.resolve(null)),
      [scenarioKey(active), mode],
    ).state,
  );
  const seriesData = series.status === 'success' ? series.data : null;
  const light: GlobeLight = useMemo(() => {
    const sample = selectedMs !== null ? lightAt(seriesData, selectedMs) : null;
    return sample ? { ...sample, validity: seriesData?.validity } : NO_LIGHT;
  }, [seriesData, selectedMs]);

  const siteList = sites.status === 'success' ? sites.data : NO_SITES;
  const places = useMemo(() => globePlaces(siteList, recommend), [siteList, recommend]);
  const notes = [
    sites.status === 'error' ? `Sites could not be loaded: ${describeError(sites.error)}` : null,
    series.status === 'error' ? `Sun and Earth directions could not be loaded: ${describeError(series.error)}` : null,
    recommend.candidatesStatus === 'error' ? `Candidate regions could not be loaded: ${describeError(recommend.candidatesError)}` : null,
    !active ? 'Choose a site and dates to light the globe for a moment.' : null,
  ].filter(Boolean);

  return (
    <MoonGlobe
      places={places}
      selectedId={active?.site_id ?? null}
      light={light}
      note={notes.length > 0 ? notes.join(' ') : null}
      onPick={(place) => {
        if (active) scenarioStore.setScenario(withPlace(active, place));
      }}
    />
  );
}

/**
 * Explore and Classroom panel: the globe stays closed until asked for, so no WebGL or three.js
 * is loaded with the page.
 */
export default function GlobePanel() {
  const [open, setOpen] = useState(false);
  return (
    <section className="globe-door-panel" aria-label="3D Moon">
      <div className="globe-door-head">
        <h2 className="panel-kicker">3D Moon</h2>
        <button type="button" className="globe-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show 3D Moon'}
        </button>
      </div>
      {open ? <MoonGlobeContainer /> : <p className="globe-note">Sites on a 3D Moon. Opens on request.</p>}
    </section>
  );
}
