import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ScenePoint, TerrainMesh } from './geometry';

/** A site or candidate region already placed on the mesh (scene kilometres). */
export interface TerrainMark {
  id: string;
  kind: 'site' | 'candidate';
  rank?: number;
  at: ScenePoint;
}

/** A body in the sky: its direction from the selected site (scene axes) and apparent radius. */
export interface SkyDisc {
  direction: ScenePoint;
  radius_deg: number;
}

export interface TerrainSky {
  sun: SkyDisc | null;
  earth: SkyDisc | null;
}

/** A line from the selected site to the terrain that hides a body from it. */
export interface TerrainRay {
  kind: 'sun' | 'earth';
  from: ScenePoint;
  to: ScenePoint;
}

export type TerrainCameraMode = 'overview' | 'stand';

export interface TerrainCamera {
  mode: TerrainCameraMode;
  /** Changes each time a camera button is pressed, so the same mode can be asked for again. */
  request: number;
}

export interface TerrainViewProps {
  mesh: TerrainMesh;
  /** RGB per vertex, 0..1, already lit: the view adds no light to the surface. */
  colours: Float32Array;
  marks: readonly TerrainMark[];
  selectedId: string | null;
  onPick: (id: string) => void;
  /** Sun and Earth as seen from the selected site; `null` draws no sky. */
  sky: TerrainSky | null;
  /** The selected site on the surface: the Sun arrow starts here and the camera can stand here. */
  site: ScenePoint | null;
  /** Eye height above the site for the standing camera, kilometres (not exaggerated). */
  eye_km: number;
  rays: readonly TerrainRay[];
  camera: TerrainCamera;
}

