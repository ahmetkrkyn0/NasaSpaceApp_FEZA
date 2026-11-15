import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { bodySeriesExample, earthLinkExample, earthLinkRelayExample, groundStationsExample, sitesExample } from '../../api/examples';
import type { Scenario } from '../../api/types';
import { EMPTY_RECOMMEND_STATE } from '../../state/recommend-store';
import { globePlaces } from '../globe';
import { earthPose } from './frame';
import SpacePanel, { SpaceSceneView, landerPlace, type SpaceSceneProps } from './index';
import { NOT_TO_SCALE, NO_STATION_NOTE, RELAY_NOTE, linkDrawingAt } from './scene-text';

const places = globePlaces(sitesExample, EMPTY_RECOMMEND_STATE);
const sample = bodySeriesExample.samples[0]!;

function render(over: Partial<SpaceSceneProps>): string {
  const props: SpaceSceneProps = {
    places,
    selectedId: null,
    site: null,
    stations: groundStationsExample,
    pose: earthPose(sample),
    sampleUtc: sample.utc,
    seriesValidity: bodySeriesExample.validity,
    link: earthLinkExample,
    drawing: linkDrawingAt(earthLinkExample, '2026-12-01T06:00:00Z'),
    utc: '2026-12-01T06:00:00Z',
    notes: [],
    webgl: false,
    ...over,
  };
  return renderToStaticMarkup(<SpaceSceneView {...props} />);
}

const relayUtc = earthLinkRelayExample.link_windows.find((w) => w.mode === 'relay_needed')!.start_utc;

describe('space scene view', () => {
  it('always says the scene is not to scale and labels the computed parts', () => {
    for (const html of [render({}), render({ webgl: true }), render({ pose: null, link: null, drawing: { mode: null, stationIds: [] }, utc: null })]) {
      expect(html).toContain(NOT_TO_SCALE);
    }
    const html = render({});
    // Earth link and body series validity badges.
    expect(html).toContain('Derived');
    expect(html).toContain('2026-12-05 00:00 UTC');
  });

  it('names the listening stations for direct, explains no_station, and shows the relay only when needed', () => {
    const direct = render({});
    expect(direct).toContain('Direct to Earth');
    expect(direct).toContain('Line to:');
    expect(direct).not.toContain(RELAY_NOTE);

    const none = render({ drawing: linkDrawingAt(earthLinkExample, '2026-12-02T01:00:00Z'), utc: '2026-12-02T01:00:00Z' });
    expect(none).toContain(NO_STATION_NOTE);
    expect(none).not.toContain(RELAY_NOTE);

    const relay = render({ link: earthLinkRelayExample, drawing: linkDrawingAt(earthLinkRelayExample, relayUtc), utc: relayUtc });
    expect(relay).toContain('Relay needed');
    expect(relay).toContain('>Illustration</span>');
    expect(relay).toContain(RELAY_NOTE);
  });

  it('falls back to the text and the 2D link diagram without WebGL', () => {
    const html = render({ webgl: false });
    expect(html).toContain('needs WebGL');
    expect(html).not.toContain('space-canvas');
  });

  it('stays closed until asked for, so no 3D code loads with the page', () => {
    const html = renderToStaticMarkup(<SpacePanel />);
    expect(html).toContain('Show space scene');
    expect(html).not.toContain('space-canvas');
  });

  it('stands the lander on the scenario site or custom point', () => {
    const base = { scenario_id: 's', label: 'x', start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z', mast_height_m: null, panel_profile_id: 'vertical_tracking' } as const;
    const site = sitesExample[0]!;
    expect(landerPlace({ ...base, site_id: site.id, lat_deg: null, lon_deg: null } as Scenario, places)).toEqual({ lat_deg: site.lat_deg, lon_deg: site.lon_deg });
    expect(landerPlace({ ...base, site_id: null, lat_deg: -85, lon_deg: 30 } as Scenario, places)).toEqual({ lat_deg: -85, lon_deg: 30 });
    expect(landerPlace(null, places)).toBeNull();
  });
});
