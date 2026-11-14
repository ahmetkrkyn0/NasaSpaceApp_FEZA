import { useState } from 'react';
import { getSites } from '../../api/client';
import { displayWithUnit } from '../../api/compare-metrics';
import type { Site } from '../../api/types';
import { useAsync } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { placeLabel } from '../../state/scenario-tools';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { AsyncBlock, ErrorNote, ExampleNote, PanelHeader } from '../setup/shared';
import { metricDef } from '../why/explain';
import { GUIDED_TASKS, fetchTaskAnswers, taskScenarios, taskState, type GuidedTask, type TaskAnswer } from './tasks';

/**
 * Guided tasks (Classroom door): guess, look, explain. Opening a task sets its site and dates so
 * the horizon strip and the timeline show it; the answer shows the server's numbers for that
 * preset and an explanation backed by verified sources.
 */

export function AnswerTable({ task, answers, sites }: { task: GuidedTask; answers: readonly TaskAnswer[]; sites: readonly Site[] }) {
  return (
    <div className="d-table-wrap">
      <table className="d-table">
        <caption className="d-muted">Computed by the server for this task.</caption>
        <thead>
          <tr>
            <th scope="col">Site</th>
            {task.metrics.map((key) => (
              <th key={key} scope="col">
                {metricDef(key).label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {answers.map(({ scenario, events }) => (
            <tr key={scenario.scenario_id}>
              <th scope="row">
                {placeLabel(scenario, sites)} {events ? <ValidityBadge validity={events.validity} /> : null}
              </th>
              {task.metrics.map((key) => (
                <td key={key} className="d-num">
                  {displayWithUnit(metricDef(key), events ? events.metrics[key] : null)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {task.table_note ? <p className="d-note" role="note">{task.table_note}</p> : null}
      {answers.some((a) => a.events === null) ? (
        <p className="d-muted">— : the example files have no answer for this site. Add ?data=live to the address to compute it.</p>
      ) : null}
    </div>
  );
}

export function TaskExplanation({ task }: { task: GuidedTask }) {
  return (
    <>
      <p>{task.explanation}</p>
      <ul className="d-list" aria-label="Sources">
        {task.sources.map((s) => (
          <li key={`${s.file}-${s.row}`} className="d-muted">
            Source: {s.label}
          </li>
        ))}
      </ul>
    </>
  );
}

function Answer({ task, sites }: { task: GuidedTask; sites: readonly Site[] }) {
  const key = JSON.stringify([task.id, sites.length]);
  const answers = useAsync((signal) => fetchTaskAnswers(taskScenarios(task, sites), { signal }), [key]);
  return (
    <>
      <AsyncBlock result={answers}>{(data) => <AnswerTable task={task} answers={data} sites={sites} />}</AsyncBlock>
      <TaskExplanation task={task} />
    </>
  );
}

function TaskCard({ task, sites }: { task: GuidedTask; sites: readonly Site[] }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="d-card" aria-label={task.title}>
      <p className="d-card-title">{task.title}</p>
      <p>{task.question}</p>
      <p className="d-hint">Play the timeline and watch the horizon strip, then check your guess.</p>
      {revealed ? (
        <Answer task={task} sites={sites} />
      ) : (
        <button type="button" className="d-button d-button-primary" onClick={() => setRevealed(true)}>
          Check my guess
        </button>
      )}
    </div>
  );
}

export default function TasksPanel() {
  const [openId, setOpenId] = useState<string | null>(null);
  const sitesResult = useAsync((signal) => getSites({}, { signal }), []);
  const sites = sitesResult.state.data ?? [];
  // Tasks open only with the site list, so scenario labels carry site names, not ids (PR #66 review).
  const ready = sitesResult.state.status === 'success';
  const task = GUIDED_TASKS.find((t) => t.id === openId) ?? null;

  const open = (t: GuidedTask) => {
    scenarioStore.replaceState(taskState(taskScenarios(t, sites)));
    setOpenId(t.id);
  };

  return (
    <section className="d-panel" aria-label="Guided tasks">
      <PanelHeader title="Guided tasks" />
      <ExampleNote />
      {sitesResult.state.status === 'error' ? <ErrorNote error={sitesResult.state.error} /> : null}
      <ul className="d-list" aria-label="Tasks">
        {GUIDED_TASKS.map((t) => (
          <li key={t.id} className="d-list-item">
            <button
              type="button"
              className="d-button"
              aria-pressed={t.id === openId}
              disabled={!ready}
              title={ready ? undefined : 'Loading the site list…'}
              onClick={() => open(t)}
            >
              {t.title}
            </button>
          </li>
        ))}
      </ul>
      {task ? <TaskCard key={task.id} task={task} sites={sites} /> : <p className="d-muted">Pick a task: guess, look, then check.</p>}
    </section>
  );
}
