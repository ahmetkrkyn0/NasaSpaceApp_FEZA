import { describeError } from '../timeline/describe-error';
import { useEvents, useNow, useScenario } from '../timeline/data';
import { toUtc } from '../timeline/time';
import { HudView } from './HudView';

/** Countdown panel: `/api/now` for the selected moment, with event ranges from `/api/events`. */
export default function HudPanel() {
  const { active, selectedMs } = useScenario();
  const now = useNow(active, selectedMs === null ? null : toUtc(selectedMs));
  const events = useEvents(active);

  return (
    // No aria-live here: during playback the rows change about twice a second, and a live
    // region would read every change aloud. Errors still announce through role="alert".
    <section className="hud-panel" aria-label="Countdown">
      <h2 className="panel-kicker">Countdown</h2>
      {!active || selectedMs === null ? (
        <p className="hud-note">No scenario selected.</p>
      ) : now.status === 'error' ? (
        <p className="hud-note" role="alert">
          {describeError(now.error)}
        </p>
      ) : now.data ? (
        <HudView now={now.data} events={events.data ?? null} selectedMs={selectedMs} />
      ) : (
        <p className="hud-note">Loading…</p>
      )}
    </section>
  );
}
