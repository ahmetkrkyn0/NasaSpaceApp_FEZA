import { useState } from 'react';
import { displayWithUnit, COMPARE_METRICS, sameQuestion } from '../../api/compare-metrics';
import { recordingIndex } from '../../api/recorded';
import { getDataMode } from '../../api/config';
import { useAsync, useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { PanelHeader, AsyncBlock } from '../setup/shared';
import { RESEARCH_SCENARIOS, openResearchScenario, presetAnswer, researchState, type ResearchScenario } from './scenarios';

function ResearchResult({ preset }: { preset: ResearchScenario }) {
  const state = researchState(preset);
  const scenarios = state.compare.length ? state.compare : [state.active];
  const mode = getDataMode();
  const answer = useAsync((signal) => presetAnswer(scenarios, { signal }), [preset.id, mode]);
  return (
    <AsyncBlock result={answer}>
      {(data) => (
        <div className="d-table-wrap">
          <table className="d-table">
            <caption>{mode === 'examples' ? 'Recorded server answers' : 'Live server answers'} for this preset</caption>
            <thead><tr><th scope="col">Metric</th>{scenarios.map((s) => <th scope="col" key={s.scenario_id}>{s.label}</th>)}</tr></thead>
            <tbody>{COMPARE_METRICS.map((metric) => (
              <tr key={metric.key}><th scope="row">{metric.label}</th>{data.map((r) => <td className="d-num" key={r.scenario.scenario_id}>{displayWithUnit(metric, r.metrics[metric.key])}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AsyncBlock>
  );
}

export default function ScenariosPanel() {
  const active = useStore(scenarioStore, (s) => s.active);
  const [opened, setOpened] = useState<string | null>(null);
  const selected = RESEARCH_SCENARIOS.find((p) => active && sameQuestion(researchState(p).active, active) && (opened === p.id || active.scenario_id.startsWith(`research-${p.id}-`)));
  return (
    <section className="d-panel" aria-label="Research scenarios">
      <PanelHeader title="Research scenarios" />
      <p className="d-muted">Choose a question to load its site, period and panel. Available from every door.</p>
      <p className="d-note">{recordingIndex.start_utc.slice(0, 10)} to {recordingIndex.end_utc.slice(0, 10)}, mast {recordingIndex.mast_height_m} m. Offline sky samples every {recordingIndex.sky_step_minutes / 60} hours; event times keep the server's precision.</p>
      <ul className="d-list" aria-label="Ready-made scenarios">
        {RESEARCH_SCENARIOS.map((preset) => (
          <li className="d-list-item" key={preset.id}>
            <button className="d-button" type="button" aria-pressed={selected?.id === preset.id} onClick={() => { openResearchScenario(preset); setOpened(preset.id); }}>
              {preset.title}
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <div className="d-card" aria-label={selected.title}>
          <p className="d-card-title">{selected.question}</p>
          <p>{selected.vehicle}</p><p>{selected.communication}</p>
          <p className="d-hint">Opens the {selected.door} door's 2D sky view. Play the timeline; the surface image is an illustration.</p>
          <ul className="d-list" aria-label="What to watch">{selected.watch.map((item) => <li key={item}>{item}</li>)}</ul>
          <ResearchResult key={selected.id} preset={selected} />
          <details className="d-muted">
            <summary>Sources and recording</summary>
            <ul className="d-list">{selected.sources.map((source) => <li key={source.file} title={`${source.file}, ${source.row}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</li>)}</ul>
            <p>Recorded {recordingIndex.recorded_utc}, server {recordingIndex.server_version}, commit {recordingIndex.main_sha.slice(0, 7)}.</p>
          </details>
          <p className="d-muted">Panel power is assumed; these are site studies, not reconstructed mission performance.</p>
        </div>
      ) : <p className="d-muted">Open a preset to see its question, three observations and sources.</p>}
    </section>
  );
}
