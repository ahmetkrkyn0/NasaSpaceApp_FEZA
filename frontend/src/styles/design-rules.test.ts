import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Checks the design rules of the plan (F1-C acceptance 5 and 6) over every
// style sheet and component in src/. Values from the design export are
// referenced through var(--...), never written out.
const srcDir = fileURLToPath(new URL('..', import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sources = walk(srcDir).filter((f) => /\.(css|tsx?)$/.test(f) && !/\.test\.tsx?$/.test(f));

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('design rules', () => {
  it('scans the source tree', () => {
    expect(sources.some((f) => f.endsWith('shell.css'))).toBe(true);
  });

  it('writes no colour literal: hex, rgb, hsl or named colours come from tokens', () => {
    const offenders: string[] = [];
    for (const file of sources) {
      let text = stripComments(readFileSync(file, 'utf8'));
      // theme-light.css is itself a token file (issue #92): it may give values, but only in
      // custom property declarations. A colour written anywhere else in it still fails here.
      if (file.endsWith('theme-light.css')) text = text.replace(/^\s*--[a-z0-9-]+\s*:[^;]*;/gm, '');
      const matches = text.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? [];
      // Element ids such as #root are not colours.
      const colours = matches.filter((m) => !/^#root$/.test(m));
      if (colours.length > 0) offenders.push(`${file}: ${colours.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('takes every font family and font size from tokens', () => {
    const offenders: string[] = [];
    for (const file of sources.filter((f) => f.endsWith('.css'))) {
      const text = stripComments(readFileSync(file, 'utf8'));
      for (const match of text.matchAll(/font-(family|size)\s*:\s*([^;]+);/g)) {
        const value = (match[2] ?? '').trim();
        if (!/^var\(--(font|fs)-[a-z-]+\)$/.test(value) && value !== 'inherit') {
          offenders.push(`${file}: font-${match[1]}: ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('uses the design radius and nothing else for rounded corners', () => {
    const offenders: string[] = [];
    for (const file of sources.filter((f) => f.endsWith('.css'))) {
      const text = stripComments(readFileSync(file, 'utf8'));
      for (const match of text.matchAll(/border-radius\s*:\s*([^;]+);/g)) {
        const value = (match[1] ?? '').trim();
        if (value !== 'var(--radius)' && value !== '0') offenders.push(`${file}: ${value}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the design floor: the smallest type token is 12px and the radius is 2px', () => {
    const tokens = readFileSync(
      fileURLToPath(new URL('../../../frontend-migrate/design-export/tokens.css', import.meta.url)),
      'utf8',
    );
    const sizes = [...tokens.matchAll(/--fs-[a-z]+:\s*(\d+)px;/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBe(12);
    expect(tokens).toMatch(/--radius:\s*2px;/);
  });
});
