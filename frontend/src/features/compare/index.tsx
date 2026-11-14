import { useMemo, useState } from 'react';
import { getSites, postCompare } from '../../api/client';
import { COMPARE_METRICS, displayDifference, displayWithUnit } from '../../api/compare-metrics';
import { formatDate } from '../../api/format';
import { MAX_COMPARE_SCENARIOS, MIN_COMPARE_SCENARIOS, type CompareResponse, type Scenario, type Site } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import {
  SLIP_SCENARIO_ID,
  dateToUtc,
  placeLabel,
  sameDateAnotherSite,
  sameSiteAnotherDate,
  slippedScenario,
} from '../../state/scenario-tools';
import { VALIDITY_LABEL, ValidityBadge } from '../../ui/ValidityBadge';
import { AsyncBlock, ExampleNote, NeedsScenario, PanelHeader } from '../setup/shared';
import { compareCsv, compareJson, download } from './export';

/**
 * Compare tab (UC-08, UC-11): add scenarios (at most four), two templates, the launch-slip
 * slider, the six metrics side by side with the best one and the difference from the first
 * scenario, and export.
 */

const FULL_REASON = `The comparison holds at most ${MAX_COMPARE_SCENARIOS} scenarios. Remove one to add another.`;
const MAX_SLIP_DAYS = 30;

/** Why a scenario cannot be added right now, or `null` when it can. */
export function addBlockedReason(list: readonly Scenario[], candidate: Scenario | null): string | null {
  if (!candidate) return 'Set up a scenario first.';
  if (list.some((s) => s.scenario_id === candidate.scenario_id)) return 'This scenario is already in the comparison.';
  if (list.length >= MAX_COMPARE_SCENARIOS) return FULL_REASON;
  return null;
}

/**
 * Why the list cannot be sent to `/api/compare` yet, or `null` when it can. The server takes
 * 2 to 4 scenarios with different ids (ADR-0004, "Sınırlar"); the store already keeps ids unique
 * and the list at most four long.
 */
export function compareWaitingReason(list: readonly Scenario[]): string | null {
  if (list.length === 0) return 'Nothing to compare yet. Add the active scenario first.';
  if (list.length < MIN_COMPARE_SCENARIOS) {
    return `Add one more scenario to see the comparison. It needs ${MIN_COMPARE_SCENARIOS} to ${MAX_COMPARE_SCENARIOS} scenarios.`;
  }
  return null;
}

function currentLink(): string | null {
  return (globalThis as { location?: { href?: string } }).location?.href ?? null;
}

function AddButton({ label, list, candidate }: { label: string; list: readonly Scenario[]; candidate: Scenario | null }) {
  const reason = addBlockedReason(list, candidate);
  return (
    <>
      <button
        type="button"
        className="d-button"
        disabled={reason !== null}
        title={reason ?? undefined}
        onClick={() => candidate && scenarioStore.addToCompare(candidate)}
      >
        {label}
      </button>
      {reason && candidate ? <span className="d-hint">{reason}</span> : null}
    </>
  );
}

