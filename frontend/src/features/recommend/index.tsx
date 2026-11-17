import { useMemo, useState } from 'react';
import { postRecommend } from '../../api/client';
import { ExampleDataNote } from '../../api/ExampleDataNote';
import { formatDate } from '../../api/format';
import type { RankedSite, RecommendResponse, Scenario, ScoreComponent } from '../../api/types';
import { useStore } from '../../lib/hooks';
import { recommendStore } from '../../state/recommend-store';
import { scenarioStore } from '../../state/scenario-store';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { ErrorNote, ExampleNote, NeedsScenario, PanelHeader } from '../setup/shared';
import {
  ALWAYS_NOTES,
  DEFAULT_FORM,
  METRIC_VIEW,
  PSR_LABEL,
  SLOPE_LIMIT_SOURCE,
  WEIGHT_KEYS,
  WEIGHT_LABEL,
  componentText,
  createRanker,
  eliminatedReason,
  rankingIsStale,
  siteScenario,
  splitRanked,
  topThree,
  type RecommendForm,
} from './recommend';
import './recommend.css';

/**
 * Site recommendation (Plan door, issue #109): weights and limits in, the server's ranking out.
 * Every score is shown with its components; eliminated sites are listed apart with the reason.
 * A ranked site becomes the active scenario or goes to the comparison.
 */

function ComponentBar({ c }: { c: ScoreComponent }) {
  const view = METRIC_VIEW[c.metric];
  const width = c.normalized === null ? 0 : Math.max(0, Math.min(1, c.normalized)) * 100;
  return (
    <li className="rec-component">
      <span className="rec-component-label">{view.label}</span>
      <span className="rec-bar" aria-hidden="true">
        <span className="rec-bar-fill" style={{ width: `${width}%` }} />
      </span>
      <span className="data">{componentText(c)}</span>
      <span className="d-muted">weight {c.weight}</span>
      <ValidityBadge validity={c.validity} />
    </li>
  );
}

export function RankedRow({ site, rank, active, stale = false }: { site: RankedSite; rank: number; active: Scenario | null; stale?: boolean }) {
  return (
    <li className="d-card rec-row" aria-label={`${rank}. ${site.name}`}>
      <p className="d-card-title">
        <span className="data">{rank}.</span> {site.name}{' '}
        <span className="rec-score">
          score <span className="data">{site.score ?? '—'}</span>
          {stale ? ' (for the ranked period)' : null}
        </span>{' '}
        <ValidityBadge validity={site.validity} />
      </p>
      <ul className="rec-components" aria-label="Score components">
        {site.components.map((c) => (
          <ComponentBar key={c.metric} c={c} />
        ))}
      </ul>
      <button type="button" className="d-button" disabled={!active} onClick={() => active && scenarioStore.setScenario(siteScenario(active, site))}>
        Use this site
      </button>
    </li>
  );
}

