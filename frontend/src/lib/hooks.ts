import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Minimal external store shape. The scenario store (F1-D) and the UI state
 * store in shell/ui-state.ts both satisfy it.
 */
export interface Store<S> {
  getState(): S;
  subscribe(listener: () => void): () => void;
}

/**
 * Subscribes a component to an external store and returns the selected slice.
 * The component re-renders whenever the store publishes a new state object.
 * Stores must replace their state object on change, never mutate it.
 */
export function useStore<S, T>(store: Store<S>, selector: (state: S) => T): T {
  const subscribe = useCallback((listener: () => void) => store.subscribe(listener), [store]);
  const getSnapshot = useCallback(() => store.getState(), [store]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(state);
}

export type AsyncState<T> =
  | { status: 'idle'; data: undefined; error: undefined }
  | { status: 'loading'; data: T | undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: T | undefined; error: unknown };

export interface AsyncResult<T> {
  state: AsyncState<T>;
  /** Runs the function again with the current dependencies. */
  reload: () => void;
}

/**
 * Runs an async function when its dependencies change and tracks the result.
 * The function receives an AbortSignal that is aborted when the dependencies
 * change or the component unmounts; a result that arrives after that is
 * discarded, so a slow earlier request can never overwrite a newer one.
 */
export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: undefined,
    error: undefined,
  });
  const [run, setRun] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ status: 'loading', data: prev.data, error: undefined }));
    fnRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data, error: undefined });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState((prev) => ({ status: 'error', data: prev.data, error }));
        }
      },
    );
    return () => controller.abort();
    // The caller owns the dependency list, as with useEffect.
  }, [...deps, run]);

  const reload = useCallback(() => setRun((n) => n + 1), []);
  return { state, reload };
}
