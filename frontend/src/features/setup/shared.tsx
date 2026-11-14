/**
 * Pieces shared by the D-line panels (setup, power, comms, compare): example-data note, error
 * text, "set up a scenario first" prompt, label-value rows and the horizon note.
 */

import type { ReactNode } from 'react';
import { getHorizon } from '../../api/client';
import { getDataMode } from '../../api/config';
import { isApiError } from '../../api/errors';
import type { HorizonProfile, LocationParams } from '../../api/types';
import { useAsync, type AsyncResult } from '../../lib/hooks';
import { uiStore } from '../../shell/ui-state';
import { ValidityBadge } from '../../ui/ValidityBadge';
import './panels.css';

/** Shown in example mode: the answers are the files in data/examples/, not this scenario. */
export function ExampleNote() {
  if (getDataMode() !== 'examples') return null;
  return (
    <p className="d-note d-note-example" role="note">
      Example data: these values come from the example files and are the same for every scenario. Add{' '}
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
  return <>{children(state.data)}</>;
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
