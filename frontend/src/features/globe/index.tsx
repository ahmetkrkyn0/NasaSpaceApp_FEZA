import { Suspense, lazy, useMemo, useState } from 'react';
import { getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { Site } from '../../api/types';
import { useAsync } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { withSite } from '../map';
import { describeError } from '../timeline/describe-error';
import { useScenario } from '../timeline/data';
import { sunDirection, type LatLon } from './coords';
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
}

export interface MoonGlobeProps {
  sites: readonly Site[];
  selectedId: string | null;
  onPick: (site: Site) => void;
  light: GlobeLight;
  /** Text shown instead of the globe, e.g. when the site list failed. */
  note?: string | null;
}

/** Globe with its legend, notes and a keyboard site list. */
export function MoonGlobe({ sites, selectedId, onPick, light, note }: MoonGlobeProps) {
  const webgl = useMemo(hasWebGL, []);
  const sun = useMemo(() => sunDirection(light.subSolar), [light.subSolar]);
  const selected = sites.find((s) => s.id === selectedId) ?? null;
  const focus = useMemo(() => (selected ? { lat_deg: selected.lat_deg, lon_deg: selected.lon_deg } : null), [selected]);
  const pick = (id: string) => {
    const site = sites.find((s) => s.id === id);
    if (site) onPick(site);
  };

  return (
    <div className="globe-panel">
      {note ? <p className="globe-note">{note}</p> : null}
      {!webgl ? (
        <p className="globe-note" role="alert">
          3D view needs WebGL, which this browser does not provide. The 2D map shows the same sites.
        </p>
      ) : (
        <Suspense fallback={<p className="globe-note">Loading the 3D view…</p>}>
          <GlobeView sites={sites} selectedId={selectedId} onPick={pick} sun={sun} subEarth={light.subEarth} focus={focus} />
        </Suspense>
      )}
      <ul className="globe-legend">
        <li>Small dot: site · large dot: selected site</li>
        {light.subEarth ? <li>Ring: sub-Earth point (Earth overhead)</li> : null}
        <li>Lines every 30° of latitude and longitude; drag to turn</li>
      </ul>
      <p className="globe-note">{sun ? LIGHTING_NOTE : NO_LIGHTING_NOTE}</p>
      <label className="globe-site">
        <span>Site</span>
        <select value={selectedId ?? ''} onChange={(e) => pick(e.currentTarget.value)} disabled={sites.length === 0}>
          {selectedId === null ? <option value="">Choose a site…</option> : null}
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Light for the globe. The server's `/api/body-series` answer is wired in with #108. */
export const NO_LIGHT: GlobeLight = { subSolar: null, subEarth: null };

/** Container: sites from `/api/sites`; a pick moves the active scenario, as on the 2D map. */
export function MoonGlobeContainer() {
  const { active } = useScenario();
  const sites = useAsync((signal) => getSites({}, { signal }), [getDataMode()]).state;
  const list = sites.status === 'success' ? sites.data : [];
  const note = sites.status === 'error' ? `Sites could not be loaded: ${describeError(sites.error)}` : null;
  return (
    <MoonGlobe
      sites={list}
      selectedId={active?.site_id ?? null}
      light={NO_LIGHT}
      note={note}
      onPick={(site) => {
        if (active) scenarioStore.setScenario(withSite(active, site));
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
