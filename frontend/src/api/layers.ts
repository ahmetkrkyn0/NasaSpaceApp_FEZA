/**
 * Map layer transport (`/api/layers/{name}?format=f32`): a headerless little-endian Float32
 * array, with shape, range and validity in response headers (frontend-migrate/DESIGN.md, 6.3;
 * ADR-0004 adds `X-Layer-Bounds`). Missing cells are NaN; `X-Layer-Nodata` counts them.
 */

import { ApiError } from './errors';
import { VALIDITY_VALUES, type LayerBounds, type LayerGrid, type Validity } from './types';

export const LAYER_HEADERS = {
  rows: 'X-Layer-Rows',
  cols: 'X-Layer-Cols',
  min: 'X-Layer-Min',
  max: 'X-Layer-Max',
  resolution: 'X-Layer-Resolution-M',
  validity: 'X-Layer-Validity',
  nodata: 'X-Layer-Nodata',
  downsample: 'X-Layer-Downsample',
  name: 'X-Layer-Name',
  bounds: 'X-Layer-Bounds',
} as const;

/** Anything with a case-insensitive `get`, such as `Headers`; or a plain object. */
export type HeaderSource = { get(name: string): string | null } | Record<string, string | undefined>;

function header(source: HeaderSource, name: string): string | null {
  if (typeof (source as { get?: unknown }).get === 'function') {
    return (source as { get(name: string): string | null }).get(name);
  }
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(source as Record<string, string | undefined>)) {
    if (key.toLowerCase() === wanted) return value ?? null;
  }
  return null;
}

function numberHeader(source: HeaderSource, name: string): number | null {
  const raw = header(source, name);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function integerHeader(source: HeaderSource, name: string): number {
  const value = numberHeader(source, name);
  if (value === null || !Number.isInteger(value) || value <= 0) {
    throw new ApiError('invalid_response', `Layer header ${name} is missing or not a positive integer.`);
  }
  return value;
}

function validityHeader(source: HeaderSource): Validity | null {
  const raw = header(source, LAYER_HEADERS.validity);
  return raw !== null && (VALIDITY_VALUES as readonly string[]).includes(raw) ? (raw as Validity) : null;
}

/** `x_min,y_min,x_max,y_max` in metres. */
export function parseBounds(raw: string | null): LayerBounds | null {
  if (raw === null) return null;
  const parts = raw.split(',').map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((p) => !Number.isFinite(p))) return null;
  const [x_min, y_min, x_max, y_max] = parts as [number, number, number, number];
  return { x_min, y_min, x_max, y_max };
}

/** Decodes a layer body and its headers. Throws `invalid_response` when the shape does not match. */
export function decodeLayer(buffer: ArrayBuffer, headers: HeaderSource, fallbackName: string): LayerGrid {
  const rows = integerHeader(headers, LAYER_HEADERS.rows);
  const cols = integerHeader(headers, LAYER_HEADERS.cols);
  if (buffer.byteLength !== rows * cols * 4) {
    throw new ApiError(
      'invalid_response',
      `Layer body has ${buffer.byteLength} bytes; ${rows} x ${cols} float32 values need ${rows * cols * 4}.`,
    );
  }
  // DataView reads little-endian on any platform.
  const view = new DataView(buffer);
  const values = new Float32Array(rows * cols);
  for (let i = 0; i < values.length; i += 1) values[i] = view.getFloat32(i * 4, true);

  return {
    name: header(headers, LAYER_HEADERS.name) ?? fallbackName,
    rows,
    cols,
    values,
    min: numberHeader(headers, LAYER_HEADERS.min),
    max: numberHeader(headers, LAYER_HEADERS.max),
    resolution_m: numberHeader(headers, LAYER_HEADERS.resolution),
    validity: validityHeader(headers),
    nodata_count: numberHeader(headers, LAYER_HEADERS.nodata),
    downsample: numberHeader(headers, LAYER_HEADERS.downsample),
    bounds: parseBounds(header(headers, LAYER_HEADERS.bounds)),
  };
}

/**
 * Example-mode layer: an 8 x 8 ramp from 0 to 1 with one NaN cell. It is not real terrain:
 * validity `SYNTHETIC`, no resolution and no bounds, so nothing can mistake it for a map.
 */
export function syntheticLayer(name: string): LayerGrid {
  const rows = 8;
  const cols = 8;
  const values = new Float32Array(rows * cols);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) values[r * cols + c] = (r + c) / (rows + cols - 2);
  }
  values[rows * cols - 1] = Number.NaN;
  return {
    name,
    rows,
    cols,
    values,
    min: 0,
    max: (rows + cols - 3) / (rows + cols - 2),
    resolution_m: null,
    validity: 'SYNTHETIC',
    nodata_count: 1,
    downsample: null,
    bounds: null,
  };
}
