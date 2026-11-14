import { postCompare } from '../../api/client';
import { getDataMode } from '../../api/config';
import type { CompareResponse, Scenario } from '../../api/types';

/**
 * One `/api/compare` answer per comparison list, shared by the Compare table and the Why cards,
 * so the same list is not computed twice. The request runs without the caller's abort signal,
 * because another panel may still wait for it; `useAsync` drops an answer that arrives after its
 * own signal was aborted. A failed request is forgotten, so the next call tries again.
 */

const MAX_ENTRIES = 8;
const cache = new Map<string, Promise<CompareResponse>>();

export function compareScenarios(scenarios: readonly Scenario[]): Promise<CompareResponse> {
  const key = `${getDataMode()}|${JSON.stringify(scenarios)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const request = postCompare({ scenarios: [...scenarios] });
  cache.set(key, request);
  request.catch(() => cache.delete(key));
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return request;
}

/** Empties the cache. Used by tests. */
export function clearCompareCache(): void {
  cache.clear();
}
