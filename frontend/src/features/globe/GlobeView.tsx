import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LayerGrid } from '../../api/types';
import { scaleBar } from '../terrain3d/readout';
import { projectUnit } from '../terrain3d/shadow';
import { useVisibilityMaps } from '../terrain3d/use-visibility';
import { heightAt } from '../terrain3d/geometry';
import { FAR_SIDE_CENTRE, NEAR_SIDE_CENTRE, graticule, latLonToVector, turnTowards, vectorToLatLon, type LatLon, type Vec3 } from './coords';
import { CAP_EDGE_M, buildPolarCap, capColours, capNormals, capReadout, capVertexAt, kmPerPixel, sunBody, type PolarCap } from './polar';
import { MOON_RADIUS_M } from '../map/projection';
import { MOON_TEXTURE_URL, TEXTURE_ROTATION_Y } from './texture';
import { cachedTexture, showTexture, token, useThemeKey } from './three-kit';

export interface GlobePlace {
  id: string;
  name: string;
  lat_deg: number;
  lon_deg: number;
  /** Catalogue site (round dot) or candidate region (square). */
  kind: 'site' | 'candidate';
  /** Position in the last recommendation, 1 first; absent when not ranked. */
  rank?: number;
}

export interface GlobeViewProps {
  places: readonly GlobePlace[];
  selectedId: string | null;
  onPick: (id: string) => void;
  /** Unit vector to the Sun from the server's sub-solar point; `null` gives even light. */
  sun: Vec3 | null;
  /** Server's sub-Earth point, marked separately; `null` hides the mark. */
  subEarth: LatLon | null;
  /** Start the camera centred on this point (the selected place). */
  focus: LatLon | null;
  /** South polar height map (`south-pole-cap`), drawn as relief with terrain shadows. */
  polar?: LayerGrid | null;
  /** Called with the time the last shadow map took, or `null` while one is being worked out. */
  onShadowState?: (state: { busy: boolean; ms: number | null }) => void;
}

/** Closest the camera may come: about 14 km above the reference sphere, over 7 km peaks. */
const NEAR_LIMIT = 1.008;
const FAR_LIMIT = 8;
/** Below this distance from the centre the graticule is hidden; it would cut through the relief. */
const GRID_HIDE_BELOW = 1.15;

const v3 = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);

/**
 * The Moon's surface is neutral grey until the surface image has loaded, and stays grey if it
 * cannot load; it is the same in both themes. The marks follow the theme tokens.
 */
const SURFACE = 'silver';

/** The surface image, loaded once per page and reused when the scene is rebuilt. */
const moonTexture = cachedTexture(MOON_TEXTURE_URL);

interface Live {
  scene: THREE.Scene;
  globe: THREE.Mesh;
  sunLight: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  ring: THREE.Mesh;
  markers: THREE.Mesh[];
  colours: { site: THREE.Color; candidate: THREE.Color; selected: THREE.Color };
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  render: () => void;
}

/** Ambient light when the Sun direction is known (night side stays readable) and when it is not. */
const AMBIENT_WITH_SUN = 0.25;
const AMBIENT_EVEN = 1.6;

/**
 * WebGL view of the globe. Kept in its own module so that three.js is only loaded when the 3D
 * view is opened. It draws; it computes nothing about the Sun or Earth. The scene is built
 * once per place list and theme. A new selection only restyles the marks, a new focus turns
 * the camera only when the place is on the hidden side, and the light and the sub-Earth ring
 * are moved in place, so neither picking a site nor playing the timeline resets the camera.
 */
