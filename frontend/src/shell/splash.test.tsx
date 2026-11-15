import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Splash } from './Splash';
import { BACKDROP_CAPTION, BACKDROP_POSTER_URL, BACKDROP_VIDEO_URL, BackdropPauseButton, holdDarkTheme, prefersReducedMotion } from './SplashBackdrop';

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

describe('opening screen theme', () => {
  function fakeRoot() {
    const attrs = new Map<string, string>();
    return {
      attrs,
      setAttribute: (k: string, v: string) => void attrs.set(k, v),
      removeAttribute: (k: string) => void attrs.delete(k),
    };
  }

  it('is dark in the light theme too, and gives the saved theme back when it closes', () => {
    const root = fakeRoot();
    root.setAttribute('data-theme', 'light');
    const release = holdDarkTheme(() => 'light', root);
    expect(root.attrs.has('data-theme')).toBe(false);
    release();
    expect(root.attrs.get('data-theme')).toBe('light');
  });

  it('leaves the dark theme as it is', () => {
    const root = fakeRoot();
    const release = holdDarkTheme(() => 'dark', root);
    release();
    expect(root.attrs.has('data-theme')).toBe(false);
  });
});

describe('pausing the background', () => {
  it('offers a keyboard button that says what it does and whether the video is paused', () => {
    const playing = renderToStaticMarkup(<BackdropPauseButton paused={false} onToggle={() => undefined} />);
    expect(playing).toContain('<button type="button"');
    expect(playing).toContain('aria-pressed="false"');
    expect(playing).toContain('Pause background');
    const paused = renderToStaticMarkup(<BackdropPauseButton paused onToggle={() => undefined} />);
    expect(paused).toContain('aria-pressed="true"');
    expect(paused).toContain('Play background');
  });

  it('shows no button while only the still poster is drawn (first paint, reduced motion)', () => {
    expect(renderToStaticMarkup(<Splash onEnter={() => undefined} />)).not.toContain('background</button>');
  });
});
