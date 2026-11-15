import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { sitesExample } from '../../api/examples';
import type { Scenario } from '../../api/types';
import { SitePickerView } from './SitePicker';
import { candidateOptions, unlistedOption } from './site-pick';

const scenario = (site_id: string, label: string): Scenario => ({
  scenario_id: 's',
  label,
  site_id,
  lat_deg: null,
  lon_deg: null,
  start_utc: '2026-12-01T00:00:00Z',
  end_utc: '2026-12-31T00:00:00Z',
  mast_height_m: 2,
  panel_profile_id: 'vertical_tracking',
});

const CANDIDATES = [
  { id: 'cand-11', name: 'Candidate 11', kind: 'candidate' },
  { id: 'mons-mouton-im2-target', name: 'Mons Mouton', kind: 'catalogue' },
];

describe('site picker with candidate regions (#140, item 2)', () => {
  it('offers loaded candidate regions as their own group, without catalogue duplicates', () => {
    const options = candidateOptions(sitesExample, CANDIDATES);
    expect(options).toEqual([{ id: 'cand-11', name: 'Candidate 11' }]);
    const html = renderToStaticMarkup(
      <SitePickerView sites={sitesExample} candidates={options} active={scenario('cand-11', 'Candidate 11')} onPick={() => undefined} />,
    );
    expect(html).toContain('<optgroup label="Candidate regions">');
    expect(html).toContain('<option value="cand-11" selected="">Candidate 11</option>');
    expect(html).not.toMatch(/value="apollo-11" selected=""/);
  });

  it('shows an unlisted active place by name instead of falling back to the first option', () => {
    const active = scenario('cand-11', 'Candidate 11');
    expect(unlistedOption(active, sitesExample, [])).toEqual({ id: 'cand-11', name: 'Candidate 11' });
    const html = renderToStaticMarkup(<SitePickerView sites={sitesExample} active={active} onPick={() => undefined} />);
    expect(html).toContain('<option value="cand-11" selected="">Candidate 11</option>');
    expect(html).not.toMatch(/value="apollo-11" selected=""/);
    // Listed places, empty values and custom points need no extra option.
    expect(unlistedOption(scenario('apollo-11', 'Apollo 11'), sitesExample, [])).toBeNull();
    expect(unlistedOption(null, sitesExample, [])).toBeNull();
    expect(unlistedOption({ ...active, site_id: null, lat_deg: -89, lon_deg: 0 }, sitesExample, [])).toBeNull();
  });

  it('uses the id when the scenario has no name', () => {
    expect(unlistedOption(scenario('cand-99', ' '), sitesExample, [])).toEqual({ id: 'cand-99', name: 'cand-99' });
  });
});