export default function GlobeView({ places, selectedId, onPick, sun, subEarth, focus, polar = null, onShadowState }: GlobeViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLSpanElement>(null);
  const farRef = useRef<HTMLSpanElement>(null);
  const scaleRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const capRef = useRef<{ mesh: THREE.Mesh; cap: PolarCap; normals: Float32Array } | null>(null);
  const cap = useMemo(() => (polar ? buildPolarCap(polar) : null), [polar]);
  const grids = useMemo(() => (polar && cap ? [polar] : null), [polar, cap]);
  const sunForShadow = useMemo(() => sunBody(sun), [sun]);
  const shadows = useVisibilityMaps(grids, cap, sunForShadow, null);
  const shadowRef = useRef(shadows.sun);
  shadowRef.current = shadows.sun;
  const shadowStateRef = useRef(onShadowState);
  shadowStateRef.current = onShadowState;
  const polarRef = useRef(polar);
  polarRef.current = polar;
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const theme = useThemeKey();
  const lightRef = useRef({ sun, subEarth });
  lightRef.current = { sun, subEarth };
  const viewRef = useRef({ selectedId, focus });
  viewRef.current = { selectedId, focus };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      // The camera comes within kilometres of the relief: a logarithmic depth buffer keeps it sharp.
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    } catch {
      setFailed('3D view needs WebGL, which this browser does not provide. The 2D map shows the same sites.');
      return;
    }
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const startFocus = viewRef.current.focus;
    camera.position.copy(startFocus ? v3(latLonToVector(startFocus, 4)) : new THREE.Vector3(0, 0, 4));
    camera.lookAt(0, 0, 0);

    const surface = new THREE.MeshStandardMaterial({ color: new THREE.Color(SURFACE), roughness: 1, metalness: 0 });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), surface);
    globe.rotation.y = TEXTURE_ROTATION_Y;
    scene.add(globe);
    let disposed = false;
    const ambient = new THREE.AmbientLight(0xffffff, AMBIENT_EVEN);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0);
    scene.add(ambient, sunLight);

    const gridMaterial = new THREE.LineBasicMaterial({ color: token('--line-button', 'grey'), transparent: true, opacity: 0.6 });
    const gridLines = new THREE.Group();
    for (const line of graticule(30)) {
      gridLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map((p) => v3(latLonToVector(p, 1.002)))), gridMaterial));
    }
    scene.add(gridLines);

    // Sites are dots, candidate regions are squares; the selected place is larger and accented
    // (set by `styleMarkers`, so a new selection does not rebuild the scene).
    const markers: THREE.Mesh[] = [];
    const colours = { site: token('--text', 'white'), candidate: token('--mint', 'green'), selected: token('--lavender-bright', 'violet') };
    for (const place of places) {
      const topRanked = place.rank !== undefined && place.rank <= 3;
      const size = topRanked ? 0.024 : 0.016;
      const geometry = place.kind === 'site' ? new THREE.SphereGeometry(size, 16, 12) : new THREE.BoxGeometry(size * 1.6, size * 1.6, size * 1.6);
      const marker = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      const p = v3(latLonToVector(place, 1.01));
      marker.position.copy(p);
      marker.lookAt(p.clone().multiplyScalar(2));
      marker.userData = { placeId: place.id, kind: place.kind, size };
      scene.add(marker);
      markers.push(marker);
    }

    // Sub-Earth point: a ring, so it reads apart from the place markers without colour.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.05, 32),
      new THREE.MeshBasicMaterial({ color: token('--cyan', 'cyan'), side: THREE.DoubleSide }),
    );
    ring.visible = false;
    scene.add(ring);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = FAR_LIMIT;
    controls.enableDamping = !reduceMotion;

    const nearPoint = v3(latLonToVector(NEAR_SIDE_CENTRE, 1.05));
    const farPoint = v3(latLonToVector(FAR_SIDE_CENTRE, 1.05));
    const placeLabel = (el: HTMLElement | null, point: THREE.Vector3, w: number, h: number) => {
      if (!el) return;
      const facing = point.clone().normalize().dot(camera.position.clone().normalize()) > 0.15;
      const projected = point.clone().project(camera);
      el.style.display = facing ? 'block' : 'none';
      el.style.left = `${((projected.x + 1) / 2) * w}px`;
      el.style.top = `${((1 - projected.y) / 2) * h}px`;
    };

    const render = () => {
      // Close to the surface everything scales with the height above it: clipping, zoom and turn
      // steps, and the size of the marks.
      const distance = camera.position.length();
      const altitude = Math.max(1e-4, distance - 1);
      camera.near = Math.max(1e-5, (distance - 1.005) * 0.5);
      camera.far = distance + 2;
      camera.updateProjectionMatrix();
      controls.zoomSpeed = Math.min(1, Math.max(0.05, (2 * altitude) / distance));
      controls.rotateSpeed = Math.min(1, Math.max(0.002, altitude / 1.5));
      const markScale = Math.min(1, Math.max(0.02, altitude / 0.6));
      for (const marker of markers) marker.scale.setScalar((marker.userData.styleScale as number | undefined ?? 1) * markScale);
      gridLines.visible = distance > GRID_HIDE_BELOW;
      placeLabel(nearRef.current, nearPoint, host.clientWidth, host.clientHeight);
      placeLabel(farRef.current, farPoint, host.clientWidth, host.clientHeight);
      const bar = scaleRef.current;
      if (bar) {
        const fit = scaleBar(kmPerPixel(altitude, camera.fov, host.clientHeight));
        bar.style.display = fit && distance < 2.5 ? 'block' : 'none';
        if (fit) {
          bar.style.width = `${fit.px}px`;
          bar.textContent = fit.label;
        }
      }
      renderer.render(scene, camera);
    };
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (controls.update()) render();
    };
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    liveRef.current = { scene, globe, sunLight, ambient, ring, markers, colours, camera, controls, render };
    styleMarkers(liveRef.current, viewRef.current.selectedId);
    showTexture(moonTexture, surface, renderer, () => !disposed, render);
    applyLight(liveRef.current, lightRef.current.sun, lightRef.current.subEarth);
    resize();
    if (controls.enableDamping) loop();

    const ray = new THREE.Raycaster();
    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects([globe, ...markers])[0];
      const id = hit?.object.userData.placeId as string | undefined;
      if (id) pickRef.current(id);
    };
    renderer.domElement.addEventListener('click', onClick);

    // Readout under the cursor: the ray meets the reference sphere (the relief is at most a few
    // kilometres off it), and the height map is read there.
    let hoverFrame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(hoverFrame);
      hoverFrame = requestAnimationFrame(() => {
        const el = readoutRef.current;
        if (!el) return;
        const rect = renderer.domElement.getBoundingClientRect();
        const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 1), new THREE.Vector3());
        if (!hit) {
          el.textContent = '';
          return;
        }
        const p = { x: hit.x, y: hit.y, z: hit.z };
        const grid = polarRef.current;
        const drawn = capRef.current;
        if (grid && drawn && hit.y < 0) {
          const k = capVertexAt(grid, drawn.cap, p);
          const share = k !== null ? shadowRef.current?.[k] ?? null : null;
          el.textContent = capReadout(grid, p, share !== null && Number.isFinite(share) ? share : null);
        } else {
          const ll = vectorToLatLon(p);
          el.textContent = `${Math.abs(ll.lat_deg).toFixed(2)}° ${ll.lat_deg >= 0 ? 'N' : 'S'}, ${Math.abs(ll.lon_deg).toFixed(2)}° ${ll.lon_deg >= 0 ? 'E' : 'W'}`;
        }
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(hoverFrame);
      if (readoutRef.current) readoutRef.current.textContent = '';
    };
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    return () => {
      disposed = true;
      liveRef.current = null;
      capRef.current = null;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hoverFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          const m = o.material;
          (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [places, theme]);

  // A new selection restyles the marks; the camera stays where it is.
  useEffect(() => {
    if (liveRef.current) styleMarkers(liveRef.current, selectedId);
  }, [selectedId]);

  // A new focus turns the camera only when the place is hidden, keeping the zoom.
  useEffect(() => {
    const live = liveRef.current;
    if (!live || !focus) return;
    const c = live.camera.position;
    const next = turnTowards({ x: c.x, y: c.y, z: c.z }, focus);
    if (!next) return;
    live.camera.position.copy(v3(next));
    live.controls.update();
    live.render();
  }, [focus]);

  // The selected moment moves only the light and the ring.
  useEffect(() => {
    if (liveRef.current) applyLight(liveRef.current, sun, subEarth);
  }, [sun, subEarth]);

  // The polar relief: added when the height map arrives, with the globe cut back to 80° S under
  // it and the marks set on the ground; removed with the scene or a new map.
  useEffect(() => {
    const live = liveRef.current;
    if (!live || !cap || !polar) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(cap.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cap.rows * cap.cols * 3).fill(0.5), 3));
    geometry.setIndex(new THREE.BufferAttribute(cap.indices, 1));
    geometry.computeBoundingSphere();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    const normals = capNormals(cap);
    capRef.current = { mesh, cap, normals };
    live.scene.add(mesh);

    const fullSphere = live.globe.geometry;
    live.globe.geometry = cutSphere();
    live.controls.minDistance = NEAR_LIMIT;
    const moved: [THREE.Mesh, THREE.Vector3][] = [];
    for (const marker of live.markers) {
      const p = marker.position;
      const m = projectUnit({ x: p.x, y: p.y, z: p.z });
      if (p.y >= 0 || Math.hypot(m.x_m, m.y_m) > CAP_EDGE_M) continue;
      const h = heightAt(polar, m.x_m, m.y_m);
      if (h === null) continue;
      moved.push([marker, p.clone()]);
      marker.position.copy(p.clone().normalize().multiplyScalar(1 + (h + 300) / MOON_RADIUS_M));
    }
    paintCap(capRef.current, sun, shadowRef.current);
    live.render();

    return () => {
      live.scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      live.globe.geometry.dispose();
      live.globe.geometry = fullSphere;
      live.controls.minDistance = 1.6;
      for (const [marker, p] of moved) marker.position.copy(p);
      if (capRef.current?.mesh === mesh) capRef.current = null;
      live.render();
    };
    // `sun` is applied by the effect below; it is read here only for the first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, polar, places, theme]);

  // New light or a new shadow map repaints the relief.
  useEffect(() => {
    const drawn = capRef.current;
    if (!drawn) return;
    paintCap(drawn, sun, shadows.sun);
    liveRef.current?.render();
  }, [sun, shadows.sun]);

  useEffect(() => {
    shadowStateRef.current?.({ busy: shadows.busy, ms: shadows.ms });
  }, [shadows.busy, shadows.ms]);

  if (failed) return <p className="globe-note" role="alert">{failed}</p>;
  return (
    <div className="globe-canvas" ref={hostRef}>
      <span className="globe-side-label" ref={nearRef}>
        Near side
      </span>
      <span className="globe-side-label" ref={farRef}>
        Far side
      </span>
      <span className="globe-scale" ref={scaleRef} aria-hidden="true" />
      <span className="globe-readout" ref={readoutRef} aria-live="off" />
    </div>
  );
}

