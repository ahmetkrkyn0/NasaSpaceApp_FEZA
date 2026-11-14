import { useState } from 'react';
import { postCompare } from '../../api/client';
import { COMPARE_METRICS, displayWithUnit, type MetricDef } from '../../api/compare-metrics';
import type { CompareResponse, Scenario } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { uiStore, type Door } from '../../shell/ui-state';
import { scenarioStore } from '../../state/scenario-store';
import { ValidityBadge } from '../../ui/ValidityBadge';
import {
  TERRAIN_RULE_TEXT,
  fetchHorizonModels,
  mixIsWarning,
  mixWarning,
  modelMix,
  modelsKey,
  modelsState,
  type HorizonModels,
  type ModelMix,
  type ModelsState,
} from '../compare/horizon-models';
import { compareScenarios } from '../compare/results';
import { AsyncBlock, ErrorNote, ExampleNote, PanelHeader } from '../setup/shared';
import {
  NONE_KNOWN,
  MIXED_CAVEAT,
  MIXED_ROWS_NOTE,
  PLAN_NOTE,
  UNKNOWN_ROWS_NOTE,
  classroomText,
  compareValues,
  counterfactualScenarios,
  differingInputs,
  fetchCounterfactuals,
  headline,
  letter,
  planIntro,
  planRows,
  relatedMetric,
  resultFor,
  type Counterfactual,
  type Named,
  type WhyLevel,
} from './explain';
import { HookFacts } from './hook-facts';
import { whyStore, type WhyFocus } from './why-state';
import './why.css';

/**
 * Why panel (UC-09): explains the difference between scenario A and one other scenario of the
 * comparison, at the level of the open door. Explore gives one sentence per metric, Classroom
 * adds what the number measures and a related computed value, Plan adds counterfactual rows that
 * tie the difference to single inputs. Opened from the "Why?" links of the Compare table.
 */

export const WHY_PANEL_ID = 'why-panel';


const LEVEL_LABEL: Record<WhyLevel, string> = {
  explore: 'Explore: one sentence',
  classroom: 'Classroom: what the number measures',
  plan: 'Plan: one input at a time',
};

const EMPTY_TEXT: Record<Door, string> = {
  explore: 'Why cards explain how two scenarios differ. Open the Plan door and put at least two scenarios in the comparison.',
  classroom: 'Why cards explain how two scenarios differ. Open the Plan door and put at least two scenarios in the comparison.',
  plan: 'Why cards explain how two scenarios differ. Add at least two scenarios in the Compare tab, then use a "Why?" link.',
};

function named(index: number, scenario: Scenario, response: CompareResponse, def: MetricDef): Named {
  return { name: `${letter(index)} (${scenario.label})`, scenario, value: resultFor(response, scenario.scenario_id)?.metrics[def.key] ?? null };
}

function ClassroomDetail({ def, a, b, aIndex, bIndex, response }: CardProps & { aIndex: number; bIndex: number }) {
  const related = relatedMetric(def);
  const ra = named(aIndex, a, response, related);
  const rb = named(bIndex, b, response, related);
  return (
    <>
      <p>{classroomText(def)}</p>
      <p className="d-muted">
        Related computed value, {related.label}: {letter(aIndex)} <span className="data">{displayWithUnit(related, ra.value)}</span>,{' '}
        {letter(bIndex)} <span className="data">{displayWithUnit(related, rb.value)}</span>.
      </p>
    </>
  );
}

/** Counterfactual rows of the pair: still loading, failed, or the server's answers. */
export type CounterfactualState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; rows: readonly Counterfactual[] };

/** Rows or failure of one pair, tagged with the pair they were computed for. */
export interface PairRows {
  key: string;
  rows?: readonly Counterfactual[];
  error?: unknown;
}

/** Runs the counterfactual request and tags its outcome, success or failure, with the pair key. */
export async function fetchPairRows(key: string, request: Promise<readonly Counterfactual[]>): Promise<PairRows> {
  try {
    return { key, rows: await request };
  } catch (error) {
    return { key, error };
  }
}

/**
 * State for the pair on screen. An answer for another pair (the previous one, before the new
 * request starts) counts as loading, so its rows never appear under the new A and B (PR #66 review).
 */
export function counterfactualState(answer: PairRows | undefined, key: string): CounterfactualState {
  if (!answer || answer.key !== key) return { status: 'loading' };
  if (answer.rows) return { status: 'ready', rows: answer.rows };
  return { status: 'error', error: answer.error };
}

