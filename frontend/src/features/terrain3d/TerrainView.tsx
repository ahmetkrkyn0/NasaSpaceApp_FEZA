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

export interface TerrainViewProps {
  mesh: TerrainMesh;
  /** RGB per vertex, 0..1. */
  colours: Float32Array;
  marks: readonly TerrainMark[];
  selectedId: string | null;
  onPick: (id: string) => void;
  /** Unit vector to the Sun in scene axes; `null` gives even light. */
  sun: ScenePoint | null;
}

function token(name: string, fallback: string): THREE.Color {
  const value = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

interface Live {
  sunLight: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  render: () => void;
}

const AMBIENT_WITH_SUN = 0.35;
const AMBIENT_EVEN = 1.5;

/**
 * WebGL view of the terrain mesh, in its own module so three.js loads only when the view
 * opens. It draws the mesh and marks it is given and lights them from the given direction;
 * there are no cast shadows. The scene is built once per mesh, colours, marks and selection;
 * a new Sun direction only moves the light, so playing the timeline does not rebuild it.
 */
export default function TerrainView({ mesh, colours, marks, selectedId, onPick, sun }: TerrainViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const sunRef = useRef(sun);
  sunRef.current = sun;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed('3D terrain needs WebGL, which this browser does not provide. The 2D map shows the same region.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colours, 3));
    geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new THREE.Box3();
    const span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z, 1e-6);

    const scene = new THREE.Scene();
    const surface = new THREE.Mesh(
      geometry,
      new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    );
    scene.add(surface);
    const ambient = new THREE.AmbientLight(0xffffff, AMBIENT_EVEN);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0);
    scene.add(ambient, sunLight);

    const markers: THREE.Mesh[] = [];
    const size = span * 0.012;
    const siteColour = token('--text', 'white');
    const candidateColour = token('--mint', 'green');
    const selectedColour = token('--lavender-bright', 'violet');
    for (const mark of marks) {
      const selected = mark.id === selectedId;
      const top = mark.rank !== undefined && mark.rank <= 3;
      const s = selected ? size * 1.8 : top ? size * 1.4 : size;
      const g = mark.kind === 'site' ? new THREE.SphereGeometry(s, 16, 12) : new THREE.BoxGeometry(s * 1.6, s * 1.6, s * 1.6);
      const marker = new THREE.Mesh(
        g,
        new THREE.MeshBasicMaterial({ color: selected ? selectedColour : mark.kind === 'site' ? siteColour : candidateColour }),
      );
      marker.position.set(mark.at.x, mark.at.y + s * 1.2, mark.at.z);
      marker.userData.placeId = mark.id;
      scene.add(marker);
      markers.push(marker);
    }

    const camera = new THREE.PerspectiveCamera(40, 1, span / 1000, span * 20);
    camera.up.set(0, 1, 0);
    camera.position.set(0, span * 0.75, span * 0.75);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, (box.max.y + box.min.y) / 2, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = span * 0.1;
    controls.maxDistance = span * 3;
    controls.update();

    const render = () => renderer.render(scene, camera);
    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    };
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    liveRef.current = { sunLight, ambient, render };
    applySun(liveRef.current, sunRef.current, span);
    resize();

    const ray = new THREE.Raycaster();
    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const id = ray.intersectObjects(markers)[0]?.object.userData.placeId as string | undefined;
      if (id) pickRef.current(id);
    };
    renderer.domElement.addEventListener('click', onClick);

    return () => {
      liveRef.current = null;
      observer.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material;
          (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [mesh, colours, marks, selectedId]);

  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    applySun(live, sun, 1);
  }, [sun]);

  if (failed) return <p className="terrain-note" role="alert">{failed}</p>;
  return <div className="terrain-canvas" ref={hostRef} />;
}

function applySun(live: Live, sun: ScenePoint | null, distance: number) {
  if (sun && sun.y > 0) {
    live.sunLight.position.set(sun.x * distance * 10, sun.y * distance * 10, sun.z * distance * 10);
    live.sunLight.intensity = 2.0;
    live.ambient.intensity = AMBIENT_WITH_SUN;
  } else if (sun) {
    // Sun below the horizon at the site: no direct light, only a dim ambient.
    live.sunLight.intensity = 0;
    live.ambient.intensity = AMBIENT_WITH_SUN;
  } else {
    live.sunLight.intensity = 0;
    live.ambient.intensity = AMBIENT_EVEN;
  }
  live.render();
}
