import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FAR_SIDE_CENTRE, NEAR_SIDE_CENTRE, graticule, latLonToVector, type LatLon, type Vec3 } from './coords';

export interface GlobeSite {
  id: string;
  name: string;
  lat_deg: number;
  lon_deg: number;
}

export interface GlobeViewProps {
  sites: readonly GlobeSite[];
  selectedId: string | null;
  onPick: (id: string) => void;
  /** Unit vector to the Sun from the server's sub-solar point; `null` gives even light. */
  sun: Vec3 | null;
  /** Server's sub-Earth point, marked separately; `null` hides the mark. */
  subEarth: LatLon | null;
  /** Start the camera centred on this point (the selected site). */
  focus: LatLon | null;
}

/** CSS token value from the page, so the globe follows the dark and light themes. */
function token(name: string, fallback: string): THREE.Color {
  const value = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

const v3 = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);

/**
 * WebGL view of the globe. Kept in its own module so that three.js is only loaded when the 3D
 * view is opened. It draws; it computes nothing about the Sun or Earth.
 */
export default function GlobeView({ sites, selectedId, onPick, sun, subEarth, focus }: GlobeViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLSpanElement>(null);
  const farRef = useRef<HTMLSpanElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

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
    const start = focus ? v3(latLonToVector(focus, 4)) : new THREE.Vector3(0, 0, 4);
    camera.position.copy(start);
    camera.lookAt(0, 0, 0);

    // Globe: plain grey surface; lit from the server's Sun direction, or evenly when there is none.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 64),
      new THREE.MeshStandardMaterial({ color: token('--text-3', 'grey'), roughness: 1, metalness: 0 }),
    );
    scene.add(globe);
    if (sun) {
      scene.add(new THREE.AmbientLight(0xffffff, 0.08));
      const light = new THREE.DirectionalLight(0xffffff, 2.2);
      light.position.copy(v3(sun).multiplyScalar(10));
      scene.add(light);
    } else {
      scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    }

    // Graticule every 30 degrees, just above the surface.
    const gridMaterial = new THREE.LineBasicMaterial({ color: token('--line-button', 'grey'), transparent: true, opacity: 0.6 });
    for (const line of graticule(30)) {
      const geometry = new THREE.BufferGeometry().setFromPoints(line.map((p) => v3(latLonToVector(p, 1.002))));
      scene.add(new THREE.Line(geometry, gridMaterial));
    }

    // Site markers; the selected one is larger and in the accent colour.
    const markers: THREE.Mesh[] = [];
    const siteColour = token('--text', 'white');
    const selectedColour = token('--lavender-bright', 'violet');
    for (const site of sites) {
      const selected = site.id === selectedId;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(selected ? 0.03 : 0.018, 16, 12),
        new THREE.MeshBasicMaterial({ color: selected ? selectedColour : siteColour }),
      );
      marker.position.copy(v3(latLonToVector(site, 1.01)));
      marker.userData.siteId = site.id;
      marker.userData.name = site.name;
      scene.add(marker);
      markers.push(marker);
    }

    // Sub-Earth point: a ring, so it reads apart from the site dots without colour.
    if (subEarth) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.035, 0.05, 32),
        new THREE.MeshBasicMaterial({ color: token('--cyan', 'cyan'), side: THREE.DoubleSide }),
      );
      const p = v3(latLonToVector(subEarth, 1.012));
      ring.position.copy(p);
      ring.lookAt(p.clone().multiplyScalar(2));
      scene.add(ring);
    }

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

    let frame = 0;
    const render = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      placeLabel(nearRef.current, nearPoint, w, h);
      placeLabel(farRef.current, farPoint, w, h);
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
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (controls.update()) render();
    };
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    if (controls.enableDamping) loop();

    // Click on a site marker selects that site.
    const ray = new THREE.Raycaster();
    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects([globe, ...markers])[0];
      const id = hit?.object.userData.siteId as string | undefined;
      if (id) pickRef.current(id);
    };
    renderer.domElement.addEventListener('click', onClick);

    return () => {
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
    // A new site list, selection or server answer rebuilds the scene.
  }, [sites, selectedId, sun, subEarth, focus]);

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