/** Colours of the relief for the light: shadows only while they belong to the Sun that is shown. */
function paintCap(drawn: { mesh: THREE.Mesh; normals: Float32Array } | null, sun: Vec3 | null, shadow: Float32Array | null) {
  if (!drawn) return;
  const colours = capColours(drawn.normals, sun, sun && shadow && shadow.length * 3 === drawn.normals.length ? shadow : null);
  const attribute = drawn.mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
  (attribute.array as Float32Array).set(colours);
  attribute.needsUpdate = true;
}

/**
 * The globe without its cap south of 80° S, where the relief takes over. The texture
 * coordinates are set back to the full sphere's, so the image does not stretch.
 */
function cutSphere(): THREE.SphereGeometry {
  const thetaLength = (170 * Math.PI) / 180;
  const geometry = new THREE.SphereGeometry(1, 96, 64, 0, Math.PI * 2, 0, thetaLength);
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const k = thetaLength / Math.PI;
  for (let i = 0; i < uv.count; i += 1) uv.setY(i, 1 - (1 - uv.getY(i)) * k);
  uv.needsUpdate = true;
  return geometry;
}

function styleMarkers(live: Live, selectedId: string | null) {
  for (const marker of live.markers) {
    const { placeId, kind, size } = marker.userData as { placeId: string; kind: 'site' | 'candidate'; size: number };
    const selected = placeId === selectedId;
    // `render` multiplies this by the zoom factor.
    marker.userData.styleScale = selected ? 0.03 / size : 1;
    (marker.material as THREE.MeshBasicMaterial).color.copy(selected ? live.colours.selected : kind === 'site' ? live.colours.site : live.colours.candidate);
  }
  live.render();
}

function applyLight(live: Live, sun: Vec3 | null, subEarth: LatLon | null) {
  if (sun) {
    live.sunLight.position.copy(v3(sun).multiplyScalar(10));
    live.sunLight.intensity = 2.2;
    live.ambient.intensity = AMBIENT_WITH_SUN;
  } else {
    live.sunLight.intensity = 0;
    live.ambient.intensity = AMBIENT_EVEN;
  }
  if (subEarth) {
    const p = v3(latLonToVector(subEarth, 1.012));
    live.ring.position.copy(p);
    live.ring.lookAt(p.clone().multiplyScalar(2));
    live.ring.visible = true;
  } else {
    live.ring.visible = false;
  }
  live.render();
}
