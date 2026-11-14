// SVG glyphs from the design export (Material Symbols Outlined paths,
// fill="currentColor"). Loaded as text at build time, never fetched at run time.
const SOURCES = import.meta.glob('../../../frontend-migrate/design-export/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCES).map(([path, svg]) => {
    const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
    return [name, svg];
  }),
);

export function hasIcon(name: string): boolean {
  return name in ICONS;
}

export interface IconProps {
  name: string;
  className?: string;
}

/** Decorative icon; always pair it with visible text. */
export function Icon({ name, className }: IconProps) {
  const svg = ICONS[name];
  if (svg === undefined) {
    throw new Error(`Unknown icon "${name}". See frontend-migrate/design-export/icons/.`);
  }
  return (
    <span
      className={className ? `lp-icon ${className}` : 'lp-icon'}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
