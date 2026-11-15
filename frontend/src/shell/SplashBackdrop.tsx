import { useEffect, useLayoutEffect, useState } from 'react';
import { applyTheme, themeStore, type Theme } from './theme';

/**
 * Background of the opening screen: NASA Scientific Visualization Studio animation 14992,
 * "Lunar Near and Far Side Phases" (an artist's concept, not the product's calculation).
 * Source, credit and changes are in `frontend/public/media/CREDITS.md`.
 */
export const BACKDROP_VIDEO_URL = `${import.meta.env.BASE_URL}media/backdrop/moon-phases-near-far-1080.mp4`;
export const BACKDROP_POSTER_URL = `${import.meta.env.BASE_URL}media/backdrop/moon-phases-near-far-poster.jpg`;
export const BACKDROP_CAPTION = "NASA SVS animation “Lunar Near and Far Side Phases”, an artist's concept; not computed by this product.";

/** Whether the viewer asked for reduced motion; then only the still poster is shown. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The poster is drawn at once; the 3.8 MB video is only attached after the first paint, and
 * never with reduced motion, so it does not slow the first view.
 */
export function SplashBackdrop() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.requestAnimationFrame(() => setPlay(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="splash-backdrop" aria-hidden="true">
      {play ? (
        <video className="splash-backdrop-media" src={BACKDROP_VIDEO_URL} poster={BACKDROP_POSTER_URL} autoPlay muted loop playsInline preload="auto" />
      ) : (
        <img className="splash-backdrop-media" src={BACKDROP_POSTER_URL} alt="" />
      )}
      <div className="splash-backdrop-shade" />
    </div>
  );
}

/** Visible label, so the picture is never read as computed data. */
export function SplashBackdropCaption() {
  return (
    <p className="splash-backdrop-caption">
      <span className="splash-backdrop-label">Illustration</span> {BACKDROP_CAPTION}
    </p>
  );
}

type ThemeRoot = Pick<HTMLElement, 'setAttribute' | 'removeAttribute'>;

/**
 * The opening screen is dark in both themes, so the NASA animation shows as made (Göktuğ, PR #151).
 * It only lifts the theme attribute while the screen is shown and puts the saved theme back when it
 * closes; the saved choice itself never changes, and the console follows it as before.
 */
export function holdDarkTheme(getTheme: () => Theme, root?: ThemeRoot | null): () => void {
  applyTheme('dark', root);
  return () => applyTheme(getTheme(), root);
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Keeps the page dark while the opening screen is mounted, before the first paint. */
export function useDarkWhileMounted() {
  useIsomorphicLayoutEffect(() => holdDarkTheme(() => themeStore.getState().theme), []);
}
