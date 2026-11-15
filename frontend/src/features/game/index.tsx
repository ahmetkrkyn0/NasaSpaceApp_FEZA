import { useState } from 'react';
import { getSites } from '../../api/client';
import { useAsync } from '../../lib/hooks';
import { uiStore } from '../../shell/ui-state';
import { scenarioStore } from '../../state/scenario-store';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { ErrorNote, PanelHeader } from '../setup/shared';
import {
  GOALS_NOTE,
  LEVELS,
  MISSION_DAYS,
  RECORDED_UTC,
  checkGoals,
  dateAt,
  earthReason,
  goalLines,
  land,
  levelMonths,
  missionScenario,
  monthOf,
  resultSentence,
  stars,
  type GameAnswer,
  type GameLevel,
} from './game';
import './game.css';

/**
 * Landing window game (Explore door, UC-17): pick a landing date for a two-week mission, land,
 * and see which of three goals the server's answer meets. No battery or survival model.
 */

export interface Attempt {
  level: GameLevel;
  date: string;
  answer: GameAnswer;
}

const GOAL_ORDER = ['sun', 'dark', 'earth'] as const;

function Stars({ count }: { count: number }) {
  return (
    <span className="g-stars" aria-label={`${count} of 3 goals met`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? 'g-star g-star-on' : 'g-star'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/** Opens the same site and mission in the Plan door. */
export function openInPlan(attempt: Attempt, sites: Parameters<typeof missionScenario>[2]) {
  const scenario = missionScenario(attempt.level, attempt.date, sites);
  scenarioStore.setScenario(scenario);
  scenarioStore.setSelectedUtc(scenario.start_utc);
  uiStore.setDoor('plan');
  uiStore.setMode('analyze');
}

export function GameResult({ attempt, onRetry, onOpenPlan }: { attempt: Attempt; onRetry: () => void; onOpenPlan: () => void }) {
  const { level, date, answer } = attempt;
  const checks = checkGoals(level.goals, answer.metrics);
  const lines = goalLines(level.goals, answer.metrics);
  const reason = earthReason(level, answer.metrics);
  return (
    <div className="d-card" aria-label="Landing result">
      <p className="d-card-title">
        Landing on <span className="data">{date}</span> <Stars count={stars(checks)} />
      </p>
      <p>{resultSentence(answer.metrics)}</p>
      <ul className="d-list" aria-label="Goals">
        {GOAL_ORDER.map((key) => {
          const met = checks.find((c) => c.key === key)!.met;
          return (
            <li key={key} className={met ? 'g-goal g-goal-met' : 'g-goal'}>
              <span aria-hidden="true">{met ? '✓' : '✗'}</span> {lines[key]}
              <span className="visually-hidden">{met ? ', met' : ', not met'}</span>
            </li>
          );
        })}
      </ul>
      {reason ? (
        <p className="d-note d-note-warn" role="note">
          {reason} <span className="d-muted">(Source: {level.never_earth!.source.label})</span>
        </p>
      ) : null}
      <p className="d-muted">
        Computed by the server <ValidityBadge validity={answer.validity} note={answer.validity === 'SYNTHETIC' ? 'terrain not included' : undefined} />
        {answer.origin === 'recorded' ? ` · answer recorded from the server on ${RECORDED_UTC.slice(0, 10)}; add ?data=live to ask it now` : null}
      </p>
      <p className="d-muted">{GOALS_NOTE}</p>
      <div className="d-row">
        <button type="button" className="d-button d-button-primary" onClick={onRetry}>
          Try another date
        </button>
        <button type="button" className="d-button" onClick={onOpenPlan}>
          Open in Plan
        </button>
      </div>
    </div>
  );
}

export function AttemptList({ attempts }: { attempts: readonly Attempt[] }) {
  if (attempts.length === 0) return null;
  return (
    <div className="d-section">
      <h3 className="d-section-title">Your landings</h3>
      <ul className="d-list" aria-label="Previous landings">
        {attempts.map((a, i) => {
          const s = stars(checkGoals(a.level.goals, a.answer.metrics));
          return (
            <li key={`${a.level.id}-${a.date}-${i}`} className="d-list-item">
              <span>
                <span className="data">{a.date}</span> {a.level.title}
              </span>
              <Stars count={s} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Level buttons; off while a landing is computed, so an answer never arrives under another level (PR #78 review). */
export function LevelPicker({ levelId, landing, onChoose }: { levelId: string; landing: boolean; onChoose: (id: string) => void }) {
  return (
    <div className="d-choice" role="group" aria-label="Level">
      {LEVELS.map((l) => (
        <button key={l.id} type="button" className="d-choice-option" aria-pressed={l.id === levelId} disabled={landing} onClick={() => onChoose(l.id)}>
          {l.title}
        </button>
      ))}
    </div>
  );
}

export default function GamePanel() {
  const sitesResult = useAsync((signal) => getSites({}, { signal }), []);
  const sites = sitesResult.state.data ?? [];
  const [levelId, setLevelId] = useState(LEVELS[0]!.id);
  const level = LEVELS.find((l) => l.id === levelId)!;
  const [index, setIndex] = useState(0);
  const [landing, setLanding] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<Attempt | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const date = dateAt(level, index);
  // A level that spans many months is browsed a month at a time: the slider covers one month.
  const months = levelMonths(level);
  const month = monthOf(level, index);

  const chooseLevel = (id: string) => {
    setLevelId(id);
    setIndex(0);
    setResult(null);
    setError(null);
  };

  const onLand = async () => {
    setLanding(true);
    setError(null);
    try {
      const attempt: Attempt = { level, date, answer: await land(level, date, sites) };
      setResult(attempt);
      setAttempts((list) => [attempt, ...list].slice(0, 10));
    } catch (e) {
      setError(e);
    } finally {
      setLanding(false);
    }
  };

  return (
    <section className="d-panel" aria-label="Landing window game">
      <PanelHeader title="Can you pick the landing date?" />
      <LevelPicker levelId={levelId} landing={landing} onChoose={chooseLevel} />
      <p>{level.intro}</p>
      {result ? (
        <GameResult attempt={result} onRetry={() => setResult(null)} onOpenPlan={() => openInPlan(result, sites)} />
      ) : (
        <div className="d-section">
          {months.length > 1 ? (
            <label className="d-control">
              <span className="d-control-label">Month</span>
              <select className="d-select" value={month.key} disabled={landing} onChange={(e) => setIndex(months.find((m) => m.key === e.target.value)!.first)}>
                {months.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="d-control">
            <span className="d-control-label">
              Landing date: <span className="data">{date}</span> · mission of {MISSION_DAYS} days
            </span>
            <input
              type="range"
              min={month.first}
              max={month.last}
              step={1}
              value={index}
              disabled={landing}
              onChange={(e) => setIndex(Number(e.target.value))}
            />
          </label>
          <div className="d-row">
            <button type="button" className="d-button d-button-primary" disabled={landing} onClick={() => void onLand()}>
              {landing ? 'Landing…' : 'Land'}
            </button>
          </div>
          {error ? <ErrorNote error={error} /> : null}
        </div>
      )}
      <AttemptList attempts={attempts} />
    </section>
  );
}
