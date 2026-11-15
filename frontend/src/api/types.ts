/**
 * Types for every structure in the data contract (docs/adr/0003-veri-sozlesmesi.md)
 * and the API endpoints (docs/adr/0004-api-uc-noktalari.md).
 *
 * Field names follow the contract exactly: lower case with underscores, angles end in
 * `_deg`, times are ISO 8601 UTC strings ending in `Z`. A value the server does not know
 * is `null`; the field is still present. Fields marked optional (`?`) belong to extra
 * features and only appear when that feature is built.
 *
 * No React, no Vite: this file compiles on its own.
 */

/** ISO 8601 UTC time ending in `Z`, for example `2026-12-01T00:00:00Z`. */
export type UtcString = string;

// ---------------------------------------------------------------------------
// Closed value sets. The arrays are exported so code and checks can list them.
// ---------------------------------------------------------------------------

/** Lowest to highest. A result built from several inputs takes the lowest label. */
export const VALIDITY_VALUES = ['SYNTHETIC', 'DERIVED', 'MODEL', 'MEASURED'] as const;
export type Validity = (typeof VALIDITY_VALUES)[number];

export const SITE_CATEGORIES = [
  'apollo',
  'clps',
  'commercial',
  'international',
  'artemis_candidate',
  'test',
  'custom',
] as const;
export type SiteCategory = (typeof SITE_CATEGORIES)[number];

export const SITE_STATUSES = [
  'landed',
  'landed_tipped',
  'crashed',
  'planned',
  'candidate',
  'reference',
] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

export const HORIZON_METHODS = ['terrain', 'sphere'] as const;
export type HorizonMethod = (typeof HORIZON_METHODS)[number];

export const EVENT_TYPES = [
  'sunrise',
  'sunset',
  'earthrise',
  'earthset',
  'eclipse_start',
  'eclipse_end',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const WINDOW_KINDS = ['sunlit', 'dark', 'earth_visible', 'earth_hidden'] as const;
export type WindowKind = (typeof WINDOW_KINDS)[number];

/** How a disk counts as above the horizon. Default for Earth: `center`. */
export const CRITERIA = ['center', 'first_limb', 'full_disk'] as const;
export type Criterion = (typeof CRITERIA)[number];
export const DEFAULT_EARTH_CRITERION: Criterion = 'center';

export const PANEL_TYPES = ['horizontal', 'vertical_fixed', 'vertical_tracking', 'two_axis'] as const;
export type PanelType = (typeof PANEL_TYPES)[number];

/** Extra feature: docs/design/role-etiketi.md */
export const RELAY_STATUSES = ['not_required', 'intermittent', 'required', 'unknown'] as const;
export type RelayStatus = (typeof RELAY_STATUSES)[number];

/**
 * Evidence level of a past-mission fact (docs/design/gecmis-gorev-vakalari.md, "Kanıt düzeyi
 * etiketi"): official report, preliminary statement, third-party commentary.
 */
export const EVIDENCE_LEVELS = ['official', 'preliminary', 'commentary'] as const;
export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number];

/** Map layers (ADR-0004, "Harita katmanı adları"). */
export const LAYER_NAMES = ['hillshade', 'elevation', 'slope', 'psr'] as const;
export type LayerName = (typeof LAYER_NAMES)[number];

/** The only region in the first release. */
export const LAYER_REGIONS = ['mons-mouton'] as const;
export type LayerRegion = (typeof LAYER_REGIONS)[number];

/** Server error codes (ADR-0004, "Hata kodları"). */
export const SERVER_ERROR_CODES = [
  'site_not_found',
  'invalid_parameter',
  'date_out_of_range',
  'too_many_scenarios',
  'data_unavailable',
] as const;
export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number];

/** `/api/compare` takes at least this many scenarios, each with a different `scenario_id` (ADR-0004, "Sınırlar"). */
export const MIN_COMPARE_SCENARIOS = 2;
/** `/api/compare` takes at most this many scenarios (ADR-0004, "Sınırlar"). */
export const MAX_COMPARE_SCENARIOS = 4;

const VALIDITY_RANK: Record<Validity, number> = { SYNTHETIC: 0, DERIVED: 1, MODEL: 2, MEASURED: 3 };

