import { describe, expect, it } from 'vitest';
import {
  SLIP_SCENARIO_ID,
  addDaysUtc,
  buildScenario,
  checkDuration,
  checkLatitude,
  checkLongitude,
  checkStartDate,
  dateToUtc,
  locationWithMast,
  momentIn,
  normalizeLongitude,
  sameDateAnotherSite,
  sameSiteAnotherDate,
  scenarioDays,
  slippedScenario,
} from './scenario-tools';

const SITES = [
  { id: 'mons-mouton-im2-target', name: 'Mons Mouton (IM-2 target point)' },
  { id: 'im1-odysseus', name: 'IM-1 Odysseus' },
];
const MONS = SITES[0]!;

function dec1() {
  return buildScenario({
    place: { kind: 'site', site: MONS },
    start_utc: '2026-12-01T00:00:00Z',
    days: 30,
    mast_height_m: 0,
    panel_profile_id: 'vertical_tracking',
  });
}

describe('coordinate checks', () => {
  it('rejects latitude 95 with a message', () => {
    expect(checkLatitude('95')).toEqual({ ok: false, error: 'Latitude must be between -90 and 90 degrees.' });
    expect(checkLatitude('abc').ok).toBe(false);
    expect(checkLatitude('-84.78')).toEqual({ ok: true, value: -84.78 });
  });

  it('converts longitudes above 180 to east-positive -180..180 and says so', () => {
    expect(checkLongitude('359.9')).toEqual({ ok: true, value: { value: -0.1, converted: true } });
    expect(checkLongitude('206.0148')).toEqual({ ok: true, value: { value: -153.9852, converted: true } });
    expect(checkLongitude('29.13')).toEqual({ ok: true, value: { value: 29.13, converted: false } });
    expect(checkLongitude('361').ok).toBe(false);
    expect(normalizeLongitude(180)).toBe(180);
  });
});

describe('dates', () => {
  it('accepts real calendar dates only', () => {
    expect(dateToUtc('2026-12-01')).toBe('2026-12-01T00:00:00Z');
    expect(dateToUtc('2026-02-30')).toBeNull();
    expect(dateToUtc('12/01/2026')).toBeNull();
  });

  it('adds whole days in UTC', () => {
    expect(addDaysUtc('2026-12-01T00:00:00Z', 30)).toBe('2026-12-31T00:00:00Z');
    expect(addDaysUtc('2026-12-30T00:00:00Z', 5)).toBe('2027-01-04T00:00:00Z');
  });

  it('limits the length to 1..60 whole days', () => {
    expect(checkDuration('30')).toEqual({ ok: true, value: 30 });
    expect(checkDuration('0').ok).toBe(false);
    expect(checkDuration('61').ok).toBe(false);
    expect(checkDuration('2.5').ok).toBe(false);
  });

  it('accepts any date when the server range is unknown', () => {
    expect(checkStartDate('2026-12-01', 30, { start_utc: null, end_utc: null })).toEqual({ ok: true, value: '2026-12-01T00:00:00Z' });
  });

  it('names the server range and suggests the nearest start that fits', () => {
    const range = { start_utc: '2026-01-01T00:00:00Z', end_utc: '2032-12-31T00:00:00Z' };
    const late = checkStartDate('2032-12-20', 30, range);
    expect(late).toEqual({
      ok: false,
      error: 'The server can compute 2026-01-01 to 2032-12-31.',
      suggestion: '2032-12-01',
    });
    const early = checkStartDate('2025-06-01', 30, range);
    expect(early.ok ? null : early.suggestion).toBe('2026-01-01');
  });
});

describe('scenarios', () => {
  it('builds the S-01 scenario with a stable id and a readable label', () => {
    const a = dec1();
    expect(a).toMatchObject({
      label: 'Mons Mouton (IM-2 target point), 2026-12-01',
      site_id: 'mons-mouton-im2-target',
      lat_deg: null,
      lon_deg: null,
      start_utc: '2026-12-01T00:00:00Z',
      end_utc: '2026-12-31T00:00:00Z',
      mast_height_m: 0,
    });
    expect(dec1().scenario_id).toBe(a.scenario_id);
    expect(scenarioDays(a)).toBe(30);
  });

  it('gives a different id when the question changes, including the criterion', () => {
    const a = dec1();
    expect(buildScenario({ place: { kind: 'site', site: MONS }, start_utc: a.start_utc, days: 30, mast_height_m: 2, panel_profile_id: 'vertical_tracking' }).scenario_id).not.toBe(a.scenario_id);
    expect(buildScenario({ place: { kind: 'site', site: MONS }, start_utc: a.start_utc, days: 30, mast_height_m: 0, panel_profile_id: 'vertical_tracking', earth_criterion: 'full_disk' }).scenario_id).not.toBe(a.scenario_id);
  });

  it('template "same site, another date" keeps place, length and settings', () => {
    const b = sameSiteAnotherDate(dec1(), '2026-12-06T00:00:00Z', SITES);
    expect(b).toMatchObject({ site_id: 'mons-mouton-im2-target', start_utc: '2026-12-06T00:00:00Z', end_utc: '2027-01-05T00:00:00Z', mast_height_m: 0, label: 'Mons Mouton (IM-2 target point), 2026-12-06' });
    expect(b.scenario_id).not.toBe(dec1().scenario_id);
  });

  it('template "same date, another site" keeps the dates', () => {
    const c = sameDateAnotherSite(dec1(), SITES[1]!, SITES);
    expect(c).toMatchObject({ site_id: 'im1-odysseus', start_utc: '2026-12-01T00:00:00Z', end_utc: '2026-12-31T00:00:00Z', label: 'IM-1 Odysseus, 2026-12-01' });
  });

  it('the slipped launch always has the same id so the slider replaces it', () => {
    const s5 = slippedScenario(dec1(), 5, SITES);
    const s9 = slippedScenario(dec1(), 9, SITES);
    expect(s5.scenario_id).toBe(SLIP_SCENARIO_ID);
    expect(s9.scenario_id).toBe(SLIP_SCENARIO_ID);
    expect(s9).toMatchObject({ start_utc: '2026-12-10T00:00:00Z', label: 'Mons Mouton (IM-2 target point), launch +9 d' });
  });

  it('custom coordinates go to the API as lat and lon, with the mast height', () => {
    const custom = buildScenario({ place: { kind: 'custom', lat_deg: -0.1, lon_deg: -0.1 }, start_utc: '2026-12-01T00:00:00Z', days: 10, mast_height_m: 5, panel_profile_id: 'two_axis' });
    expect(locationWithMast(custom)).toEqual({ lat_deg: -0.1, lon_deg: -0.1, mast_height_m: 5 });
    expect(custom.label).toBe('-0.1000, -0.1000, 2026-12-01');
  });

  it('shows the selected moment only when it lies inside the scenario', () => {
    const a = dec1();
    expect(momentIn(a, '2026-12-05T00:00:00Z')).toBe('2026-12-05T00:00:00Z');
    expect(momentIn(a, '2027-03-01T00:00:00Z')).toBe(a.start_utc);
    expect(momentIn(a, null)).toBe(a.start_utc);
  });
});