export function PlanDetail({
  def,
  a,
  b,
  bIndex,
  response,
  counterfactuals: cf,
  mix,
  models,
}: CardProps & { bIndex: number; counterfactuals: CounterfactualState; mix: ModelMix; models: HorizonModels }) {
  const bLetter = letter(bIndex);
  const na = named(0, a, response, def);
  const nb = named(bIndex, b, response, def);
  // One-input rows are shown only once the horizon models are known: a row cannot be read without its model (issue #71).
  const several = differingInputs(a, b).length > 1 && mix.kind !== 'unknown';
  const counterfactuals = several && cf.status === 'ready' ? cf.rows : undefined;
  const rows = counterfactuals ? planRows(def, na, nb, bLetter, counterfactuals, models) : [];
  return (
    <>
      <p>{planIntro(a, b, 'A', bLetter, mix)}</p>
      {several && cf.status === 'loading' ? <p className="d-muted">Computing one input at a time…</p> : null}
      {several && cf.status === 'error' ? (
        <p className="d-note d-note-error" role="alert">
          The one-input-at-a-time rows could not be computed. The difference above still comes from the server.
        </p>
      ) : null}
      {several && counterfactuals ? (
        <div className="d-table-wrap">
          <table className="d-table">
            <caption className="d-muted">
              A: <span className="data">{displayWithUnit(def, na.value)}</span>. Difference from A in the last column.
            </caption>
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">{def.label}</th>
                <th scope="col">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">
                    {row.label} {row.validity ? <ValidityBadge validity={row.validity} /> : null}
                    {row.model === 'other' ? <span className="d-diff d-other-model">other horizon model: {row.modelLabel}</span> : null}
                    {row.model === 'unknown' ? <span className="d-diff d-other-model">horizon model not known</span> : null}
                  </th>
                  <td className="d-num">{row.value}</td>
                  <td className="d-num">{row.diff === null ? '—' : `${row.diff > 0 ? '+' : ''}${row.diff.toFixed(def.decimals)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {several && counterfactuals ? <p className="d-muted">{PLAN_NOTE}</p> : null}
      {rows.slice(1).some((r) => r.model === 'other') ? (
        <p className="d-note d-note-warn" role="note">
          {MIXED_ROWS_NOTE} {TERRAIN_RULE_TEXT}
        </p>
      ) : null}
      {rows.slice(1).some((r) => r.model === 'unknown') ? (
        <p className="d-note d-note-warn" role="note">
          {UNKNOWN_ROWS_NOTE}
        </p>
      ) : null}
    </>
  );
}

interface CardProps {
  def: MetricDef;
  a: Scenario;
  b: Scenario;
  response: CompareResponse;
}

function WhyCard({
  def,
  a,
  b,
  bIndex,
  response,
  level,
  focused,
  counterfactuals,
  mix,
  models,
}: CardProps & { bIndex: number; level: WhyLevel; focused: boolean; counterfactuals: CounterfactualState; mix: ModelMix; models: HorizonModels }) {
  const na = named(0, a, response, def);
  const nb = named(bIndex, b, response, def);
  const sentence = headline(def, na, nb);
  // Plan rows explain a difference; with equal or unknown values there is none to explain.
  const differs = compareValues(def, na, nb).kind === 'differs';
  return (
    <article className={focused ? 'd-card d-card-focus' : 'd-card'} aria-label={`Why: ${def.label}`} aria-current={focused || undefined}>
      <p className="d-card-title">{def.label}</p>
      <p>{sentence}</p>
      {differs && (mix.kind === 'horizon' || mix.kind === 'validity') ? <p className="d-muted">{MIXED_CAVEAT}</p> : null}
      {level === 'classroom' ? <ClassroomDetail def={def} a={a} b={b} aIndex={0} bIndex={bIndex} response={response} /> : null}
      {level === 'plan' && differs ? (
        <PlanDetail def={def} a={a} b={b} bIndex={bIndex} response={response} counterfactuals={counterfactuals} mix={mix} models={models} />
      ) : null}
    </article>
  );
}

/** Index of the scenario compared with A: the focused one, else the user's choice, else B. */
export function pairIndex(list: readonly Scenario[], focus: WhyFocus | null, chosen: string | null): number {
  const byFocus = focus ? list.findIndex((s) => s.scenario_id === focus.scenarioId) : -1;
  if (byFocus > 0) return byFocus;
  const byChoice = chosen ? list.findIndex((s) => s.scenario_id === chosen) : -1;
  return byChoice > 0 ? byChoice : 1;
}

/** Metrics in card order: the focused one first. */
export function cardOrder(focus: WhyFocus | null): MetricDef[] {
  if (!focus) return [...COMPARE_METRICS];
  return [...COMPARE_METRICS].sort((x, y) => Number(y.key === focus.metric) - Number(x.key === focus.metric));
}

export function WhyCards({
  list,
  response,
  level,
  focus,
  models: givenModels,
}: {
  list: readonly Scenario[];
  response: CompareResponse;
  level: WhyLevel;
  focus: WhyFocus | null;
  /** Horizon models when the caller already has them; otherwise they are read from the server. */
  models?: ModelsState;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const bIndex = pairIndex(list, focus, chosen);
  const a = list[0]!;
  const b = list[bIndex]!;
  const pairKey = JSON.stringify([a, b, bIndex, level]);
  const counterfactuals = useAsync(
    (signal) => fetchPairRows(pairKey, level === 'plan' ? fetchCounterfactuals(a, b, letter(bIndex), postCompare, { signal }) : Promise.resolve([])),
    [pairKey],
  );
  const cfState = counterfactualState(counterfactuals.state.status === 'success' ? counterfactuals.state.data : undefined, pairKey);
  const ra = resultFor(response, a.scenario_id);
  const rb = resultFor(response, b.scenario_id);
  // Horizon model of A, of B and, at the Plan level, of every one-input copy, from the server. A difference
  // is tied to an input only when the models are known and equal (issue #71).
  const modelSet = level === 'plan' ? [a, b, ...counterfactualScenarios(a, b, letter(bIndex))] : [a, b];
  const setKey = modelsKey(modelSet);
  const modelsAnswer = useAsync((_signal) => fetchHorizonModels(modelSet), [setKey]);
  const fetched = modelsState(modelsAnswer.state.status === 'success' ? modelsAnswer.state.data : undefined, setKey);
  const state = givenModels ?? fetched;
  const mix = modelMix(
    [
      { name: 'A', scenarioId: a.scenario_id, validity: ra?.validity },
      { name: letter(bIndex), scenarioId: b.scenario_id, validity: rb?.validity },
    ],
    state,
  );
  const warning = mixWarning(mix);
  const knownModels = state.status === 'ready' ? state.models : {};
  const noneKnown = COMPARE_METRICS.every((def) => compareValues(def, named(0, a, response, def), named(bIndex, b, response, def)).kind === 'unknown');
  const choose = (id: string) => {
    if (focus) whyStore.open({ ...focus, scenarioId: id });
    else setChosen(id);
  };

  return (
    <>
      <div className="d-row">
        <label className="d-control">
          <span className="d-control-label">Compare A with</span>
          <select className="d-select" value={b.scenario_id} onChange={(e) => choose(e.target.value)}>
            {list.slice(1).map((s, i) => (
              <option key={s.scenario_id} value={s.scenario_id}>
                {letter(i + 1)}: {s.label}
              </option>
            ))}
          </select>
        </label>
        {ra && rb ? (
          <span className="d-muted">
            A <ValidityBadge validity={ra.validity} /> {letter(bIndex)} <ValidityBadge validity={rb.validity} />
          </span>
        ) : null}
      </div>
      {warning ? (
        <p className={mixIsWarning(mix) ? 'd-note d-note-warn' : 'd-muted'} role="note">
          {warning}
        </p>
      ) : null}
      {level === 'plan' && cfState.status === 'error' ? <ErrorNote error={cfState.error} /> : null}
      {noneKnown ? <p className="d-muted">{NONE_KNOWN}</p> : null}
      {noneKnown ? null : cardOrder(focus).map((def) => (
        <WhyCard
          key={def.key}
          def={def}
          a={a}
          b={b}
          bIndex={bIndex}
          response={response}
          level={level}
          focused={focus?.metric === def.key}
          counterfactuals={cfState}
          mix={mix}
          models={knownModels}
        />
      ))}
    </>
  );
}

export default function WhyPanel() {
  const door = useStore(uiStore, (s) => s.door);
  const list = useStore(scenarioStore, (s) => s.compare);
  const focus = useStore(whyStore, (s) => s.focus);
  const siteId = useStore(scenarioStore, (s) => s.active?.site_id ?? null);
  const key = JSON.stringify(list);
  const results = useAsync((_signal) => (list.length < 2 ? Promise.resolve(null) : compareScenarios(list)), [key]);

  return (
    <section className="d-panel" id={WHY_PANEL_ID} aria-label="Why they differ">
      <PanelHeader title="Why they differ">
        <span className="d-muted">{LEVEL_LABEL[door]}</span>
      </PanelHeader>
      {door === 'explore' ? <HookFacts key={siteId ?? 'none'} siteId={siteId} start={1} /> : null}
      <ExampleNote />
      {list.length < 2 ? (
        <p className="d-muted">{EMPTY_TEXT[door]}</p>
      ) : (
        <AsyncBlock result={results}>{(data) => (data ? <WhyCards list={list} response={data} level={door} focus={focus} /> : null)}</AsyncBlock>
      )}
    </section>
  );
}
