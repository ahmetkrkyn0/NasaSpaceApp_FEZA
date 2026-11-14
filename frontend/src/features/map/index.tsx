import { useState } from 'react';
import { getLayer, getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import { isApiError } from '../../api/errors';
import { LAYER_REGIONS, type LayerName, type Scenario, type Site } from '../../api/types';
import { useAsync } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { describeError } from '../timeline/describe-error';
import { useScenario } from '../timeline/data';
import { MapView, type LayerStatus, type MapViewMode } from './MapView';
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

/** The server has no such layer: HTTP 503 or the `data_unavailable` code (ADR-0004, "Hata kodları"). */
export function layerMissing(error: unknown): boolean {
  return isApiError(error) && (error.status === 503 || error.code === 'data_unavailable');
}

/** Map panel: sites from `/api/sites`, layers from `/api/layers/{name}`. */
export default function MapPanel() {
  const { active } = useScenario();
  const [view, setView] = useState<MapViewMode>('overview');
  const [layerName, setLayerName] = useState<LayerName | null>('hillshade');
  const [picked, setPicked] = useState<GeoPoint | null>(null);
  const mode = getDataMode();

  const sites = useAsync((signal) => getSites({}, { signal }), [mode]).state;
  const regionOpen = view === 'region';
  // The permanent shadow layer is asked for as soon as the region view opens, so a missing
  // layer (503) shows as a disabled option before anyone picks it. The answer is reused when
  // the layer is picked.
  const psrState = useAsync(
    (signal) => (regionOpen ? getLayer('psr', { region: LAYER_REGIONS[0] }, { signal }) : Promise.resolve(null)),
    [regionOpen, mode],
  ).state;
  const psrAvailable = !(psrState.status === 'error' && layerMissing(psrState.error));
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

  return (
    <section className="map-panel" aria-label="Map">
      {sites.status === 'error' ? (
        <p className="map-note" role="alert">
          Sites could not be loaded: {describeError(sites.error)}
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
