import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// globals first, so component styles can override them
import './index.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
