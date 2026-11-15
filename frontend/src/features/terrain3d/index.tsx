import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { getLayer } from '../../api/client';
import { getDataMode } from '../../api/config';
import { isApiError } from '../../api/errors';
import { LAYER_REGIONS, type LayerGrid } from '../../api/types';
import { useAsync } from '../../lib/hooks';
import { ValidityBadge } from '../../ui/ValidityBadge';
import type { GlobePlace } from '../globe/GlobeView';
import { hasWebGL } from '../globe';
import { forwardSouthPolar } from '../map/projection';
import { layerPixels, LAYER_TEXT, tokenRgb } from '../map/raster';
import { nearestSample } from '../sky/geometry';
import { describeError } from '../timeline/describe-error';
import { useScenario, useSkyData } from '../timeline/data';
import { formatUtc } from '../timeline/time';
import {
  NO_SUN_NOTE,
  PSR_SURFACE_NOTE,
  SURFACE_LAYERS,
  VERTICAL_EXAGGERATION,
  buildTerrain,
  exaggerationNote,
  heightAt,
  meshHeightAt,
  placeOnTerrain,
  vertexColours,
  type ScenePoint,
  type SurfaceLayer,
  type TerrainMesh,
} from './geometry';
import { centreSunSine, exposureFor, hiddenShare, plainColours, sunlitColours, tintHidden, vertexNormals } from './lighting';
import {
  bodyFromSite,
  bodyVisibility,
  directionToNearBody,
  prepareTerrain,
  toSceneAxes,
  type SkyBody,
  type SurfacePoint,
  type Visibility,
} from './shadow';
import type { TerrainCamera, TerrainMark, TerrainRay, TerrainSky } from './TerrainView';
import { cursorReadout, readoutText } from './readout';
import { useVisibilityMaps } from './use-visibility';
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

/** Shown while the computed light is on. */
export const LIGHT_NOTE =
  'Sunlight and cast shadows are drawn in the browser from the height map and the Sun direction the server gave for the selected site. A drawing derived from the map, not a server result.';
export const EVEN_LIGHT_NOTE = 'Even light: the layer colours as they are; cast shadows are not drawn.';
export const WINDOW_NOTE =
  'Only this map casts shadows: terrain outside it is not included, so a far ridge can still hide the Sun where the map shows light.';
export const EARTH_MASK_NOTE =
  'Tinted ground: less than half of the Earth disk is above the terrain there, so no direct link from that ground.';
export const STAND_NOTE = 'Standing view: true heights, eye at the mast height over the selected site. Drag to look around.';
export const SKY_NOTE =
  'Sun and Earth are drawn at their apparent size, in the direction the server gave for the selected site; the glow around the Sun only helps to find it. The arrow points along the ground towards the Sun; a line with a cone marks the ground that hides a body from the site.';

/** The server's value and this map's value differ by more than this: the map is marked approximate (design note, 13.2). */
export const AGREEMENT_LIMIT = 0.1;

const KM_PER_M = 0.001;

const percent = (fraction: number) => `${Math.round(fraction * 100)} %`;

/** One line comparing the share of a disk seen at the site on this map with the server's value. */
export function agreementText(body: 'Sun' | 'Earth', here: number, server: number): { text: string; agrees: boolean } {
  const agrees = Math.abs(here - server) <= AGREEMENT_LIMIT;
  return {
    agrees,
    text: `${body} disk in view at the selected site: ${percent(here)} on this map, ${percent(server)} from the server${agrees ? '' : '. Approximate: they differ'}.`,
  };
}

/** Scene point of a map point on the drawn surface. */
function onSurface(mesh: TerrainMesh, x_m: number, y_m: number): ScenePoint | null {
  if (!mesh.centre_m) return null;
  const x = (x_m - mesh.centre_m.x) * KM_PER_M;
  const z = -(y_m - mesh.centre_m.y) * KM_PER_M;
  return { x, y: meshHeightAt(mesh, x, z), z };
}

export interface TerrainPanelProps {
  places: readonly GlobePlace[];
  selectedId: string | null;
  onPick: (place: GlobePlace) => void;
}

