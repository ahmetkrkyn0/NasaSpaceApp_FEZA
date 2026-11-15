/**
 * Light theme rules (issue #92), read from the files themselves:
 * - theme-light.css only redefines variables that tokens.css defines, and only under
 *   `:root[data-theme='light']`, so the dark theme (no attribute) keeps every value.
 * - Contrast, computed from the values in the files (WCAG 2 relative luminance).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '');

const tokensText = stripComments(read('../../../frontend-migrate/design-export/tokens.css'));
const lightText = stripComments(read('./theme-light.css'));

/** `--name: value` pairs of a style sheet, in order. */
function declarations(text: string): [string, string][] {
  return [...text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]);
}

/** Variables of the top-level `:root` blocks of tokens.css (the dark theme as exported). */
function rootTokens(): Map<string, string> {
  const out = new Map<string, string>();
  for (const block of tokensText.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) {
    for (const [name, value] of declarations(block[2]!)) out.set(name, value);
  }
  return out;
}

const DARK = rootTokens();
const LIGHT_OVERRIDES = new Map(declarations(lightText));
/** The light theme: dark tokens with the light overrides on top. */
const LIGHT = new Map([...DARK, ...LIGHT_OVERRIDES]);

type Rgba = [number, number, number, number];

/** Resolves `var(--x)` chains and parses `#rrggbb` or `rgba(r, g, b, a)`. */
function colour(theme: Map<string, string>, name: string, depth = 0): Rgba {
  const value = theme.get(name);
  if (value === undefined || depth > 8) throw new Error(`${name} is not a colour variable`);
  const ref = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  if (ref) return colour(theme, ref[1]!, depth + 1);
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex) return [parseInt(hex[1]!, 16), parseInt(hex[2]!, 16), parseInt(hex[3]!, 16), 1];
  const rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(value);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), Number(rgba[4])];
  throw new Error(`${name}: ${value} is not a parsed colour`);
}

/** A translucent colour laid over an opaque one. */
function over([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Grounds text and marks are drawn on: page, rail, card, inset, raised, the horizon strip plot
 * (`--surface-high`), and the floating panels (`--glass`, `--glass-strong`) laid over the page.
 */
function grounds(theme: Map<string, string>): [string, Rgba][] {
  const opaque = ['--void', '--bg-surface', '--bg-card', '--bg-inset', '--bg-raised', '--surface-high'].map(
    (n) => [n, colour(theme, n)] as [string, Rgba],
  );
  const page = colour(theme, '--void');
  const glass = ['--glass', '--glass-strong'].map((n) => [`${n} over --void`, over(colour(theme, n), page)] as [string, Rgba]);
  return [...opaque, ...glass];
}

/** Text: the text steps, and the accents the components use as text colour (labels, links, badges). */
const TEXT_PAIRS = [
  '--text',
  '--text-2',
  '--text-3',
  '--text-muted',
  '--text-muted-2',
  '--text-dim',
  '--text-dim-2',
  '--text-dimmest',
  '--secondary',
  '--lavender',
  '--lavender-bright',
  '--mint-text',
  '--cyan-text',
  '--coral-text',
  // Accents also written as text colour in component CSS (badges, legends, stars).
  '--cyan',
  '--risk-med',
  '--risk-high',
];

/**
 * Data and control colours: Sun (`--risk-med`, `--terminator`), Earth (`--cyan`), the risk
 * ramp, the accents, control edges and the horizon line (`--line-button`), the focus ring.
 * `--umbra` is left out on purpose: it is drawn only over the grey elevation image, which is
 * the same in both themes, so it keeps its dark-theme value.
 */
const DATA_PAIRS = [
  '--risk-low',
  '--risk-med',
  '--risk-high',
  '--risk-crit',
  '--terminator',
  '--cyan',
  '--mint',
  '--coral',
  '--lavender',
  '--line-button',
  '--line-accent-hover',
];

function failures(theme: Map<string, string>, names: readonly string[], minimum: number): string[] {
  const out: string[] = [];
  for (const name of names) {
    for (const [ground, value] of grounds(theme)) {
      const ratio = contrast(colour(theme, name), value);
      if (ratio < minimum) out.push(`${name} on ${ground}: ${ratio.toFixed(2)}`);
    }
  }
  return out;
}

describe('theme-light.css', () => {
  it('redefines only variables that tokens.css defines; it invents no name', () => {
    expect(LIGHT_OVERRIDES.size).toBeGreaterThan(0);
    const unknown = [...LIGHT_OVERRIDES.keys()].filter((name) => !DARK.has(name));
    expect(unknown).toEqual([]);
  });

  it('changes colours only: no type scale, tracking, faces or radius', () => {
    const other = [...LIGHT_OVERRIDES.keys()].filter((name) => /^--(fs|font|track|radius|backdrop)/.test(name));
    expect(other).toEqual([]);
  });

  it('applies only under :root[data-theme="light"], so the dark theme keeps every value', () => {
    const selectors = [...lightText.matchAll(/([^{}]+)\{/g)].map((m) => m[1]!.trim());
    expect(selectors).toEqual([":root[data-theme='light']"]);
  });

  it('gives every text step and every accent used as text 4.5:1 on every ground', () => {
    expect(failures(LIGHT, TEXT_PAIRS, 4.5)).toEqual([]);
  });

  it('gives data colours, control edges and the horizon line 3:1 on every ground', () => {
    expect(failures(LIGHT, DATA_PAIRS, 3)).toEqual([]);
  });

  it('keeps the reliability labels and the Illustration label apart: four different colours', () => {
    // ValidityBadge: Measured --mint-text, Model --cyan-text, Derived --lavender, Assumed --risk-med (dashed).
    // Illustration: --lavender with a dashed border, so it differs from Derived (solid) by line style too.
    const badges = ['--mint-text', '--cyan-text', '--lavender', '--risk-med'].map((n) => colour(LIGHT, n).slice(0, 3).join(','));
    expect(new Set(badges).size).toBe(4);
  });

  it('the light theme is light: text is darker than its ground, unlike the dark theme', () => {
    expect(luminance(colour(LIGHT, '--text'))).toBeLessThan(luminance(colour(LIGHT, '--bg-card')));
    expect(luminance(colour(DARK, '--text'))).toBeGreaterThan(luminance(colour(DARK, '--bg-card')));
  });
});
