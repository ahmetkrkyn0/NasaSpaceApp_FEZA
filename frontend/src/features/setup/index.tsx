import { useEffect, useMemo, useState } from 'react';
import { getHealth, getPanelProfiles, getSites } from '../../api/client';
import { formatLatLon, formatUtc } from '../../api/format';
import type { Site } from '../../api/types';
import { useAsync, useStore } from '../../lib/hooks';
import { uiStore } from '../../shell/ui-state';
import { scenarioStore } from '../../state/scenario-store';
import { MAST_HEIGHTS, TERRAIN_MAST_HEIGHTS } from '../../state/scenario-tools';
import { readScenarioDraft } from '../../state/url-sync';
import { SourcePopover } from '../../ui/SourcePopover';
import { TERRAIN_RULE_TEXT } from '../compare/horizon-models';
import { EMPTY_FORM, PANEL_TYPE_LABEL, STATUS_LABEL, checkForm, formFromScenario, groupSites, type SetupForm } from './form';
import { ErrorNote, ExampleNote, HorizonNote, PanelHeader, useHorizon } from './shared';

/** Form at start: the active scenario, or the valid fields of a partial link, or empty. */
function initialForm(): SetupForm {
  const active = scenarioStore.getState().active;
  if (active) return formFromScenario(active);
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  return search ? { ...EMPTY_FORM, ...pickDefined(formFromScenario(readScenarioDraft(new URLSearchParams(search)))) } : EMPTY_FORM;
}

function pickDefined(form: SetupForm): Partial<SetupForm> {
  return Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v !== undefined));
}

/**
 * Info cards of a site, such as CSA contributions (docs/design/csa-bilgi-kartlari.md). They come
 * with the site record from data/sites.json; a site without cards shows none.
 */
