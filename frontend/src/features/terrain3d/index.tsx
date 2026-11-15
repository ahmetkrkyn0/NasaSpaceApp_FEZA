import { Suspense, lazy, useMemo, useState } from 'react';
import { getLayer } from '../../api/client';
import { getDataMode } from '../../api/config';
import { isApiError } from '../../api/errors';
import { LAYER_REGIONS, type LayerGrid } from '../../api/types';
import { useAsync } from '../../lib/hooks';
import { ValidityBadge } from '../../ui/ValidityBadge';
import type { GlobePlace } from '../globe/GlobeView';
import { hasWebGL } from '../globe';
import { layerPixels, LAYER_TEXT, tokenRgb } from '../map/raster';
import { nearestSample } from '../sky/geometry';
import { describeError } from '../timeline/describe-error';
import { useScenario, useSkyData } from '../timeline/data';
import { formatUtc } from '../timeline/time';
import {
  NO_SUN_NOTE,
  PSR_SURFACE_NOTE,
  SHADING_NOTE,
  SURFACE_LAYERS,
  buildTerrain,
  exaggerationNote,
  placeOnTerrain,
  sunVector,
  vertexColours,
  type SurfaceLayer,
} from './geometry';
import type { TerrainMark } from './TerrainView';
import './terrain3d.css';

export { terrainAvailability, type TerrainAvailability } from './availability';

/** three.js and the mesh code load only when the view opens (issue #106, item 6). */
const TerrainView = lazy(() => import('./TerrainView'));

function layerNote(grid: LayerGrid): string {
  const res = grid.resolution_m !== null ? `${grid.resolution_m} m cells` : 'no map resolution';
  return `${LAYER_TEXT[grid.name as keyof typeof LAYER_TEXT]?.label ?? grid.name}: ${res}${grid.bounds ? '' : ', no map bounds'}`;
}

/** Text for a layer that failed: a missing layer (503) is explained, not shown as a crash. */
export function missingText(error: unknown, what: string): string {
  if (isApiError(error) && (error.status === 503 || error.code === 'data_unavailable')) {
    return `${what} is not available on the server, so the 3D terrain cannot be drawn. The 2D map still works.`;
  }
  return `${what} could not be loaded: ${describeError(error)}`;
}

/** Places drawn on the terrain, for the keyboard list: top ranked first, then in list order. */
export function terrainPlaceList(places: readonly GlobePlace[], marks: readonly TerrainMark[]): GlobePlace[] {
  const drawn = new Set(marks.map((m) => m.id));
  return places.filter((p) => drawn.has(p.id)).sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}

