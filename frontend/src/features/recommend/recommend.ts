/**
 * Site recommendation (issue #109; #97, section 4.4; docs/design/saha-puani.md).
 *
 * The server ranks; this file only builds the request, keeps the server's order, names the
 * components and turns fractions into percent. It never computes or reorders a score.
 */

import type {
  PsrPreference,
  RankedSite,
  RecommendLimits,
  RecommendMetric,
  RecommendRequest,
  RecommendResponse,
  RecommendWeights,
  Scenario,
  ScoreComponent,
} from '../../api/types';
import type { RecommendStore } from '../../state/recommend-store';
import { scenarioIdFor } from '../../state/scenario-tools';

/** Weights of the #97 example request: the user changes them. */
export const DEFAULT_WEIGHTS: RecommendWeights = { sunlit: 1, dark: 1, earth: 1, slope: 1, roughness: 0.5, psr_distance: 0 };

/**
 * 12 degrees is the one limit with a source: the Apollo lunar module's largest landing slope
 * (docs/research/dogrulama/gorev-araclari.md, No 89). Other vehicles may differ.
 */
export const DEFAULT_LIMITS: RecommendLimits = { max_slope_deg: 12 };
export const SLOPE_LIMIT_SOURCE = 'Apollo lunar module landing slope limit (validation table, gorev-araclari No 89)';

export const DEFAULT_PSR: PsrPreference = 'far';

export const WEIGHT_KEYS = ['sunlit', 'dark', 'earth', 'slope', 'roughness', 'psr_distance'] as const;
export type WeightKey = (typeof WEIGHT_KEYS)[number];

export const WEIGHT_LABEL: Record<WeightKey, string> = {
  sunlit: 'Sunlit time',
  dark: 'Short longest dark',
  earth: 'Earth in view',
  slope: 'Gentle slope',
  roughness: 'Smooth ground',
  psr_distance: 'Distance to permanent shadow',
};

export const PSR_LABEL: Record<PsrPreference, string> = {
  near: 'Near (science, ice)',
  far: 'Far (power)',
};

export interface MetricView {
  label: string;
  /** Fractions are shown in percent; the only arithmetic here. */
  percent: boolean;
  unit: string;
  decimals: number;
}

export const METRIC_VIEW: Record<RecommendMetric, MetricView> = {
  sunlit_fraction: { label: 'Sunlit time', percent: true, unit: '%', decimals: 1 },
  longest_dark_hours: { label: 'Longest dark', percent: false, unit: 'h', decimals: 1 },
  earth_visible_fraction: { label: 'Earth in view', percent: true, unit: '%', decimals: 1 },
  mean_slope_deg: { label: 'Mean slope', percent: false, unit: '°', decimals: 1 },
  slope_std_deg: { label: 'Roughness (slope spread)', percent: false, unit: '°', decimals: 1 },
  distance_to_psr_km: { label: 'Distance to permanent shadow', percent: false, unit: 'km', decimals: 1 },
};

/** Notes shown with every result (#109, item 2; #97, section 3). */
export const ALWAYS_NOTES = [
  'The score ranks the sites for the weights you chose. It does not certify a site or guarantee a safe landing.',
  'The weights are your choice; other weights give another order.',
  'Rocks and small craters are not in the data: the maps have 20 m cells.',
] as const;

export interface RecommendForm {
  weights: RecommendWeights;
  limits: RecommendLimits;
  psr_preference: PsrPreference;
  include_catalogue_sites: boolean;
}

export const DEFAULT_FORM: RecommendForm = {
  weights: DEFAULT_WEIGHTS,
  limits: DEFAULT_LIMITS,
  psr_preference: DEFAULT_PSR,
  include_catalogue_sites: true,
};

/** The request for the active scenario: its period and mast height, the form's weights and limits. */
export function buildRequest(active: Scenario, form: RecommendForm): RecommendRequest {
  return {
    region: 'mons-mouton',
    start_utc: active.start_utc,
    end_utc: active.end_utc,
    mast_height_m: active.mast_height_m ?? 2,
    weights: { ...form.weights },
    limits: { ...form.limits },
    psr_preference: form.psr_preference,
    include_catalogue_sites: form.include_catalogue_sites,
  };
}