function Templates({ active, list, sites }: { active: Scenario; list: readonly Scenario[]; sites: readonly Site[] }) {
  const [date, setDate] = useState('');
  const [siteId, setSiteId] = useState('');
  const [slip, setSlip] = useState(5);

  const start = dateToUtc(date);
  const byDate = start ? sameSiteAnotherDate(active, start, sites) : null;
  const site = sites.find((s) => s.id === siteId);
  const bySite = site ? sameDateAnotherSite(active, site, sites) : null;
  const slipped = slippedScenario(active, slip, sites);
  const slipInList = list.some((s) => s.scenario_id === SLIP_SCENARIO_ID);
  const slipBlocked = !slipInList && list.length >= MAX_COMPARE_SCENARIOS ? FULL_REASON : null;

  return (
    <div className="d-section">
      <h3 className="d-section-title">Add scenarios</h3>
      <div className="d-row">
        <AddButton label="Add active scenario" list={list} candidate={active} />
      </div>

      <div className="d-row">
        <label className="d-control">
          <span className="d-control-label">Same site, another date</span>
          <input className="d-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <AddButton label="Add date" list={list} candidate={byDate} />
      </div>

      <div className="d-row">
        <label className="d-control">
          <span className="d-control-label">Same date, another site</span>
          <select className="d-select" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Choose a site…</option>
            {sites
              .filter((s) => s.id !== active.site_id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <AddButton label="Add site" list={list} candidate={bySite} />
      </div>

      <div className="d-control">
        <label className="d-control-label" htmlFor="slip-days">
          Launch slips by <span className="data">{slip}</span> days
        </label>
        <input
          id="slip-days"
          type="range"
          min={1}
          max={MAX_SLIP_DAYS}
          step={1}
          value={slip}
          onChange={(e) => setSlip(Number(e.target.value))}
        />
        <div className="d-row">
          <button
            type="button"
            className="d-button"
            disabled={slipBlocked !== null}
            title={slipBlocked ?? undefined}
            onClick={() => scenarioStore.addToCompare(slipped)}
          >
            {slipInList ? 'Update slipped launch' : 'Compare slipped launch'}
          </button>
          {slipInList ? (
            <button type="button" className="d-button" onClick={() => scenarioStore.removeFromCompare(SLIP_SCENARIO_ID)}>
              Remove slip
            </button>
          ) : null}
        </div>
        {slipBlocked ? <span className="d-hint">{slipBlocked}</span> : <span className="d-hint">Same site and length, start moved by the slider.</span>}
      </div>
    </div>
  );
}

function ScenarioList({ list, sites }: { list: readonly Scenario[]; sites: readonly Site[] }) {
  if (list.length === 0) return <p className="d-muted">{compareWaitingReason(list)}</p>;
  return (
    <ul className="d-list" aria-label="Scenarios in the comparison">
      {list.map((s, i) => {
        const place = placeLabel(s, sites);
        // Generated labels already start with the place; a label from a link may not.
        const where = s.label.startsWith(place) ? '' : `${place}, `;
        return (
        <li key={s.scenario_id} className="d-list-item">
          <span>
            <span className="data">{String.fromCharCode(65 + i)}</span> {s.label}{' '}
            <span className="d-muted">
              ({where}
              {formatDate(s.start_utc)} to {formatDate(s.end_utc)})
            </span>
          </span>
          <button type="button" className="d-button" onClick={() => scenarioStore.removeFromCompare(s.scenario_id)}>
            Remove
          </button>
        </li>
        );
      })}
    </ul>
  );
}

export function ResultTable({ response }: { response: CompareResponse }) {
  const results = response.scenarios;
  const reference = results[0];
  const validities = new Set(results.map((r) => r.validity));
  const bestOf = new Map(response.deltas.map((d) => [d.metric, d.best_scenario_id]));
  return (
    <>
      {validities.size > 1 ? (
        <p className="d-note d-note-warn" role="note">
          These scenarios carry different reliability labels ({[...validities].map((v) => VALIDITY_LABEL[v]).join(', ')}).
          A difference may come from how they were computed, for example terrain against flat horizon, not from the place or date.
        </p>
      ) : null}
      <div className="d-table-wrap">
        <table className="d-table">
          <caption className="d-muted">Best value per row in bold; second line: difference from A.</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {results.map((r, i) => (
                <th key={r.scenario.scenario_id} scope="col">
                  {String.fromCharCode(65 + i)} <ValidityBadge validity={r.validity} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((m) => (
              <tr key={m.key}>
                <th scope="row">
                  {m.label} <span className="d-muted">({m.better === 'higher' ? 'higher is better' : 'lower is better'})</span>
                </th>
                {results.map((r, i) => {
                  const best = bestOf.get(m.key) === r.scenario.scenario_id;
                  const diff = i === 0 || !reference ? null : displayDifference(m, r.metrics[m.key], reference.metrics[m.key]);
                  return (
                    <td key={r.scenario.scenario_id} className="d-num">
                      <span className={best ? 'd-best' : undefined}>{displayWithUnit(m, r.metrics[m.key])}</span>
                      {best ? <span className="d-best"> best</span> : null}
                      {diff !== null ? <span className="d-diff">{`${diff > 0 ? '+' : ''}${diff.toFixed(m.decimals)}`}</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExportBar({ response, sites }: { response: CompareResponse; sites: readonly Site[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const link = currentLink();
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied('Link copied.');
    } catch {
      setCopied(`Copy this link: ${link}`);
    }
  };
  return (
    <div className="d-section">
      <h3 className="d-section-title">Export</h3>
      <div className="d-row">
        <button type="button" className="d-button" onClick={() => download('comparison.csv', compareCsv(response, sites), 'text/csv')}>
          Download CSV
        </button>
        <button type="button" className="d-button" onClick={() => download('comparison.json', compareJson(response, link), 'application/json')}>
          Download JSON
        </button>
        <button type="button" className="d-button" disabled={!link} onClick={() => void copy()}>
          Copy link
        </button>
      </div>
      {copied ? <p className="d-muted">{copied}</p> : <p className="d-muted">The link reopens this scenario and this comparison.</p>}
    </div>
  );
}

export default function ComparePanel() {
  const active = useStore(scenarioStore, (s) => s.active);
  const list = useStore(scenarioStore, (s) => s.compare);
  const sitesResult = useAsync((signal) => getSites({}, { signal }), []);
  const sites = sitesResult.state.data ?? [];
  const key = useMemo(() => JSON.stringify(list), [list]);
  const waiting = compareWaitingReason(list);
  const results = useAsync(
    (signal) => (waiting !== null ? Promise.resolve(null) : postCompare({ scenarios: [...list] }, { signal })),
    [key],
  );

  return (
    <section className="d-panel" aria-label="Compare scenarios">
      <PanelHeader title="Compare scenarios">
        <span className="d-muted">
          {list.length} of {MAX_COMPARE_SCENARIOS}
        </span>
      </PanelHeader>
      <ExampleNote />
      {active ? <Templates active={active} list={list} sites={sites} /> : <NeedsScenario />}
      <ScenarioList list={list} sites={sites} />
      {waiting !== null && list.length > 0 ? <p className="d-hint">{waiting}</p> : null}
      {waiting === null ? (
        <AsyncBlock result={results}>
          {(data) =>
            data ? (
              <>
                <ResultTable response={data} />
                <ExportBar response={data} sites={sites} />
              </>
            ) : null
          }
        </AsyncBlock>
      ) : null}
    </section>
  );
}
