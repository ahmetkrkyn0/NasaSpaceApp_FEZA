import { describeError } from '../timeline/describe-error';
import { useScenario, useSkyData } from '../timeline/data';
import { SkyStrip } from './SkyStrip';

/** Sky tab: the horizon strip for the active scenario at the selected moment. */
export default function SkyPanel() {
  const { active, selectedMs } = useScenario();
  const sky = useSkyData(active);

  return (
    <section className="sky-panel" aria-label="Sky view">
      <h2 className="panel-kicker">Sky view</h2>
      {!active || selectedMs === null ? (
        <p className="sky-note">Choose a site and a date range to see the Sun and Earth over the horizon.</p>
      ) : sky.status === 'error' ? (
        <p className="sky-note" role="alert">
          {describeError(sky.error)}
        </p>
      ) : sky.data ? (
        <SkyStrip horizon={sky.data.horizon} series={sky.data.series} selectedMs={selectedMs} capped={sky.data.capped} />
      ) : (
        <p className="sky-note">Loading the horizon and sky series…</p>
      )}
    </section>
  );
}