/** 3D terrain of the south pole region: surface, colour layer, sunlight with cast shadows, sky and marks. */
export default function TerrainPanel({ places, selectedId, onPick }: TerrainPanelProps) {
  const { active, selectedMs } = useScenario();
  const mode = getDataMode();
  const [surface, setSurface] = useState<SurfaceLayer>('hillshade');
  const [light, setLight] = useState(true);
  const [earthMask, setEarthMask] = useState(false);
  const [camera, setCamera] = useState<TerrainCamera>({ mode: 'overview', request: 0 });
  const [hover, setHover] = useState<{ x: number; z: number } | null>(null);
  const webgl = useMemo(hasWebGL, []);
  const region = LAYER_REGIONS[0];
  // The standing view shows the horizon as it is, so it is drawn without exaggeration.
  const exaggeration = camera.mode === 'stand' ? 1 : VERTICAL_EXAGGERATION;

  const heights = useAsync((signal) => getLayer('elevation', { region }, { signal }), [mode]).state;
  const colour = useAsync((signal) => getLayer(surface, { region }, { signal }), [surface, mode]).state;
  const sky = useSkyData(active);

  const heightGrid = heights.status === 'success' ? heights.data : null;
  const colourGrid = colour.status === 'success' ? colour.data : null;
  const mesh = useMemo(() => (heightGrid ? buildTerrain(heightGrid, exaggeration) : null), [heightGrid, exaggeration]);
  const normals = useMemo(() => (mesh ? vertexNormals(mesh) : null), [mesh]);
  const grids = useMemo(() => (heightGrid?.bounds ? [heightGrid] : null), [heightGrid]);
  const prepared = useMemo(() => (grids ? prepareTerrain(grids) : null), [grids]);

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
  const picked = sample?.sample ?? null;

  // The selected site on the map, and the Sun and the Earth as the server gave them there.
  const siteLat = skyData?.series.lat_deg ?? null;
  const siteLon = skyData?.series.lon_deg ?? null;
  const eye_m = skyData?.series.mast_height_m ?? 0;
  const sitePoint: SurfacePoint | null = useMemo(() => {
    if (siteLat === null || siteLon === null || !heightGrid) return null;
    const p = forwardSouthPolar(siteLat, siteLon);
    const h = heightAt(heightGrid, p.x_m, p.y_m);
    return h === null ? null : { x_m: p.x_m, y_m: p.y_m, height_m: h };
  }, [siteLat, siteLon, heightGrid]);
  const sunBody: SkyBody | null = useMemo(
    () =>
      picked && sitePoint && siteLat !== null && siteLon !== null
        ? bodyFromSite(siteLat, siteLon, sitePoint, eye_m, {
            azimuth_true_deg: picked.sun.azimuth_true_deg,
            elevation_deg: picked.sun.elevation_deg,
            radius_deg: picked.sun.radius_deg ?? 0,
            range_m: null,
          })
        : null,
    [picked, sitePoint, siteLat, siteLon, eye_m],
  );
  const earthBody: SkyBody | null = useMemo(
    () =>
      picked && sitePoint && siteLat !== null && siteLon !== null
        ? bodyFromSite(siteLat, siteLon, sitePoint, eye_m, {
            azimuth_true_deg: picked.earth.azimuth_true_deg,
            elevation_deg: picked.earth.elevation_deg,
            radius_deg: picked.earth.radius_deg ?? 0,
            range_m: picked.earth.range_km !== null ? picked.earth.range_km * 1000 : null,
          })
        : null,
    [picked, sitePoint, siteLat, siteLon, eye_m],
  );

  const maps = useVisibilityMaps(light || earthMask ? grids : null, mesh, light ? sunBody : null, earthMask ? earthBody : null);

  const colours = useMemo(() => {
    if (!mesh || !heightGrid) return null;
    const lit = light && sunBody !== null;
    let base: Float32Array;
    // Under the computed light the pre-shaded hillshade layer would be shaded twice: plain ground instead.
    if (lit && surface === 'hillshade') base = plainColours(mesh);
    else {
      const grid = colourGrid ?? heightGrid;
      const name = colourGrid ? surface : 'elevation';
      base = vertexColours(mesh, heightGrid, grid, layerPixels(grid, name, tokenRgb('--umbra') ?? undefined));
    }
    let out = lit && sunBody ? sunlitColours(mesh, { base, sun: sunBody.direction, visible: maps.sun, ...(normals ? { normals } : {}) }) : base;
    if (earthMask && maps.earth) {
      const tint = tokenRgb('--coral') ?? [224, 122, 95];
      out = tintHidden(out, maps.earth, [tint[0] / 255, tint[1] / 255, tint[2] / 255]);
    }
    return out;
  }, [mesh, heightGrid, colourGrid, surface, light, sunBody, maps.sun, maps.earth, earthMask, normals]);

  // The same walk at the site alone, from the mast height: compared with the server's own value.
  const siteSun: Visibility | null = useMemo(
    () => (prepared && sitePoint && sunBody ? bodyVisibility(prepared, sitePoint, sunBody, { eye_m }) : null),
    [prepared, sitePoint, sunBody, eye_m],
  );
  const siteEarth: Visibility | null = useMemo(
    () => (prepared && sitePoint && earthBody ? bodyVisibility(prepared, sitePoint, earthBody, { eye_m }) : null),
    [prepared, sitePoint, earthBody, eye_m],
  );

  const siteScene = useMemo(() => (mesh && sitePoint ? onSurface(mesh, sitePoint.x_m, sitePoint.y_m) : null), [mesh, sitePoint]);
  const skyDiscs: TerrainSky | null = useMemo(() => {
    if (!sitePoint || (!sunBody && !earthBody)) return null;
    const at = (body: SkyBody) => {
      const to = body.distance_m === null ? body.direction : directionToNearBody(sitePoint, body.direction, body.distance_m, eye_m);
      return { direction: toSceneAxes(sitePoint.x_m, sitePoint.y_m, to), radius_deg: body.radius_deg };
    };
    return { sun: sunBody ? at(sunBody) : null, earth: earthBody ? at(earthBody) : null };
  }, [sitePoint, sunBody, earthBody, eye_m]);
  const rays: TerrainRay[] = useMemo(() => {
    if (!mesh || !siteScene) return [];
    const out: TerrainRay[] = [];
    const add = (kind: TerrainRay['kind'], v: Visibility | null, on: boolean) => {
      if (!on || !v || v.fraction >= 1 || !v.blocker) return;
      const to = onSurface(mesh, v.blocker.x_m, v.blocker.y_m);
      if (to) out.push({ kind, from: siteScene, to });
    };
    add('sun', siteSun, light);
    add('earth', siteEarth, earthMask);
    return out;
  }, [mesh, siteScene, siteSun, siteEarth, light, earthMask]);

  // Without a site on the map there is nowhere to stand.
  const cannotStand = camera.mode === 'stand' && heightGrid !== null && skyData !== null && !sitePoint;
  useEffect(() => {
    if (cannotStand) setCamera((c) => ({ mode: 'overview', request: c.request + 1 }));
  }, [cannotStand]);

  const pick = (id: string) => {
    const place = places.find((p) => p.id === id);
    if (place) onPick(place);
  };
  const listed = useMemo(() => terrainPlaceList(places, marks), [places, marks]);
  const exposure = mesh && sunBody && light ? exposureFor(centreSunSine(mesh, sunBody.direction)) : null;
  const sunAgreement = light && siteSun && picked ? agreementText('Sun', siteSun.fraction, picked.sun.visible_fraction) : null;
  const earthAgreement = earthMask && siteEarth && picked ? agreementText('Earth', siteEarth.fraction, picked.earth.visible_fraction) : null;
  const darkShare = light && maps.sun ? hiddenShare(maps.sun) : null;
  const noLinkShare = earthMask && maps.earth ? hiddenShare(maps.earth) : null;
  const readout = hover && mesh && heightGrid ? cursorReadout(heightGrid, mesh, hover.x, hover.z, light ? maps.sun : null) : null;
  const toggle = (label: string, on: boolean, set: (v: boolean) => void) => (
    <button type="button" className={`map-button${on ? ' is-active' : ''}`} aria-pressed={on} onClick={() => set(!on)}>
      {label}
    </button>
  );

  return (
    <div className="terrain-panel">
      <div className="terrain-controls">
        <span className="terrain-toggles" role="group" aria-label="Surface colour">
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
        </span>
        <span className="terrain-toggles" role="group" aria-label="Light and link">
          {toggle('Sunlight and shadows', light, setLight)}
          {toggle('Earth in view', earthMask, setEarthMask)}
        </span>
        <span className="terrain-toggles" role="group" aria-label="Camera">
          <button
            type="button"
            className={`map-button${camera.mode === 'overview' ? ' is-active' : ''}`}
            aria-pressed={camera.mode === 'overview'}
            onClick={() => setCamera((c) => ({ mode: 'overview', request: c.request + 1 }))}
          >
            Overview
          </button>
          <button
            type="button"
            className={`map-button${camera.mode === 'stand' ? ' is-active' : ''}`}
            aria-pressed={camera.mode === 'stand'}
            disabled={!sitePoint}
            title={sitePoint ? undefined : 'Needs a selected site on this map.'}
            onClick={() => setCamera((c) => ({ mode: 'stand', request: c.request + 1 }))}
          >
            Stand at the site
          </button>
        </span>
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
          <TerrainView
            mesh={mesh}
            colours={colours}
            marks={marks}
            selectedId={selectedId}
            onPick={pick}
            sky={skyDiscs}
            site={siteScene}
            eye_km={eye_m * KM_PER_M}
            rays={rays}
            camera={camera}
            onHover={setHover}
          />
        </Suspense>
      ) : (
        <p className="terrain-note">Loading the elevation layer…</p>
      )}
      {colour.status === 'error' ? (
        <p className="terrain-note" role="status">{missingText(colour.error, `The ${LAYER_TEXT[surface].label.toLowerCase()} layer`)} Elevation grey is shown instead.</p>
      ) : null}
      <p className="terrain-readout" aria-live="off">
        <span className="terrain-readout-label">Under the cursor</span>{' '}
        <span className="terrain-data">{readout ? readoutText(readout) : mesh?.mapped ? 'move over the surface' : 'not available for this grid'}</span>
      </p>
      <ul className="terrain-notes">
        {light && !sunBody ? <li>{NO_SUN_NOTE}</li> : null}
        {picked && sample ? (
          <li>
            Sun {picked.sun.elevation_deg.toFixed(1)}° high, azimuth {picked.sun.azimuth_true_deg.toFixed(1)}° · Earth {picked.earth.elevation_deg.toFixed(1)}° high,
            azimuth {picked.earth.azimuth_true_deg.toFixed(1)}° · {sample.outside ? 'nearest sample ' : 'sample '}
            <span className="terrain-data">{formatUtc(picked.utc)}</span>
            {picked.sun.elevation_deg <= 0 ? ' · Sun below the horizon: no direct light' : ''}
          </li>
        ) : null}
        {sunAgreement ? <li role={sunAgreement.agrees ? undefined : 'status'}>{sunAgreement.text}</li> : null}
        {earthAgreement ? <li role={earthAgreement.agrees ? undefined : 'status'}>{earthAgreement.text}</li> : null}
        {light && sunBody ? (
          <li>
            {maps.busy ? 'Working out the shadows… ' : ''}
            {darkShare !== null ? `${percent(darkShare)} of this map sees less than half of the Sun disk. ` : ''}
            {exposure !== null ? `Brightness is scaled ×${exposure.toFixed(1)} so that level sunlit ground stays readable at this Sun height.` : ''}
          </li>
        ) : null}
        {earthMask ? (
          <li>
            {EARTH_MASK_NOTE}
            {noLinkShare !== null ? ` ${percent(noLinkShare)} of this map.` : ''}
          </li>
        ) : null}
        {surface === 'psr' ? <li>{PSR_SURFACE_NOTE}</li> : null}
      </ul>
      <details className="terrain-about">
        <summary>
          How this view is drawn
          {light ? <ValidityBadge validity="DERIVED" /> : null}
        </summary>
        <ul className="terrain-notes">
        {mesh ? <li>{camera.mode === 'stand' ? STAND_NOTE : exaggerationNote(mesh)}</li> : null}
        <li>{light ? LIGHT_NOTE : EVEN_LIGHT_NOTE}</li>
        {light ? <li>{WINDOW_NOTE}</li> : null}
        {skyDiscs ? <li>{SKY_NOTE}</li> : null}
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
        {heightGrid && !heightGrid.bounds ? <li>Example grid without map bounds: sites are not placed on it and no shadows are drawn.</li> : null}
        <li>Dot: landing site · square: candidate region (larger: top three of the last recommendation). Drag to turn; the Place list picks a mark with the keyboard.</li>
        </ul>
      </details>
    </div>
  );
}
