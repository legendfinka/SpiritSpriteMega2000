import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// bundled, so they work offline
import '@fontsource/russo-one/400.css';
import '@fontsource/pt-sans/400.css';
import '@fontsource/pt-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/700.css';
// globals first, so component styles can override them
import './index.css';
import { App } from './App';
import { registerServiceWorker } from './pwa/register';

registerServiceWorker();

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
