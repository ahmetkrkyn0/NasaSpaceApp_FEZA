import { getReferenceMissions, getSites } from '../../api/client';
import { formatDeg, formatUtc } from '../../api/format';
import type { MissionFact, ReferenceMission, Site } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { scenarioStore } from '../../state/scenario-store';
import { ValidityBadge } from '../../ui/ValidityBadge';
import { STATUS_LABEL } from '../setup/form';
import { AsyncBlock, ExampleNote, Field, Fields, PanelHeader } from '../setup/shared';
import { ATHENA_CLOSING, ATHENA_ID, EVIDENCE_DESCRIPTION, EVIDENCE_LABEL, activeMission, demoScenarios, missionScenario } from './missions';
import './missions.css';

/**
 * Past missions (UC-13): six landings as ready scenarios. Picking one loads its site and landing
 * moment; the verified facts are listed with their evidence label. The Athena case has the demo
 * button and the closing sentence (docs/design/athena-demosu.md).
 */

function open(mission: ReferenceMission, sites: readonly Site[]) {
  scenarioStore.setScenario(missionScenario(mission, sites));
  scenarioStore.setSelectedUtc(mission.landing_utc);
}

/** Loads Athena and Blue Ghost 1 into the comparison, Athena active at its landing moment. */
export function loadDemo(missions: readonly ReferenceMission[], sites: readonly Site[]): boolean {
  const demo = demoScenarios(missions, sites);
  if (!demo) return false;
  const athena = missions.find((m) => m.id === ATHENA_ID)!;
  scenarioStore.replaceState({ active: demo[0], selected_utc: athena.landing_utc, compare: [...demo] });
  return true;
}

export function EvidenceTag({ evidence }: { evidence: MissionFact['evidence'] }) {
  return (
    <span className={`d-evidence d-evidence-${evidence}`} title={EVIDENCE_DESCRIPTION[evidence]}>
      {EVIDENCE_LABEL[evidence]}
    </span>
  );
}

function FactList({ facts }: { facts: readonly MissionFact[] }) {
  if (facts.length === 0) return <p className="d-muted">No verified facts with a named source for this case yet.</p>;
  return (
    <ul className="d-list" aria-label="Verified facts">
      {facts.map((fact) => (
        <li key={fact.text} className="d-fact">
          <EvidenceTag evidence={fact.evidence} /> {fact.text}{' '}
          <span className="d-muted">
            ({fact.source.url ? (
              <a className="d-link" href={fact.source.url} target="_blank" rel="noreferrer">
                {fact.source.label}
              </a>
            ) : (
              fact.source.label
            )}
            )
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MissionCard({ mission, missions, sites }: { mission: ReferenceMission; missions: readonly ReferenceMission[]; sites: readonly Site[] }) {
  const { expected } = mission;
  return (
    <div className="d-card" aria-label={`${mission.mission} case`}>
      <p className="d-card-title">{mission.mission}</p>
      <Fields>
        <Field label="Landing" value={formatUtc(mission.landing_utc)} badge={<ValidityBadge validity={mission.landing_utc_validity} />} />
        <Field label="Outcome" value={STATUS_LABEL[mission.outcome]} />
        {expected.sun_elevation_deg !== null ? <Field label="Sun at landing, reference" value={formatDeg(expected.sun_elevation_deg)} /> : null}
        {expected.earth_elevation_deg !== null ? <Field label="Earth at landing, reference" value={formatDeg(expected.earth_elevation_deg)} /> : null}
      </Fields>
      <p className="d-muted">
        Reference angles were checked against JPL Horizons for a ground-level flat horizon (validation test T1). The sky view shows the
        product's own result for this moment.
      </p>
      <FactList facts={mission.facts} />
      {mission.id === ATHENA_ID ? (
        <>
          <div className="d-row">
            <button type="button" className="d-button d-button-primary" onClick={() => loadDemo(missions, sites)}>
              Load demo
            </button>
            <span className="d-hint">Athena and Blue Ghost 1 from their landings, side by side in the comparison.</span>
          </div>
          <p className="d-note" role="note">
            {ATHENA_CLOSING}
          </p>
        </>
      ) : null}
    </div>
  );
}

export default function MissionsPanel() {
  const active = useStore(scenarioStore, (s) => s.active);
  const missionsResult = useAsync((signal) => getReferenceMissions({ signal }), []);
  const sitesResult = useAsync((signal) => getSites({}, { signal }), []);
  const sites = sitesResult.state.data ?? [];

  return (
    <section className="d-panel" aria-label="Past missions">
      <PanelHeader title="Past missions" />
      <ExampleNote />
      <AsyncBlock result={missionsResult}>
        {(missions) => {
          const current = activeMission(missions, active);
          return (
            <>
              <ul className="d-list" aria-label="Missions">
                {missions.map((m) => (
                  <li key={m.id} className="d-list-item">
                    <button
                      type="button"
                      className="d-button"
                      aria-pressed={current?.id === m.id}
                      onClick={() => open(m, sites)}
                    >
                      {m.mission}
                    </button>
                    <span className="d-muted">
                      {formatUtc(m.landing_utc)}, {STATUS_LABEL[m.outcome].toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
              {current ? (
                <MissionCard mission={current} missions={missions} sites={sites} />
              ) : (
                <p className="d-muted">Pick a mission to load its site and landing moment.</p>
              )}
            </>
          );
        }}
      </AsyncBlock>
    </section>
  );
}
