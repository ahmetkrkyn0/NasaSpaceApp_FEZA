import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { getBodySeries, getEarthLink, getGroundStations, getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { BodySeries, EarthLink, GroundStation, Scenario, Site, Validity } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { recommendStore } from '../../state/recommend-store';
import { scenarioStore } from '../../state/scenario-store';
import { ValidityBadge } from '../../ui/ValidityBadge';
import type { LatLon } from '../globe/coords';
import type { GlobePlace } from '../globe/GlobeView';
import { globePlaces, hasWebGL } from '../globe';
import { bodySeriesRequest, nearestSample } from '../globe/light';
import { LinkDiagram } from '../link';
import { MODE_LABEL, earthLinkRequest, linkSentence, stationsAt } from '../link/link';
import { describeError } from '../timeline/describe-error';
import { currentOnly, useScenario } from '../timeline/data';
import { formatUtc, toUtc } from '../timeline/time';
import { earthPose, type EarthPose } from './frame';
import {
  ANTENNA_NOTE,
  CAMERA_LABELS,
  DIRECTIONS_NOTE,
  EARTH_TURN_UNAVAILABLE,
  LANDER_NOTE,
  NOT_TO_SCALE,
  NO_EARTH_NOTE,
  NO_STATION_NOTE,
  RELAY_NOTE,
  STARS_NOTE,
  linkDrawingAt,
  type CameraPreset,
  type LinkDrawing,
} from './scene-text';
import './space.css';

/** three.js and the scene load only when the scene is opened. */
const SpaceView = lazy(() => import('./SpaceView'));

export interface SpaceSceneProps {
  places: readonly GlobePlace[];
  selectedId: string | null;
  site: LatLon | null;
  stations: readonly GroundStation[];
  pose: EarthPose | null;
  /** Time of the server sample the pose comes from. */
  sampleUtc: string | null;
  seriesValidity: Validity | null;
  link: EarthLink | null;
  drawing: LinkDrawing;
  utc: string | null;
  /** Notes such as load errors, shown under the scene. */
  notes: readonly string[];
  /** `false` renders the text and the 2D link diagram only. */
  webgl: boolean;
}

/** The scene with its camera buttons, status text and notes. */
export function SpaceSceneView(props: SpaceSceneProps) {
  const { places, selectedId, site, stations, pose, sampleUtc, seriesValidity, link, drawing, utc, notes, webgl } = props;
  const [camera, setCamera] = useState<CameraPreset>('link');
  const [cameraRequest, setCameraRequest] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const status = link && utc ? linkSentence(link, utc) : 'Choose a site and dates to see who can talk to whom.';
  const inView = link && utc ? stationsAt(link, utc) : [];
  const listening = drawing.mode === 'direct' ? drawing.stationIds.map((id) => stations.find((s) => s.id === id)?.name ?? id) : [];

  return (
    <div className="space-panel">
      {webgl ? (
        <>
          <div className="space-controls">
            <span className="space-group" role="group" aria-label="Camera">
              {(['moon', 'earth', 'link'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`space-button${preset === camera ? ' is-active' : ''}`}
                  aria-pressed={preset === camera}
                  disabled={preset !== 'moon' && !pose}
                  onClick={() => {
                    setCamera(preset);
                    setCameraRequest((n) => n + 1);
                  }}
                >
                  {CAMERA_LABELS[preset]}
                </button>
              ))}
            </span>
            <label className="space-check">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.currentTarget.checked)} />
              <span>Latitude and longitude lines</span>
            </label>
          </div>
          <Suspense fallback={<p className="space-note">Loading the space scene…</p>}>
            <SpaceView
              places={places}
              selectedId={selectedId}
              site={site}
              stations={stations}
              pose={pose}
              link={drawing}
              showGrid={showGrid}
              camera={camera}
              cameraRequest={cameraRequest}
            />
          </Suspense>
        </>
      ) : (
        <>
          <p className="space-note" role="alert">
            The space scene needs WebGL, which this browser does not provide. The diagram below shows the same link.
          </p>
          {link ? <LinkDiagram mode={drawing.mode} link={link} inView={inView} /> : null}
        </>
      )}
      {/* Below the scene, where the countdown overlay of the Plan door never covers it. */}
      <p className="space-scale" role="note">
        {NOT_TO_SCALE}
      </p>
      <div className="space-status" role="status">
        {drawing.mode ? <strong className="space-mode">{MODE_LABEL[drawing.mode]}</strong> : null}
        <span>{status}</span>
        {link?.validity ? <ValidityBadge validity={link.validity} /> : null}
      </div>
      {drawing.mode === 'direct' && listening.length > 0 && pose?.rotation ? (
        <p className="space-note">Line to: {listening.join(', ')} (highlighted on Earth).</p>
      ) : null}
      {drawing.mode === 'no_station' ? <p className="space-note">{NO_STATION_NOTE}</p> : null}
      {drawing.mode === 'relay_needed' ? (
        <p className="space-note space-illustration">
          <span className="space-tag">Illustration</span> {RELAY_NOTE}
        </p>
      ) : null}
      <div className="space-light">
        <p className="space-note">{pose ? DIRECTIONS_NOTE : NO_EARTH_NOTE}</p>
        {pose && sampleUtc ? (
          <p className="space-note">
            Sample: <span className="space-data">{formatUtc(sampleUtc)}</span>
          </p>
        ) : null}
        {pose && seriesValidity ? <ValidityBadge validity={seriesValidity} /> : null}
      </div>
      <ul className="space-legend">
        <li>Cones on Earth: ground stations ({stations.map((s) => s.name).join(', ') || 'not loaded'}); green when it sees the Moon</li>
        <li>Dots on the Moon: landing sites; squares: candidate regions</li>
        <li>{ANTENNA_NOTE}</li>
        {site ? <li>{LANDER_NOTE}</li> : null}
        <li>{STARS_NOTE}</li>
      </ul>
      {notes.map((n) => (
        <p key={n} className="space-note" role="status">
          {n}
        </p>
      ))}
    </div>
  );
}

