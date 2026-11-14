/**
 * Comparison export (UC-11). The CSV uses the same display rules as the on-screen table
 * (api/compare-metrics.ts), so every number in the file is the number on screen. Each row
 * names the scenario's place, dates and reliability label.
 */

import { COMPARE_METRICS, displayText } from '../../api/compare-metrics';
import type { CompareResponse, Site } from '../../api/types';
import { DEFAULT_EARTH_CRITERION } from '../../api/types';
import { placeLabel } from '../../state/scenario-tools';

const FIXED_COLUMNS = [
  'scenario_id',
  'label',
  'site',
  'site_id',
  'lat_deg',
  'lon_deg',
  'start_utc',
  'end_utc',
  'mast_height_m',
  'panel_profile_id',
  'earth_criterion',
  'validity',
] as const;

/** Header of a metric column: `Sunlit time (%)`. */
export function metricColumn(label: string, unit: string): string {
  return `${label} (${unit})`;
}

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function compareCsv(response: CompareResponse, sites: readonly Pick<Site, 'id' | 'name'>[]): string {
  const header = [...FIXED_COLUMNS, ...COMPARE_METRICS.map((m) => metricColumn(m.label, m.unit))];
  const rows = response.scenarios.map((r) => {
    const s = r.scenario;
    const fixed = [
      s.scenario_id,
      s.label,
      placeLabel(s, sites),
      s.site_id,
      s.lat_deg,
      s.lon_deg,
      s.start_utc,
      s.end_utc,
      s.mast_height_m,
      s.panel_profile_id,
      s.earth_criterion ?? DEFAULT_EARTH_CRITERION,
      r.validity,
    ];
    const metrics = COMPARE_METRICS.map((m) => displayText(m, r.metrics[m.key]));
    return [...fixed, ...metrics].map(csvCell).join(',');
  });
  return [header.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n';
}

/** The server's answer as it came, plus the page address that reopens the comparison. */
export function compareJson(response: CompareResponse, link: string | null): string {
  return `${JSON.stringify({ link, ...response }, null, 2)}\n`;
}

/** Starts a download in the browser. Does nothing outside one. */
export function download(fileName: string, text: string, type: string): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
