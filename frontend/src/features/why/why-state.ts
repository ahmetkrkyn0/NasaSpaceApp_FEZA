import type { CompareMetricName } from '../../api/types';
import type { Store } from '../../lib/hooks';

/** The difference a "Why?" link opened: one metric, scenario A against `scenarioId`. */
export interface WhyFocus {
  metric: CompareMetricName;
  scenarioId: string;
}

export interface WhyState {
  focus: WhyFocus | null;
}

export interface WhyStore extends Store<WhyState> {
  open(focus: WhyFocus): void;
  clear(): void;
}

export function createWhyStore(): WhyStore {
  let state: WhyState = { focus: null };
  const listeners = new Set<() => void>();
  const set = (next: WhyState) => {
    state = next;
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
    open(focus) {
      set({ focus });
    },
    clear() {
      if (state.focus !== null) set({ focus: null });
    },
  };
}

/** Shared by the Compare table's "Why?" links and the Why panel. */
export const whyStore = createWhyStore();
