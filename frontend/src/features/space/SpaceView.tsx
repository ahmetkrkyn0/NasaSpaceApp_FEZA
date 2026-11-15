import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GroundStation } from '../../api/types';
import { graticule, latLonToVector, type LatLon, type Vec3 } from '../globe/coords';
import type { GlobePlace } from '../globe/GlobeView';
import { MOON_TEXTURE_URL, TEXTURE_ROTATION_Y } from '../globe/texture';
import { cachedTexture, showTexture, token, useThemeKey } from '../globe/three-kit';
import { EARTH_RADIUS, decorativeStars, earthPoint, moonPoint, relayPoint, type EarthPose } from './frame';
import { EARTH_TEXTURE_URL, LANDER_MODEL_URL, type CameraPreset, type LinkDrawing } from './scene-text';
import { rotationQuaternion } from './three-frame';

export interface SpaceViewProps {
  /** Sites and candidate regions on the Moon. */
  places: readonly GlobePlace[];
  selectedId: string | null;
  /** Where the lander stands: the scenario's site or point. */
  site: LatLon | null;
  stations: readonly GroundStation[];
  /** Earth's place and orientation from the server sample; `null` hides Earth. */
  pose: EarthPose | null;
  link: LinkDrawing;
  showGrid: boolean;
  camera: CameraPreset;
  /** Changes each time a camera button is pressed, so the same preset can be asked for again. */
  cameraRequest: number;
}

const moonTexture = cachedTexture(MOON_TEXTURE_URL);
const earthTexture = cachedTexture(EARTH_TEXTURE_URL);

/** The lander model, loaded once per page; each scene uses its own copy. */
let landerModel: Promise<THREE.Object3D> | null = null;
function loadLander(): Promise<THREE.Object3D> {
  landerModel ??= new GLTFLoader().loadAsync(LANDER_MODEL_URL).then(
    (gltf) => gltf.scene,
    (error: unknown) => {
      landerModel = null;
      throw error;
    },
  );
  return landerModel;
}

/** Display sizes in Moon radii. The lander is enlarged about 4 000 times so it can be seen. */
const LANDER_HEIGHT = 0.16;
const STATION_SIZE = 0.09;
const STAR_COUNT = 1600;
const STAR_RADIUS = 90;
const AMBIENT_WITH_SUN = 0.25;
const AMBIENT_EVEN = 1.5;
const CAMERA_MS = 700;

const v3 = (p: Vec3) => new THREE.Vector3(p.x, p.y, p.z);

interface Live {
  earth: THREE.Group;
  earthBall: THREE.Mesh;
  plainEarth: THREE.Mesh;
  stationMarks: Map<string, THREE.Mesh>;
  links: THREE.Line[];
  relay: THREE.Group;
  relayPath: THREE.Line;
  sunLight: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  colours: { station: THREE.Color; listening: THREE.Color };
  site: LatLon | null;
  stations: readonly GroundStation[];
  render: () => void;
  moveCamera: (preset: CameraPreset) => void;
  setEarthLabel: (p: THREE.Vector3 | null) => void;
  setRelayLabel: (p: THREE.Vector3 | null) => void;
}

