/**
 * Candidate regions and the last site recommendation (issue #108; #97, section 4.3 and 4.4).
 * The map, the globe and the 3D terrain draw their markers from here; the recommendation panel
 * (#109) writes the ranked answer. Nothing is computed here: the lists are the server's answers.
 */

import { getCandidates, type CandidatesParams, type RequestOptions } from '../api/client';
import type { Candidate, CandidateList, LayerRegion, RecommendRequest, RecommendResponse } from '../api/types';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RecommendState {
  /** `/api/candidates` answer, or `null` before it has loaded. */
  candidates: CandidateList | null;
  candidatesStatus: LoadStatus;
  candidatesError: unknown;
  /** Last `/api/recommend` answer, in the server's order, and the request that produced it. */
  ranked: RecommendResponse | null;
  rankedRequest: RecommendRequest | null;
}

export const EMPTY_RECOMMEND_STATE: RecommendState = {
  candidates: null,
  candidatesStatus: 'idle',
  candidatesError: undefined,
  ranked: null,
  rankedRequest: null,
};

export interface RecommendStore {
  getState(): RecommendState;
  /** Returns a function that removes the listener. */
  subscribe(listener: () => void): () => void;
  /**
   * Loads the candidate regions of a region. A later call wins: the answer of an earlier call
   * that arrives after it is dropped, so a slow request never overwrites a newer list.
   */
  loadCandidates(region?: LayerRegion, options?: RequestOptions): Promise<void>;
  /** Stores a recommendation answer as it came from the server; `null` clears it. */
  setRanked(response: RecommendResponse | null, request?: RecommendRequest | null): void;
}

type CandidatesFetcher = (params: CandidatesParams, options?: RequestOptions) => Promise<CandidateList>;

export function createRecommendStore(fetchCandidates: CandidatesFetcher = getCandidates): RecommendStore {
  let state = EMPTY_RECOMMEND_STATE;
  let loads = 0;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<RecommendState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async loadCandidates(region, options) {
      loads += 1;
      const mine = loads;
      set({ candidatesStatus: 'loading', candidatesError: undefined });
      try {
        const list = await fetchCandidates(region ? { region } : {}, options);
        if (mine === loads) set({ candidates: list, candidatesStatus: 'ready' });
      } catch (error) {
        if (mine === loads) set({ candidatesStatus: 'error', candidatesError: error });
      }
    },
    setRanked(response, request = null) {
      set({ ranked: response, rankedRequest: response ? request : null });
    },
  };
}

/** The application-wide store. */
export const recommendStore: RecommendStore = createRecommendStore();

/** Candidate ids look like `cand-01` (#97, section 4.3). */
export function isCandidateId(id: string | null | undefined): boolean {
  return typeof id === 'string' && /^cand-\d+$/.test(id);
}

/** The loaded candidate with this id, if any. */
export function candidateById(state: RecommendState, id: string): Candidate | undefined {
  return state.candidates?.candidates.find((c) => c.id === id);
}

/**
 * Place ids a picker may offer: the loaded catalogue sites and the loaded candidate regions.
 * Candidate ids are valid `site_id` values on every location endpoint (#97, section 4.3), so the
 * "only what is loaded" rule of the site picker extends to them.
 */
export function knownPlaceIds(siteIds: readonly string[], state: RecommendState): string[] {
  const candidates = state.candidates?.candidates.map((c) => c.id) ?? [];
  return [...siteIds, ...candidates.filter((id) => !siteIds.includes(id))];
}
