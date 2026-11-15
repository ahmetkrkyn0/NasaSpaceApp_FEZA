import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Splash } from './Splash';
import { BACKDROP_CAPTION, BACKDROP_POSTER_URL, BACKDROP_VIDEO_URL, prefersReducedMotion } from './SplashBackdrop';

const publicFile = (url: string) => fileURLToPath(new URL(`../../public/${url.replace(/^\//, '')}`, import.meta.url));
const credits = readFileSync(fileURLToPath(new URL('../../public/media/CREDITS.md', import.meta.url)), 'utf8');

describe('opening screen background', () => {
  it('starts with the still poster, so the first view loads no video and moves nothing', () => {
    const html = renderToStaticMarkup(<Splash onEnter={() => undefined} />);
    expect(html).toContain(`src="${BACKDROP_POSTER_URL}"`);
    expect(html).not.toContain('<video');
    // Decorative: hidden from screen readers, and the button is still the first control.
    expect(html).toMatch(/class="splash-backdrop" aria-hidden="true"/);
    expect(html).toContain('Open console</button>');
  });

  it('is labelled as an illustration on screen, not as computed data', () => {
    const html = renderToStaticMarkup(<Splash onEnter={() => undefined} />);
    expect(html).toContain('>Illustration</span>');
    expect(html).toContain(BACKDROP_CAPTION.replaceAll("'", '&#x27;'));
    expect(BACKDROP_CAPTION).toContain('not computed');
  });

  it('treats a missing matchMedia as reduced motion (no autoplay outside a browser)', () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it('ships both files and credits their NASA source', () => {
    for (const url of [BACKDROP_VIDEO_URL, BACKDROP_POSTER_URL]) expect(existsSync(publicFile(url))).toBe(true);
    expect(credits).toContain('backdrop/moon-phases-near-far-1080.mp4');
    expect(credits).toContain('https://svs.gsfc.nasa.gov/14992/');
    expect(credits).toContain('no NASA endorsement is implied');
  });
});
