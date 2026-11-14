/**
 * Turns a decoded layer grid into RGBA pixels. Grey levels follow the grid's own range; the
 * permanent-shadow layer is drawn as a mask. Missing cells (NaN) stay transparent.
 */

import type { LayerGrid, LayerName } from '../../api/types';

/** Grey level 0..255 of a value within the grid's range. */
export function greyLevel(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return -1;
  if (!(max > min)) return 128;
  return Math.round(Math.min(1, Math.max(0, (value - min) / (max - min))) * 255);
}

/** Range of the finite cells, used when the server sends no range header. */
export function gridRange(grid: LayerGrid): { min: number; max: number } | null {
  if (grid.min !== null && grid.max !== null) return { min: grid.min, max: grid.max };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of grid.values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return Number.isFinite(min) ? { min, max } : null;
}

export type Rgb = readonly [number, number, number];

/** Reads a design token such as `--umbra` (a six-digit hex value) as RGB bytes. */
export function tokenRgb(token: string): Rgb | null {
  if (typeof document === 'undefined') return null;
  const text = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const match = /^.([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(text);
  return match ? [parseInt(match[1] ?? '0', 16), parseInt(match[2] ?? '0', 16), parseInt(match[3] ?? '0', 16)] : null;
}

/** RGBA bytes, row 0 first. `mask` colours the shadowed cells of the permanent-shadow layer. */
export function layerPixels(grid: LayerGrid, name: LayerName, mask: Rgb = [255, 255, 255]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(grid.rows * grid.cols * 4);
  const range = gridRange(grid);
  for (let i = 0; i < grid.values.length; i += 1) {
    const v = grid.values[i] ?? Number.NaN;
    const level = range ? greyLevel(v, range.min, range.max) : -1;
    const o = i * 4;
    if (level < 0) continue; // transparent
    if (name === 'psr') {
      // Mask: shadowed cells in the umbra colour, others transparent.
      if (v > 0) {
        out[o] = mask[0];
        out[o + 1] = mask[1];
        out[o + 2] = mask[2];
        out[o + 3] = 200;
      }
      continue;
    }
    out[o] = level;
    out[o + 1] = level;
    out[o + 2] = level;
    out[o + 3] = 255;
  }
  return out;
}

/** A PNG data URL of the layer, or `null` outside a browser. */
export function layerImage(grid: LayerGrid, name: LayerName): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = grid.cols;
  canvas.height = grid.rows;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(grid.cols, grid.rows);
  image.data.set(layerPixels(grid, name, tokenRgb('--umbra') ?? undefined));
  context.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

export const LAYER_TEXT: Record<LayerName, { label: string; unit: string }> = {
  hillshade: { label: 'Hillshade', unit: '' },
  elevation: { label: 'Elevation', unit: 'm' },
  slope: { label: 'Slope', unit: '°' },
  psr: { label: 'Permanent shadow', unit: '' },
};
