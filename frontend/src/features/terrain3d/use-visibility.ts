import { useEffect, useRef, useState } from 'react';
import type { LayerGrid } from '../../api/types';
import { prepareTerrain, type MeshCells, type SkyBody } from './shadow';
import { answer, type ShadowAnswer, type ShadowRequest } from './shadow.worker';

export interface VisibilityMaps {
  /** Share of the Sun's disk each vertex sees; `null` until the first answer for this Sun. */
  sun: Float32Array | null;
  /** Share of the Earth's disk each vertex sees. */
  earth: Float32Array | null;
  /** An answer for the current bodies is still being worked out. */
  busy: boolean;
  /** Time the last answer took, milliseconds. */
  ms: number | null;
}

const NONE: VisibilityMaps = { sun: null, earth: null, busy: false, ms: null };

const sameBody = (a: SkyBody | null, b: SkyBody | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.direction.x === b.direction.x &&
    a.direction.y === b.direction.y &&
    a.direction.z === b.direction.z &&
    a.distance_m === b.distance_m &&
    a.radius_deg === b.radius_deg);

/**
 * Visibility maps of the mesh for the Sun and the Earth, worked out off the page in a worker.
 * `grids` is the height data, finest first; its first grid is the one the mesh was built from.
 * While the timeline plays only the newest request is kept: an answer that is already out of
 * date is dropped and the latest bodies are asked for next.
 */
export function useVisibilityMaps(grids: readonly LayerGrid[] | null, cells: MeshCells | null, sun: SkyBody | null, earth: SkyBody | null): VisibilityMaps {
  const [maps, setMaps] = useState<VisibilityMaps>(NONE);
  const workerRef = useRef<Worker | null>(null);
  const state = useRef({ nextId: 1, running: 0, wanted: null as { sun: SkyBody | null; earth: SkyBody | null } | null, shown: null as { sun: SkyBody | null; earth: SkyBody | null } | null });
  const sendRef = useRef<() => void>(() => undefined);

  // One worker per terrain; without Worker support the same code runs on the page.
  useEffect(() => {
    setMaps(NONE);
    state.current = { nextId: 1, running: 0, wanted: null, shown: null };
    if (!grids || grids.length === 0 || !cells) {
      sendRef.current = () => undefined;
      return;
    }
    const list = [...grids];
    const first = list[0]!;
    let closed = false;
    const finish = (result: ShadowAnswer) => {
      if (closed) return;
      const s = state.current;
      if (result.id !== s.running) return;
      s.running = 0;
      const asked = s.shown;
      const stale = s.wanted !== null && asked !== null && !(sameBody(s.wanted.sun, asked.sun) && sameBody(s.wanted.earth, asked.earth));
      setMaps({ sun: result.sun, earth: result.earth, busy: stale, ms: result.ms });
      if (stale) sendRef.current();
    };

    let worker: Worker | null = null;
    let local: ReturnType<typeof prepareTerrain> | null = null;
    if (typeof Worker !== 'undefined') {
      try {
        worker = new Worker(new URL('./shadow.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event: MessageEvent<ShadowAnswer>) => finish(event.data);
        worker.postMessage({ kind: 'terrain', grids: list } satisfies ShadowRequest);
      } catch {
        worker = null;
      }
    }
    if (!worker) local = prepareTerrain(list);
    workerRef.current = worker;

    sendRef.current = () => {
      const s = state.current;
      if (s.running !== 0 || !s.wanted) return;
      const request: ShadowRequest = { kind: 'compute', id: s.nextId, cells, sun: s.wanted.sun, earth: s.wanted.earth };
      s.running = s.nextId;
      s.nextId += 1;
      s.shown = s.wanted;
      if (worker) worker.postMessage(request);
      else if (local) {
        const terrain = local;
        setTimeout(() => finish(answer(terrain, first, request)), 0);
      }
    };
    sendRef.current();

    return () => {
      closed = true;
      worker?.terminate();
      workerRef.current = null;
    };
  }, [grids, cells]);

  // New bodies: ask for them, or queue them behind the request that is running.
  useEffect(() => {
    const s = state.current;
    if (!sun && !earth) {
      s.wanted = null;
      setMaps((m) => (m === NONE ? m : NONE));
      return;
    }
    s.wanted = { sun, earth };
    if (s.running !== 0) setMaps((m) => (m.busy ? m : { ...m, busy: true }));
    else {
      setMaps((m) => (m.busy ? m : { ...m, busy: true }));
      sendRef.current();
    }
  }, [sun, earth, grids, cells]);

  return maps;
}
