import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { getReferenceMissions } from '../../api/client';
import { configureApi, resetApiConfig } from '../../api/config';
import { referenceMissionsExample, sitesExample } from '../../api/examples';
import { recordingIndex } from '../../api/recorded';
import { EMPTY_SCENARIO_STATE, scenarioStore } from '../../state/scenario-store';
import { scenarioDays } from '../../state/scenario-tools';
import { MissionCard, loadDemo } from './index';
import { ATHENA_CLOSING, EVIDENCE_LABEL, activeMission, caseRecorded, demoScenarios, missionScenario } from './missions';

afterEach(() => {
  scenarioStore.replaceState(EMPTY_SCENARIO_STATE);
  resetApiConfig();
});

const missions = referenceMissionsExample;
const byId = (id: string) => missions.find((m) => m.id === id)!;
/** Rendered text without tags, with the apostrophe entity decoded. */
const text = (html: string) => html.replace(/<[^>]+>/g, '').replaceAll('&#x27;', "'").replace(/\s+/g, ' ');

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

  it('no case is covered by the recordings, which hold one period and mast; a recorded scenario is', () => {
    for (const mission of missions) expect(caseRecorded(missionScenario(mission, sitesExample)), mission.id).toBe(false);
    const recorded = {
      ...missionScenario(byId('slim'), sitesExample),
      start_utc: recordingIndex.start_utc,
      end_utc: recordingIndex.end_utc,
      mast_height_m: recordingIndex.mast_height_m,
    };
    expect(caseRecorded(recorded)).toBe(true);
    expect(caseRecorded({ ...recorded, mast_height_m: 0 })).toBe(false);
    expect(caseRecorded({ ...recorded, start_utc: '2026-12-02T00:00:00Z' })).toBe(false);
    expect(caseRecorded({ ...recorded, end_utc: '2026-12-30T00:00:00Z' })).toBe(false);
    expect(caseRecorded({ ...recorded, site_id: 'unknown' })).toBe(false);
  });

  it('in example mode a case says it has no recording and that the views show general examples', () => {
    const note =
      `Example data has no recorded answer for this case. The case uses ground level (0 m) from the landing moment; ` +
      `the recordings cover ${recordingIndex.start_utc.slice(0, 10)} to ${recordingIndex.end_utc.slice(0, 10)} at a ` +
      `${recordingIndex.mast_height_m} m mast. The sky view, countdown and timeline show general examples. ` +
      'Add ?data=live to the address to compute this case.';
    for (const id of ['slim', 'chandrayaan-3']) {
      const html = renderToStaticMarkup(<MissionCard mission={byId(id)} missions={missions} sites={sitesExample} />);
      expect(text(html)).toContain(note);
      expect(html).toContain('role="note"');
      expect(text(html)).not.toContain("product's own result");
    }
  });

  it('in live mode a case keeps the product result sentence and no example note', () => {
    configureApi({ mode: 'live' });
    const html = renderToStaticMarkup(<MissionCard mission={byId('slim')} missions={missions} sites={sitesExample} />);
    expect(text(html)).toContain("The sky view shows the product's own result for this moment.");
    expect(html).not.toContain('Example data has no recorded answer');
  });

  it("Chinese missions use the NASA table coordinate and official statements only", () => {
    for (const id of ['change-4']) {
      const site = sitesExample.find((s) => s.id === id)!;
      expect(site.coordinate_source.label).toContain('NASA');
      expect(byId(id).facts.every((f) => f.evidence === 'official')).toBe(true);
    }
  });
});
