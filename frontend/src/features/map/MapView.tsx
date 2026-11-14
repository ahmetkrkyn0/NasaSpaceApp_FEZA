import { useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import type { LayerBounds, LayerGrid, LayerName, Site } from '../../api/types';
import { LAYER_NAMES } from '../../api/types';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { forwardSouthPolar, inverseSouthPolar, type GeoPoint } from './projection';
import { LAYER_TEXT, gridRange, layerImage } from './raster';
import './map.css';

export type MapViewMode = 'overview' | 'region';

/** Region view extent without a layer: down to this latitude around the pole. Display scale only. */
const REGION_FALLBACK_EDGE_LAT = -80;
/** Graticule of the overview, degrees. Axis scale only. */
const OVERVIEW_GRID_STEP = 30;
/** SVG units per degree in the overview, so 12 px labels stay small against the grid. */
const K = 4;
/** Graticule of the region view. */
const REGION_RING_STEP = 1;
const REGION_SPOKE_STEP = 30;

export type LayerStatus =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'ready'; grid: LayerGrid }
  | { kind: 'unavailable'; message: string };

export interface MapViewProps {
  view: MapViewMode;
  onView: (view: MapViewMode) => void;
  sites: readonly Site[];
  /** Site of the active scenario, highlighted. */
  activeSiteId: string | null;
  /** Custom point of the active scenario, or a point picked without a scenario. */
  point: GeoPoint | null;
  layerName: LayerName | null;
  onLayerName: (name: LayerName | null) => void;
  layer: LayerStatus;
  onPickPoint: (point: GeoPoint) => void;
  onPickSite: (site: Site) => void;
}

