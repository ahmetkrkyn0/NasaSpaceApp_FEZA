import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { horizonExample, panelProfilesExample, sitesExample } from '../../api/examples';
import { createScenarioStore } from '../../state/scenario-store';
import { EMPTY_FORM, checkForm, formFromScenario, groupSites, type SetupForm } from './form';
import { HorizonNote } from './shared';

const form = (patch: Partial<SetupForm>): SetupForm => ({ ...EMPTY_FORM, ...patch });

describe('site list', () => {
  it('is grouped by category', () => {
    const groups = groupSites(sitesExample);
    expect(groups.map((g) => g.label)).toEqual(['Apollo', 'CLPS', 'Commercial', 'International', 'Test site']);
    expect(groups.reduce((n, g) => n + g.sites.length, 0)).toBe(sitesExample.length);
  });

  it('shows the two Mons Mouton records under different names', () => {
    const names = sitesExample.filter((s) => s.id === 'im2-athena' || s.id === 'mons-mouton-im2-target').map((s) => s.name);
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
  });
});

describe('setup form checks', () => {
  const run = (f: SetupForm) => checkForm(f, sitesExample, panelProfilesExample, null);

  it('builds the scenario for a site and date', () => {
    const check = run(form({ siteId: 'mons-mouton-im2-target', startDate: '2026-12-01', mastHeight: 0 }));
    expect(check.errors).toEqual({});
    expect(check.scenario).toMatchObject({ site_id: 'mons-mouton-im2-target', start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z', mast_height_m: 0 });
  });

  it('latitude 95: error next to the field, no scenario, active scenario unchanged', () => {
    const store = createScenarioStore();
    const before = run(form({ siteId: 'mons-mouton-im2-target', startDate: '2026-12-01' })).scenario!;
    store.setScenario(before);
    const check = run(form({ source: 'custom', lat: '95', lon: '29.13', startDate: '2026-12-01' }));
    expect(check.errors.lat).toBe('Latitude must be between -90 and 90 degrees.');
    expect(check.scenario).toBeNull();
    if (check.scenario) store.setScenario(check.scenario); // what Apply does; it is disabled here
    expect(store.getState().active).toEqual(before);
  });

  it('longitude 359.9 is shown converted and used as -0.1', () => {
    const check = run(form({ source: 'custom', lat: '-84.78', lon: '359.9', startDate: '2026-12-01' }));
    expect(check.convertedLon).toBe(-0.1);
    expect(check.scenario).toMatchObject({ site_id: null, lat_deg: -84.78, lon_deg: -0.1 });
  });

  it('needs a site, a real date and a length of 1 to 60 days', () => {
    const check = run(form({ startDate: '2026-02-30', durationDays: '90' }));
    expect(Object.keys(check.errors).sort()).toEqual(['date', 'duration', 'site']);
    expect(check.scenario).toBeNull();
  });

  it('out-of-range date: names the server range and suggests the nearest valid date', () => {
    const range = { start_utc: '2026-01-01T00:00:00Z', end_utc: '2032-12-31T00:00:00Z' };
    const check = checkForm(form({ siteId: 'apollo-11', startDate: '2040-01-01' }), sitesExample, panelProfilesExample, range);
    expect(check.errors.date).toBe('The server can compute 2026-01-01 to 2032-12-31.');
    expect(check.dateSuggestion).toBe('2032-12-01');
    expect(check.scenario).toBeNull();
  });

  it('a fixed panel takes an optional direction between 0 and 360', () => {
    const base = form({ siteId: 'apollo-11', startDate: '2026-12-01', panelId: 'vertical_fixed' });
    expect(run({ ...base, fixedAzimuth: '' }).scenario).not.toHaveProperty('fixed_azimuth_deg');
    expect(run({ ...base, fixedAzimuth: '270' }).scenario?.fixed_azimuth_deg).toBe(270);
    expect(run({ ...base, fixedAzimuth: '400' }).errors.azimuth).toBeDefined();
  });

  it('round-trips a scenario through the form', () => {
    const scenario = run(form({ source: 'custom', lat: '-84.78', lon: '29.13', startDate: '2026-12-01', durationDays: '14', mastHeight: 20 })).scenario!;
    expect(run(formFromScenario(scenario)).scenario).toEqual(scenario);
  });
});

describe('horizon note', () => {
  it('labels a flat horizon "Assumed" with "terrain not included", as for a 5 m or 20 m mast', () => {
    const html = renderToStaticMarkup(<HorizonNote horizon={{ ...horizonExample, mast_height_m: 20 }} />);
    expect(html).toContain('Assumed');
    expect(html).toContain('terrain not included');
    expect(html).toContain('Flat horizon at 20 m');
  });

  it('labels a terrain horizon "Derived" and names the elevation map', () => {
    const terrain = { ...horizonExample, method: 'terrain' as const, validity: 'DERIVED' as const, dem: { product: 'PGDA 90', resolution_m: 10, url: null } };
    const html = renderToStaticMarkup(<HorizonNote horizon={terrain} />);
    expect(html).toContain('Derived');
    expect(html).toContain('PGDA 90, 10 m');
  });
});
