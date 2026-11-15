import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { ROLE_SITES, percent, sampleAt, sampleLabel, siteById } from './data';
import { EducatorPage } from './EducatorPage';
import { EngineerPage } from './EngineerPage';
import { Frame, RECORDED_NOTE } from './parts';
import { PublicPage } from './PublicPage';
import { ROLES, ROLE_DOOR, liveHref, parseRoleRoute, roleHref } from './route';
import { StartPage } from './StartPage';

const recordedDir = fileURLToPath(new URL('../../../data/examples/recorded/', import.meta.url));

function recorded(site: string, file: string): { response: Record<string, unknown> } {
  return JSON.parse(readFileSync(`${recordedDir}${site}/${file}`, 'utf8')) as { response: Record<string, unknown> };
}

describe('role routes', () => {
  it('reads the four role addresses and nothing else', () => {
    expect(parseRoleRoute('#/start')).toBe('start');
    expect(parseRoleRoute('#/public')).toBe('public');
    expect(parseRoleRoute('#/educator/')).toBe('educator');
    expect(parseRoleRoute('#/engineer')).toBe('engineer');
    expect(parseRoleRoute('')).toBeNull();
    expect(parseRoleRoute('#/plan')).toBeNull();
    expect(parseRoleRoute('#start')).toBeNull();
  });

  it('sends each role to its own door of the live console', () => {
    expect(ROLE_DOOR).toEqual({ public: 'explore', educator: 'classroom', engineer: 'plan' });
    expect(liveHref('public', '/')).toBe('/?door=explore');
    expect(liveHref('educator', '/')).toBe('/?door=classroom');
    expect(liveHref('engineer', '/')).toBe('/?door=plan');
  });

  it('leaves the opening screen as it was when the address has no role', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('splash-enter');
    expect(html).not.toContain('rp-root');
  });
});

describe('role page data', () => {
  it('copies the metrics of the recorded answers without changing them', () => {
    expect(ROLE_SITES.length).toBe(3);
    for (const site of ROLE_SITES) {
      const events = recorded(site.id, 'events.json').response as { metrics: Record<string, number>; validity: string; relay_status: string };
      for (const [key, value] of Object.entries(site.metrics)) {
        expect(value, `${site.id} ${key}`).toBeCloseTo(events.metrics[key] ?? Number.NaN, 4);
      }
      expect(site.validity.events).toBe(events.validity);
      expect(site.relay_status).toBe(events.relay_status);
      const power = recorded(site.id, 'power.json').response as { summary: Record<string, number>; validity: string };
      expect(site.power.mean_power_w).toBe(power.summary.mean_power_w);
      expect(site.power.energy_kwh).toBe(power.summary.energy_kwh);
      expect(site.validity.power).toBe(power.validity);
    }
  });

  it('copies the sky samples of the recorded series', () => {
    for (const site of ROLE_SITES) {
      const sky = recorded(site.id, 'sky-series.json').response as {
        samples: { sun: { elevation_deg: number; azimuth_true_deg: number }; earth: { elevation_deg: number; visible_fraction: number } }[];
        horizon: { method: string };
      };
      expect(site.samples.length).toBe(sky.samples.length);
      expect(site.horizon).toBe(sky.horizon.method);
      for (const index of [0, 37, sky.samples.length - 1]) {
        const mine = sampleAt(site, index);
        const theirs = sky.samples[index];
        expect(mine.sunElevation).toBeCloseTo(theirs?.sun.elevation_deg ?? Number.NaN, 2);
        expect(mine.sunAzimuth).toBeCloseTo(theirs?.sun.azimuth_true_deg ?? Number.NaN, 1);
        expect(mine.earthElevation).toBeCloseTo(theirs?.earth.elevation_deg ?? Number.NaN, 2);
        expect(mine.earthVisible).toBeCloseTo(theirs?.earth.visible_fraction ?? Number.NaN, 3);
      }
    }
  });

  it('labels a sample with its day and hour', () => {
    const site = siteById('apollo-11');
    expect(sampleLabel(site, 0)).toBe('Day 1, 00:00 UTC');
    expect(sampleLabel(site, 5)).toBe('Day 2, 06:00 UTC');
  });
});

describe('role pages', () => {
  it('offers the three roles on the start page', () => {
    const html = renderToStaticMarkup(
      <Frame route="start">
        <StartPage />
      </Frame>,
    );
    expect(html).toContain('One Moon. Three ways to explore.');
    for (const role of ROLES) expect(html).toContain(`href="${roleHref(role)}"`);
    expect(html).toContain('Illustration');
  });

  it('links every role page to its door and says the data is a recorded example', () => {
    const pages = { public: <PublicPage />, educator: <EducatorPage />, engineer: <EngineerPage /> };
    for (const role of ROLES) {
      const html = renderToStaticMarkup(<Frame route={role}>{pages[role]}</Frame>);
      expect(html).toContain(`?door=${ROLE_DOOR[role]}`);
      expect(html).toContain(RECORDED_NOTE.replace('’', '&#x27;').slice(0, 16));
      expect(html).toContain('not the product');
      expect(html).toContain(`aria-current="page"`);
    }
  });

  it('shows the recorded numbers and their validity labels to the engineer', () => {
    const html = renderToStaticMarkup(<EngineerPage />);
    for (const site of ROLE_SITES) {
      expect(html).toContain(percent(site.metrics.sunlit_fraction));
      expect(html).toContain(site.metrics.max_sun_elevation_deg.toFixed(2));
    }
    expect(html).toContain('DERIVED');
    expect(html).toContain('SYNTHETIC');
    expect(html).toContain('certifies no landing');
  });

  it('tells the public that Earth never rises on the far side', () => {
    const far = siteById('change-4');
    expect(far.metrics.earth_visible_fraction).toBe(0);
    expect(far.relay_status).toBe('required');
    const html = renderToStaticMarkup(<EducatorPage />);
    expect(html).toContain(percent(far.metrics.earth_visible_fraction));
  });
});
