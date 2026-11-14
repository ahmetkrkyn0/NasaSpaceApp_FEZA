import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { configureApi } from './api/config';
import { scenarioStore } from './state/scenario-store';
import { bindScenarioUrl } from './state/url-sync';
import '../../frontend-migrate/design-export/motion.css';
import './styles/index.css';

// Data source: example files by default; VITE_DATA_MODE=live (or ?data=live in
// the address bar) switches to the server behind /api (docs/PLAN.md, 3.1 rule 5).
configureApi({ mode: import.meta.env.VITE_DATA_MODE });

// Keep the scenario in the address bar for the whole session, so a copied link
// reopens the same scenario (UC-11). The door parameter is left to the shell.
bindScenarioUrl(scenarioStore);

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