function token(name: string, fallback: string): THREE.Color {
  const value = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

interface Live {
  geometry: THREE.BufferGeometry;
  marks: THREE.Group;
  markers: THREE.Mesh[];
  size: number;
  span: number;
  skyGroup: THREE.Group;
  sunBall: THREE.Mesh;
  sunGlow: THREE.Mesh;
  earthBall: THREE.Mesh;
  earthLight: THREE.DirectionalLight;
  arrow: THREE.ArrowHelper;
  rays: THREE.Group;
  render: () => void;
  moveCamera: (mode: TerrainCameraMode) => void;
}

/** Distance of the sky discs from the camera, in mesh spans; inside the far plane. */
const SKY_DISTANCE = 8;
const DEG = Math.PI / 180;
/** The glow around the Sun is this many times the disc; it is not part of the Sun's size. */
const GLOW_SCALE = 5;

/**
 * WebGL view of the terrain mesh, in its own module so three.js loads only when the view
 * opens. It draws what it is given: the surface colours arrive lit (`lighting.ts`), the Sun and
 * the Earth are placed in the direction given for the selected site at their apparent size, and
 * they stay at the same place in the sky wherever the camera goes. The scene and camera are
 * built once per mesh; new colours, marks, sky or rays are changed in place, so playing the
 * timeline does not reset the camera.
 */
export default function TerrainView({ mesh, colours, marks, selectedId, onPick, sky, site, eye_km, rays, camera }: TerrainViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sunLabel = useRef<HTMLSpanElement>(null);
  const earthLabel = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const propsRef = useRef({ colours, marks, selectedId, sky, site, eye_km, rays, camera });
  propsRef.current = { colours, marks, selectedId, sky, site, eye_km, rays, camera };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    } catch {
      setFailed('3D terrain needs WebGL, which this browser does not provide. The 2D map shows the same region.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(propsRef.current.colours, 3));
    geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new THREE.Box3();
    const span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z, 1e-6);

    const scene = new THREE.Scene();
    // Unlit: the colours already carry the sunlight and the shadows.
    const surface = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    scene.add(surface);

    const markGroup = new THREE.Group();
    scene.add(markGroup);
    const markers: THREE.Mesh[] = [];
    const size = span * 0.012;

    // Sky: kept centred on the camera, so the discs are at the same place in the sky from anywhere.
    const skyGroup = new THREE.Group();
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshBasicMaterial({ color: token('--warning', 'gold') }));
    const earthBall = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshLambertMaterial({ color: token('--cyan', 'steelblue') }));
    // A soft glow so the small disc can be found; the disc inside it is the true size.
    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: token('--warning', 'gold'), transparent: true, opacity: 0.16, depthWrite: false }),
    );
    sunBall.visible = false;
    sunGlow.visible = false;
    earthBall.visible = false;
    skyGroup.add(sunGlow, sunBall, earthBall);
    scene.add(skyGroup);
    // Lights reach only the Earth disc (the rest is unlit material): it shows its phase.
    const earthLight = new THREE.DirectionalLight(0xffffff, 0);
    scene.add(earthLight, earthLight.target, new THREE.AmbientLight(0xffffff, 0.12));

    const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), span * 0.12, token('--warning', 'gold'), span * 0.03, span * 0.015);
    arrow.visible = false;
    const arrowHolder = new THREE.Group();
    arrowHolder.add(arrow);
    scene.add(arrowHolder);
    const rayGroup = new THREE.Group();
    scene.add(rayGroup);

    const cam = new THREE.PerspectiveCamera(40, 1, span / 1000, span * 20);
    cam.up.set(0, 1, 0);
    const controls = new OrbitControls(cam, renderer.domElement);
    const overviewTarget = new THREE.Vector3(0, (box.max.y + box.min.y) / 2, 0);

    const placeLabel = (el: HTMLElement | null, ball: THREE.Mesh) => {
      if (!el) return;
      if (!ball.visible) {
        el.style.display = 'none';
        return;
      }
      const p = ball.getWorldPosition(new THREE.Vector3()).project(cam);
      const inView = p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
      el.style.display = inView ? 'block' : 'none';
      el.style.left = `${((p.x + 1) / 2) * host.clientWidth}px`;
      el.style.top = `${((1 - p.y) / 2) * host.clientHeight}px`;
    };
    const render = () => {
      skyGroup.position.copy(cam.position);
      skyGroup.updateMatrixWorld(true);
      placeLabel(sunLabel.current, sunBall);
      placeLabel(earthLabel.current, earthBall);
      renderer.render(scene, cam);
    };

    const moveCamera = (mode: TerrainCameraMode) => {
      const now = propsRef.current;
      // The marks and the Sun arrow are sized for the overview; from eye height they would fill the view.
      const standing = mode === 'stand' && now.site !== null;
      markGroup.visible = !standing;
      arrowHolder.visible = !standing;
      if (mode === 'stand' && now.site) {
        // Eye at the mast height over the site, looking along the ground towards the Sun
        // (or the Earth, or map east when neither is known).
        const eye = new THREE.Vector3(now.site.x, now.site.y + Math.max(now.eye_km * mesh.exaggeration, 0.002), now.site.z);
        const towards = now.sky?.sun?.direction ?? now.sky?.earth?.direction ?? { x: 1, y: 0, z: 0 };
        const flat = new THREE.Vector3(towards.x, 0, towards.z);
        if (flat.lengthSq() < 1e-9) flat.set(1, 0, 0);
        flat.normalize();
        const reach = span * 0.004;
        cam.near = 0.0005;
        cam.position.copy(eye);
        controls.target.copy(eye).addScaledVector(flat, reach);
        controls.minDistance = reach;
        controls.maxDistance = reach;
        controls.minPolarAngle = Math.PI * 0.25;
        controls.maxPolarAngle = Math.PI * 0.75;
        controls.enablePan = false;
      } else {
        cam.near = span / 1000;
        cam.position.set(0, span * 0.75, span * 0.75);
        controls.target.copy(overviewTarget);
        controls.minDistance = span * 0.02;
        controls.maxDistance = span * 3;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.enablePan = true;
      }
      cam.updateProjectionMatrix();
      controls.update();
      render();
    };

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      render();
    };
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const live: Live = { geometry, marks: markGroup, markers, size, span, skyGroup, sunBall, sunGlow, earthBall, earthLight, arrow, rays: rayGroup, render, moveCamera };
    liveRef.current = live;
    drawMarks(live, propsRef.current.marks, propsRef.current.selectedId);
    applySky(live, propsRef.current.sky, propsRef.current.site);
    drawRays(live, propsRef.current.rays);
    moveCamera(propsRef.current.camera.mode);
    resize();

    const ray = new THREE.Raycaster();
    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, cam);
      const id = ray.intersectObjects(markers)[0]?.object.userData.placeId as string | undefined;
      if (id) pickRef.current(id);
    };
    renderer.domElement.addEventListener('click', onClick);

    return () => {
      observer.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      clearMarks(live);
      clearRays(live);
      arrow.dispose();
      for (const o of [surface, sunBall, sunGlow, earthBall]) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
      liveRef.current = null;
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [mesh]);

  // New colours (another layer, another moment, a finished shadow map) only replace the attribute.
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    live.geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    live.render();
  }, [colours]);

  // New marks or a new selection only redraw the marks.
  useEffect(() => {
    if (liveRef.current) drawMarks(liveRef.current, marks, selectedId);
  }, [marks, selectedId]);

  useEffect(() => {
    if (liveRef.current) applySky(liveRef.current, sky, site);
  }, [sky, site]);

  useEffect(() => {
    if (liveRef.current) drawRays(liveRef.current, rays);
  }, [rays]);

  // A camera button moves the camera; building the scene already placed it.
  const firstRequest = useRef(camera.request);
  useEffect(() => {
    if (camera.request !== firstRequest.current) liveRef.current?.moveCamera(camera.mode);
  }, [camera]);

  if (failed) return <p className="terrain-note" role="alert">{failed}</p>;
  return (
    <div className="terrain-canvas" ref={hostRef}>
      <span className="terrain-sky-label" ref={sunLabel}>
        Sun
      </span>
      <span className="terrain-sky-label" ref={earthLabel}>
        Earth
      </span>
    </div>
  );
}