/** Keyboard way to pick a mark: the same places as on the surface, in a native list. */
export function TerrainPlacePicker({ places, selectedId, onPick }: { places: readonly GlobePlace[]; selectedId: string | null; onPick: (id: string) => void }) {
  const selected = places.some((p) => p.id === selectedId);
  return (
    <label className="terrain-site">
      <span>Place</span>
      <select value={selected ? selectedId ?? '' : ''} onChange={(e) => onPick(e.currentTarget.value)} disabled={places.length === 0}>
        {!selected ? <option value="">{places.length === 0 ? 'No places on this terrain' : 'Choose a place…'}</option> : null}
        {places.map((p) => (
          <option key={p.id} value={p.id}>
            {p.rank !== undefined ? `${p.rank}. ` : ''}
            {p.name}
            {p.kind === 'candidate' ? ' (candidate)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

export interface TerrainPanelProps {
  places: readonly GlobePlace[];
  selectedId: string | null;
  onPick: (place: GlobePlace) => void;
}

/** 3D terrain of the south pole region: surface, colour layer, Sun light and marks. */
export default function TerrainPanel({ places, selectedId, onPick }: TerrainPanelProps) {
  const { active, selectedMs } = useScenario();
  const mode = getDataMode();
  const [surface, setSurface] = useState<SurfaceLayer>('hillshade');
  const webgl = useMemo(hasWebGL, []);
  const region = LAYER_REGIONS[0];

  const heights = useAsync((signal) => getLayer('elevation', { region }, { signal }), [mode]).state;
  const colour = useAsync((signal) => getLayer(surface, { region }, { signal }), [surface, mode]).state;
  const sky = useSkyData(active);

  const heightGrid = heights.status === 'success' ? heights.data : null;
  const colourGrid = colour.status === 'success' ? colour.data : null;
  const mesh = useMemo(() => (heightGrid ? buildTerrain(heightGrid) : null), [heightGrid]);
  const colours = useMemo(() => {
    if (!mesh || !heightGrid) return null;
    const grid = colourGrid ?? heightGrid;
    const name = colourGrid ? surface : 'elevation';
    return vertexColours(mesh, heightGrid, grid, layerPixels(grid, name, tokenRgb('--umbra') ?? undefined));
  }, [mesh, heightGrid, colourGrid, surface]);
  const marks: TerrainMark[] = useMemo(() => {
    if (!mesh || !heightGrid) return [];
    return places.flatMap((p) => {
      const at = placeOnTerrain(heightGrid, mesh, p.lat_deg, p.lon_deg);
      return at ? [{ id: p.id, kind: p.kind, ...(p.rank !== undefined ? { rank: p.rank } : {}), at }] : [];
    });
  }, [places, mesh, heightGrid]);

  // One sky-series request per scenario; the timeline only picks the nearest sample.
  const skyData = sky.status === 'success' ? sky.data : null;
  const sample = skyData && selectedMs !== null ? nearestSample(skyData.series, selectedMs) : null;
  const sun = useMemo(
    () =>
      sample && skyData
        ? sunVector(sample.sample.sun.azimuth_true_deg, sample.sample.sun.elevation_deg, skyData.series.lat_deg, skyData.series.lon_deg)
        : null,
    [sample, skyData],
  );

  const pick = (id: string) => {
    const place = places.find((p) => p.id === id);
    if (place) onPick(place);
  };
  const listed = useMemo(() => terrainPlaceList(places, marks), [places, marks]);

  return (
    <div className="terrain-panel">
      <div className="terrain-controls" role="group" aria-label="Surface colour">
        {SURFACE_LAYERS.map((name) => (
          <button
            key={name}
            type="button"
            className={`map-button${name === surface ? ' is-active' : ''}`}
            aria-pressed={name === surface}
            onClick={() => setSurface(name)}
          >
            {LAYER_TEXT[name].label}
          </button>
        ))}
        <TerrainPlacePicker places={listed} selectedId={selectedId} onPick={pick} />
      </div>
      {heights.status === 'error' ? (
        <p className="terrain-note" role="alert">{missingText(heights.error, 'The elevation layer')}</p>
      ) : !webgl ? (
        <p className="terrain-note" role="alert">
          3D terrain needs WebGL, which this browser does not provide. The 2D map shows the same region.
        </p>
      ) : mesh && colours ? (
        <Suspense fallback={<p className="terrain-note">Loading the 3D terrain…</p>}>
          <TerrainView mesh={mesh} colours={colours} marks={marks} selectedId={selectedId} onPick={pick} sun={sun} />
        </Suspense>
      ) : (
        <p className="terrain-note">Loading the elevation layer…</p>
      )}
      {colour.status === 'error' ? (
        <p className="terrain-note" role="status">{missingText(colour.error, `The ${LAYER_TEXT[surface].label.toLowerCase()} layer`)} Elevation grey is shown instead.</p>
      ) : null}
      <ul className="terrain-notes">
        {mesh ? <li>{exaggerationNote(mesh)}</li> : null}
        <li>{SHADING_NOTE}</li>
        {sun ? null : <li>{NO_SUN_NOTE}</li>}
        {sun && sample ? (
          <li>
            Sun {sample.sample.sun.elevation_deg.toFixed(1)}° high, azimuth {sample.sample.sun.azimuth_true_deg.toFixed(1)}° ·{' '}
            {sample.outside ? 'nearest sample ' : 'sample '}
            <span className="terrain-data">{formatUtc(sample.sample.utc)}</span>
            {sample.sample.sun.elevation_deg <= 0 ? ' · below the horizon: no direct light' : ''}
          </li>
        ) : null}
        {surface === 'psr' ? <li>{PSR_SURFACE_NOTE}</li> : null}
        {heightGrid ? (
          <li className="terrain-validity">
            {layerNote(heightGrid)} <ValidityBadge validity={heightGrid.validity ?? 'SYNTHETIC'} />
          </li>
        ) : null}
        {colourGrid && colourGrid.name !== 'elevation' ? (
          <li className="terrain-validity">
            {layerNote(colourGrid)} <ValidityBadge validity={colourGrid.validity ?? 'SYNTHETIC'} />
          </li>
        ) : null}
        {heightGrid && !heightGrid.bounds ? <li>Example grid without map bounds: sites are not placed on it.</li> : null}
        <li>Dot: landing site · square: candidate region (larger: top three of the last recommendation). Drag to turn; the Place list picks a mark with the keyboard.</li>
      </ul>
    </div>
  );
}
