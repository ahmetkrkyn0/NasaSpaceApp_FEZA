import { Suspense, lazy, useState, useSyncExternalStore } from 'react';
import { parseRoleRoute } from './roles/route';
import { Shell } from './shell/Shell';
import { Splash } from './shell/Splash';

// The role pages load only when one of their addresses is opened (`#/start` and the three roles).
const RolePages = lazy(() => import('./roles/RolePages'));

function subscribeToHash(notify: () => void): () => void {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
}

const readHash = () => window.location.hash;
const noHash = () => '';

export default function App() {
  const [entered, setEntered] = useState(false);
  const route = parseRoleRoute(useSyncExternalStore(subscribeToHash, readHash, noHash));
  if (route) {
    return (
      <Suspense fallback={null}>
        <RolePages route={route} />
      </Suspense>
    );
  }
  return entered ? <Shell /> : <Splash onEnter={() => setEntered(true)} />;
}
