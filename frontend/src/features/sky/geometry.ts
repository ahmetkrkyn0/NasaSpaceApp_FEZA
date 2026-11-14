/**
 * Pure helpers of the horizon strip. They pick and place server values on the drawing;
 * no position is computed or interpolated here (docs/PLAN.md, 4.1, rule 2).
 */

import type { HorizonMethod, HorizonProfile, SkySample, SkySeries, Validity } from '../../api/types';
import { parseUtc } from '../timeline/time';

export const TERRAIN_NOT_INCLUDED = 'terrain not included';

/**
 * Note shown next to the strip's validity label. A flat (sphere) horizon is an assumption and
 * says so (docs/PLAN.md, 4.1, rule 5).
 */
export function horizonNote(validity: Validity, method: HorizonMethod | null): string | undefined {
  return method === 'sphere' || validity === 'SYNTHETIC' ? TERRAIN_NOT_INCLUDED : undefined;
}

export interface NearestSample {
  sample: SkySample;
  index: number;
  /** The selected moment lies before the first or after the last sample. */
  outside: boolean;
}

/** The sample closest to a moment. Positions snap to samples; they are never interpolated. */
export function nearestSample(series: SkySeries, ms: number): NearestSample | null {
  let bestIndex = -1;
  let bestGap = Number.POSITIVE_INFINITY;
  let first = Number.POSITIVE_INFINITY;
  let last = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < series.samples.length; index += 1) {
    const t = parseUtc(series.samples[index]?.utc);
    if (t === null) continue;
    first = Math.min(first, t);
    last = Math.max(last, t);
    const gap = Math.abs(t - ms);
    if (gap < bestGap) {
      bestGap = gap;
      bestIndex = index;
    }
  }
  const sample = series.samples[bestIndex];
  if (!sample) return null;
  const halfStep = (series.step_minutes * 60_000) / 2;
  return { sample, index: bestIndex, outside: ms < first - halfStep || ms > last + halfStep };
}

export type DiskState = 'visible' | 'partial' | 'hidden';

/** Filled, partly filled or outlined disk, from the server's visible fraction. */
export function diskState(visibleFraction: number): DiskState {
  if (visibleFraction <= 0) return 'hidden';
  if (visibleFraction >= 1) return 'visible';
  return 'partial';
}

/** Percentage text, shown only for a partly covered disk. */
export function partialText(visibleFraction: number): string | null {
  return diskState(visibleFraction) === 'partial' ? `${Math.round(visibleFraction * 100)} % visible` : null;
}

export interface ElevationDomain {
  min: number;
  max: number;
}

/**
 * Vertical range of the drawing: the horizon profile and every sample, with a margin. Scale
 * only; no value on screen depends on it.
 */
export function elevationDomain(horizon: HorizonProfile | null, series: SkySeries | null): ElevationDomain {
  const values: number[] = [];
  horizon?.horizon_deg.forEach((v) => Number.isFinite(v) && values.push(v));
  series?.samples.forEach((s) => {
    values.push(s.sun.elevation_deg, s.earth.elevation_deg, s.sun.horizon_deg, s.earth.horizon_deg);
  });
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return { min: -1, max: 1 };
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  const span = Math.max(max - min, 1);
  min -= span * 0.15;
  max += span * 0.15;
  return { min, max };
}

/** Round tick positions inside a range, for the elevation axis. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  if (!(span > 0)) return [];
  const raw = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(Number(t.toFixed(10)) || 0);
  return ticks;
}

export interface Point {
  az: number;
  el: number;
}

/**
 * Path of a body as separate runs: a run breaks where the azimuth wraps through north, so no
 * line crosses the whole strip.
 */
export function pathRuns(samples: readonly SkySample[], body: 'sun' | 'earth'): Point[][] {
  const runs: Point[][] = [];
  let current: Point[] = [];
  let previous: Point | null = null;
  for (const sample of samples) {
    const point = { az: sample[body].azimuth_true_deg, el: sample[body].elevation_deg };
    if (!Number.isFinite(point.az) || !Number.isFinite(point.el)) continue;
    if (previous && Math.abs(point.az - previous.az) > 180) {
      runs.push(current);
      current = [];
    }
    current.push(point);
    previous = point;
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

/** Normalises an azimuth to [0, 360). */
export function wrapAzimuth(az: number): number {
  return ((az % 360) + 360) % 360;
}