const NO_SITES: readonly Site[] = [];
const NO_STATIONS: readonly GroundStation[] = [];

function scenarioKey(s: Scenario | null): string {
  return s ? JSON.stringify([s.site_id, s.lat_deg, s.lon_deg, s.start_utc, s.end_utc, s.mast_height_m, s.earth_criterion]) : '';
}

/** Where the lander stands: the scenario's catalogue site or candidate, or its custom point. */
export function landerPlace(active: Scenario | null, places: readonly GlobePlace[]): LatLon | null {
  if (!active) return null;
  if (active.site_id) {
    const p = places.find((x) => x.id === active.site_id);
    return p ? { lat_deg: p.lat_deg, lon_deg: p.lon_deg } : null;
  }
  return active.lat_deg !== null && active.lon_deg !== null ? { lat_deg: active.lat_deg, lon_deg: active.lon_deg } : null;
}

/**
 * Container: places from `/api/sites` and the candidate store, stations from
 * `/api/ground-stations`, directions from `/api/body-series` and the link from `/api/earth-link`.
 * The series and the link are asked for once per scenario; the timeline only picks within them.
 */
export function SpaceScene() {
  const { active, window, selectedMs } = useScenario();
  const mode = getDataMode();
  const webgl = useMemo(hasWebGL, []);
  const sites = useAsync((signal) => getSites({}, { signal }), [mode]).state;
  const stations = useAsync((signal) => getGroundStations({ signal }), [mode]).state;
  const recommend = useStore(recommendStore, (s) => s);
  useEffect(() => {
    if (recommendStore.getState().candidatesStatus === 'idle') void recommendStore.loadCandidates();
  }, []);

  const key = scenarioKey(active);
  const request = window ? bodySeriesRequest(window) : null;
  const series = currentOnly(
    useAsync<BodySeries | null>((signal) => (request ? getBodySeries(request, { signal }) : Promise.resolve(null)), [key, mode]).state,
  );
  const link = currentOnly(
    useAsync<EarthLink | null>((signal) => (active ? getEarthLink(earthLinkRequest(active), { signal }) : Promise.resolve(null)), [key, mode]).state,
  );

  const seriesData = series.status === 'success' ? series.data : null;
  const linkData = link.status === 'success' ? link.data : null;
  const found = selectedMs !== null ? nearestSample(seriesData, selectedMs) : null;
  const sample = found?.sample ?? null;
  const pose = useMemo(() => (sample ? earthPose(sample) : null), [sample]);
  const utc = selectedMs !== null ? toUtc(selectedMs) : null;
  const drawing = linkDrawingAt(linkData, utc);
  // Same drawing while the window and stations stay the same, so playback does not redraw lines.
  const drawingKey = `${drawing.mode ?? ''}|${drawing.stationIds.join(',')}`;
  const stableDrawing = useMemo((): LinkDrawing => {
    const [m, ids] = drawingKey.split('|');
    return { mode: m ? (m as LinkDrawing['mode']) : null, stationIds: ids ? ids.split(',') : [] };
  }, [drawingKey]);

  const siteList = sites.status === 'success' ? sites.data : NO_SITES;
  const stationList = stations.status === 'success' ? stations.data : NO_STATIONS;
  const places = useMemo(() => globePlaces(siteList, recommend), [siteList, recommend]);
  const site = useMemo(() => landerPlace(active, places), [active, places]);
  const notes = [
    sites.status === 'error' ? `Sites could not be loaded: ${describeError(sites.error)}` : null,
    stations.status === 'error' ? `Ground stations could not be loaded: ${describeError(stations.error)}` : null,
    series.status === 'error' ? `Sun and Earth directions could not be loaded: ${describeError(series.error)}` : null,
    link.status === 'error' ? `The Earth link could not be loaded: ${describeError(link.error)}` : null,
    pose && !pose.rotation ? EARTH_TURN_UNAVAILABLE : null,
    found?.outside ? 'The selected moment is outside the loaded series; the nearest sample is shown.' : null,
  ].filter((n): n is string => Boolean(n));

  return (
    <SpaceSceneView
      places={places}
      selectedId={active?.site_id ?? null}
      site={site}
      stations={stationList}
      pose={pose}
      sampleUtc={sample?.utc ?? null}
      seriesValidity={seriesData?.validity ?? null}
      link={linkData}
      drawing={stableDrawing}
      utc={utc}
      notes={notes}
      webgl={webgl}
    />
  );
}

/** Explore and Classroom panel: closed until asked for, so no WebGL or three.js loads with the page. */
export default function SpacePanel() {
  const [open, setOpen] = useState(false);
  const active = useStore(scenarioStore, (s) => s.active);
  return (
    <section className="space-door-panel" aria-label="Space scene">
      <div className="space-door-head">
        <h2 className="panel-kicker">Earth and Moon</h2>
        <button type="button" className="space-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show space scene'}
        </button>
      </div>
      {open ? (
        <SpaceScene />
      ) : (
        <p className="space-note">
          {active ? 'Who can talk to whom: the site, Earth and the three stations in 3D. Opens on request.' : 'Earth, the Moon and the three stations in 3D. Opens on request.'}
        </p>
      )}
    </section>
  );
}
