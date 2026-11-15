import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { scenarioStore } from '../../state/scenario-store';
import CommsPanel from './index';
import { GROUND_STATIONS, GroundStations, STATIONS_CONTENT, mediaUrl } from './stations';

const MEDIA = new URL('../../../public/media/', import.meta.url);
const exists = (path: string) => existsSync(fileURLToPath(new URL(path, MEDIA)));

describe('ground station content (issue #81)', () => {
  it('lists Goldstone, Madrid and Canberra, each with a NASA source', () => {
    expect(GROUND_STATIONS.map((s) => s.name)).toEqual(['Goldstone', 'Madrid', 'Canberra']);
    for (const s of GROUND_STATIONS) {
      expect(s.source_url, s.id).toMatch(/^https:\/\/www\.nasa\.gov\//);
      expect(s.text.length, s.id).toBeGreaterThan(0);
      expect(s.alt, s.id).toMatch(/^Illustration/);
    }
    expect(STATIONS_CONTENT.source.url).toMatch(/^https:\/\/www\.nasa\.gov\//);
  });

  it('lists the antennas of a site as NASA does: one 70 m, one 26 m, multiple 34 m (PR #86 review)', () => {
    const madrid = GROUND_STATIONS.find((s) => s.id === 'dsn-madrid')!;
    expect(madrid.text).toContain('one huge 230-foot (70-meter) antenna');
    expect(madrid.text).toContain('one 85-foot (26-meter) antenna');
    expect(madrid.text).toContain('multiple 112-foot (34-meter) antennas');
  });

  it('every picture it names exists under frontend/public/media/stations/', () => {
    const images = [STATIONS_CONTENT.globe.image, ...GROUND_STATIONS.map((s) => s.image)];
    for (const image of images) {
      expect(image, image).toMatch(/^stations\//);
      expect(exists(image), image).toBe(true);
    }
  });

  it('never uses moon.jpg or moonzoom.jpg', () => {
    const files = ['../../content/ground-stations.json', './stations.tsx'];
    for (const f of files) {
      const text = readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8');
      expect(text, f).not.toMatch(/moon(zoom)?\.jpg/);
    }
  });
});

describe('ground station section', () => {
  it('does not draw the pictures while closed, so they are not downloaded', () => {
    const closed = renderToStaticMarkup(<GroundStations />);
    expect(closed).toContain('Who listens on Earth');
    expect(closed).not.toContain('<img');
    expect(closed).not.toContain('Illustration');
  });

  it('when open, shows the Illustration label and says the pictures are not the computed station view', () => {
    const open = renderToStaticMarkup(<GroundStations initiallyOpen />);
    expect(open).toContain('>Illustration</span>');
    // Since #110 the station view is computed (station cards); the pictures stay illustrations.
    expect(open).toContain('These pictures are illustrations, not data');
    expect(open).toContain('for the Moon&#x27;s centre rather than for the site');
    // Every picture is lazy and comes from the media folder.
    const imgs = open.match(/<img [^>]*>/g) ?? [];
    expect(imgs).toHaveLength(GROUND_STATIONS.length + 1);
    for (const img of imgs) expect(img).toContain('loading="lazy"');
    expect(open).toContain(`src="${mediaUrl('stations/dsn-goldstone/overview.jpg')}"`);
    // Sources are linked next to the text.
    expect(open.match(/href="https:\/\/www\.nasa\.gov\/communicating-with-missions\/dsn\/"/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it('sits at the end of the Earth link panel and leaves the rest of it as it was', () => {
    scenarioStore.setScenario({
      scenario_id: 'x',
      label: 'Mons Mouton',
      site_id: 'mons-mouton-im2-target',
      lat_deg: null,
      lon_deg: null,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      mast_height_m: 2,
      panel_profile_id: 'vertical_tracking',
    });
    const html = renderToStaticMarkup(<CommsPanel />);
    scenarioStore.setScenario(null);
    const order = ['When does Earth count as visible?', 'Now', 'Over the period', 'Link to Earth', 'Who listens on Earth'];
    const at = order.map((text) => html.indexOf(text));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });
});
