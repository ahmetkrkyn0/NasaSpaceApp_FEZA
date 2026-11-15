import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { bodySeriesExample, earthLinkExample, earthLinkRelayExample, groundStationsExample } from '../../api/examples';
import { latLonToVector } from '../globe/coords';
import { EARTH_DISTANCE, EARTH_RADIUS, angleDeg, applyRotation, decorativeStars, earthPoint, earthPose, relayPoint, triad } from './frame';
import { EARTH_TEXTURE_URL, LANDER_MODEL_URL, linkDrawingAt } from './scene-text';
import { rotationQuaternion } from './three-frame';

const sample = bodySeriesExample.samples[0]!;
const pose = earthPose(sample)!;

describe('Earth placement from the server sample', () => {
  it('puts Earth along the sub-Earth direction at the display distance', () => {
    const dir = latLonToVector({ lat_deg: sample.sub_earth_lat_deg, lon_deg: sample.sub_earth_lon_deg });
    expect(angleDeg(pose.centre, dir)).toBeLessThan(1e-5);
    expect(Math.hypot(pose.centre.x, pose.centre.y, pose.centre.z)).toBeCloseTo(EARTH_DISTANCE, 9);
  });

  it('turns Earth so its sub-lunar point faces the Moon and its sub-solar point faces the Sun', () => {
    expect(pose.rotation).not.toBeNull();
    const subLunar = earthPoint(pose, { lat_deg: sample.earth_sub_lunar_lat_deg, lon_deg: sample.earth_sub_lunar_lon_deg })!;
    // The sub-lunar point is the point of Earth nearest the Moon's centre (the scene origin).
    const outward = { x: subLunar.x - pose.centre.x, y: subLunar.y - pose.centre.y, z: subLunar.z - pose.centre.z };
    const toMoon = { x: -pose.centre.x, y: -pose.centre.y, z: -pose.centre.z };
    expect(angleDeg(outward, toMoon)).toBeLessThan(1e-6);
    const subSolar = earthPoint(pose, { lat_deg: sample.earth_sub_solar_lat_deg, lon_deg: sample.earth_sub_solar_lon_deg })!;
    const sunward = { x: subSolar.x - pose.centre.x, y: subSolar.y - pose.centre.y, z: subSolar.z - pose.centre.z };
    // Only the roll is set from the Sun, so allow for the Sun's parallax between Earth and the Moon.
    expect(angleDeg(sunward, pose.sun)).toBeLessThan(0.5);
  });

  it('places the stations at their latitude and longitude on the turned Earth', () => {
    for (const station of groundStationsExample) {
      const p = earthPoint(pose, station)!;
      const local = applyRotation(pose.rotation!, latLonToVector(station, EARTH_RADIUS));
      expect(p.x).toBeCloseTo(pose.centre.x + local.x, 9);
      expect(Math.hypot(p.x - pose.centre.x, p.y - pose.centre.y, p.z - pose.centre.z)).toBeCloseTo(EARTH_RADIUS, 9);
    }
  });

  it('gives three.js the same turn, so drawn station marks match the computed points', () => {
    const group = new THREE.Group();
    group.position.set(pose.centre.x, pose.centre.y, pose.centre.z);
    group.quaternion.copy(rotationQuaternion(pose.rotation!));
    group.updateMatrixWorld(true);
    for (const station of groundStationsExample) {
      const local = latLonToVector(station, EARTH_RADIUS);
      const world = new THREE.Vector3(local.x, local.y, local.z).applyMatrix4(group.matrixWorld);
      const expected = earthPoint(pose, station)!;
      expect(world.distanceTo(new THREE.Vector3(expected.x, expected.y, expected.z))).toBeLessThan(1e-6);
    }
  });

  it('has no orientation when the reference points are in line', () => {
    expect(triad({ x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 })).toBeNull();
    expect(earthPose({ ...sample, earth_sub_lunar_lat_deg: Number.NaN })).toBeNull();
  });

  it('computes no Earth rotation, time or ephemeris in the scene code', () => {
    for (const file of ['frame.ts', 'three-frame.ts', 'SpaceView.tsx', 'scene-text.ts', 'index.tsx']) {
      const text = readFileSync(fileURLToPath(new URL(`./${file}`, import.meta.url)), 'utf8');
      expect(text).not.toMatch(/julian|sidereal|gmst|obliquity|anomaly|getTime\(|Date\.now|new Date|86164|7\.292/i);
    }
  });
});

describe('scene drawing helpers', () => {
  it('keeps the relay above the Moon and the stars the same on every load', () => {
    const r = relayPoint({ lat_deg: -45, lon_deg: 177 }, pose.direction);
    expect(Math.hypot(r.x, r.y, r.z)).toBeGreaterThan(1.5);
    expect(decorativeStars(5, 10)).toEqual(decorativeStars(5, 10));
  });

  it('draws the link from the server windows: lines for direct, none otherwise', () => {
    const direct = linkDrawingAt(earthLinkExample, '2026-12-01T06:00:00Z');
    expect(direct.mode).toBe('direct');
    expect(direct.stationIds.length).toBeGreaterThan(0);
    expect(linkDrawingAt(earthLinkExample, '2026-12-02T01:00:00Z')).toEqual({ mode: 'no_station', stationIds: [] });
    const relayWindow = earthLinkRelayExample.link_windows.find((w) => w.mode === 'relay_needed')!;
    expect(linkDrawingAt(earthLinkRelayExample, relayWindow.start_utc)).toEqual({ mode: 'relay_needed', stationIds: [] });
    expect(linkDrawingAt(null, '2026-12-01T06:00:00Z').mode).toBeNull();
  });

  it('uses files that exist in the public media folder and are credited', () => {
    const credits = readFileSync(fileURLToPath(new URL('../../../public/media/CREDITS.md', import.meta.url)), 'utf8');
    for (const url of [EARTH_TEXTURE_URL, LANDER_MODEL_URL]) {
      const file = url.replace(/^.*media\//, '');
      expect(() => readFileSync(fileURLToPath(new URL(`../../../public/media/${file}`, import.meta.url)))).not.toThrow();
      expect(credits).toContain(file);
    }
  });
});
