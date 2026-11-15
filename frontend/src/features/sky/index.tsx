import { describeError } from '../timeline/describe-error';
import { eventsWindow, useEvents, useScenario, useSkyData } from '../timeline/data';
import { activeEclipse, eclipseSpans } from '../timeline/eclipse';
import { SkyStrip } from './SkyStrip';
import { ExampleDataNote } from '../../api/ExampleDataNote';

/** Sky tab: the horizon strip for the active scenario at the selected moment. */
export default function SkyPanel() {
  const { active, window, selectedMs } = useScenario();
  const sky = useSkyData(active);
  // Eclipses come only from the `/api/events` answer; without them no eclipse is shown.
  const events = useEvents(active);
  const eclipse =
    events.data && window && selectedMs !== null ? activeEclipse(eclipseSpans(events.data.events, eventsWindow(window)), selectedMs) : null;

  return (
    <section className="sky-panel" aria-label="Sky view">
      <h2 className="panel-kicker">Sky view</h2>
      <ExampleDataNote value={sky.data?.series} fallbackOnly />
      <ExampleDataNote value={sky.data?.horizon} fallbackOnly />
      {!active || selectedMs === null ? (
        <p className="sky-note">Choose a site and a date range to see the Sun and Earth over the horizon.</p>
      ) : sky.status === 'error' ? (
        <p className="sky-note" role="alert">
          {describeError(sky.error)}
        </p>
      ) : sky.data ? (
        <SkyStrip
          horizon={sky.data.horizon}
          series={sky.data.series}
          selectedMs={selectedMs}
          capped={sky.data.capped}
          eclipse={eclipse}
        />
      ) : (
        <p className="sky-note">Loading the horizon and sky series…</p>
      )}
    </section>
  );
}
