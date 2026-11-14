/**
 * Setup form state and its checks, kept apart from the component so they can be tested
 * without a DOM. Invalid input never changes the active scenario.
 */

import type { Criterion, PanelProfile, Scenario, Site } from '../../api/types';
import {
  DEFAULT_DURATION_DAYS,
  DEFAULT_MAST_HEIGHT_M,
  DEFAULT_PANEL_PROFILE_ID,
  buildScenario,
  checkDuration,
  checkLatitude,
  checkLongitude,
  checkStartDate,
  scenarioDays,
  utcToDate,
  type DateRange,
  type ScenarioPlace,
} from '../../state/scenario-tools';

export interface SetupForm {
  source: 'site' | 'custom';
  siteId: string;
  lat: string;
  lon: string;
  startDate: string;
  durationDays: string;
  mastHeight: number;
  panelId: string;
  /** Only for a `vertical_fixed` panel; empty means "let the server pick the best direction". */
  fixedAzimuth: string;
  /** Kept from the active scenario; changed in the Comms tab. */
  criterion: Criterion | undefined;
}

export const EMPTY_FORM: SetupForm = {
  source: 'site',
  siteId: '',
  lat: '',
  lon: '',
  startDate: '',
  durationDays: String(DEFAULT_DURATION_DAYS),
  mastHeight: DEFAULT_MAST_HEIGHT_M,
  panelId: DEFAULT_PANEL_PROFILE_ID,
  fixedAzimuth: '',
  criterion: undefined,
};

/** Form values of an existing scenario, or of a partial one read from a link. */
export function formFromScenario(scenario: Partial<Scenario> | null): SetupForm {
  if (!scenario) return EMPTY_FORM;
  const custom = !scenario.site_id && scenario.lat_deg != null && scenario.lon_deg != null;
  const days =
    scenario.start_utc && scenario.end_utc ? scenarioDays(scenario as Scenario) : DEFAULT_DURATION_DAYS;
  return {
    source: custom ? 'custom' : 'site',
    siteId: scenario.site_id ?? '',
    lat: custom ? String(scenario.lat_deg) : '',
    lon: custom ? String(scenario.lon_deg) : '',
    startDate: scenario.start_utc ? utcToDate(scenario.start_utc) : '',
    durationDays: String(days > 0 ? days : DEFAULT_DURATION_DAYS),
    mastHeight: scenario.mast_height_m ?? DEFAULT_MAST_HEIGHT_M,
    panelId: scenario.panel_profile_id ?? DEFAULT_PANEL_PROFILE_ID,
    fixedAzimuth: scenario.fixed_azimuth_deg != null ? String(scenario.fixed_azimuth_deg) : '',
    criterion: scenario.earth_criterion,
  };
}

export interface FormCheck {
  scenario: Scenario | null;
  errors: Partial<Record<'site' | 'lat' | 'lon' | 'date' | 'duration' | 'panel' | 'azimuth', string>>;
  /** Converted longitude, shown when the user typed a value above 180. */
  convertedLon: number | null;
  /** Nearest valid start date when the date is outside the server's range. */
  dateSuggestion: string | null;
  place: ScenarioPlace | null;
}

export function checkForm(
  form: SetupForm,
  sites: readonly Site[],
  profiles: readonly PanelProfile[],
  range: DateRange | null,
): FormCheck {
  const errors: FormCheck['errors'] = {};
  let place: ScenarioPlace | null = null;
  let convertedLon: number | null = null;

  if (form.source === 'site') {
    const site = sites.find((s) => s.id === form.siteId);
    if (site) place = { kind: 'site', site };
    else errors.site = 'Choose a site.';
  } else {
    const lat = checkLatitude(form.lat);
    const lon = checkLongitude(form.lon);
    if (!lat.ok) errors.lat = lat.error;
    if (!lon.ok) errors.lon = lon.error;
    if (lon.ok && lon.value.converted) convertedLon = lon.value.value;
    if (lat.ok && lon.ok) place = { kind: 'custom', lat_deg: lat.value, lon_deg: lon.value.value };
  }

  const duration = checkDuration(form.durationDays);
  if (!duration.ok) errors.duration = duration.error;

  let dateSuggestion: string | null = null;
  let start: string | null = null;
  const date = checkStartDate(form.startDate, duration.ok ? duration.value : 1, range);
  if (date.ok) start = date.value;
  else {
    errors.date = date.error;
    dateSuggestion = date.suggestion;
  }

  const profile = profiles.find((p) => p.id === form.panelId);
  if (profiles.length > 0 && !profile) errors.panel = 'Choose a panel type.';

  let fixedAzimuth: number | null = null;
  if (profile?.type === 'vertical_fixed' && form.fixedAzimuth.trim() !== '') {
    const value = Number(form.fixedAzimuth);
    if (!Number.isFinite(value) || value < 0 || value >= 360) errors.azimuth = 'Direction must be between 0 and 360 degrees.';
    else fixedAzimuth = value;
  }

  const ok = place !== null && start !== null && duration.ok && Object.keys(errors).length === 0;
  const scenario = ok
    ? buildScenario({
        place: place!,
        start_utc: start!,
        days: duration.ok ? duration.value : DEFAULT_DURATION_DAYS,
        mast_height_m: form.mastHeight,
        panel_profile_id: form.panelId,
        ...(fixedAzimuth !== null ? { fixed_azimuth_deg: fixedAzimuth } : {}),
        ...(form.criterion !== undefined ? { earth_criterion: form.criterion } : {}),
      })
    : null;

  return { scenario, errors, convertedLon, dateSuggestion, place };
}

export const CATEGORY_LABEL: Record<Site['category'], string> = {
  apollo: 'Apollo',
  clps: 'CLPS',
  commercial: 'Commercial',
  international: 'International',
  artemis_candidate: '2024 Artemis III candidate study',
  test: 'Test site',
  custom: 'Custom',
};

export const PANEL_TYPE_LABEL: Record<PanelProfile['type'], string> = {
  horizontal: 'Flat on the ground',
  vertical_fixed: 'Vertical, fixed direction',
  vertical_tracking: 'Vertical, turns to the Sun',
  two_axis: 'Two-axis tracking',
};

export const STATUS_LABEL: Record<Site['status'], string> = {
  landed: 'Landed',
  landed_tipped: 'Landed, tipped over',
  crashed: 'Crashed',
  planned: 'Planned',
  candidate: 'Candidate',
  reference: 'Reference point',
};

/** Sites grouped by category, in the order of `CATEGORY_LABEL`, keeping the list order inside a group. */
export function groupSites(sites: readonly Site[]): { category: Site['category']; label: string; sites: Site[] }[] {
  return (Object.keys(CATEGORY_LABEL) as Site['category'][])
    .map((category) => ({ category, label: CATEGORY_LABEL[category], sites: sites.filter((s) => s.category === category) }))
    .filter((group) => group.sites.length > 0);
}
