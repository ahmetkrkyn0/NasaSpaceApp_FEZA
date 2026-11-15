import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sites from '../../../../data/sites.json';
import type { Scenario } from '../../api/types';
import { ILLUSTRATION_NOTE, LANDER_NOTE, SCENE_MEDIA, sceneFor } from './media';
import { SceneView } from './SceneView';

const MEDIA_DIR = fileURLToPath(new URL('../../../public/media/', import.meta.url));
const CONTENT = fileURLToPath(new URL('../../content/scene-media.json', import.meta.url));
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));

const scenario = (site_id: string | null): Scenario => ({
  scenario_id: 's',
  label: 'x',
  site_id,
  lat_deg: site_id ? null : -85,
  lon_deg: site_id ? null : 30,
  start_utc: '2026-12-01T00:00:00Z',
  end_utc: '2026-12-31T00:00:00Z',
  mast_height_m: null,
  panel_profile_id: 'vertical_tracking',
});

/** RenderToStaticMarkup escapes apostrophes. */
const html = (text: string) => text.replace(/'/g, '&#x27;');

describe('scene media content', () => {
  it('lists every catalogue site, mapped with a basis and source or unmapped with a reason', () => {
    const listed = SCENE_MEDIA.sites.map((s) => s.site_id).sort();
    expect(listed).toEqual(sites.map((s) => s.id).sort());
    for (const entry of SCENE_MEDIA.sites) {
      if (entry.scene === null) {
        expect(entry.reason.trim()).not.toBe('');
      } else {
        expect(entry.basis.trim()).not.toBe('');
        expect(entry.source_label.trim()).not.toBe('');
        const url = entry.source_url.trim();
        // An https address, or a repository path that exists.
        expect(/^https:\/\//.test(url) || existsSync(`${REPO}${url}`)).toBe(true);
      }
    }
  });

  it('names only files that exist under frontend/public/media', () => {
    for (const scene of Object.values(SCENE_MEDIA.scenes)) {
      for (const file of [scene.poster, scene.loop, ...scene.views.map((v) => v.file)]) {
        expect(existsSync(`${MEDIA_DIR}${file}`), file).toBe(true);
      }
    }
  });

  it('never names the left-out frames', () => {
    const text = readFileSync(CONTENT, 'utf8');
    for (const name of ['earth.jpg', 'sun.jpg', 'moon.jpg', 'moonzoom.jpg']) expect(text).not.toContain(name);
  });
});

describe('surface view panel', () => {
  it('shows the illustration with its label and both notes', () => {
    const choice = sceneFor(scenario('mons-mouton-im2-target'));
    expect(choice.kind).toBe('scene');
    const out = renderToStaticMarkup(<SceneView choice={choice} />);
    expect(out).toContain('>Illustration<');
    expect(out).toContain(html(ILLUSTRATION_NOTE));
    expect(out).toContain(html(LANDER_NOTE));
    expect(out).toContain('scenes/moon-ridges/poster.jpg');
    // No validity badge: this is not data.
    expect(out).not.toMatch(/validity-badge|Measured|Derived|Assumed/);
  });

  it('keeps the label and notes on every still view', () => {
    for (const view of ['overview', 'ground', 'lander']) {
      const out = renderToStaticMarkup(<SceneView choice={sceneFor(scenario('blue-ghost-1'))} initialView={view} />);
      expect(out).toContain(`scenes/moon-plains/${view}.jpg`);
      expect(out).toContain('>Illustration<');
      expect(out).toContain(html(LANDER_NOTE));
    }
  });

  it('does not load or play the loop until it is asked for', () => {
    const start = renderToStaticMarkup(<SceneView choice={sceneFor(scenario('chandrayaan-3'))} />);
    expect(start).not.toContain('<video');
    expect(start).not.toContain('orbit.mp4');
    const loop = renderToStaticMarkup(<SceneView choice={sceneFor(scenario('chandrayaan-3'))} initialView="loop" />);
    expect(loop).toMatch(/<video[^>]*preload="none"/);
    expect(loop).toContain('playsinline');
    expect(loop).toContain('>Illustration<');
  });

  it('shows text, not an image, for a custom point and an unmapped site', () => {
    const custom = renderToStaticMarkup(<SceneView choice={sceneFor(scenario(null))} />);
    expect(custom).toContain('Custom points have no surface illustration');
    expect(custom).not.toContain('<img');
    const unmapped = renderToStaticMarkup(<SceneView choice={sceneFor(scenario('hakuto-r-m2'))} />);
    expect(unmapped).toContain('No surface illustration for this site.');
    expect(unmapped).not.toContain('<img');
  });

  it('changes the scene with the site', () => {
    const a = sceneFor(scenario('blue-ghost-1'));
    const b = sceneFor(scenario('im2-athena'));
    expect(a.kind === 'scene' && a.scene.poster).toBe('scenes/moon-plains/poster.jpg');
    expect(b.kind === 'scene' && b.scene.poster).toBe('scenes/moon-ridges/poster.jpg');
  });
});
