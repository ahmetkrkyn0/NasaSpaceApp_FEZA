import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FAR_SIDE_CENTRE, NEAR_SIDE_CENTRE, graticule, latLonToVector, type LatLon, type Vec3 } from './coords';
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
}

const v3 = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);

/**
 * The Moon's surface is neutral grey until the surface image has loaded, and stays grey if it
 * cannot load; it is the same in both themes. The marks follow the theme tokens.
 */
const SURFACE = 'silver';

/** The surface image, loaded once per page and reused when the scene is rebuilt. */
const moonTexture = cachedTexture(MOON_TEXTURE_URL);

interface Live {
  sunLight: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  ring: THREE.Mesh;
  render: () => void;
}

/** Ambient light when the Sun direction is known (night side stays readable) and when it is not. */
const AMBIENT_WITH_SUN = 0.25;
const AMBIENT_EVEN = 1.6;

/**
 * WebGL view of the globe. Kept in its own module so that three.js is only loaded when the 3D
 * view is opened. It draws; it computes nothing about the Sun or Earth. The scene is built
 * once per place list, selection and focus; the light and the sub-Earth ring are then moved in
 * place, so playing the timeline neither rebuilds the scene nor resets the camera.
 */
export default function GlobeView({ places, selectedId, onPick, sun, subEarth, focus }: GlobeViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLSpanElement>(null);
  const farRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const theme = useThemeKey();
  const lightRef = useRef({ sun, subEarth });
  lightRef.current = { sun, subEarth };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
    camera.position.copy(focus ? v3(latLonToVector(focus, 4)) : new THREE.Vector3(0, 0, 4));
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
    for (const line of graticule(30)) {
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map((p) => v3(latLonToVector(p, 1.002)))), gridMaterial));
    }

    // Sites are dots, candidate regions are squares; the selected place is larger and accented.
    const markers: THREE.Mesh[] = [];
    const siteColour = token('--text', 'white');
    const candidateColour = token('--mint', 'green');
    const selectedColour = token('--lavender-bright', 'violet');
    for (const place of places) {
      const selected = place.id === selectedId;
      const topRanked = place.rank !== undefined && place.rank <= 3;
      const size = selected ? 0.03 : topRanked ? 0.024 : 0.016;
      const geometry = place.kind === 'site' ? new THREE.SphereGeometry(size, 16, 12) : new THREE.BoxGeometry(size * 1.6, size * 1.6, size * 1.6);
      const marker = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: selected ? selectedColour : place.kind === 'site' ? siteColour : candidateColour }),
      );
      const p = v3(latLonToVector(place, 1.01));
      marker.position.copy(p);
      marker.lookAt(p.clone().multiplyScalar(2));
      marker.userData.placeId = place.id;
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
    controls.maxDistance = 8;
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
      placeLabel(nearRef.current, nearPoint, host.clientWidth, host.clientHeight);
      placeLabel(farRef.current, farPoint, host.clientWidth, host.clientHeight);
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

    liveRef.current = { sunLight, ambient, ring, render };
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

    return () => {
      disposed = true;
      liveRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
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
  }, [places, selectedId, focus, theme]);

  // The selected moment moves only the light and the ring.
  useEffect(() => {
    if (liveRef.current) applyLight(liveRef.current, sun, subEarth);
  }, [sun, subEarth]);

  if (failed) return <p className="globe-note" role="alert">{failed}</p>;
  return (
    <div className="globe-canvas" ref={hostRef}>
      <span className="globe-side-label" ref={nearRef}>
        Near side
      </span>
      <span className="globe-side-label" ref={farRef}>
        Far side
      </span>
    </div>
  );
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