export function RecommendResults({ response, active, stale = false }: { response: RecommendResponse; active: Scenario | null; stale?: boolean }) {
  const { kept, eliminated } = splitRanked(response);
  const [added, setAdded] = useState<string | null>(null);
  const addTopThree = () => {
    if (!active) return;
    const results = topThree(response).map((site) => scenarioStore.addToCompare(siteScenario(active, site)));
    const full = results.filter((r) => r === 'full').length;
    setAdded(full > 0 ? `${results.length - full} added; the comparison holds at most four scenarios.` : `${results.length} added to the comparison.`);
  };
  return (
    <div className="d-section">
      <h3 className="d-section-title">Ranking</h3>
      {kept.length === 0 ? <p className="d-muted">Every site was eliminated by the limits.</p> : null}
      <ol className="rec-list" aria-label="Ranked sites">
        {kept.map((site, i) => (
          <RankedRow key={site.site_id} site={site} rank={i + 1} active={active} stale={stale} />
        ))}
      </ol>
      <div className="d-row">
        <button type="button" className="d-button" disabled={!active || kept.length === 0} onClick={addTopThree}>
          Add top three to compare
        </button>
        {added ? <span className="d-hint">{added}</span> : null}
      </div>
      {eliminated.length > 0 ? (
        <>
          <h3 className="d-section-title">Eliminated</h3>
          <ul className="d-list" aria-label="Eliminated sites">
            {eliminated.map((site) => (
              <li key={site.site_id} className="d-list-item">
                <span>{site.name}</span>
                <span className="d-muted">{eliminatedReason(site, response.limits)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <ul className="d-list" aria-label="Assumptions">
        {response.assumptions.map((text) => (
          <li key={text} className="d-muted">
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecommendForm({ form, onChange }: { form: RecommendForm; onChange: (form: RecommendForm) => void }) {
  return (
    <div className="d-section">
      <h3 className="d-section-title">Weights</h3>
      {WEIGHT_KEYS.map((key) => (
        <label key={key} className="d-control rec-weight">
          <span className="d-control-label">
            {WEIGHT_LABEL[key]} <span className="data">{form.weights[key].toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={form.weights[key]}
            onChange={(e) => onChange({ ...form, weights: { ...form.weights, [key]: Number(e.target.value) } })}
          />
        </label>
      ))}
      <label className="d-control">
        <span className="d-control-label">Slope limit (°)</span>
        <input
          className="d-input"
          inputMode="decimal"
          value={form.limits.max_slope_deg}
          onChange={(e) => onChange({ ...form, limits: { max_slope_deg: Number(e.target.value) } })}
        />
        <span className="d-hint">Default 12°: {SLOPE_LIMIT_SOURCE}.</span>
      </label>
      <div className="d-control">
        <span className="d-control-label">Permanent shadow</span>
        <div className="d-choice" role="group" aria-label="Permanent shadow preference">
          {(['near', 'far'] as const).map((p) => (
            <button key={p} type="button" className="d-choice-option" aria-pressed={form.psr_preference === p} onClick={() => onChange({ ...form, psr_preference: p })}>
              {PSR_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      <label className="d-row">
        <input
          type="checkbox"
          checked={form.include_catalogue_sites}
          onChange={(e) => onChange({ ...form, include_catalogue_sites: e.target.checked })}
        />
        <span>Include catalogue sites</span>
      </label>
    </div>
  );
}

export default function RecommendPanel() {
  const active = useStore(scenarioStore, (s) => s.active);
  const ranked = useStore(recommendStore, (s) => s.ranked);
  const rankedRequest = useStore(recommendStore, (s) => s.rankedRequest);
  const [form, setForm] = useState<RecommendForm>(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // One runner for the panel's life, so its request counter drops answers that arrive late.
  const ranker = useMemo(() => createRanker((body) => postRecommend(body), recommendStore), []);
  const stale = rankingIsStale(rankedRequest, active);

  const rank = async () => {
    if (!active) return;
    setBusy(true);
    setError(null);
    const result = await ranker(active, form);
    if ('stale' in result) return;
    if (!result.ok) setError(result.error);
    setBusy(false);
  };

  return (
    <section className="d-panel" aria-label="Site recommendation">
      <PanelHeader title="Site recommendation" />
      <ExampleNote />
      <ul className="d-list rec-notes" aria-label="About the score">
        {ALWAYS_NOTES.map((text) => (
          <li key={text} className="d-note">
            {text}
          </li>
        ))}
      </ul>
      {active ? (
        <>
          <p className="d-muted">
            Period and mast from the active scenario: <span className="data">{formatDate(active.start_utc)}</span> to{' '}
            <span className="data">{formatDate(active.end_utc)}</span>, mast <span className="data">{active.mast_height_m ?? 2} m</span>. Region: Mons
            Mouton.
          </p>
          <RecommendForm form={form} onChange={setForm} />
          <div className="d-row">
            <button type="button" className="d-button d-button-primary" disabled={busy} onClick={() => void rank()}>
              {busy ? 'Ranking…' : 'Rank sites'}
            </button>
          </div>
          {error ? <ErrorNote error={error} /> : null}
        </>
      ) : (
        <NeedsScenario />
      )}
      {ranked ? (
        <>
          {rankedRequest ? (
            <p className={stale ? 'd-note d-note-warn' : 'd-muted'} role={stale ? 'note' : undefined}>
              Ranking for <span className="data">{formatDate(rankedRequest.start_utc)}</span> to{' '}
              <span className="data">{formatDate(rankedRequest.end_utc)}</span>, mast <span className="data">{rankedRequest.mast_height_m} m</span>.
              {stale ? ' This ranking is for another period or mast than the active scenario; rank again to update it.' : null}
            </p>
          ) : null}
          {/* An example answer that does not match the request says so (README, example mode). */}
          <ExampleDataNote value={ranked} fallbackOnly />
          <RecommendResults response={ranked} active={active} stale={stale} />
        </>
      ) : null}
    </section>
  );
}