/** Camera target and position for a preset; Earth presets fall back to the Moon without a pose. */
export function cameraFor(preset: CameraPreset, pose: EarthPose | null, site: LatLon | null): { target: Vec3; position: Vec3 } {
  const from = (v: Vec3, k: number) => ({ x: v.x * k, y: v.y * k, z: v.z * k });
  if (preset === 'earth' && pose) {
    // Between Earth and the Moon, looking at the side of Earth that faces the Moon.
    return { target: pose.centre, position: { x: pose.centre.x - pose.direction.x * 6, y: pose.centre.y - pose.direction.y * 6 + 0.8, z: pose.centre.z - pose.direction.z * 6 } };
  }
  if (preset === 'link' && pose) {
    // Aimed nearer the Moon than the midpoint, so the Moon stays clear of the Plan door's
    // countdown card at the top left and Earth still fits on the right.
    const mid = from(pose.centre, 0.4);
    const up = Math.abs(pose.direction.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    const side = new THREE.Vector3().crossVectors(v3(pose.direction), v3(up)).normalize();
    return { target: mid, position: { x: mid.x + side.x * 13, y: mid.y + side.y * 13 + 3, z: mid.z + side.z * 13 } };
  }
  const look = site ? latLonToVector(site) : pose ? pose.direction : { x: 0, y: 0, z: 1 };
  return { target: { x: 0, y: 0, z: 0 }, position: from(look, 3.6) };
}

/**
 * WebGL view of the Earth–Moon scene. It draws only; every direction comes from the server
 * through `EarthPose` and the link state. The scene is built once per place list, stations, site,
 * grid setting and theme; Earth, the light, the link lines and the relay then move in place, so
 * playing the timeline neither rebuilds the scene nor resets the camera.
 */
export default function SpaceView(props: SpaceViewProps) {
  const { places, selectedId, site, stations, pose, link, showGrid, camera, cameraRequest } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const moonLabel = useRef<HTMLSpanElement>(null);
  const earthLabel = useRef<HTMLSpanElement>(null);
  const relayLabel = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<Live | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const theme = useThemeKey();
  const dynamic = useRef({ pose, link, camera });
  dynamic.current = { pose, link, camera };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed('The space scene needs WebGL, which this browser does not provide.');
      return;
    }
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    let disposed = false;
    const alive = () => !disposed;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 400);

    // Moon: body-fixed frame of the 3D Moon, radius 1.
    const moonMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color('silver'), roughness: 1, metalness: 0 });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), moonMaterial);
    moon.rotation.y = TEXTURE_ROTATION_Y;
    scene.add(moon);
    if (showGrid) {
      const gridMaterial = new THREE.LineBasicMaterial({ color: token('--line-button', 'grey'), transparent: true, opacity: 0.45 });
      for (const line of graticule(30)) {
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map((p) => v3(latLonToVector(p, 1.002)))), gridMaterial));
      }
    }
    const siteColour = token('--text', 'white');
    const candidateColour = token('--mint', 'green');
    const selectedColour = token('--lavender-bright', 'violet');
    for (const place of places) {
      const selected = place.id === selectedId;
      const size = selected ? 0.026 : 0.014;
      const geometry = place.kind === 'site' ? new THREE.SphereGeometry(size, 12, 10) : new THREE.BoxGeometry(size * 1.6, size * 1.6, size * 1.6);
      const mark = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: selected ? selectedColour : place.kind === 'site' ? siteColour : candidateColour }));
      const p = v3(moonPoint(place, 1.01));
      mark.position.copy(p);
      mark.lookAt(p.clone().multiplyScalar(2));
      scene.add(mark);
    }

    // Lander, upright on the site.
    if (site) {
      const holder = new THREE.Group();
      const normal = v3(latLonToVector(site)).normalize();
      holder.position.copy(normal);
      holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      scene.add(holder);
      loadLander().then(
        (model) => {
          if (!alive()) return;
          const copy = model.clone(true);
          const box = new THREE.Box3().setFromObject(copy);
          const height = box.max.y - box.min.y || 1;
          copy.scale.setScalar(LANDER_HEIGHT / height);
          copy.position.y = -box.min.y * (LANDER_HEIGHT / height);
          holder.add(copy);
          live.render();
        },
        () => undefined,
      );
    }

    // Earth: a group in Earth-fixed axes; the sphere inside carries the texture turn.
    const earth = new THREE.Group();
    const earthMaterial = new THREE.MeshStandardMaterial({ color: token('--cyan', 'teal'), roughness: 0.9, metalness: 0 });
    const earthBall = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS, 96, 64), earthMaterial);
    earthBall.rotation.y = TEXTURE_ROTATION_Y;
    earth.add(earthBall);
    // Without a turn the image and the stations would face the wrong way: a plain ball instead.
    const plainEarth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_RADIUS, 48, 32), new THREE.MeshStandardMaterial({ color: token('--text-3', 'grey'), roughness: 1, metalness: 0 }));
    plainEarth.visible = false;
    earth.add(plainEarth);
    const stationColour = token('--text-2', 'grey');
    const listeningColour = token('--mint', 'green');
    const stationMarks = new Map<string, THREE.Mesh>();
    for (const station of stations) {
      // Antenna mark: a cone pointing straight up from the station.
      const mark = new THREE.Mesh(new THREE.ConeGeometry(STATION_SIZE * 0.6, STATION_SIZE * 1.6, 12), new THREE.MeshBasicMaterial({ color: stationColour.clone() }));
      const local = v3(latLonToVector(station, EARTH_RADIUS));
      const up = local.clone().normalize();
      mark.position.copy(local.clone().add(up.clone().multiplyScalar(STATION_SIZE * 0.8)));
      mark.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      mark.userData.stationId = station.id;
      earth.add(mark);
      stationMarks.set(station.id, mark);
    }
    earth.visible = false;
    scene.add(earth);

    // Link lines (one per listening station) and the schematic relay.
    const links = stations.map(() => {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: listeningColour }));
      line.visible = false;
      scene.add(line);
      return line;
    });
    const relay = new THREE.Group();
    const relayColour = token('--coral', 'orange');
    relay.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: relayColour })));
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.01, 0.1), new THREE.MeshBasicMaterial({ color: relayColour }));
    relay.add(panel);
    relay.visible = false;
    scene.add(relay);
    const relayPath = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({ color: relayColour, dashSize: 0.15, gapSize: 0.1 }),
    );
    relayPath.visible = false;
    scene.add(relayPath);

    // Decorative stars.
    const stars = new THREE.BufferGeometry().setFromPoints(decorativeStars(STAR_COUNT, STAR_RADIUS).map(v3));
    scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: token('--text-2', 'white'), size: 1.4, sizeAttenuation: false })));

    const ambient = new THREE.AmbientLight(0xffffff, AMBIENT_EVEN);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0);
    scene.add(ambient, sunLight);

    const controls = new OrbitControls(cam, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.3;
    controls.maxDistance = 40;
    controls.enableDamping = !reduceMotion;

    const placeLabel = (el: HTMLElement | null, point: THREE.Vector3 | null) => {
      if (!el) return;
      if (!point) {
        el.style.display = 'none';
        return;
      }
      const projected = point.clone().project(cam);
      const inFront = projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
      el.style.display = inFront ? 'block' : 'none';
      el.style.left = `${((projected.x + 1) / 2) * host.clientWidth}px`;
      el.style.top = `${((1 - projected.y) / 2) * host.clientHeight}px`;
    };
    let earthAt: THREE.Vector3 | null = null;
    let relayAt: THREE.Vector3 | null = null;
    // Body labels sit just above each disc as seen by the camera, whatever its turn.
    const above = (centre: THREE.Vector3, radius: number) => new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion).multiplyScalar(radius).add(centre);
    const render = () => {
      placeLabel(moonLabel.current, above(new THREE.Vector3(), 1.2));
      placeLabel(earthLabel.current, earthAt ? above(earthAt, EARTH_RADIUS + 0.35) : null);
      placeLabel(relayLabel.current, relayAt);
      renderer.render(scene, cam);
    };

    let tween: { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number } | null = null;
    const moveCamera = (preset: CameraPreset) => {
      const goal = cameraFor(preset, dynamic.current.pose, site);
      const to = v3(goal.position);
      const toTarget = v3(goal.target);
      if (reduceMotion) {
        cam.position.copy(to);
        controls.target.copy(toTarget);
        controls.update();
        render();
        return;
      }
      tween = { from: cam.position.clone(), to, fromTarget: controls.target.clone(), toTarget, start: performance.now() };
    };

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      render();
    };
    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      let moved = false;
      if (tween) {
        const k = Math.min(1, (performance.now() - tween.start) / CAMERA_MS);
        const e = k * k * (3 - 2 * k);
        cam.position.lerpVectors(tween.from, tween.to, e);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
        if (k >= 1) tween = null;
        moved = true;
      }
      if (controls.update() || moved) render();
    };
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const live: Live = {
      earth,
      earthBall,
      plainEarth,
      stationMarks,
      links,
      relay,
      relayPath,
      sunLight,
      ambient,
      colours: { station: stationColour, listening: listeningColour },
      site,
      stations,
      render,
      moveCamera,
      setEarthLabel: (p) => {
        earthAt = p;
      },
      setRelayLabel: (p) => {
        relayAt = p;
      },
    };
    liveRef.current = live;
    showTexture(moonTexture, moonMaterial, renderer, alive, render);
    showTexture(earthTexture, earthMaterial, renderer, alive, render);

    const start = cameraFor(dynamic.current.camera, dynamic.current.pose, site);
    cam.position.copy(v3(start.position));
    controls.target.copy(v3(start.target));
    controls.update();
    applyMoment(live, dynamic.current.pose, dynamic.current.link);
    resize();
    if (!reduceMotion) loop();

    return () => {
      disposed = true;
      liveRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
          o.geometry.dispose();
          const m = o.material;
          (Array.isArray(m) ? m : [m]).forEach((x: THREE.Material) => x.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [places, selectedId, site, stations, showGrid, theme]);

  // The selected moment moves Earth, the light, the link lines and the relay only.
  useEffect(() => {
    if (liveRef.current) applyMoment(liveRef.current, pose, link);
  }, [pose, link]);

  // A camera button moves the camera; the first render already placed it.
  const firstRequest = useRef(cameraRequest);
  useEffect(() => {
    if (cameraRequest !== firstRequest.current) liveRef.current?.moveCamera(camera);
  }, [camera, cameraRequest]);

  if (failed) return <p className="space-note" role="alert">{failed}</p>;
  return (
    <div className="space-canvas" ref={hostRef}>
      <span className="space-label" ref={moonLabel}>
        Moon
      </span>
      <span className="space-label" ref={earthLabel}>
        Earth
      </span>
      <span className="space-label space-label-relay" ref={relayLabel}>
        Relay (illustration)
      </span>
    </div>
  );
}

