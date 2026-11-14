import { describe, expect, it } from 'vitest';
import { decodeLayer, parseBounds, syntheticLayer } from './layers';

function body(values: number[]): ArrayBuffer {
  const buffer = new ArrayBuffer(values.length * 4);
  const view = new DataView(buffer);
  values.forEach((v, i) => view.setFloat32(i * 4, v, true));
  return buffer;
}

describe('layer decoding', () => {
  it('reads every header the reference interface reads, case-insensitively', () => {
    const grid = decodeLayer(
      body([0, 1, 2, 3]),
      {
        'x-layer-rows': '2',
        'X-LAYER-COLS': '2',
        'X-Layer-Min': '0',
        'X-Layer-Max': '3',
        'X-Layer-Resolution-M': '20',
        'X-Layer-Validity': 'MEASURED',
        'X-Layer-Nodata': '0',
        'X-Layer-Downsample': '4',
        'X-Layer-Name': 'elevation',
      },
      'fallback',
    );
    expect(grid).toMatchObject({
      name: 'elevation',
      rows: 2,
      cols: 2,
      min: 0,
      max: 3,
      resolution_m: 20,
      validity: 'MEASURED',
      nodata_count: 0,
      downsample: 4,
      bounds: null,
    });
    expect(Array.from(grid.values)).toEqual([0, 1, 2, 3]);
  });

  it('uses the requested name and leaves unknown validity as null', () => {
    const grid = decodeLayer(body([1]), { 'X-Layer-Rows': '1', 'X-Layer-Cols': '1', 'X-Layer-Validity': 'GUESS' }, 'psr');
    expect(grid.name).toBe('psr');
    expect(grid.validity).toBeNull();
  });

  it('refuses a body whose size does not match rows x cols', () => {
    expect(() => decodeLayer(new ArrayBuffer(8), { 'X-Layer-Rows': '2', 'X-Layer-Cols': '3' }, 'psr')).toThrow(
      expect.objectContaining({ code: 'invalid_response' }),
    );
  });

  it('refuses missing or non-integer shape headers', () => {
    expect(() => decodeLayer(body([1]), { 'X-Layer-Rows': '1' }, 'psr')).toThrow(
      expect.objectContaining({ code: 'invalid_response' }),
    );
    expect(() => decodeLayer(body([1]), { 'X-Layer-Rows': '1.5', 'X-Layer-Cols': '1' }, 'psr')).toThrow(
      expect.objectContaining({ code: 'invalid_response' }),
    );
  });

  it('parses X-Layer-Bounds and rejects malformed values', () => {
    expect(parseBounds('-1, -2, 3, 4')).toEqual({ x_min: -1, y_min: -2, x_max: 3, y_max: 4 });
    expect(parseBounds('1,2,3')).toBeNull();
    expect(parseBounds('a,b,c,d')).toBeNull();
    expect(parseBounds(null)).toBeNull();
  });
});

describe('synthetic layer', () => {
  it('is an 8 x 8 ramp with one missing cell, labelled SYNTHETIC', () => {
    const grid = syntheticLayer('hillshade');
    expect([grid.rows, grid.cols]).toEqual([8, 8]);
    expect(grid.validity).toBe('SYNTHETIC');
    expect(Array.from(grid.values).filter(Number.isNaN)).toHaveLength(1);
    expect(grid.nodata_count).toBe(1);
  });
});
