/**
 * Pieces shared by the D-line panels (setup, power, comms, compare): example-data note, error
 * text, "set up a scenario first" prompt, label-value rows and the horizon note.
 */

import type { ReactNode } from 'react';
import { getHorizon } from '../../api/client';
import { getDataMode } from '../../api/config';
import { isApiError } from '../../api/errors';
import { ExampleDataNote } from '../../api/ExampleDataNote';
import type { HorizonProfile, LocationParams } from '../../api/types';
import { useAsync, type AsyncResult, type AsyncState } from '../../lib/hooks';
import { uiStore } from '../../shell/ui-state';
import { ValidityBadge } from '../../ui/ValidityBadge';
import './panels.css';

/** Shown in example mode; individual fallback answers also carry their source identity. */
export function ExampleNote() {
  if (getDataMode() !== 'examples') return null;
  return (
    <p className="d-note d-note-example" role="note">
      Example data: recorded answers are available for the research scenarios. Other dates or settings use general examples; check the recorded place and period in the result note. Add{' '}
      <span className="data">?data=live</span> to the address to use the server.
    </p>
  );
}

/** Readable text for any failure; server codes keep the server's message. */
export function errorText(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === 'network_error') return 'Cannot reach the server. Check that it runs on port 8000.';
    if (error.code === 'aborted') return 'The request was cancelled.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <p className="d-note d-note-error" role="alert">
      {errorText(error)}
    </p>
  );
}

/** Loading, error or content for one request. */
export function AsyncBlock<T>({ result, children }: { result: AsyncResult<T>; children: (data: T) => ReactNode }) {
  const { state } = result;
  if (state.status === 'error') return <ErrorNote error={state.error} />;
  if (state.data === undefined) return <p className="d-muted">Loading…</p>;
  // While a new request runs, the previous answer stays on screen; say that it is being replaced.
  if (state.status === 'loading') {
    return (
      <div aria-busy="true">
        <p className="d-muted" role="status">
          Updating for the new settings…
        </p>
        <ExampleDataNote value={state.data} fallbackOnly />
        {children(state.data)}
      </div>
    );
  }
  return <><ExampleDataNote value={state.data} fallbackOnly />{children(state.data)}</>;
}

/**
 * Calls `fetcher(params)` and calls it again whenever any request parameter changes. Keying on
 * the parameters themselves, rather than on the scenario id, means a setting that the server
 * reads cannot change without a new request.
 */
export function useRequest<P, T>(
  fetcher: (params: P, options: { signal: AbortSignal }) => Promise<T>,
  params: P,
): RequestResult<T> {
  const key = requestKey(params);
  // The answer carries the key it was asked with, so it can be told from an answer to the previous parameters.
  const { state: tagged, reload } = useAsync((signal) => fetcher(params, { signal }).then((data) => ({ key, data })), [key]);
  return { state: untag(tagged), reload, current: isCurrent(tagged, key) };
}

export interface RequestResult<T> extends AsyncResult<T> {
  /**
   * `true` when `state.data` answers the current parameters. `useAsync` keeps the previous answer
   * while a new request loads, and for one render before it starts; a value that must never be
   * shown under another scenario (the relay label) is read only when this is `true`.
   */
  current: boolean;
}

interface Tagged<T> {
  key: string;
  data: T;
}

/** Whether a settled answer belongs to `key`. */
export function isCurrent<T>(state: AsyncState<Tagged<T>>, key: string): boolean {
  return state.status === 'success' && state.data.key === key;
}

function untag<T>(state: AsyncState<Tagged<T>>): AsyncState<T> {
  if (state.status === 'success') return { status: 'success', data: state.data.data, error: undefined };
  if (state.status === 'error') return { status: 'error', data: state.data?.data, error: state.error };
  if (state.status === 'loading') return { status: 'loading', data: state.data?.data, error: undefined };
  return state;
}

/** The value `useRequest` keys on: two parameter sets with the same key send the same request. */
export function requestKey(params: unknown): string {
  return JSON.stringify(params);
}

/** Prompt shown by result panels before a scenario exists. */
export function NeedsScenario() {
  return (
    <div className="d-empty">
      <p className="d-muted">No scenario yet. Choose a site and dates in the scenario setup.</p>
      <button type="button" className="d-button" onClick={() => uiStore.setMode('plan')}>
        Open scenario setup
      </button>
    </div>
  );
}

export function PanelHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="d-panel-header">
      <h2 className="panel-kicker">{title}</h2>
      {children}
    </header>
  );
}

/** One label-value row; `badge` sits after the value. */
export function Field({ label, value, badge }: { label: string; value: ReactNode; badge?: ReactNode }) {
  return (
    <div className="d-field">
      <dt className="d-field-label">{label}</dt>
      <dd className="d-field-value">
        <span className="data">{value}</span>
        {badge ? <span className="d-field-badge">{badge}</span> : null}
      </dd>
    </div>
  );
}

export function Fields({ children }: { children: ReactNode }) {
  return <dl className="d-fields">{children}</dl>;
}

/** Horizon profile used for a location and mast height. */
export function useHorizon(location: LocationParams | null, mastHeight: number | null): AsyncResult<HorizonProfile> {
  const key = JSON.stringify([location, mastHeight]);
  return useAsync(
    (signal) => {
      if (!location) return Promise.reject(new Error('No location yet.'));
      const params = mastHeight === null ? location : { ...location, mast_height_m: mastHeight };
      return getHorizon(params, { signal });
    },
    [key],
  );
}

/**
 * How the horizon was computed. A flat sphere horizon is labelled "Assumed" with
 * "terrain not included" (docs/PLAN.md, section 4.1, rule 5).
 */
export function HorizonNote({ horizon }: { horizon: HorizonProfile }) {
  if (horizon.method === 'sphere') {
    return (
      <span className="d-horizon-note">
        <ValidityBadge validity={horizon.validity} note="terrain not included" />
        <span className="d-muted">Flat horizon at {horizon.mast_height_m} m</span>
      </span>
    );
  }
  const dem = horizon.dem ? `${horizon.dem.product}, ${horizon.dem.resolution_m} m` : 'elevation map';
  return (
    <span className="d-horizon-note">
      <ValidityBadge validity={horizon.validity} note="terrain horizon" />
      <span className="d-muted">
        {dem}, mast {horizon.mast_height_m} m
      </span>
    </span>
  );
}