function applyMoment(live: Live, pose: EarthPose | null, link: LinkDrawing) {
  const sitePoint = live.site ? v3(moonPoint(live.site, 1.0)) : null;
  if (pose) {
    live.sunLight.position.copy(v3(pose.sun).multiplyScalar(50));
    live.sunLight.intensity = 2.2;
    live.ambient.intensity = AMBIENT_WITH_SUN;
    live.earth.position.copy(v3(pose.centre));
    const turned = pose.rotation !== null;
    if (pose.rotation) live.earth.quaternion.copy(rotationQuaternion(pose.rotation));
    live.earthBall.visible = turned;
    live.plainEarth.visible = !turned;
    for (const mark of live.stationMarks.values()) mark.visible = turned;
    live.earth.visible = true;
    live.setEarthLabel(v3(pose.centre));
  } else {
    live.sunLight.intensity = 0;
    live.ambient.intensity = AMBIENT_EVEN;
    live.earth.visible = false;
    live.setEarthLabel(null);
  }

  const listening = new Set(link.mode === 'direct' ? link.stationIds : []);
  for (const [id, mark] of live.stationMarks) {
    const on = listening.has(id);
    (mark.material as THREE.MeshBasicMaterial).color.copy(on ? live.colours.listening : live.colours.station);
    mark.scale.setScalar(on ? 1.5 : 1);
  }

  // Direct: a line from the site to each station that hears it.
  const targets = pose && sitePoint ? live.stations.filter((s) => listening.has(s.id)) : [];
  live.links.forEach((line, i) => {
    const station = targets[i];
    const end = station && pose ? earthPoint(pose, station, 1.0) : null;
    if (!station || !end || !sitePoint) {
      line.visible = false;
      return;
    }
    line.geometry.setFromPoints([sitePoint, v3(end)]);
    // New end points: refresh the bounds, or the camera may cull a line that is in view.
    line.geometry.computeBoundingSphere();
    line.visible = true;
  });

  // Relay needed: schematic satellite and dashed path, always labelled as an illustration.
  if (link.mode === 'relay_needed' && pose && live.site && sitePoint) {
    const at = v3(relayPoint(live.site, pose.direction));
    live.relay.position.copy(at);
    live.relay.lookAt(v3(pose.centre));
    live.relay.visible = true;
    live.relayPath.geometry.setFromPoints([sitePoint, at, v3(pose.centre)]);
    live.relayPath.computeLineDistances();
    live.relayPath.geometry.computeBoundingSphere();
    live.relayPath.visible = true;
    live.setRelayLabel(at.clone().add(new THREE.Vector3(0, 0.25, 0)));
  } else {
    live.relay.visible = false;
    live.relayPath.visible = false;
    live.setRelayLabel(null);
  }
  live.render();
}