/** The lowest of several validity labels (ADR-0003, rule 4). */
export function lowestValidity(first: Validity, ...rest: Validity[]): Validity {
  return rest.reduce((low, v) => (VALIDITY_RANK[v] < VALIDITY_RANK[low] ? v : low), first);
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

export interface SourceRef {
  label: string;
  url: string | null;
}

/** Extra feature: info cards on a site (docs/design/csa-bilgi-kartlari.md). */
export interface InfoCard {
  agency: string;
  text: string;
  source: SourceRef;
}

// ---------------------------------------------------------------------------
// Site (`/api/sites`)
// ---------------------------------------------------------------------------

export interface Site {
  /** Lower case with hyphens, for example `im2-athena`. */
  id: string;
  name: string;
  category: SiteCategory;
  /** ME frame, degrees. */
  lat_deg: number;
  /** ME frame, degrees, east positive, between -180 and 180. */
  lon_deg: number;
  /** Metres above the 1737.4 km sphere. */
  elevation_m: number | null;
  landing_utc: UtcString | null;
  status: SiteStatus;
  coordinate_source: SourceRef;
  validity: Validity;
  notes: string | null;
  cards?: InfoCard[];
}

// ---------------------------------------------------------------------------
// Horizon profile (`/api/horizon`)
// ---------------------------------------------------------------------------

export interface DemInfo {
  product: string;
  resolution_m: number;
  url: string | null;
}

export interface HorizonProfile {
  lat_deg: number;
  lon_deg: number;
  site_id: string | null;
  mast_height_m: number;
  /** Always 0.5. */
  azimuth_step_deg: number;
  /** 720 values. First value is north, then eastwards. */
  horizon_deg: number[];
  method: HorizonMethod;
  max_range_km: number | null;
  dem: DemInfo | null;
  /** `DERIVED` for terrain, `SYNTHETIC` for sphere. */
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Sky series (`/api/sky-series`)
// ---------------------------------------------------------------------------

export interface SunSample {
  azimuth_true_deg: number;
  elevation_deg: number;
  /** Horizon angle in the direction of the Sun. */
  horizon_deg: number;
  /** Part of the disk above the horizon: 0 none, 1 all. */
  visible_fraction: number;
  range_au: number | null;
  radius_deg: number | null;
}

export interface EarthSample {
  azimuth_true_deg: number;
  elevation_deg: number;
  horizon_deg: number;
  visible_fraction: number;
  range_km: number | null;
  radius_deg: number | null;
}

export interface SkySample {
  utc: UtcString;
  sun: SunSample;
  earth: EarthSample;
}

export interface EphemerisInfo {
  /** For example `SPICE DE440`. */
  source: string;
  /** `MOON_ME`. */
  frame: string;
  /** `LT+S`. */
  correction: string;
}

export interface SkySeries {
  lat_deg: number;
  lon_deg: number;
  mast_height_m: number;
  start_utc: UtcString;
  step_minutes: number;
  /** Both ends included: `hours` 24 with `step_minutes` 60 gives 25 samples. */
  samples: SkySample[];
  ephemeris: EphemerisInfo;
  horizon: { method: HorizonMethod; validity: Validity };
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Events, windows and metrics (`/api/events`)
// ---------------------------------------------------------------------------

export interface SkyEvent {
  type: EventType;
  utc: UtcString;
  /**
   * Sensitivity range: the event time with the horizon moved one arc minute down and up.
   * Not a confidence interval. `null` when it could not be computed.
   */
  utc_earliest: UtcString | null;
  utc_latest: UtcString | null;
  criterion: Criterion;
  /** Extra feature: eclipse events only (docs/design/tutulmalar.md). */
  max_obscured_fraction?: number | null;
}

export interface EventWindow {
  kind: WindowKind;
  start_utc: UtcString;
  end_utc: UtcString;
  duration_hours: number;
}

export interface EventMetrics {
  sunlit_fraction: number | null;
  longest_dark_hours: number | null;
  max_sun_elevation_deg: number | null;
  earth_visible_fraction: number | null;
  longest_earth_hidden_hours: number | null;
}

/** Extra feature fields: docs/design/role-etiketi.md */
export interface RelayFields {
  relay_status?: RelayStatus;
  relay_required?: boolean;
}

export interface EventList extends RelayFields {
  events: SkyEvent[];
  windows: EventWindow[];
  metrics: EventMetrics;
  mast_height_m: number;
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Now status (`/api/now`)
// ---------------------------------------------------------------------------

export interface NowStatus {
  utc: UtcString;
  sun_up: boolean | null;
  hours_to_sunset: number | null;
  hours_to_sunrise: number | null;
  earth_up: boolean | null;
  hours_to_earthset: number | null;
  hours_to_earthrise: number | null;
  /** Length of the current dark window if the Sun is down, otherwise of the next one. */
  night_hours: number | null;
  /** Criterion used for the Earth fields. */
  criterion: Criterion;
  mast_height_m: number;
  /** `true` when an event was not found within the searched time. */
  search_limited: boolean;
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Communication window (`/api/comm-window`). Durations in minutes.
// ---------------------------------------------------------------------------

export interface CommWindow extends RelayFields {
  utc: UtcString;
  lat_deg: number;
  lon_deg: number;
  mast_height_m: number;
  visible_now: boolean;
  minutes_remaining: number | null;
  minutes_until_visible: number | null;
  next_change_utc: UtcString | null;
  search_limited: boolean;
  searched_hours: number;
  earth_elevation_deg: number | null;
  earth_azimuth_true_deg: number | null;
  horizon_deg: number;
  criterion: Criterion;
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Panel profiles (`/api/panel-profiles`) and power (`/api/power`)
// ---------------------------------------------------------------------------

export interface PanelProfile {
  /** For example `vertical_tracking`. */
  id: string;
  type: PanelType;
  area_m2: number;
  /** Between 0 and 1. */
  efficiency: number;
  /** Only for `vertical_fixed`. */
  fixed_azimuth_deg: number | null;
  mast_height_m: number;
  /** `SYNTHETIC` for the default values. */
  validity: Validity;
}

export interface PowerSample {
  utc: UtcString;
  incidence_cos: number;
  sun_visible_fraction: number;
  irradiance_w_m2: number;
  power_w: number;
}

export interface PowerSummary {
  mean_power_w: number | null;
  energy_kwh: number | null;
  sunlit_fraction: number | null;
  longest_dark_hours: number | null;
}

export interface PowerSeries {
  panel_profile_id: string;
  mast_height_m: number;
  /** Panel direction used; only for `vertical_fixed`, otherwise `null`. */
  fixed_azimuth_deg: number | null;
  samples: PowerSample[];
  summary: PowerSummary;
  /** Lower of the panel profile and the horizon profile. */
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Scenario and comparison (`/api/compare`)
// ---------------------------------------------------------------------------

/**
 * A scenario names either a catalogue site (`site_id`) or custom coordinates
 * (`lat_deg` and `lon_deg`); the unused fields are `null`.
 */
export interface Scenario {
  scenario_id: string;
  label: string;
  site_id: string | null;
  lat_deg: number | null;
  lon_deg: number | null;
  start_utc: UtcString;
  end_utc: UtcString;
  /** `null` falls back to the panel profile, then to 2 m (ADR-0003, "Direk yüksekliği kuralı"). */
  mast_height_m: number | null;
  panel_profile_id: string;
  /** Only for a `vertical_fixed` panel. */
  fixed_azimuth_deg?: number | null;
  /** Default `center`. */
  earth_criterion?: Criterion;
}

export interface CompareRequest {
  scenarios: Scenario[];
}

export interface CompareMetrics extends EventMetrics {
  mean_power_w: number | null;
}

export type CompareMetricName = keyof CompareMetrics;

export interface CompareScenarioResult {
  scenario: Scenario;
  metrics: CompareMetrics;
  now: NowStatus | null;
  validity: Validity;
}

export interface CompareDelta {
  metric: CompareMetricName;
  /** Keyed by `scenario_id`. */
  values: Record<string, number | null>;
  unit: string;
  best_scenario_id: string | null;
}

export interface CompareResponse {
  scenarios: CompareScenarioResult[];
  deltas: CompareDelta[];
}

// ---------------------------------------------------------------------------
// Past missions (`/api/reference-missions`), docs/design/gecmis-gorev-vakalari.md
// ---------------------------------------------------------------------------

export interface MissionFact {
  text: string;
  evidence: EvidenceLevel;
  source: SourceRef;
}

export interface ReferenceMission {
  id: string;
  mission: string;
  site_id: string;
  landing_utc: UtcString;
  /** How reliable `landing_utc` is. */
  landing_utc_validity: Validity;
  outcome: SiteStatus;
  /** Angles at `landing_utc`, sphere at 0 m, no terrain. */
  expected: {
    sun_elevation_deg: number | null;
    sun_azimuth_true_deg: number | null;
    earth_elevation_deg: number | null;
  };
  facts: MissionFact[];
}

// ---------------------------------------------------------------------------
// Plan 2 endpoints (issue #97, section 4): body positions, ground stations and Earth link,
// candidate regions, site recommendation. Field names follow #97 exactly.
// ---------------------------------------------------------------------------

/** Sub-solar and sub-Earth points on the Moon at one instant (`MOON_ME`, ADR-0002). */
export interface BodySample {
  utc: UtcString;
  sub_solar_lat_deg: number;
  sub_solar_lon_deg: number;
  sub_earth_lat_deg: number;
  sub_earth_lon_deg: number;
  earth_distance_km: number;
}

/** `GET /api/body-series`. */
export interface BodySeries {
  frame: string;
  samples: BodySample[];
  validity: Validity;
}

/** `GET /api/ground-stations`: one Earth station; coordinates are given with their source. */
export interface GroundStation {
  id: string;
  name: string;
  lat_deg: number;
  lon_deg: number;
  elevation_m: number;
  source: SourceRef;
  validity: Validity;
}

/**
 * `direct`: Earth is in view from the site and at least one station sees the Moon.
 * `no_station`: Earth is in view, but no station sees the Moon.
 * `relay_needed`: Earth is not in view from the site. No relay satellite is modelled.
 */
export const LINK_MODES = ['direct', 'no_station', 'relay_needed'] as const;
export type LinkMode = (typeof LINK_MODES)[number];

export interface TimeWindow {
  start_utc: UtcString;
  end_utc: UtcString;
}

export interface StationLink {
  id: string;
  name: string;
  /** Share of the period in which the station sees the Moon. */
  in_view_fraction: number;
  windows: TimeWindow[];
}

export interface LinkWindow extends TimeWindow {
  mode: LinkMode;
  station_ids: string[];
}

/** `GET /api/earth-link`. */
export interface EarthLink {
  min_station_elevation_deg: number;
  stations: StationLink[];
  link_windows: LinkWindow[];
  assumptions: string[];
  validity: Validity;
}

/** How the candidate regions were found (`GET /api/candidates`). */
export interface CandidateMethod {
  window_m: number;
  slope_limit_deg: number;
  min_separation_km: number;
  source: string;
}

/** `candidate`: a region found in the elevation maps. `catalogue`: a catalogue site listed with them (#97, 4.3). */
export const CANDIDATE_KINDS = ['candidate', 'catalogue'] as const;
export type CandidateKind = (typeof CANDIDATE_KINDS)[number];

/** A candidate region. Its id (`cand-NN`) is a valid `site_id` on every location endpoint. */
export interface Candidate {
  id: string;
  kind: CandidateKind;
  name: string;
  lat_deg: number;
  lon_deg: number;
  elevation_m: number;
  mean_slope_deg: number;
  max_slope_deg: number;
  slope_std_deg: number;
  safe_cell_fraction: number;
  psr_fraction: number;
  distance_to_psr_km: number;
  has_terrain_horizon: boolean;
  validity: Validity;
}

/** `GET /api/candidates`. */
export interface CandidateList {
  region: LayerRegion;
  method: CandidateMethod;
  candidates: Candidate[];
  validity: Validity;
}

export const PSR_PREFERENCES = ['near', 'far'] as const;
export type PsrPreference = (typeof PSR_PREFERENCES)[number];

export interface RecommendWeights {
  sunlit: number;
  dark: number;
  earth: number;
  slope: number;
  roughness: number;
  psr_distance: number;
}

export interface RecommendLimits {
  max_slope_deg: number;
}

/** `POST /api/recommend` body. */
export interface RecommendRequest {
  region: LayerRegion;
  start_utc: UtcString;
  end_utc: UtcString;
  mast_height_m: number;
  weights: RecommendWeights;
  limits: RecommendLimits;
  psr_preference: PsrPreference;
  include_catalogue_sites: boolean;
}

/** Measures a recommendation score is built from (#97, section 4.4). */
export const RECOMMEND_METRICS = [
  'sunlit_fraction',
  'longest_dark_hours',
  'earth_visible_fraction',
  'mean_slope_deg',
  'slope_std_deg',
  'distance_to_psr_km',
] as const;
export type RecommendMetric = (typeof RECOMMEND_METRICS)[number];

export interface ScoreComponent {
  metric: RecommendMetric;
  value: number | null;
  unit: string;
  /** 0 to 1, as the server scaled it. */
  normalized: number | null;
  weight: number;
  validity: Validity;
}

export interface RankedSite {
  site_id: string;
  name: string;
  lat_deg: number;
  lon_deg: number;
  /** `null` for an eliminated site. */
  score: number | null;
  eliminated: boolean;
  /** Limits that eliminated the site, for example `max_slope_deg`. */
  eliminated_by: string[];
  components: ScoreComponent[];
  validity: Validity;
}

/** `POST /api/recommend` answer, in the server's order. */
export interface RecommendResponse {
  ranked: RankedSite[];
  weights: RecommendWeights;
  limits: RecommendLimits;
  assumptions: string[];
  validity: Validity;
}

// ---------------------------------------------------------------------------
// Validation report (`/api/validation`), ADR-0004 "/api/validation"
// ---------------------------------------------------------------------------

export const VALIDATION_STATUSES = ['pass', 'warn', 'fail', 'skipped', 'info'] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

/** `reference`: test with a threshold. `approximate`: comparison without one (T6 only). */
export const VALIDATION_KINDS = ['reference', 'approximate'] as const;
export type ValidationKind = (typeof VALIDATION_KINDS)[number];

export interface ValidationRow {
  id: string;
  /** `T1` to `T7`. */
  test: string;
  title: string;
  condition: string;
  kind: ValidationKind;
  /** A number, or a UTC time for event rows; `null` when only `expected_range` is given. */
  expected: number | string | null;
  measured: number | string | null;
  /** Measured minus expected, in `unit`. */
  diff: number | null;
  /** `null` on `approximate` rows and on range rows. */
  threshold: number | null;
  unit: string;
  status: ValidationStatus;
  /** Validation table row or document the expected value comes from. */
  source: string;
  /** Endpoint that produced the measured value; `null` for unit-test rows (T3) and T6. */
  endpoint: string | null;
  note: string | null;
  /** `[low, high]`; either end may be `null`. */
  expected_range?: [number | null, number | null];
}

export interface ValidationReport {
  generated_utc: UtcString;
  /** Where the run was made, for example `in-process`. */
  target: string;
  summary: Record<ValidationStatus, number>;
  rows: ValidationRow[];
}

// ---------------------------------------------------------------------------
// Health (`/api/health`) and error body
// ---------------------------------------------------------------------------

export interface Health {
  ok: boolean;
  kernels_loaded: boolean;
  dem_available: boolean;
  layers_available?: boolean;
  /** Dates the server can compute; outside it the server answers `date_out_of_range`. */
  ephemeris_range: { start_utc: UtcString | null; end_utc: UtcString | null };
}

export interface ApiErrorBody {
  error: { code: ServerErrorCode | string; message: string };
}

// ---------------------------------------------------------------------------
// Map layers (`/api/layers/{name}`): decoded form, see layers.ts
// ---------------------------------------------------------------------------

/** Grid bounds in metres in the south polar projection of the elevation maps. */
export interface LayerBounds {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface LayerGrid {
  name: string;
  rows: number;
  cols: number;
  /** Row-major, `rows * cols` values; missing cells are `NaN`. */
  values: Float32Array;
  min: number | null;
  max: number | null;
  resolution_m: number | null;
  validity: Validity | null;
  /** Count of `NaN` cells, not a sentinel value. */
  nodata_count: number | null;
  downsample: number | null;
  bounds: LayerBounds | null;
}

// ---------------------------------------------------------------------------
// Request parameters
// ---------------------------------------------------------------------------

/** Catalogue site or custom coordinates (ADR-0004, "Konum parametreleri"). */
export type LocationParams = { site_id: string } | { lat_deg: number; lon_deg: number };

export type WithMast = { mast_height_m?: number };
