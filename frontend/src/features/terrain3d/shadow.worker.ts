/**
 * Background worker for the visibility maps of the 3D terrain, so that the walk over the height
 * maps never blocks the timeline. It holds the prepared terrain and answers one request at a time.
 */

import type { LayerGrid } from '../../api/types';
import { prepareTerrain, visibilityMap, type MeshCells, type ShadowTerrain, type SkyBody } from './shadow';

export type ShadowRequest =
  | { kind: 'terrain'; grids: LayerGrid[] }
  | { kind: 'compute'; id: number; cells: MeshCells; sun: SkyBody | null; earth: SkyBody | null };

export interface ShadowAnswer {
  id: number;
  sun: Float32Array | null;
  earth: Float32Array | null;
  /** Time the walk took, milliseconds. */
  ms: number;
}

/** The work itself, shared by the worker and the fallback that runs on the page. */
export function answer(terrain: ShadowTerrain, grid: LayerGrid, request: Extract<ShadowRequest, { kind: 'compute' }>): ShadowAnswer {
  const t0 = performance.now();
  const sun = request.sun ? visibilityMap(terrain, grid, request.cells, request.sun) : null;
  const earth = request.earth ? visibilityMap(terrain, grid, request.cells, request.earth) : null;
  return { id: request.id, sun, earth, ms: performance.now() - t0 };
}

interface WorkerScope {
  onmessage: ((event: MessageEvent<ShadowRequest>) => void) | null;
  postMessage: (message: ShadowAnswer, transfer: Transferable[]) => void;
}

// Only inside a worker: the module is also imported by the page for `answer`.
if (typeof document === 'undefined' && typeof self !== 'undefined' && 'postMessage' in self) {
  const scope = self as unknown as WorkerScope;
  let terrain: ShadowTerrain | null = null;
  let grid: LayerGrid | null = null;
  scope.onmessage = (event) => {
    const message = event.data;
    if (message.kind === 'terrain') {
      grid = message.grids[0] ?? null;
      terrain = prepareTerrain(message.grids);
      return;
    }
    if (!terrain || !grid) return;
    const result = answer(terrain, grid, message);
    const transfer: Transferable[] = [];
    if (result.sun) transfer.push(result.sun.buffer);
    if (result.earth) transfer.push(result.earth.buffer);
    scope.postMessage(result, transfer);
  };
}
