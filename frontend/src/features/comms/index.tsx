import { getCommWindow, getEvents } from '../../api/client';
import { getDataMode } from '../../api/config';
import { formatDate, formatDeg, formatHours, formatMinutes, formatPercent, formatUtc } from '../../api/format';
import { CRITERIA, DEFAULT_EARTH_CRITERION, type CommWindow, type Criterion, type EventList, type RelayStatus, type Scenario } from '../../api/types';
import { useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { commWindowRequest, eventsRequest, momentIn } from '../../state/scenario-tools';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { RelayLabel } from './relay';
import { AsyncBlock, ExampleNote, Field, Fields, NeedsScenario, PanelHeader, useRequest } from '../setup/shared';

/**
 * Comms tab (UC-07): Earth elevation, visibility windows and time left, for the criterion the
 * user picks. The answer's `criterion` is shown, so the user sees which rule the numbers follow
 * (docs/design/iletisim-penceresi.md).
 */

export const CRITERION_LABEL: Record<Criterion, string> = {
  center: 'Centre above horizon',
  first_limb: 'Any part above horizon',
  full_disk: 'Whole disk above horizon',
};

const CRITERION_HINT: Record<Criterion, string> = {
  center: 'Default. Between the optimistic and the strict rule.',
  first_limb: 'Optimistic: the link counts as soon as any part of Earth shows.',
  full_disk: 'Strict: all of Earth must be above the horizon.',
};

function CriterionPicker({ scenario }: { scenario: Scenario }) {
  const current = scenario.earth_criterion ?? DEFAULT_EARTH_CRITERION;
  const choose = (criterion: Criterion) => {
    if (criterion === current) return;
    scenarioStore.setScenario({ ...scenario, earth_criterion: criterion });
  };
  return (
    <div className="d-control">
      <span className="d-control-label">When does Earth count as visible?</span>
      <div className="d-choice" role="group" aria-label="Earth visibility criterion">
        {CRITERIA.map((c) => (
          <button key={c} type="button" className="d-choice-option" aria-pressed={c === current} onClick={() => choose(c)}>
            {CRITERION_LABEL[c]}
          </button>
        ))}
      </div>
      <span className="d-hint">{CRITERION_HINT[current]}</span>
    </div>
  );
}

/** States which criterion the answer used, and says so plainly when it differs from the request. */
export function CriterionUsed({ requested, used }: { requested: Criterion; used: Criterion }) {
  return (
    <p className={used === requested ? 'd-muted' : 'd-note d-note-warn'}>
      Criterion used: <span className="data">{CRITERION_LABEL[used]}</span>
      {used === requested
        ? null
        : getDataMode() === 'examples'
          ? ` (requested: ${CRITERION_LABEL[requested]}; the example files are computed with this one)`
          : ` (requested: ${CRITERION_LABEL[requested]}; the server answered with another criterion)`}
    </p>
  );
}

function NowBlock({ comm, requested }: { comm: CommWindow; requested: Criterion }) {
  const badge = <ValidityBadge validity={comm.validity} note={comm.validity === 'SYNTHETIC' ? 'terrain not included' : undefined} />;
  const timeLeft = comm.visible_now
    ? { label: 'Earthset in', value: formatMinutes(comm.minutes_remaining) }
    : { label: 'Earthrise in', value: formatMinutes(comm.minutes_until_visible) };
  return (
    <>
      <Fields>
        <Field label="At" value={formatUtc(comm.utc)} />
        <Field label="Earth" value={comm.visible_now ? 'In view' : 'Below the horizon'} badge={badge} />
        <Field label="Earth elevation" value={formatDeg(comm.earth_elevation_deg)} />
        <Field label="Earth direction" value={formatDeg(comm.earth_azimuth_true_deg)} />
        <Field label="Horizon there" value={formatDeg(comm.horizon_deg)} />
        <Field label={timeLeft.label} value={timeLeft.value} />
        <Field label="Next change" value={formatUtc(comm.next_change_utc)} />
      </Fields>
      {comm.search_limited ? (
        <p className="d-note d-note-warn">No Earthrise or Earthset within the {comm.searched_hours} hours searched.</p>
      ) : null}
      <CriterionUsed requested={requested} used={comm.criterion} />
    </>
  );
}

const WINDOW_LABEL = { earth_visible: 'Earth in view', earth_hidden: 'Earth hidden' } as const;

function WindowsBlock({ events }: { events: EventList }) {
  const windows = events.windows.filter((w) => w.kind === 'earth_visible' || w.kind === 'earth_hidden');
  return (
    <>
      <Fields>
        <Field label="Earth in view" value={formatPercent(events.metrics.earth_visible_fraction)} badge={<ValidityBadge validity={events.validity} />} />
        <Field label="Longest Earth gap" value={formatHours(events.metrics.longest_earth_hidden_hours)} />
      </Fields>
      {windows.length === 0 ? (
        <p className="d-muted">No Earth windows in this answer.</p>
      ) : (
        <div className="d-table-wrap">
          <table className="d-table">
            <caption className="d-muted">Windows are cut at the ends of the scenario period.</caption>
            <thead>
              <tr>
                <th scope="col">Window</th>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th scope="col">Length</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => (
                <tr key={`${w.kind}-${w.start_utc}`}>
                  <td>{WINDOW_LABEL[w.kind as keyof typeof WINDOW_LABEL]}</td>
                  <td className="d-num">{formatUtc(w.start_utc)}</td>
                  <td className="d-num">{formatUtc(w.end_utc)}</td>
                  <td className="d-num">{formatHours(w.duration_hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/**
 * Relay status to show: the period's (from `/api/events`) first, else the moment's
 * (from `/api/comm-window`). Only settled answers count, so a label never belongs to the
 * previous scenario while a new one loads.
 */
export function relayStatus(
  events: { status: string; data?: { relay_status?: RelayStatus } | undefined },
  comm: { status: string; data?: { relay_status?: RelayStatus } | undefined },
): RelayStatus | undefined {
  const settled = (s: typeof events) => (s.status === 'success' ? s.data?.relay_status : undefined);
  return settled(events) ?? settled(comm);
}

export default function CommsPanel() {
  const scenario = useStore(scenarioStore, (s) => s.active);
  if (!scenario) {
    return (
      <section className="d-panel" aria-label="Earth link">
        <PanelHeader title="Earth link" />
        <NeedsScenario />
      </section>
    );
  }
  return <CommsForScenario scenario={scenario} />;
}

function CommsForScenario({ scenario }: { scenario: Scenario }) {
  const selected = useStore(scenarioStore, (s) => s.selected_utc);
  const criterion = scenario.earth_criterion ?? DEFAULT_EARTH_CRITERION;
  const utc = momentIn(scenario, selected);
  const comm = useRequest(getCommWindow, commWindowRequest(scenario, utc));
  const events = useRequest(getEvents, eventsRequest(scenario));

  return (
    <section className="d-panel" aria-label="Earth link">
      <PanelHeader title="Earth link" />
      <ExampleNote />
      <p className="d-muted">
        <span className="data">{scenario.label}</span>, {formatDate(scenario.start_utc)} to {formatDate(scenario.end_utc)}
      </p>
      <CriterionPicker scenario={scenario} />
      <RelayLabel status={relayStatus(events.state, comm.state)} />
      <div className="d-section">
        <h3 className="d-section-title">Now</h3>
        <AsyncBlock result={comm}>{(data) => <NowBlock comm={data} requested={criterion} />}</AsyncBlock>
      </div>
      <div className="d-section">
        <h3 className="d-section-title">Over the period</h3>
        <AsyncBlock result={events}>{(data) => <WindowsBlock events={data} />}</AsyncBlock>
      </div>
      <p className="d-muted">
        Direct link also needs a ground station that sees the Moon; that layer is not part of this release.
      </p>
    </section>
  );
}