/** Ranked sites and eliminated ones, each in the server's order. */
export function splitRanked(response: RecommendResponse): { kept: RankedSite[]; eliminated: RankedSite[] } {
  return {
    kept: response.ranked.filter((r) => !r.eliminated),
    eliminated: response.ranked.filter((r) => r.eliminated),
  };
}

/** Why a site was left out, from the limits the server names. */
export function eliminatedReason(site: RankedSite, limits: RecommendLimits): string {
  const reasons = site.eliminated_by.map((limit) =>
    limit === 'max_slope_deg' ? `slope above the ${limits.max_slope_deg}° limit` : limit.replaceAll('_', ' '),
  );
  return reasons.length > 0 ? `Eliminated: ${reasons.join(', ')}.` : 'Eliminated.';
}

/** A component value as text, with its unit; `—` when the server gave none. */
export function componentText(c: ScoreComponent): string {
  const view = METRIC_VIEW[c.metric];
  if (c.value === null) return '—';
  const shown = view.percent ? c.value * 100 : c.value;
  return view.unit === '°' ? `${shown.toFixed(view.decimals)}°` : `${shown.toFixed(view.decimals)} ${view.unit}`;
}

/**
 * The scenario "Use this site" opens: the ranked site in place of the active one, with the same
 * period, mast, panel and criterion, so only the place changes.
 */
export function siteScenario(active: Scenario, site: Pick<RankedSite, 'site_id' | 'name'>): Scenario {
  const base: Omit<Scenario, 'scenario_id' | 'label'> = {
    site_id: site.site_id,
    lat_deg: null,
    lon_deg: null,
    start_utc: active.start_utc,
    end_utc: active.end_utc,
    mast_height_m: active.mast_height_m,
    panel_profile_id: active.panel_profile_id,
  };
  if (active.fixed_azimuth_deg != null) base.fixed_azimuth_deg = active.fixed_azimuth_deg;
  if (active.earth_criterion !== undefined) base.earth_criterion = active.earth_criterion;
  return { scenario_id: scenarioIdFor(base), label: `${site.name}, ${active.start_utc.slice(0, 10)}`, ...base };
}

/** The top three ranked sites that were not eliminated, in the server's order. */
export function topThree(response: RecommendResponse): RankedSite[] {
  return splitRanked(response).kept.slice(0, 3);
}

/**
 * Asks the server for a ranking and stores it. A failure (for example every weight at zero, which
 * the server refuses) is returned for the panel to show, and the previous ranking stays.
 */
export async function runRanking(
  active: Scenario,
  form: RecommendForm,
  post: (body: RecommendRequest) => Promise<RecommendResponse>,
  store: Pick<RecommendStore, 'setRanked'>,
): Promise<RankingResult> {
  return createRanker(post, store)(active, form);
}

export type RankingResult = { ok: true } | { ok: false; error: unknown } | { ok: false; stale: true };

/**
 * A ranking runner with a request counter, as the candidate load has (PR #116 review): when the
 * user ranks again before an answer arrives, only the newest answer is stored; an older one that
 * arrives later is dropped and reported as `stale`.
 */
export function createRanker(
  post: (body: RecommendRequest) => Promise<RecommendResponse>,
  store: Pick<RecommendStore, 'setRanked'>,
): (active: Scenario, form: RecommendForm) => Promise<RankingResult> {
  let latest = 0;
  return async (active, form) => {
    latest += 1;
    const mine = latest;
    const request = buildRequest(active, form);
    try {
      const response = await post(request);
      if (mine !== latest) return { ok: false, stale: true };
      store.setRanked(response, request);
      return { ok: true };
    } catch (error) {
      if (mine !== latest) return { ok: false, stale: true };
      return { ok: false, error };
    }
  };
}

/**
 * Whether a ranking was made for another period or mast than the active scenario (PR #116
 * review): its scores then belong to that request, not to what the setup shows now.
 */
export function rankingIsStale(request: RecommendRequest | null, active: Scenario | null): boolean {
  if (!request || !active) return false;
  return (
    request.start_utc !== active.start_utc || request.end_utc !== active.end_utc || request.mast_height_m !== (active.mast_height_m ?? 2)
  );
}
