import type { CandidateList } from '../../api/types';

export interface TerrainAvailability {
  enabled: boolean;
  /** Why the view is off; `null` when it is on. */
  reason: string | null;
}

/**
 * The view needs a selected site or candidate region inside the map region. The region's
 * entries are the server's `/api/candidates` list (candidates and the catalogue sites inside it),
 * so no region bounds are written here.
 */
export function terrainAvailability(selectedId: string | null, candidates: CandidateList | null): TerrainAvailability {
  if (!candidates) return { enabled: false, reason: 'The region list (/api/candidates) is not loaded yet.' };
  if (!selectedId) return { enabled: false, reason: 'Choose a site or candidate region inside the south pole region.' };
  if (!candidates.candidates.some((c) => c.id === selectedId)) {
    return { enabled: false, reason: 'The selected place is outside the south pole region; 3D terrain covers that region only.' };
  }
  return { enabled: true, reason: null };
}