function clearMarks(live: Pick<Live, 'marks' | 'markers'>) {
  for (const m of live.markers) {
    m.geometry.dispose();
    (m.material as THREE.Material).dispose();
  }
  live.marks.clear();
  live.markers.length = 0;
}

/** Sites are dots, candidate regions are squares; the selected place is larger and accented. */
function drawMarks(live: Live, marks: readonly TerrainMark[], selectedId: string | null) {
  clearMarks(live);
  const siteColour = token('--text', 'white');
  const candidateColour = token('--mint', 'green');
  const selectedColour = token('--lavender-bright', 'violet');
  for (const mark of marks) {
    const selected = mark.id === selectedId;
    const top = mark.rank !== undefined && mark.rank <= 3;
    const s = selected ? live.size * 1.8 : top ? live.size * 1.4 : live.size;
    const g = mark.kind === 'site' ? new THREE.SphereGeometry(s, 16, 12) : new THREE.BoxGeometry(s * 1.6, s * 1.6, s * 1.6);
    const marker = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ color: selected ? selectedColour : mark.kind === 'site' ? siteColour : candidateColour }),
    );
    marker.position.set(mark.at.x, mark.at.y + s * 1.2, mark.at.z);
    marker.userData.placeId = mark.id;
    live.marks.add(marker);
    live.markers.push(marker);
  }
  live.render();
}

function placeDisc(ball: THREE.Mesh, disc: SkyDisc | null, distance: number) {
  if (!disc) {
    ball.visible = false;
    return;
  }
  const d = disc.direction;
  ball.position.set(d.x * distance, d.y * distance, d.z * distance);
  // True apparent size: the radius the disc has at this distance.
  ball.scale.setScalar(distance * Math.tan(disc.radius_deg * DEG));
  ball.visible = true;
}

/** Sun and Earth discs, the Earth's phase light and the Sun arrow on the ground. */
function applySky(live: Live, sky: TerrainSky | null, site: ScenePoint | null) {
  const distance = live.span * SKY_DISTANCE;
  placeDisc(live.sunBall, sky?.sun ?? null, distance);
  placeDisc(live.sunGlow, sky?.sun ?? null, distance * 0.999);
  if (live.sunGlow.visible) live.sunGlow.scale.multiplyScalar(GLOW_SCALE);
  placeDisc(live.earthBall, sky?.earth ?? null, distance);
  const sun = sky?.sun?.direction ?? null;
  if (sun && sky?.earth) {
    // The Earth is lit from where the Sun stands; the Sun is far enough for one direction.
    live.earthLight.position.set(sun.x, sun.y, sun.z);
    live.earthLight.target.position.set(0, 0, 0);
    live.earthLight.intensity = 2.5;
  } else {
    live.earthLight.intensity = 0;
  }
  const flat = sun ? new THREE.Vector3(sun.x, 0, sun.z) : null;
  if (site && flat && flat.lengthSq() > 1e-9) {
    live.arrow.position.set(site.x, site.y + live.size * 0.6, site.z);
    live.arrow.setDirection(flat.normalize());
    live.arrow.visible = true;
  } else {
    live.arrow.visible = false;
  }
  live.render();
}

function clearRays(live: Pick<Live, 'rays'>) {
  for (const o of live.rays.children) {
    if (o instanceof THREE.Line || o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  }
  live.rays.clear();
}

/** A line from the site to the ground that hides a body, with a cone on that ground. */
function drawRays(live: Live, rays: readonly TerrainRay[]) {
  clearRays(live);
  for (const r of rays) {
    const colour = r.kind === 'sun' ? token('--warning', 'gold') : token('--coral', 'orange');
    const lift = live.size * 0.5;
    const from = new THREE.Vector3(r.from.x, r.from.y + lift, r.from.z);
    const to = new THREE.Vector3(r.to.x, r.to.y + lift, r.to.z);
    live.rays.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: colour })));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(live.size * 0.7, live.size * 2, 12), new THREE.MeshBasicMaterial({ color: colour }));
    cone.position.set(r.to.x, r.to.y + live.size * 2, r.to.z);
    cone.rotation.x = Math.PI;
    live.rays.add(cone);
  }
  live.render();
}
