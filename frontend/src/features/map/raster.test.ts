import { describe, expect, it } from 'vitest';
import type { LayerGrid } from '../../api/types';
import { layerPixels, psrAlpha } from './raster';

function psrGrid(values: number[]): LayerGrid {
  return {
    name: 'psr',
    rows: 1,
    cols: values.length,
    values: Float32Array.from(values),
    min: 0,
    max: 1,
    resolution_m: 40,
    validity: 'DERIVED',
    nodata_count: 0,
    downsample: 2,
    bounds: null,
  };
}

describe('permanent shadow raster', () => {
  it('scales opacity with the shadowed fraction', () => {
    expect(psrAlpha(1)).toBe(200);
    expect(psrAlpha(0.25)).toBe(50);
    expect(psrAlpha(0)).toBe(0);
    expect(psrAlpha(2)).toBe(200);
  });

  it('draws a quarter-shadowed block faintly and an unshadowed one not at all', () => {
    const pixels = layerPixels(psrGrid([0, 0.25, 1, Number.NaN]), 'psr', [10, 20, 30]);
    const alpha = [3, 7, 11, 15].map((i) => pixels[i]);
    expect(alpha).toEqual([0, 50, 200, 0]);
    expect(Array.from(pixels.slice(4, 7))).toEqual([10, 20, 30]);
  });
});
