import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { getReferenceMissions } from '../../api/client';
import { referenceMissionsExample, sitesExample } from '../../api/examples';
import { EMPTY_SCENARIO_STATE, scenarioStore } from '../../state/scenario-store';
import { scenarioDays } from '../../state/scenario-tools';
import { MissionCard, loadDemo } from './index';
import { ATHENA_CLOSING, EVIDENCE_LABEL, activeMission, demoScenarios, missionScenario } from './missions';

afterEach(() => scenarioStore.replaceState(EMPTY_SCENARIO_STATE));

const missions = referenceMissionsExample;
const byId = (id: string) => missions.find((m) => m.id === id)!;

describe('past missions', () => {
  it('lists the six cases of the design document', async () => {
    const answer = await getReferenceMissions();
    expect(answer.map((m) => m.id)).toEqual(['im2-athena', 'blue-ghost-1', 'chandrayaan-3', 'im1-odysseus', 'slim', 'change-4']);
  });

  it('a case opens its site from the landing moment, at ground level, for a month', () => {
    const athena = byId('im2-athena');
    const s = missionScenario(athena, sitesExample);
    expect(s.site_id).toBe('im2-athena');
    expect(s.start_utc).toBe('2025-03-06T17:30:00Z');
    expect(s.mast_height_m).toBe(0);
    expect(scenarioDays(s)).toBe(30);
    expect(s.label).toBe('IM-2 Athena, landing');
    expect(activeMission(missions, s)?.id).toBe('im2-athena');
    expect(activeMission(missions, { ...s, start_utc: '2025-03-07T17:30:00Z' })).toBeNull();
  });

  it('Load demo puts Athena and Blue Ghost 1 side by side, Athena active at its landing', () => {
    const demo = demoScenarios(missions, sitesExample)!;
    expect(demo.map((s) => s.site_id)).toEqual(['im2-athena', 'blue-ghost-1']);
    expect(demo.map((s) => s.start_utc)).toEqual(['2025-03-06T17:30:00Z', '2025-03-02T08:34:00Z']);
    expect(loadDemo(missions, sitesExample)).toBe(true);
    const state = scenarioStore.getState();
    expect(state.active).toEqual(demo[0]);
    expect(state.selected_utc).toBe('2025-03-06T17:30:00Z');
    expect(state.compare).toEqual(demo);
    expect(demoScenarios(missions.filter((m) => m.id !== 'blue-ghost-1'), sitesExample)).toBeNull();
  });

  it('every fact carries its evidence label and source', () => {
    for (const mission of missions) {
      const html = renderToStaticMarkup(<MissionCard mission={mission} missions={missions} sites={sitesExample} />);
      for (const fact of mission.facts) {
        expect(html).toContain(`>${EVIDENCE_LABEL[fact.evidence]}</span>`);
        expect(html).toContain(fact.source.label);
      }
    }
    expect(Object.values(EVIDENCE_LABEL)).toEqual(['Official report', 'Preliminary', 'Commentary']);
  });

  it('the Athena case shows the closing sentence and the demo button; the others do not', () => {
    const athena = renderToStaticMarkup(<MissionCard mission={byId('im2-athena')} missions={missions} sites={sitesExample} />);
    expect(athena).toContain(ATHENA_CLOSING);
    expect(athena).toContain('Load demo');
    const slim = renderToStaticMarkup(<MissionCard mission={byId('slim')} missions={missions} sites={sitesExample} />);
    expect(slim).not.toContain(ATHENA_CLOSING);
    expect(slim).not.toContain('Load demo');
    expect(ATHENA_CLOSING).toBe('We do not claim to explain why a mission failed. We show how the sky differs between sites and dates.');
  });

  it("Chinese missions use the NASA table coordinate and official statements only", () => {
    for (const id of ['change-4']) {
      const site = sitesExample.find((s) => s.id === id)!;
      expect(site.coordinate_source.label).toContain('NASA');
      expect(byId(id).facts.every((f) => f.evidence === 'official')).toBe(true);
    }
  });
});
