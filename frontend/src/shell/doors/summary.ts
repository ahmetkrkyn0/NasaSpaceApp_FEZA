/**
 * One-sentence result of the Explore door (docs/PLAN.md, F3-C1 item 1). Every number in the
 * sentence is a server metric from `/api/events`; the only arithmetic is unit conversion
 * (a fraction to a percentage, hours to days and hours).
 */

import type { EventMetrics, Scenario, Site } from '../../api/types';
import { formatDate, formatHours } from '../../features/timeline/time';

export interface SummaryInput {
  /** Site or point name, as the scenario labels it. */
  label: string;
  /** Range the metrics cover: the events request range. */
  startMs: number;
  endMs: number;
  metrics: EventMetrics;
}

/**
 * Name of the scenario's place: the catalogue name of its site, else its label, else the site id
 * or the coordinates as written in the scenario. The catalogue name comes first because scenario
 * labels also carry the start date, which the sentence already gives; a link may carry no label.
 */
export function placeName(scenario: Scenario, sites: readonly Site[]): string {
  const catalogue = scenario.site_id ? sites.find((s) => s.id === scenario.site_id)?.name : undefined;
  if (catalogue) return catalogue;
  const label = scenario.label.trim();
  if (label) return label;
  if (scenario.site_id) return scenario.site_id;
  if (scenario.lat_deg !== null && scenario.lon_deg !== null) return `${scenario.lat_deg}°, ${scenario.lon_deg}°`;
  return 'the chosen point';
}

/** `0.634` gives `63 %`; shares that round to the ends say so instead of claiming 0 or 100. */
export function percentText(fraction: number): string {
  if (fraction > 0 && fraction < 0.005) return 'under 1 %';
  if (fraction < 1 && fraction > 0.995) return 'over 99 %';
  return `${Math.round(fraction * 100)} %`;
}

function joinClauses(clauses: string[]): string {
  if (clauses.length <= 1) return clauses.join('');
  return `${clauses.slice(0, -1).join(', ')} and ${clauses[clauses.length - 1]}`;
}

/**
 * The sentence, or `null` when the answer carries none of the metrics it uses. Each missing
 * metric drops its clause; nothing is filled in.
 */
export function summarySentence({ label, startMs, endMs, metrics }: SummaryInput): string | null {
  const clauses: string[] = [];
  if (metrics.sunlit_fraction !== null) {
    clauses.push(`the Sun is up ${percentText(metrics.sunlit_fraction)} of the time`);
  }
  if (metrics.longest_dark_hours !== null) {
    clauses.push(
      metrics.longest_dark_hours > 0
        ? `the longest dark period lasts ${formatHours(metrics.longest_dark_hours)}`
        : 'there is no dark period',
    );
  }
  if (metrics.earth_visible_fraction !== null) {
    clauses.push(`Earth is in view ${percentText(metrics.earth_visible_fraction)} of the time`);
  }
  if (clauses.length === 0) return null;
  return `At ${label}, from ${formatDate(startMs)} to ${formatDate(endMs)}, ${joinClauses(clauses)}.`;
}
