export const PRODUCT_NAME = 'Lunar Landing Site Navigator';
export const PRODUCT_TAGLINE = 'Sun and Earth above the horizon, for any landing site and date';

/**
 * Product mark: a horizon line with a sun disc and an Earth disc above it.
 * Drawn from the palette tokens; no agency logos or insignia.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="brand-mark-ring" cx="32" cy="32" r="29" />
      <circle className="brand-mark-sun" cx="22" cy="26" r="7" />
      <circle className="brand-mark-earth" cx="43" cy="20" r="4.5" />
      <path className="brand-mark-horizon" d="M5 40 L18 35 L27 38 L38 31 L49 36 L59 34 L59 44 A29 29 0 0 1 5 44 Z" />
    </svg>
  );
}
