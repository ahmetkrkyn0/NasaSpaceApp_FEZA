import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../../frontend-migrate/design-export/motion.css';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