export function InfoCards({ cards }: { cards: Site['cards'] }) {
  if (!cards || cards.length === 0) return null;
  return (
    <ul className="d-list" aria-label="Info cards">
      {cards.map((card) => (
        <li key={card.text} className="d-note">
          <span className="d-agency">{card.agency}</span> {card.text}{' '}
          <span className="d-muted">
            (
            {card.source.url ? (
              <a className="d-link" href={card.source.url} target="_blank" rel="noreferrer">
                {card.source.label}
              </a>
            ) : (
              card.source.label
            )}
            )
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Horizon model a mast height asks for: `terrain` where the site has a profile, else `flat` (ADR-0003). */
export function mastHorizonKind(height: number): 'terrain' | 'flat' {
  return TERRAIN_MAST_HEIGHTS.includes(height) ? 'terrain' : 'flat';
}

function SiteCard({ site }: { site: Site }) {
  const source = { label: site.coordinate_source.label, ...(site.coordinate_source.url ? { url: site.coordinate_source.url } : {}) };
  return (
    <div className="d-card" aria-label="Site details">
      <p className="d-card-title">{site.name}</p>
      <dl className="d-fields">
        <div className="d-field">
          <dt className="d-field-label">Status</dt>
          <dd className="d-field-value">{STATUS_LABEL[site.status]}</dd>
        </div>
        <div className="d-field">
          <dt className="d-field-label">Landing</dt>
          <dd className="d-field-value">
            <span className="data">{site.landing_utc ? formatUtc(site.landing_utc) : 'Not listed'}</span>
          </dd>
        </div>
        <div className="d-field">
          <dt className="d-field-label">Coordinates</dt>
          <dd className="d-field-value">
            <span className="data">{formatLatLon(site.lat_deg, site.lon_deg)}</span>
          </dd>
        </div>
        <div className="d-field">
          <dt className="d-field-label">Source</dt>
          <dd className="d-field-value">
            <SourcePopover validity={site.validity} sources={[source]} />
          </dd>
        </div>
      </dl>
      {site.notes ? <p className="d-muted">{site.notes}</p> : null}
      <InfoCards cards={site.cards} />
      {site.category === 'artemis_candidate' ? (
        <p className="d-muted">Region from the 2024 Artemis III candidate study; the landing plan has changed since.</p>
      ) : null}
    </div>
  );
}

export default function SetupPanel() {
  const active = useStore(scenarioStore, (s) => s.active);
  const sitesResult = useAsync((signal) => getSites({}, { signal }), []);
  const profilesResult = useAsync((signal) => getPanelProfiles({ signal }), []);
  const healthResult = useAsync((signal) => getHealth({ signal }), []);
  const [form, setForm] = useState<SetupForm>(initialForm);

  // Another panel (Comms criterion, a link, back and forward) changed the active scenario.
  const activeId = active?.scenario_id ?? null;
  // Keyed on the id only: a new scenario resets the form, a re-render does not.
  useEffect(() => {
    const current = scenarioStore.getState().active;
    if (current) setForm(formFromScenario(current));
  }, [activeId]);

  const sites = sitesResult.state.data ?? [];
  const profiles = profilesResult.state.data ?? [];
  const range = healthResult.state.data?.ephemeris_range ?? null;
  const check = useMemo(() => checkForm(form, sites, profiles, range), [form, sites, profiles, range]);
  const groups = useMemo(() => groupSites(sites), [sites]);
  const selectedSite = form.source === 'site' ? sites.find((s) => s.id === form.siteId) ?? null : null;
  const profile = profiles.find((p) => p.id === form.panelId) ?? null;
  const horizonLocation = check.place
    ? check.place.kind === 'site'
      ? { site_id: check.place.site.id }
      : { lat_deg: check.place.lat_deg, lon_deg: check.place.lon_deg }
    : null;
  const horizon = useHorizon(horizonLocation, form.mastHeight);
  const unchanged = check.scenario !== null && active !== null && check.scenario.scenario_id === active.scenario_id;

  const set = (patch: Partial<SetupForm>) => setForm((f) => ({ ...f, ...patch }));

  const apply = () => {
    if (!check.scenario) return;
    scenarioStore.setScenario(check.scenario);
    scenarioStore.setSelectedUtc(check.scenario.start_utc);
  };

  return (
    <section className="d-panel" aria-label="Scenario setup">
      <PanelHeader title="Scenario setup" />
      <ExampleNote />
      {sitesResult.state.status === 'error' ? <ErrorNote error={sitesResult.state.error} /> : null}

      <form
        className="d-form"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <div className="d-control">
          <span className="d-control-label">Place</span>
          <div className="d-choice" role="group" aria-label="Place">
            <button type="button" className="d-choice-option" aria-pressed={form.source === 'site'} onClick={() => set({ source: 'site' })}>
              Site list
            </button>
            <button type="button" className="d-choice-option" aria-pressed={form.source === 'custom'} onClick={() => set({ source: 'custom' })}>
              Coordinates
            </button>
          </div>
        </div>

        {form.source === 'site' ? (
          <label className="d-control">
            <span className="d-control-label">Site</span>
            <select className="d-select" value={form.siteId} onChange={(e) => set({ siteId: e.target.value })} aria-invalid={Boolean(check.errors.site && form.siteId)}>
              <option value="">Choose a site…</option>
              {groups.map((group) => (
                <optgroup key={group.category} label={group.label}>
                  {group.sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        ) : (
          <div className="d-row">
            <label className="d-control">
              <span className="d-control-label">Latitude (°)</span>
              <input className="d-input" inputMode="decimal" value={form.lat} placeholder="-84.78" onChange={(e) => set({ lat: e.target.value })} aria-invalid={Boolean(check.errors.lat && form.lat)} />
              {check.errors.lat && form.lat ? <span className="d-error">{check.errors.lat}</span> : null}
            </label>
            <label className="d-control">
              <span className="d-control-label">Longitude (°, east +)</span>
              <input className="d-input" inputMode="decimal" value={form.lon} placeholder="29.13" onChange={(e) => set({ lon: e.target.value })} aria-invalid={Boolean(check.errors.lon && form.lon)} />
              {check.errors.lon && form.lon ? <span className="d-error">{check.errors.lon}</span> : null}
              {check.convertedLon !== null ? <span className="d-hint">Used as {check.convertedLon}° (east positive, -180 to 180).</span> : null}
            </label>
          </div>
        )}

        {selectedSite ? <SiteCard site={selectedSite} /> : null}

        <div className="d-row">
          <label className="d-control">
            <span className="d-control-label">Start date (UTC)</span>
            <input className="d-input" type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} aria-invalid={Boolean(check.errors.date && form.startDate)} />
          </label>
          <label className="d-control">
            <span className="d-control-label">Length (days)</span>
            <input className="d-input" inputMode="numeric" value={form.durationDays} onChange={(e) => set({ durationDays: e.target.value })} aria-invalid={Boolean(check.errors.duration)} />
          </label>
        </div>
        {check.errors.date && form.startDate ? (
          <div className="d-row">
            <span className="d-error">{check.errors.date}</span>
            {check.dateSuggestion ? (
              <button type="button" className="d-button" onClick={() => set({ startDate: check.dateSuggestion ?? '' })}>
                Use {check.dateSuggestion}
              </button>
            ) : null}
          </div>
        ) : null}
        {check.errors.duration ? <span className="d-error">{check.errors.duration}</span> : null}

        <div className="d-control">
          <span className="d-control-label">Mast height</span>
          <div className="d-choice" role="group" aria-label="Mast height">
            {MAST_HEIGHTS.map((h) => (
              <button
                key={h}
                type="button"
                className="d-choice-option d-choice-stack"
                aria-pressed={form.mastHeight === h}
                aria-label={`${h} m, ${mastHorizonKind(h)} horizon`}
                onClick={() => set({ mastHeight: h })}
              >
                {h} m<span className="d-choice-note">{mastHorizonKind(h)}</span>
              </button>
            ))}
          </div>
          {/* Shown before a height is chosen, so a mast comparison is not made across horizon models (issue #71). */}
          <span className="d-hint">{TERRAIN_RULE_TEXT}</span>
          {form.mastHeight === 0 ? (
            <span className="d-hint">0 m: flat horizon at ground level, the condition of the reference tests.</span>
          ) : null}
          {check.place ? (
            horizon.state.status === 'error' ? (
              <ErrorNote error={horizon.state.error} />
            ) : horizon.state.data ? (
              <HorizonNote horizon={horizon.state.data} />
            ) : null
          ) : null}
        </div>

        <label className="d-control">
          <span className="d-control-label">Panel type</span>
          <select className="d-select" value={form.panelId} onChange={(e) => set({ panelId: e.target.value })}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {PANEL_TYPE_LABEL[p.type]}
              </option>
            ))}
          </select>
          {profile ? <span className="d-hint">Default panel values ({profile.area_m2} m², efficiency {profile.efficiency}) are assumptions.</span> : null}
        </label>

        {profile?.type === 'vertical_fixed' ? (
          <label className="d-control">
            <span className="d-control-label">Panel direction (°, from north)</span>
            <input className="d-input" inputMode="decimal" value={form.fixedAzimuth} placeholder="Best direction" onChange={(e) => set({ fixedAzimuth: e.target.value })} aria-invalid={Boolean(check.errors.azimuth)} />
            {check.errors.azimuth ? <span className="d-error">{check.errors.azimuth}</span> : <span className="d-hint">Leave empty to let the server pick the best direction.</span>}
          </label>
        ) : null}

        <div className="d-row">
          <button type="submit" className="d-button d-button-primary" disabled={!check.scenario || unchanged}>
            {unchanged ? 'Scenario applied' : 'Apply scenario'}
          </button>
          <button type="button" className="d-button" disabled={!active} onClick={() => uiStore.setMode('analyze')}>
            Analyze
          </button>
        </div>
        {active ? (
          <p className="d-muted">
            Active: <span className="data">{active.label}</span> ({active.site_id ?? formatLatLon(active.lat_deg, active.lon_deg)})
          </p>
        ) : null}
      </form>
    </section>
  );
}