/** Click position in SVG user units. */
function svgPoint(event: ReactMouseEvent<SVGSVGElement>): { x: number; y: number } | null {
  const svg = event.currentTarget;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const local = pt.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

function regionExtent(layer: LayerStatus): LayerBounds {
  if (layer.kind === 'ready' && layer.grid.bounds) return layer.grid.bounds;
  const edge = Math.abs(forwardSouthPolar(REGION_FALLBACK_EDGE_LAT, 0).y_m);
  return { x_min: -edge, y_min: -edge, x_max: edge, y_max: edge };
}

function layerNote(layer: LayerStatus): string | null {
  if (layer.kind === 'loading') return 'Loading layer…';
  if (layer.kind === 'unavailable') return `Layer not available: ${layer.message}`;
  if (layer.kind === 'ready' && !layer.grid.bounds) {
    return 'Layer has no map bounds (example data), so it is not drawn. The grid and clicks use the projection alone.';
  }
  return null;
}

function SiteMarker({
  site,
  cx,
  cy,
  r,
  active,
  onPick,
}: {
  site: Site;
  cx: number;
  cy: number;
  r: number;
  active: boolean;
  onPick: (site: Site) => void;
}) {
  const label = `${site.name}, ${site.lat_deg.toFixed(4)}°, ${site.lon_deg.toFixed(4)}°`;
  return (
    <g
      className={`map-site map-site-${site.category}${active ? ' is-active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onPick(site);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick(site);
        }
      }}
    >
      <title>{label}</title>
      <circle cx={cx} cy={cy} r={r} />
    </g>
  );
}

/**
 * 2-D map with two views. Overview: sites on a latitude and longitude grid. Region: the
 * `mons-mouton` layers in the south polar projection, with the same sites; a click there is
 * converted back to latitude and longitude. Without a layer both views keep the grid and markers.
 */
export function MapView(props: MapViewProps) {
  const { view, onView, sites, activeSiteId, point, layerName, onLayerName, layer, onPickPoint, onPickSite } = props;
  const image = useMemo(
    () => (layer.kind === 'ready' && layer.grid.bounds && layerName ? layerImage(layer.grid, layerName) : null),
    [layer, layerName],
  );
  const note = view === 'region' ? layerNote(layer) : null;

  const picker = (
    <div className="map-toolbar">
      <span className="map-group" role="group" aria-label="Map view">
        {(['overview', 'region'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={`map-button${v === view ? ' is-active' : ''}`}
            aria-pressed={v === view}
            onClick={() => onView(v)}
          >
            {v === 'overview' ? 'Overview' : 'South pole region'}
          </button>
        ))}
      </span>
      {view === 'region' ? (
        <label className="map-layer-picker">
          <span>Layer</span>
          <select
            value={layerName ?? ''}
            onChange={(e) => onLayerName(e.currentTarget.value === '' ? null : (e.currentTarget.value as LayerName))}
          >
            <option value="">None</option>
            {LAYER_NAMES.map((name) => (
              <option key={name} value={name}>
                {LAYER_TEXT[name].label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );

  let svg;
  if (view === 'overview') {
    const lons: number[] = [];
    for (let lon = -180; lon <= 180; lon += OVERVIEW_GRID_STEP) lons.push(lon);
    const lats: number[] = [];
    for (let lat = -90; lat <= 90; lat += OVERVIEW_GRID_STEP) lats.push(lat);
    svg = (
      <svg
        className="map-svg"
        viewBox={`${-180 * K} ${-90 * K} ${360 * K} ${180 * K}`}
        role="img"
        aria-label="Site map, longitude and latitude grid. Click to pick a custom point."
        onClick={(e) => {
          const p = svgPoint(e);
          if (p) onPickPoint({ lat_deg: -p.y / K, lon_deg: p.x / K });
        }}
      >
        <rect className="map-backdrop" x={-180 * K} y={-90 * K} width={360 * K} height={180 * K} />
        {lons.map((lon) => (
          <line key={`lon${lon}`} className="map-grid" x1={lon * K} x2={lon * K} y1={-90 * K} y2={90 * K} />
        ))}
        {lats.map((lat) => (
          <line key={`lat${lat}`} className="map-grid" x1={-180 * K} x2={180 * K} y1={-lat * K} y2={-lat * K} />
        ))}
        {lats.map((lat) => (
          <text key={`latl${lat}`} className="map-grid-text" x={-178 * K} y={-lat * K - 4}>
            {`${lat}°`}
          </text>
        ))}
        {lons.map((lon) => (
          <text key={`lonl${lon}`} className="map-grid-text" x={lon * K + 4} y={88 * K}>
            {`${lon}°`}
          </text>
        ))}
        {sites.map((site) => (
          <SiteMarker
            key={site.id}
            site={site}
            cx={site.lon_deg * K}
            cy={-site.lat_deg * K}
            r={2.2 * K}
            active={site.id === activeSiteId}
            onPick={onPickSite}
          />
        ))}
        {point ? <circle className="map-point" cx={point.lon_deg * K} cy={-point.lat_deg * K} r={2.2 * K} /> : null}
      </svg>
    );
  } else {
    const extent = regionExtent(layer);
    const w = extent.x_max - extent.x_min;
    const h = extent.y_max - extent.y_min;
    const r = Math.max(w, h) / 120;
    const rings: number[] = [];
    for (let lat = -90 + REGION_RING_STEP; lat <= REGION_FALLBACK_EDGE_LAT; lat += REGION_RING_STEP) rings.push(lat);
    const spokes: number[] = [];
    for (let lon = -180; lon < 180; lon += REGION_SPOKE_STEP) spokes.push(lon);
    const outer = Math.hypot(Math.max(Math.abs(extent.x_min), Math.abs(extent.x_max)), Math.max(Math.abs(extent.y_min), Math.abs(extent.y_max)));
    const project = (lat: number, lon: number) => forwardSouthPolar(lat, lon);
    svg = (
      <svg
        className="map-svg"
        viewBox={`${extent.x_min} ${-extent.y_max} ${w} ${h}`}
        role="img"
        aria-label="South polar region map in the elevation map projection. Click to pick a custom point."
        onClick={(e) => {
          const p = svgPoint(e);
          if (p) onPickPoint(inverseSouthPolar(p.x, -p.y));
        }}
      >
        <rect className="map-backdrop" x={extent.x_min} y={-extent.y_max} width={w} height={h} />
        {image && layer.kind === 'ready' && layer.grid.bounds ? (
          <image
            href={image}
            x={layer.grid.bounds.x_min}
            y={-layer.grid.bounds.y_max}
            width={layer.grid.bounds.x_max - layer.grid.bounds.x_min}
            height={layer.grid.bounds.y_max - layer.grid.bounds.y_min}
            preserveAspectRatio="none"
            className="map-layer-image"
          />
        ) : null}
        {rings.map((lat) => {
          const radius = Math.abs(project(lat, 0).y_m);
          return radius <= outer * 1.5 ? (
            <circle key={`ring${lat}`} className={`map-grid${lat % 5 === 0 ? ' is-major' : ''}`} cx={0} cy={0} r={radius} />
          ) : null;
        })}
        {spokes.map((lon) => {
          const end = project(REGION_FALLBACK_EDGE_LAT, lon);
          return <line key={`spoke${lon}`} className="map-grid" x1={0} y1={0} x2={end.x_m} y2={-end.y_m} />;
        })}
        {sites.map((site) => {
          const p = project(site.lat_deg, site.lon_deg);
          return (
            <SiteMarker
              key={site.id}
              site={site}
              cx={p.x_m}
              cy={-p.y_m}
              r={r}
              active={site.id === activeSiteId}
              onPick={onPickSite}
            />
          );
        })}
        {point
          ? (() => {
              const p = project(point.lat_deg, point.lon_deg);
              return <circle className="map-point" cx={p.x_m} cy={-p.y_m} r={r} />;
            })()
          : null}
      </svg>
    );
  }

  const range = layer.kind === 'ready' ? gridRange(layer.grid) : null;
  return (
    <div className="map-view">
      {picker}
      <div className="map-canvas">{svg}</div>
      <div className="map-legend">
        <span className="map-key map-key-site">Site</span>
        <span className="map-key map-key-active">Selected site</span>
        <span className="map-key map-key-point">Custom point</span>
        {view === 'region' && layer.kind === 'ready' && layerName ? (
          <span className="map-legend-layer">
            {LAYER_TEXT[layerName].label}
            {range ? (
              <span className="map-data">{` ${range.min.toFixed(2)} – ${range.max.toFixed(2)}${LAYER_TEXT[layerName].unit ? ` ${LAYER_TEXT[layerName].unit}` : ''}`}</span>
            ) : null}
            {layer.grid.resolution_m !== null ? <span className="map-data">{` · ${layer.grid.resolution_m} m/px`}</span> : null}
            {layer.grid.validity ? <ValidityBadge validity={layer.grid.validity} /> : null}
          </span>
        ) : null}
      </div>
      {note ? <p className="map-note">{note}</p> : null}
    </div>
  );
}
