import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { getLayer, getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import { isApiError } from '../../api/errors';
import { LAYER_REGIONS, type LayerName, type Scenario, type Site } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { recommendStore, type RecommendState } from '../../state/recommend-store';
import { scenarioStore } from '../../state/scenario-store';
import { describeError } from '../timeline/describe-error';
import { useScenario } from '../timeline/data';
import { MoonGlobeContainer, globePlaces, withPlace } from '../globe';
import { terrainAvailability } from '../terrain3d/availability';
import { SpaceScene } from '../space';
import { MapView, type LayerStatus, type MapCandidate, type MapViewMode } from './MapView';
import { normalizeLongitude, type GeoPoint } from './projection';

/** Scenario with its location moved to a custom point; dates and panel are kept. */
export function withCustomPoint(active: Scenario, point: GeoPoint): Scenario {
  const lat = Number(point.lat_deg.toFixed(6));
  const lon = Number(normalizeLongitude(point.lon_deg).toFixed(6));
  return { ...active, site_id: null, lat_deg: lat, lon_deg: lon, label: `Custom ${lat.toFixed(4)}, ${lon.toFixed(4)}` };
}

/** Scenario with its location moved to a catalogue site. */
export function withSite(active: Scenario, site: Site): Scenario {
  return { ...active, site_id: site.id, lat_deg: null, lon_deg: null, label: site.name };
}

const NO_SITES: readonly Site[] = [];

/** The 3D terrain panel and three.js load only when that view is chosen (issue #106). */
const TerrainPanel = lazy(() => import('../terrain3d'));

type Dimension = '2d' | '3d' | 'terrain' | 'space';
const DIMENSION_LABELS: Record<Dimension, string> = { '2d': '2D map', '3d': '3D Moon', terrain: '3D terrain', space: 'Space' };

/** Candidate regions of the recommend store with their rank; catalogue sites are drawn as sites. */
export function mapCandidates(sites: readonly Site[], recommend: RecommendState): MapCandidate[] {
  return globePlaces(sites, recommend)
    .filter((p) => p.kind === 'candidate')
    .map(({ id, name, lat_deg, lon_deg, rank }) => (rank !== undefined ? { id, name, lat_deg, lon_deg, rank } : { id, name, lat_deg, lon_deg }));
}

/** The server has no such layer: HTTP 503 or the `data_unavailable` code (ADR-0004, "Hata kodları"). */
export function layerMissing(error: unknown): boolean {
  return isApiError(error) && (error.status === 503 || error.code === 'data_unavailable');
}

/** Map panel: sites from `/api/sites`, layers from `/api/layers/{name}`. */
export default function MapPanel() {
  const { active } = useScenario();
  const [view, setView] = useState<MapViewMode>('overview');
  // 2D map or 3D Moon; local to the panel, so it never changes the scenario in the address bar.
  const [dimension, setDimension] = useState<Dimension>('2d');
  const [layerName, setLayerName] = useState<LayerName | null>('hillshade');
  const [picked, setPicked] = useState<GeoPoint | null>(null);
  const mode = getDataMode();

  const sites = useAsync((signal) => getSites({}, { signal }), [mode]).state;
  const recommend = useStore(recommendStore, (s) => s);
  useEffect(() => {
    if (recommendStore.getState().candidatesStatus === 'idle') void recommendStore.loadCandidates();
  }, []);
  const siteList = sites.status === 'success' ? sites.data : NO_SITES;
  const candidates = useMemo(() => mapCandidates(siteList, recommend), [siteList, recommend]);
  const regionOpen = view === 'region';
  // The permanent shadow layer is asked for as soon as the region view opens, so a missing
  // layer (503) shows as a disabled option before anyone picks it. The answer is reused when
  // the layer is picked.
  const psrState = useAsync(
    (signal) => (regionOpen ? getLayer('psr', { region: LAYER_REGIONS[0] }, { signal }) : Promise.resolve(null)),
    [regionOpen, mode],
  ).state;
  const psrAvailable = !(psrState.status === 'error' && layerMissing(psrState.error));
  // Picked before the check finished and then found missing: return to the layer shown before.
  const previousLayer = useRef<LayerName | null>(layerName === 'psr' ? null : layerName);
  useEffect(() => {
    if (layerName !== 'psr') previousLayer.current = layerName;
    else if (!psrAvailable) setLayerName(previousLayer.current);
  }, [layerName, psrAvailable]);
  const otherState = useAsync(
    (signal) =>
      regionOpen && layerName && layerName !== 'psr'
        ? getLayer(layerName, { region: LAYER_REGIONS[0] }, { signal })
        : Promise.resolve(null),
    [regionOpen, layerName, mode],
  ).state;
  const layerState = layerName === 'psr' ? psrState : otherState;

  let layer: LayerStatus = { kind: 'none' };
  if (regionOpen && layerName) {
    if (layerState.status === 'error') layer = { kind: 'unavailable', message: describeError(layerState.error) };
    else if (layerState.status === 'success' && layerState.data) layer = { kind: 'ready', grid: layerState.data };
    else layer = { kind: 'loading' };
  }

  const activePoint =
    active && active.site_id === null && active.lat_deg !== null && active.lon_deg !== null
      ? { lat_deg: active.lat_deg, lon_deg: active.lon_deg }
      : null;

  const onPickPoint = (point: GeoPoint) => {
    if (active) {
      setPicked(null);
      scenarioStore.setScenario(withCustomPoint(active, point));
    } else {
      setPicked({ lat_deg: point.lat_deg, lon_deg: normalizeLongitude(point.lon_deg) });
    }
  };

  const onPickSite = (site: Site) => {
    if (active) scenarioStore.setScenario(withSite(active, site));
  };

  const onPickCandidate = (candidate: MapCandidate) => {
    if (active) scenarioStore.setScenario(withPlace(active, { ...candidate, kind: 'candidate' }));
  };

  const terrain = terrainAvailability(active?.site_id ?? null, recommend.candidates);
  // The selection moved out of the region while the terrain was open: back to the 2D map.
  useEffect(() => {
    if (dimension === 'terrain' && !terrain.enabled) setDimension('2d');
  }, [dimension, terrain.enabled]);

  const switcher = (
    <>
      <span className="map-group map-dimension" role="group" aria-label="Map, globe, terrain or space">
        {(['2d', '3d', 'terrain', 'space'] as const).map((d) => {
          const off = d === 'terrain' && !terrain.enabled;
          return (
            <button
              key={d}
              type="button"
              className={`map-button${d === dimension ? ' is-active' : ''}`}
              aria-pressed={d === dimension}
              disabled={off}
              title={off ? terrain.reason ?? undefined : undefined}
              onClick={() => setDimension(d)}
            >
              {DIMENSION_LABELS[d]}
            </button>
          );
        })}
      </span>
      {!terrain.enabled && terrain.reason ? <p className="map-note">3D terrain: {terrain.reason}</p> : null}
    </>
  );

  if (dimension === 'terrain') {
    return (
      <section className="map-panel" aria-label="3D terrain">
        {switcher}
        <Suspense fallback={<p className="map-note">Loading the 3D terrain…</p>}>
          <TerrainPanel
            places={globePlaces(siteList, recommend)}
            selectedId={active?.site_id ?? null}
            onPick={(place) => {
              if (active) scenarioStore.setScenario(withPlace(active, place));
            }}
          />
        </Suspense>
      </section>
    );
  }

  if (dimension === 'space') {
    return (
      <section className="map-panel" aria-label="Space scene">
        {switcher}
        <SpaceScene />
      </section>
    );
  }

  if (dimension === '3d') {
    return (
      <section className="map-panel" aria-label="3D Moon">
        {switcher}
        <MoonGlobeContainer />
      </section>
    );
  }

  return (
    <section className="map-panel" aria-label="Map">
      {switcher}
      {sites.status === 'error' ? (
        <p className="map-note" role="alert">
          Sites could not be loaded: {describeError(sites.error)}
        </p>
      ) : null}
      {recommend.candidatesStatus === 'error' ? (
        <p className="map-note" role="status">
          Candidate regions could not be loaded: {describeError(recommend.candidatesError)}
        </p>
      ) : null}
      <MapView
        view={view}
        onView={setView}
        sites={sites.data ?? []}
        activeSiteId={active?.site_id ?? null}
        point={activePoint ?? picked}
        layerName={layerName}
        onLayerName={setLayerName}
        layer={layer}
        psrAvailable={psrAvailable}
        onPickPoint={onPickPoint}
        onPickSite={onPickSite}
        candidates={candidates}
        onPickCandidate={onPickCandidate}
      />
      {!active ? (
        <p className="map-note">
          {picked
            ? `Picked ${picked.lat_deg.toFixed(4)}°, ${picked.lon_deg.toFixed(4)}°. Choose dates in Scenario setup to use this point.`
            : 'Choose dates in Scenario setup; then a click on the map moves the scenario to that point.'}
        </p>
      ) : null}
    </section>
  );
}
