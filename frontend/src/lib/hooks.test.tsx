import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useAsync, useStore, type Store } from './hooks';

function fixedStore<S>(state: S): Store<S> {
  return { getState: () => state, subscribe: () => () => undefined };
}

describe('useStore', () => {
  it('returns the selected slice of the store state', () => {
    const store = fixedStore({ door: 'classroom', count: 3 });
    function Probe() {
      const door = useStore(store, (s) => s.door);
      return <span>{door}</span>;
    }
    expect(renderToStaticMarkup(<Probe />)).toBe('<span>classroom</span>');
  });
});

describe('useAsync', () => {
  it('starts idle before the effect runs', () => {
    function Probe() {
      const { state } = useAsync(async () => 1, []);
      return <span>{state.status}</span>;
    }
    expect(renderToStaticMarkup(<Probe />)).toBe('<span>idle</span>');
  });
});
