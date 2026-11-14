import { getSites } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { EventList, Scenario, Site } from '../../api/types';
import { TERRAIN_NOT_INCLUDED } from '../../features/sky/geometry';
import { describeError } from '../../features/timeline/describe-error';
import { eventsRequest, useEvents, useScenario, type ScenarioWindow } from '../../features/timeline/data';
import { parseUtc } from '../../features/timeline/time';
import { useAsync } from '../../lib/hooks';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { placeName, summarySentence } from './summary';

export interface SummaryViewProps {
  scenario: Scenario | null;
  window: ScenarioWindow | null;
  events: EventList | null;
  /** Catalogue sites, to name a scenario that carries no label. */
  sites?: readonly Site[];
  /** Loading or error text for the events request. */
  note?: string | null;
}

/** The one-sentence result with its validity label beside it. */
export function SummaryView({ scenario, window, events, sites = [], note }: SummaryViewProps) {
  if (!scenario || !window) {
    return (
      <section className="door-summary" aria-label="Result">
        <p className="door-summary-text">
          No site chosen yet. Pick one above; every door shows the same scenario.
        </p>
      </section>
    );
  }
  if (!events) {
    return (
      <section className="door-summary" aria-label="Result">
        <p className="door-summary-note">{note ?? 'Loading the result…'}</p>
      </section>
    );
  }
  const request = eventsRequest(window);
  const endMs = parseUtc(request?.end_utc) ?? window.endMs;
  const name = placeName(scenario, sites);
  const sentence = summarySentence({ label: name, startMs: window.startMs, endMs, metrics: events.metrics });
  return (
    <section className="door-summary" aria-label="Result">
      <p className="door-summary-text">
        {sentence ?? `Summary not available: the server returned no sunlight or Earth metrics for ${name}.`}
      </p>
      <ValidityBadge validity={events.validity} note={events.validity === 'SYNTHETIC' ? TERRAIN_NOT_INCLUDED : undefined} />
    </section>
  );
}

/** Explore door result for the active scenario, built from the `/api/events` metrics. */
export function DoorSummary() {
  const { active, window } = useScenario();
  const events = useEvents(active);
  const sites = useAsync((signal) => getSites({}, { signal }), [getDataMode()]).state;
  const note = events.status === 'error' ? `Result not available: ${describeError(events.error)}` : null;
  return <SummaryView scenario={active} window={window} events={events.status === 'error' ? null : events.data ?? null} sites={sites.data ?? []} note={note} />;
}
